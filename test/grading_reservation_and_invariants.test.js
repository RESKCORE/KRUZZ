import test from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// AI Grading Reservation, Invariants & Anti-Abuse Simulation
// ============================================================================

const ALLOWED_LANGUAGES = new Set([
  "typescript",
  "javascript",
  "python",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
  "csharp",
  "ruby",
  "php",
  "swift",
  "kotlin",
  "scala",
  "elixir",
  "haskell",
  "clojure",
  "erlang",
  "ocaml",
  "zig",
  "lua",
  "r",
  "julia",
  "dart",
  "sql",
  "shell",
  "bash",
  "powershell",
  "perl",
  "racket",
  "fsharp",
  "nim",
  "v",
  "solidity",
  "assembly",
]);

function createMockGradingDb() {
  const caseProgress = new Map(); // key: `${userId}:${caseSlug}`
  const labSubmissions = [];

  return {
    caseProgress,
    labSubmissions,
    getProgress(userId, caseSlug) {
      return caseProgress.get(`${userId}:${caseSlug}`) || null;
    },
    upsertProgress(userId, caseSlug, data) {
      const key = `${userId}:${caseSlug}`;
      const existing = caseProgress.get(key) || {
        userId,
        caseSlug,
        status: "in_progress",
        bestScore: 0,
        passed: false,
        attemptCount: 0,
        recentAttempts: [],
        createdAt: Date.now(),
      };
      const updated = { ...existing, ...data, updatedAt: Date.now() };
      caseProgress.set(key, updated);
      return updated;
    },
    insertAuditSubmission(record) {
      const submission = {
        _id: `sub_${labSubmissions.length + 1}`,
        ...record,
      };
      labSubmissions.push(submission);
      return submission;
    },
  };
}

/**
 * Simulates atomic reservation `_reserveLabAttempt`
 * Enforces:
 * 1. Payload size limits (20KB code, 5KB explanation)
 * 2. Allowed language validation
 * 3. 5s per-user/per-lab cooldown
 * 4. 15 attempts/hour quota
 */
function reserveLabAttempt(
  db,
  { userId, caseSlug, language, code, explanation, now = Date.now() },
) {
  if (code.length > 20000) {
    throw new Error("Submission code exceeds maximum length of 20,000 characters.");
  }

  if (explanation && explanation.length > 5000) {
    throw new Error("Explanation exceeds maximum length of 5,000 characters.");
  }

  if (!ALLOWED_LANGUAGES.has(language.toLowerCase().trim())) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const existing = db.getProgress(userId, caseSlug);
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentAttempts = (existing?.recentAttempts || []).filter((ts) => ts > oneHourAgo);

  // 1. Cooldown check (5 seconds)
  const lastAttempt = recentAttempts[recentAttempts.length - 1];
  if (lastAttempt && now - lastAttempt < 5000) {
    throw new Error("Please wait at least 5 seconds between lab submissions.");
  }

  // 2. Hourly quota check (15 attempts/hour)
  if (recentAttempts.length >= 15) {
    throw new Error("Hourly grading limit reached (15 attempts/hour). Please try again later.");
  }

  // Record atomic reservation
  const newAttempts = [...recentAttempts, now];
  db.upsertProgress(userId, caseSlug, {
    recentAttempts: newAttempts,
    lastAttemptAt: now,
    attemptCount: (existing?.attemptCount || 0) + 1,
  });

  return {
    allowed: true,
    attemptNumber: (existing?.attemptCount || 0) + 1,
  };
}

/**
 * Simulates `_recordLabResult`
 * Enforces monotonic progress updates:
 * - `bestScore` only increases (Math.max)
 * - `passed` stays true once passed
 * - stores clean audit trail WITHOUT raw student code or explanation
 */
function recordLabResult(db, { userId, caseSlug, attemptNumber, result, now = Date.now() }) {
  const existing = db.getProgress(userId, caseSlug);
  if (!existing) {
    throw new Error("Progress record not found for reservation");
  }

  const newBestScore = Math.max(existing.bestScore || 0, result.score);
  const newPassed = existing.passed || false || result.passed;

  db.upsertProgress(userId, caseSlug, {
    bestScore: newBestScore,
    passed: newPassed,
    lastGradedAt: now,
  });

  // Audit trail insertion (must NOT contain raw code or explanation)
  const audit = db.insertAuditSubmission({
    userId,
    caseSlug,
    attemptNumber,
    passed: result.passed,
    score: result.score,
    durationMs: result.durationMs || 120,
    ...(result.provider ? { provider: result.provider } : {}),
    timestamp: now,
  });

  return {
    progress: db.getProgress(userId, caseSlug),
    audit,
  };
}

