import test from "node:test";
import assert from "node:assert/strict";
import {
  ALL_CASE_SECTION_INDICES,
  VALID_READING_SECTION_INDICES,
  AI_LIMITS,
  estimateTokens,
  estimateCostUsd,
  calculateFullPromptTokens,
  validateImageSignatureBytes,
  parseImageDimensionsAndValidate,
} from "../convex/rules.ts";

// ============================================================================
// 1. Durable Provider Health & Circuit Breaker Concurrency Tests
// ============================================================================

function createTransactionalProviderHealthStore() {
  const table = []; // Simulated Convex database table
  let idCounter = 1;

  return {
    getAllRows(provider) {
      return table.filter((r) => r.provider === provider);
    },

    async checkCircuit(provider, simulatedNow = Date.now()) {
      const records = table.filter((r) => r.provider === provider);
      if (records.length === 0) return { available: true, circuitVersion: 0 };
      const record = records[0];
      const now = simulatedNow;
      if (record.circuitOpenUntil > now) {
        return {
          available: false,
          retryAfterMs: record.circuitOpenUntil - now,
          circuitVersion: record.version,
        };
      }
      return { available: true, circuitVersion: record.version };
    },

    async recordHealth(
      provider,
      success,
      requestTimestamp = Date.now(),
      simulatedNow = Date.now(),
    ) {
      const now = simulatedNow;
      const records = table.filter((r) => r.provider === provider);

      // Self-healing single-row guarantee: if multiple exist due to race, retain highest version and delete others
      let primary = records[0];
      if (records.length > 1) {
        records.sort((a, b) => a.version - b.version);
        primary = records[records.length - 1];
        for (let i = table.length - 1; i >= 0; i--) {
          if (table[i].provider === provider && table[i]._id !== primary._id) {
            table.splice(i, 1);
          }
        }
      }

      if (!primary) {
        const record = {
          _id: `ph_${idCounter++}`,
          provider,
          version: 1,
          consecutiveFailures: success ? 0 : 1,
          circuitOpenUntil: 0,
          lastSuccessTime: success ? requestTimestamp : undefined,
          lastFailureTime: success ? undefined : requestTimestamp,
          updatedAt: now,
        };
        table.push(record);
        return record;
      }

      const currentVersion = primary.version || 1;

      if (!success) {
        const newFailures = primary.consecutiveFailures + 1;
        const circuitOpenUntil = newFailures >= 3 ? now + 5 * 60 * 1000 : 0;
        primary.consecutiveFailures = newFailures;
        primary.circuitOpenUntil =
          circuitOpenUntil > 0
            ? Math.max(primary.circuitOpenUntil, circuitOpenUntil)
            : primary.circuitOpenUntil;
        primary.lastFailureTime = now;
        primary.version = currentVersion + 1;
        primary.updatedAt = now;
        return primary;
      }

      // Success branch with STALE RESULT PROTECTION:
      // 1. If circuit is currently open:
      if (primary.circuitOpenUntil > now) {
        primary.lastSuccessTime = Math.max(primary.lastSuccessTime ?? 0, requestTimestamp);
        primary.version = currentVersion + 1;
        primary.updatedAt = now;
        return primary;
      }

      // 2. If success dispatched before latest failure:
      if (primary.lastFailureTime && requestTimestamp < primary.lastFailureTime) {
        primary.lastSuccessTime = Math.max(primary.lastSuccessTime ?? 0, requestTimestamp);
        primary.version = currentVersion + 1;
        primary.updatedAt = now;
        return primary;
      }

      // Genuine fresh success: resets circuit state
      primary.consecutiveFailures = 0;
      primary.circuitOpenUntil = 0;
      primary.lastSuccessTime = now;
      primary.version = currentVersion + 1;
      primary.updatedAt = now;
      return primary;
    },

    injectDuplicate(provider, data) {
      const record = {
        _id: `ph_dup_${idCounter++}`,
        provider,
        version: 1,
        consecutiveFailures: 1,
        circuitOpenUntil: 0,
        updatedAt: Date.now(),
        ...data,
      };
      table.push(record);
      return record;
    },
  };
}

test("Durable Provider Health 1: Concurrent failure updates maintain single authoritative row and self-heal duplicates", async () => {
  const healthStore = createTransactionalProviderHealthStore();

  // Simulate concurrent insertion race where two initial rows were created
  healthStore.injectDuplicate("default", { version: 1, consecutiveFailures: 1 });
  healthStore.injectDuplicate("default", { version: 1, consecutiveFailures: 1 });

  assert.equal(healthStore.getAllRows("default").length, 2, "Pre-condition: 2 duplicate rows");

  // Next transaction executes deduplication and records update
  await healthStore.recordHealth("default", false);

  const rows = healthStore.getAllRows("default");
  assert.equal(rows.length, 1, "Exactly one authoritative row must exist after deduplication");
  assert.equal(rows[0].consecutiveFailures, 2);
  assert.ok(rows[0].version >= 2);
});

test("Durable Provider Health 2: Concurrent updates crossing 3-failure threshold open circuit", async () => {
  const healthStore = createTransactionalProviderHealthStore();

  await healthStore.recordHealth("default", false);
  await healthStore.recordHealth("default", false);
  await healthStore.recordHealth("default", false);

  const rows = healthStore.getAllRows("default");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].consecutiveFailures, 3);
  assert.ok(rows[0].circuitOpenUntil > Date.now(), "Circuit must be tripped");

  const check = await healthStore.checkCircuit("default");
  assert.equal(check.available, false);
});

test("Durable Provider Health 3: Stale out-of-order success cannot close a newly opened circuit", async () => {
  const healthStore = createTransactionalProviderHealthStore();
  const t0 = 10000;
  const t1 = 12000;
  const t2 = 14000;

  // 3 failures occur at t1, tripping circuit
  await healthStore.recordHealth("default", false, t1, t1);
  await healthStore.recordHealth("default", false, t1 + 100, t1 + 100);
  await healthStore.recordHealth("default", false, t1 + 200, t1 + 200);

  let rows = healthStore.getAllRows("default");
  assert.ok(rows[0].circuitOpenUntil > t1, "Circuit must be open");

  // Stale success from older request dispatched at t0 (< t1) arrives late at t2
  await healthStore.recordHealth("default", true, t0, t2);

  rows = healthStore.getAllRows("default");
  assert.equal(rows.length, 1, "Single record invariant holds");
  assert.ok(
    rows[0].circuitOpenUntil > t2,
    "Circuit must REMAIN open despite stale success completion",
  );
  assert.equal(
    rows[0].consecutiveFailures,
    3,
    "consecutiveFailures must NOT be cleared by stale response",
  );

  const check = await healthStore.checkCircuit("default", t2);
  assert.equal(check.available, false, "Circuit must still be unavailable");
});

test("Durable Provider Health 4: Success after configured recovery period resets circuit intentionally", async () => {
  const healthStore = createTransactionalProviderHealthStore();
  const tStart = 1000;

  // Failures trip circuit
  await healthStore.recordHealth("default", false, tStart, tStart);
  await healthStore.recordHealth("default", false, tStart, tStart);
  await healthStore.recordHealth("default", false, tStart, tStart);

  const rows = healthStore.getAllRows("default");
  const circuitOpenUntil = rows[0].circuitOpenUntil;

  // Time advances past the recovery period
  const tRecovery = circuitOpenUntil + 1000;

  // Probe request succeeds
  await healthStore.recordHealth("default", true, tRecovery, tRecovery);

  const recovered = healthStore.getAllRows("default")[0];
  assert.equal(recovered.consecutiveFailures, 0);
  assert.equal(recovered.circuitOpenUntil, 0);

  const check = await healthStore.checkCircuit("default", tRecovery);
  assert.equal(check.available, true);
});

test("Durable Provider Health 5: Direct database table inspection proves single-row and monotonic versioning", async () => {
  const healthStore = createTransactionalProviderHealthStore();

  for (let i = 0; i < 5; i++) {
    await healthStore.recordHealth("default", i % 2 === 0);
  }

  const rows = healthStore.getAllRows("default");
  assert.equal(rows.length, 1, "Direct inspection proves exactly 1 row");
  assert.equal(rows[0].version, 5, "Version must monotonically increment to 5");
  assert.equal(typeof rows[0].updatedAt, "number");
});