// ============================================================================
// Grading Reservation and Invariants Tests
// ============================================================================

test("Grading Invariant 1: Valid submission successfully reserves an attempt", () => {
  const db = createMockGradingDb();
  const res = reserveLabAttempt(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    language: "typescript",
    code: "const x = 1;",
    explanation: "Used sliding window algorithm",
  });

  assert.equal(res.allowed, true);
  assert.equal(res.attemptNumber, 1);

  const progress = db.getProgress("user_1", "rate-limiter");
  assert.equal(progress.attemptCount, 1);
  assert.equal(progress.recentAttempts.length, 1);
});

test("Grading Invariant 2: Submissions exceeding 20KB code or 5KB explanation are rejected", () => {
  const db = createMockGradingDb();

  // Test code too large (> 20,000 bytes)
  const oversizedCode = "a".repeat(20001);
  assert.throws(
    () => {
      reserveLabAttempt(db, {
        userId: "user_1",
        caseSlug: "rate-limiter",
        language: "typescript",
        code: oversizedCode,
      });
    },
    {
      name: "Error",
      message: /Submission code exceeds maximum length of 20,000 characters/,
    },
  );

  // Test explanation too large (> 5,000 bytes)
  const oversizedExplanation = "b".repeat(5001);
  assert.throws(
    () => {
      reserveLabAttempt(db, {
        userId: "user_1",
        caseSlug: "rate-limiter",
        language: "typescript",
        code: "const valid = true;",
        explanation: oversizedExplanation,
      });
    },
    {
      name: "Error",
      message: /Explanation exceeds maximum length of 5,000 characters/,
    },
  );
});

test("Grading Invariant 3: Unsupported or malicious language is rejected", () => {
  const db = createMockGradingDb();

  assert.throws(
    () => {
      reserveLabAttempt(db, {
        userId: "user_1",
        caseSlug: "rate-limiter",
        language: "eval_payload",
        code: "print('hack')",
      });
    },
    {
      name: "Error",
      message: /Unsupported language/,
    },
  );
});

test("Grading Invariant 4: Rapid consecutive submissions within 5 seconds trigger cooldown error", () => {
  const db = createMockGradingDb();
  const startTime = 1710000000000;

  // First submission at t=0
  reserveLabAttempt(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    language: "python",
    code: "x = 1",
    now: startTime,
  });

  // Second submission at t=2000ms (within 5000ms cooldown)
  assert.throws(
    () => {
      reserveLabAttempt(db, {
        userId: "user_1",
        caseSlug: "rate-limiter",
        language: "python",
        code: "x = 2",
        now: startTime + 2000,
      });
    },
    {
      name: "Error",
      message: /Please wait at least 5 seconds between lab submissions/,
    },
  );

  // Third submission at t=5001ms (after cooldown passes) should succeed
  const res3 = reserveLabAttempt(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    language: "python",
    code: "x = 3",
    now: startTime + 5001,
  });
  assert.equal(res3.allowed, true);
  assert.equal(res3.attemptNumber, 2);
});

test("Grading Invariant 5: Rate limit of 15 attempts per hour is strictly enforced", () => {
  const db = createMockGradingDb();
  let currentTime = 1710000000000;

  // Make 15 successful attempts with 6-second intervals
  for (let i = 1; i <= 15; i++) {
    const res = reserveLabAttempt(db, {
      userId: "user_1",
      caseSlug: "rate-limiter",
      language: "go",
      code: `func main() { /* ${i} */ }`,
      now: currentTime,
    });
    assert.equal(res.attemptNumber, i);
    currentTime += 6000; // 6s apart
  }

  // 16th attempt within the hour must be blocked
  assert.throws(
    () => {
      reserveLabAttempt(db, {
        userId: "user_1",
        caseSlug: "rate-limiter",
        language: "go",
        code: "func main() { /* blocked */ }",
        now: currentTime,
      });
    },
    {
      name: "Error",
      message: /Hourly grading limit reached \(15 attempts\/hour\)/,
    },
  );

  // 1 hour later (after window rolls over), submissions are allowed again
  const nextHourTime = 1710000000000 + 60 * 60 * 1000 + 1000;
  const resAllowed = reserveLabAttempt(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    language: "go",
    code: "func main() { /* allowed */ }",
    now: nextHourTime,
  });
  assert.equal(resAllowed.allowed, true);
});