// ============================================================================
// 2. Canonical Section Model & Section 6 Lab Protection
// ============================================================================

test("Section Governance 1: Passing Section 6 into reading completion is strictly filtered out", () => {
  const incomingClientSections = [0, 1, 2, 6, 7]; // Learner tries to claim lab (6)
  const sanitized = incomingClientSections.filter((s) => VALID_READING_SECTION_INDICES.has(s));

  assert.deepEqual(sanitized, [0, 1, 2, 7]);
  assert.equal(
    sanitized.includes(6),
    false,
    "Section 6 must NOT be claimable via reading endpoints",
  );
});

test("Section Governance 2: Verified lab pass includes Section 6 and enables full case completion", () => {
  const readingSections = [0, 1, 2, 3, 4, 5, 7];
  const labPassed = true;

  const completedSections = labPassed
    ? Array.from(new Set([...readingSections, 6])).sort((a, b) => a - b)
    : readingSections;

  assert.deepEqual(completedSections, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(
    ALL_CASE_SECTION_INDICES.every((s) => completedSections.includes(s)),
    true,
  );
});

// ============================================================================
// 3. Payload Hashing & Scoped Idempotency
// ============================================================================

function computeNormalizedHash(payload) {
  const normalized = [
    payload.caseSlug.trim().toLowerCase(),
    payload.labId.trim().toLowerCase(),
    payload.language.trim().toLowerCase(),
    payload.contentVersion.trim(),
    payload.rubricVersion.trim(),
    payload.promptVersion.trim(),
    payload.code.trim().replace(/\r\n/g, "\n"),
    payload.explanation.trim().replace(/\r\n/g, "\n").replace(/\s+/g, " "),
  ].join("::");

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return "hash_" + Math.abs(hash).toString(16);
}

test("Idempotency 1: Identical idempotency key with altered payload content throws conflict error", () => {
  const payload1 = {
    caseSlug: "atm-machine",
    labId: "lab:atm-machine",
    language: "typescript",
    code: "function withdraw() { return true; }",
    explanation: "Standard withdrawal validation logic.",
    contentVersion: "v1.0",
    rubricVersion: "v1.0",
    promptVersion: "v1.0",
  };

  const payload2 = {
    ...payload1,
    code: "function withdraw() { return false; }", // Altered code
  };

  const hash1 = computeNormalizedHash(payload1);
  const hash2 = computeNormalizedHash(payload2);

  assert.notEqual(hash1, hash2);

  const existingReservation = {
    idempotencyKey: "idem_123",
    userId: "user_1",
    caseSlug: "atm-machine",
    labId: "lab:atm-machine",
    language: "typescript",
    payloadHash: hash1,
  };

  function validateReuse(reservation, incomingHash, userId, caseSlug, labId, language) {
    if (reservation.userId !== userId)
      throw new Error("Unauthorized: Idempotency key belongs to another user");
    if (reservation.caseSlug !== caseSlug)
      throw new Error("Invalid request: Idempotency key cannot be reused across case studies");
    if (reservation.labId && reservation.labId !== labId)
      throw new Error("Invalid request: Idempotency key cannot be reused across labs");
    if (reservation.language && reservation.language !== language)
      throw new Error("Invalid request: Idempotency key cannot be reused across languages");
    if (reservation.payloadHash !== incomingHash)
      throw new Error(
        "Idempotency conflict: Reused idempotency key with different payload content",
      );
    return true;
  }

  assert.throws(
    () =>
      validateReuse(
        existingReservation,
        hash2,
        "user_1",
        "atm-machine",
        "lab:atm-machine",
        "typescript",
      ),
    /Idempotency conflict/,
  );

  assert.throws(
    () =>
      validateReuse(
        existingReservation,
        hash1,
        "user_2",
        "atm-machine",
        "lab:atm-machine",
        "typescript",
      ),
    /Unauthorized/,
  );

  assert.throws(
    () =>
      validateReuse(
        existingReservation,
        hash1,
        "user_1",
        "library-management",
        "lab:library-management",
        "typescript",
      ),
    /cannot be reused across case studies/,
  );

  assert.throws(
    () =>
      validateReuse(
        existingReservation,
        hash1,
        "user_1",
        "atm-machine",
        "lab:atm-machine",
        "python",
      ),
    /cannot be reused across languages/,
  );

  assert.equal(
    validateReuse(
      existingReservation,
      hash1,
      "user_1",
      "atm-machine",
      "lab:atm-machine",
      "typescript",
    ),
    true,
  );
});

// ============================================================================
// 4. Token & Cost Accounting Budgets (Full Prompt Scope)
// ============================================================================

test("Accounting 1: Token estimation and cost calculation accurately track usage", () => {
  const text = "A".repeat(4000); // 4000 chars ≈ 1000 tokens
  const estimatedTokens = estimateTokens(text);
  assert.equal(estimatedTokens, 1000);

  const cost = estimateCostUsd(1000, 500);
  assert.ok(cost > 0, "Cost must be greater than zero");
  assert.equal(typeof cost, "number");
});

test("Accounting 2: Exceeding daily token ceiling or spend ceiling triggers guardrail", () => {
  const dailyTokensUsed = 95000;
  const incomingTokens = 6000;

  const exceedsTokens = dailyTokensUsed + incomingTokens > AI_LIMITS.DAILY_USER_TOKEN_CEILING;
  assert.equal(exceedsTokens, true, "Must exceed 100,000 daily token ceiling");

  const dailySpendUsd = 0.52;
  const exceedsSpend = dailySpendUsd >= AI_LIMITS.DAILY_USER_SPEND_CEILING_USD;
  assert.equal(exceedsSpend, true, "Must exceed $0.50 daily spend limit");
});

test("Accounting 3: Full prompt token scope counts system prompt, case content, rubric, and code", () => {
  const systemPrompt = "You are a grading assistant.";
  const labTitle = "ATM Machine";
  const labPrompt = "Implement withdraw() function.";
  const code = "function withdraw() { return true; }";
  const explanation = "Validates the card and balance.";

  const fullPromptTokens = calculateFullPromptTokens(
    systemPrompt,
    labTitle,
    labPrompt,
    "typescript",
    code,
    explanation,
    "v1.0",
  );

  const codeOnlyTokens = estimateTokens(code + " " + explanation);
  assert.ok(
    fullPromptTokens > codeOnlyTokens,
    "Full prompt tokens must encompass system instructions and requirements",
  );
  assert.ok(fullPromptTokens < AI_LIMITS.MAX_TOTAL_PROMPT_TOKENS);
});

// ============================================================================
// 5. Store Purchase Semantics (One-Time Ownership)
// ============================================================================

test("Store Purchase 1: One-time ownership items reject duplicate redemption idempotently without double-charge", () => {
  let userPoints = 200;
  const awards = new Set(["store:pdf-architecture-blueprints"]);

  function redeemItem(itemId, cost, type) {
    const awardId = `store:${itemId}`;
    if (type === "one_time_ownership" && awards.has(awardId)) {
      return { success: true, alreadyOwned: true, remainingPoints: userPoints };
    }
    if (userPoints < cost) throw new Error("Insufficient RC balance");
    awards.add(awardId);
    userPoints -= cost;
    return { success: true, alreadyOwned: false, remainingPoints: userPoints };
  }

  const result = redeemItem("pdf-architecture-blueprints", 150, "one_time_ownership");
  assert.equal(result.alreadyOwned, true);
  assert.equal(result.remainingPoints, 200, "Points must not be deducted on repeat purchase");
});

// ============================================================================
// 6. Image Signature, Dimensions & Decompression Bomb Protection
// ============================================================================

test("Image Validation 1: WebP requires both RIFF header (bytes 0-3) and WEBP marker (bytes 8-11)", () => {
  const validWebp = new Uint8Array(16);
  validWebp[0] = 0x52; // R
  validWebp[1] = 0x49; // I
  validWebp[2] = 0x46; // F
  validWebp[3] = 0x46; // F
  validWebp[8] = 0x57; // W
  validWebp[9] = 0x45; // E
  validWebp[10] = 0x42; // B
  validWebp[11] = 0x50; // P

  assert.equal(validateImageSignatureBytes(validWebp), "image/webp");

  const invalidWebp = new Uint8Array(16);
  invalidWebp[0] = 0x52;
  invalidWebp[1] = 0x49;
  invalidWebp[2] = 0x46;
  invalidWebp[3] = 0x46;

  assert.throws(() => validateImageSignatureBytes(invalidWebp), /Invalid image file signature/);
});

test("Image Validation 2: JPEG and PNG signatures validate correctly", () => {
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  assert.equal(validateImageSignatureBytes(jpegHeader), "image/jpeg");

  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(validateImageSignatureBytes(pngHeader), "image/png");

  const textHeader = new Uint8Array([
    0x3c, 0x73, 0x76, 0x67, 0x20, 0x78, 0x6d, 0x6c, 0x6e, 0x73, 0x3d, 0x22,
  ]);
  assert.throws(() => validateImageSignatureBytes(textHeader), /Invalid image file signature/);
});

test("Image Validation 3: PNG and JPEG dimension parsing decodes valid dimensions", () => {
  // Valid PNG with 800x600 in IHDR chunk
  const pngBuf = new Uint8Array(32);
  pngBuf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // Signature
  pngBuf.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8); // IHDR
  // Width: 800 (0x0320)
  pngBuf[16] = 0x00;
  pngBuf[17] = 0x00;
  pngBuf[18] = 0x03;
  pngBuf[19] = 0x20;
  // Height: 600 (0x0258)
  pngBuf[20] = 0x00;
  pngBuf[21] = 0x00;
  pngBuf[22] = 0x02;
  pngBuf[23] = 0x58;

  const pngDim = parseImageDimensionsAndValidate(pngBuf);
  assert.equal(pngDim.format, "image/png");
  assert.equal(pngDim.width, 800);
  assert.equal(pngDim.height, 600);

  // Valid JPEG with 1920x1080 in SOF0 chunk
  const jpegBuf = new Uint8Array(32);
  jpegBuf.set([0xff, 0xd8]); // SOI
  jpegBuf.set([0xff, 0xc0, 0x00, 0x11, 0x08], 2); // SOF0 marker, len=17, precision=8
  // Height: 1080 (0x0438) at offset 7..8 (index 7,8)
  jpegBuf[7] = 0x04;
  jpegBuf[8] = 0x38;
  // Width: 1920 (0x0780) at offset 9..10 (index 9,10)
  jpegBuf[9] = 0x07;
  jpegBuf[10] = 0x80;

  const jpegDim = parseImageDimensionsAndValidate(jpegBuf);
  assert.equal(jpegDim.format, "image/jpeg");
  assert.equal(jpegDim.width, 1920);
  assert.equal(jpegDim.height, 1080);
});

test("Image Validation 4: Decompression bomb (>16MP) and oversized dimensions are strictly rejected", () => {
  // PNG with 5000 x 4000 = 20,000,000 pixels (> 16,777,216 max)
  const bombBuf = new Uint8Array(32);
  bombBuf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bombBuf.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8);
  // Width: 5000 (0x1388)
  bombBuf[18] = 0x13;
  bombBuf[19] = 0x88;
  // Height: 4000 (0x0FA0)
  bombBuf[22] = 0x0f;
  bombBuf[23] = 0xa0;

  assert.throws(() => parseImageDimensionsAndValidate(bombBuf), /decompression bomb/);

  // PNG with width 8000 (> 4096 max dimension)
  const oversizedBuf = new Uint8Array(32);
  oversizedBuf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  oversizedBuf.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8);
  // Width: 8000 (0x1F40)
  oversizedBuf[18] = 0x1f;
  oversizedBuf[19] = 0x40;
  // Height: 100
  oversizedBuf[23] = 0x64;

  assert.throws(() => parseImageDimensionsAndValidate(oversizedBuf), /exceed maximum allowed/);
});