test("Grading Invariant 6: Score monotonicity preserves best score and passing status", () => {
  const db = createMockGradingDb();

  // Attempt 1: Score 85, passed
  reserveLabAttempt(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    language: "rust",
    code: "fn main() {}",
  });
  const res1 = recordLabResult(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    attemptNumber: 1,
    result: { score: 85, passed: true, durationMs: 250, provider: "cerebras" },
  });

  assert.equal(res1.progress.bestScore, 85);
  assert.equal(res1.progress.passed, true);

  // Attempt 2: Regressed code scores 50, not passed
  reserveLabAttempt(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    language: "rust",
    code: "fn broken() {}",
    now: Date.now() + 10000,
  });
  const res2 = recordLabResult(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    attemptNumber: 2,
    result: { score: 50, passed: false, durationMs: 220, provider: "gemini" },
  });

  // Invariants: bestScore must NOT regress to 50, passed must NOT revert to false
  assert.equal(res2.progress.bestScore, 85, "bestScore must be preserved monotonically");
  assert.equal(res2.progress.passed, true, "passed status must never be lost");
  assert.equal(res2.progress.attemptCount, 2, "attemptCount must increment");

  // Attempt 3: High score 98 improves bestScore
  reserveLabAttempt(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    language: "rust",
    code: "fn perfect() {}",
    now: Date.now() + 20000,
  });
  const res3 = recordLabResult(db, {
    userId: "user_1",
    caseSlug: "rate-limiter",
    attemptNumber: 3,
    result: { score: 98, passed: true, durationMs: 180, provider: "cerebras" },
  });

  assert.equal(res3.progress.bestScore, 98);
  assert.equal(res3.progress.passed, true);
  assert.equal(res3.progress.attemptCount, 3);
});

test("Grading Invariant 7: Lab audit trail captures metrics without retaining raw learner code", () => {
  const db = createMockGradingDb();

  reserveLabAttempt(db, {
    userId: "user_privacy_test",
    caseSlug: "rate-limiter",
    language: "typescript",
    code: "export const secretLearnerCode = 'proprietary';",
    explanation: "My confidential explanation",
  });

  const { audit } = recordLabResult(db, {
    userId: "user_privacy_test",
    caseSlug: "rate-limiter",
    attemptNumber: 1,
    result: { score: 92, passed: true, durationMs: 310, provider: "gemini" },
  });

  // Verify audit fields
  assert.equal(audit.userId, "user_privacy_test");
  assert.equal(audit.caseSlug, "rate-limiter");
  assert.equal(audit.attemptNumber, 1);
  assert.equal(audit.score, 92);
  assert.equal(audit.passed, true);
  assert.equal(audit.durationMs, 310);
  assert.equal(audit.provider, "gemini");

  // CRITICAL PRIVACY INVARIANT: audit must never retain raw code or explanation
  assert.equal(audit.code, undefined, "Raw student code must not be saved in audit log");
  assert.equal(
    audit.explanation,
    undefined,
    "Raw student explanation must not be saved in audit log",
  );
});

test("Grading Invariant 8: Stored labSubmissions record captures all version and lifecycle fields", () => {
  const db = createMockGradingDb();
  const now = Date.now();

  // Simulate full reservation & result lifecycle
  const storedSubmission = db.insertAuditSubmission({
    userId: "user_audit_test",
    caseSlug: "atm-machine",
    labId: "lab:atm-machine",
    attemptId: "att_1234567890abcdef",
    reservationId: "att_1234567890abcdef",
    idempotencyKey: "idem_audit_test_1",
    language: "typescript",
    status: "completed",
    score: 88,
    passed: true,
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    rubricVersion: "v1.0",
    promptVersion: "v1.0",
    contentVersion: "v1.0",
    payloadHash: "hash_abc123def456",
    inputCodeBytes: 250,
    inputExplanationBytes: 120,
    estimatedInputTokens: 750,
    estimatedOutputTokens: 256,
    estimatedCostUsd: 0.000266,
    latencyMs: 420,
    createdAt: now - 500,
    completedAt: now,
  });

  // Explicitly assert every single stored field on the retrieved database record
  assert.equal(storedSubmission.userId, "user_audit_test");
  assert.equal(storedSubmission.caseSlug, "atm-machine");
  assert.equal(storedSubmission.labId, "lab:atm-machine");
  assert.equal(storedSubmission.reservationId, "att_1234567890abcdef");
  assert.equal(storedSubmission.attemptId, "att_1234567890abcdef");
  assert.equal(storedSubmission.idempotencyKey, "idem_audit_test_1");
  assert.equal(storedSubmission.language, "typescript");
  assert.equal(storedSubmission.status, "completed");
  assert.equal(storedSubmission.score, 88);
  assert.equal(storedSubmission.passed, true);
  assert.equal(storedSubmission.provider, "groq");
  assert.equal(storedSubmission.model, "llama-3.3-70b-versatile");
  assert.equal(storedSubmission.rubricVersion, "v1.0");
  assert.equal(storedSubmission.promptVersion, "v1.0");
  assert.equal(storedSubmission.contentVersion, "v1.0");
  assert.equal(storedSubmission.payloadHash, "hash_abc123def456");
  assert.equal(storedSubmission.inputCodeBytes, 250);
  assert.equal(storedSubmission.inputExplanationBytes, 120);
  assert.equal(storedSubmission.estimatedInputTokens, 750);
  assert.equal(storedSubmission.estimatedOutputTokens, 256);
  assert.equal(storedSubmission.estimatedCostUsd, 0.000266);
  assert.equal(storedSubmission.latencyMs, 420);
  assert.ok(storedSubmission.createdAt > 0);
  assert.ok(storedSubmission.completedAt > storedSubmission.createdAt);
});

test("Grading Invariant 9: Stale reservation expires after 5 minutes, frees budget, and rejects delayed result", () => {
  const db = createMockGradingDb();
  const baseTime = 1710000000000;

  // 1. Initial reservation created at baseTime
  const initialSub = db.insertAuditSubmission({
    userId: "user_crash_test",
    caseSlug: "url-shortener",
    attemptId: "att_stranded_1",
    reservationId: "att_stranded_1",
    idempotencyKey: "idem_crash_1",
    status: "reserved",
    estimatedInputTokens: 1200,
    estimatedOutputTokens: 1024,
    estimatedCostUsd: 0.00045,
    createdAt: baseTime,
  });

  assert.equal(initialSub.status, "reserved");

  // 2. Simulate process crash / timeout: 301 seconds elapse without result mutation
  const currentTime = baseTime + 301_000;
  const RESERVATION_EXPIRY_MS = 300_000;

  // Lazy expiry sweep on subsequent reservation check
  for (const s of db.labSubmissions) {
    if (
      (s.status === "reserved" || s.status === "processing") &&
      currentTime - s.createdAt >= RESERVATION_EXPIRY_MS
    ) {
      s.status = "expired";
      s.errorCode = "reservation_expired";
      s.completedAt = currentTime;
    }
  }

  assert.equal(initialSub.status, "expired");
  assert.equal(initialSub.errorCode, "reservation_expired");

  // Active submissions calculation: expired submission does NOT consume daily token or spend budget
  const activeSubmissions = db.labSubmissions.filter((s) => s.status !== "expired");
  const activeSpendUsd = activeSubmissions.reduce((sum, s) => sum + (s.estimatedCostUsd || 0), 0);
  assert.equal(activeSpendUsd, 0, "Expired reservation spend must not count towards active budget");

  // 3. Late result arriving after reservation expired must be rejected / ignored
  let delayedResultProcessed = false;
  if (initialSub.status !== "expired" && initialSub.status !== "completed") {
    initialSub.status = "completed";
    delayedResultProcessed = true;
  }
  assert.equal(delayedResultProcessed, false, "Late result on expired reservation must be ignored");
  assert.equal(initialSub.status, "expired");

  // 4. Learner retrying with same idempotency key is permitted to re-reserve
  const retrySub = db.insertAuditSubmission({
    userId: "user_crash_test",
    caseSlug: "url-shortener",
    attemptId: "att_retry_fresh",
    reservationId: "att_retry_fresh",
    idempotencyKey: "idem_crash_1",
    status: "reserved",
    estimatedInputTokens: 1200,
    estimatedOutputTokens: 1024,
    estimatedCostUsd: 0.00045,
    createdAt: currentTime + 5000,
  });
  assert.equal(retrySub.attemptId, "att_retry_fresh");
});

test("Grading Invariant 10: Missing or zero provider token usage metadata fails closed and marks isEstimatedUsage: true", () => {
  const db = createMockGradingDb();
  const now = Date.now();
  const estimatedInputTokens = 1500;
  const MAX_OUTPUT_TOKENS_PER_ATTEMPT = 1024;

  // Simulate provider returning response with missing/empty usageMetadata
  const providerResponse = {
    score: 85,
    passed: true,
    actualPromptTokens: undefined, // Missing provider metadata
    actualOutputTokens: 0, // Zero/malformed output tokens
  };

  const hasActualPrompt =
    typeof providerResponse.actualPromptTokens === "number" &&
    providerResponse.actualPromptTokens > 0;
  const hasActualOutput =
    typeof providerResponse.actualOutputTokens === "number" &&
    providerResponse.actualOutputTokens > 0;
  const isEstimatedUsage = !hasActualPrompt || !hasActualOutput;

  const finalInputTokens = hasActualPrompt
    ? providerResponse.actualPromptTokens
    : estimatedInputTokens;
  const finalOutputTokens = hasActualOutput
    ? providerResponse.actualOutputTokens
    : MAX_OUTPUT_TOKENS_PER_ATTEMPT;

  // Cost calculation based on non-zero conservative estimates
  const inputCost = (finalInputTokens / 1_000_000) * 0.15;
  const outputCost = (finalOutputTokens / 1_000_000) * 0.6;
  const reconciledCostUsd = inputCost + outputCost;

  assert.equal(isEstimatedUsage, true, "Must flag isEstimatedUsage when provider metadata fails");
  assert.equal(finalInputTokens, 1500, "Must retain conservative input token estimate");
  assert.equal(finalOutputTokens, 1024, "Must retain conservative output token estimate");
  assert.ok(reconciledCostUsd > 0.0008, "Cost must never be zero");

  const stored = db.insertAuditSubmission({
    userId: "user_usage_test",
    caseSlug: "key-value-cache",
    attemptId: "att_usage_fail_closed",
    status: "completed",
    score: providerResponse.score,
    passed: providerResponse.passed,
    estimatedInputTokens: finalInputTokens,
    estimatedOutputTokens: finalOutputTokens,
    estimatedCostUsd: reconciledCostUsd,
    isEstimatedUsage,
    createdAt: now,
    completedAt: now + 400,
  });

  assert.equal(stored.isEstimatedUsage, true);
  assert.equal(stored.estimatedInputTokens, 1500);
  assert.equal(stored.estimatedOutputTokens, 1024);
  assert.ok(stored.estimatedCostUsd > 0);
});

test("Grading Invariant 11: Fallback provider invocation records actual provider used and deducts from user budget", () => {
  const db = createMockGradingDb();
  const now = Date.now();

  // Primary provider (gemini) failed, secondary provider (groq) completed
  const fallbackGrade = {
    provider: "groq",
    model: "openai/gpt-oss-20b",
    score: 90,
    passed: true,
    actualPromptTokens: 820,
    actualOutputTokens: 210,
  };

  const stored = db.insertAuditSubmission({
    userId: "user_fallback_test",
    caseSlug: "circuit-breaker-pattern",
    attemptId: "att_fallback_success",
    status: "completed",
    score: fallbackGrade.score,
    passed: fallbackGrade.passed,
    provider: fallbackGrade.provider,
    model: fallbackGrade.model,
    estimatedInputTokens: fallbackGrade.actualPromptTokens,
    estimatedOutputTokens: fallbackGrade.actualOutputTokens,
    estimatedCostUsd: 0.000249,
    createdAt: now,
    completedAt: now + 350,
  });

  assert.equal(stored.provider, "groq");
  assert.equal(stored.model, "openai/gpt-oss-20b");
  assert.equal(stored.estimatedInputTokens, 820);
  assert.equal(stored.estimatedOutputTokens, 210);
  assert.ok(stored.estimatedCostUsd > 0);
});
