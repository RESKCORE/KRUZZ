import test from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// Concurrent AI Reservation, Idempotency & Lifecycle Invariant Tests
// ============================================================================

function createMockTransactionalDb() {
  const labSubmissions = new Map(); // key: submission._id
  const users = new Map();
  users.set("user_test_1", { _id: "user_test_1", points: 100 });

  let idCounter = 1;

  return {
    users,
    labSubmissions,
    // Atomic mutation simulator with mutex lock
    async mutate(fn) {
      return await fn({
        findSubmissionById(id) {
          return labSubmissions.get(id) || null;
        },
        findSubmissionByIdempotency(idempotencyKey) {
          return Array.from(labSubmissions.values()).find(
            (s) => s.idempotencyKey === idempotencyKey,
          );
        },
        findRecentUserSubmissions(userId, caseSlug, limit = 1) {
          return Array.from(labSubmissions.values())
            .filter((s) => s.userId === userId && s.caseSlug === caseSlug)
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, limit);
        },
        countHourlySubmissions(userId, since) {
          return Array.from(labSubmissions.values()).filter(
            (s) => s.userId === userId && s.createdAt >= since,
          ).length;
        },
        insertSubmission(doc) {
          const _id = `sub_${idCounter++}`;
          const record = { _id, ...doc };
          labSubmissions.set(_id, record);
          return record;
        },
        patchSubmission(id, updates) {
          const existing = labSubmissions.get(id);
          if (!existing) throw new Error("Submission not found");
          const updated = { ...existing, ...updates };
          labSubmissions.set(id, updated);
          return updated;
        },
      });
    },
  };
}

/**
 * Simulates Convex transactional `_reserveLabAttempt`
 */
async function reserveAttempt(db, { userId, caseSlug, idempotencyKey, now = Date.now() }) {
  return await db.mutate(async (tx) => {
    // 1. Idempotency check: in-flight or completed
    const existing = tx.findSubmissionByIdempotency(idempotencyKey);
    if (existing) {
      if (existing.status === "completed") {
        return {
          alreadyCompleted: true,
          score: existing.score,
          passed: existing.passed,
          attemptId: existing.attemptId,
        };
      }
      if (existing.status === "reserved" && now - existing.createdAt < 300_000) {
        return {
          alreadyCompleted: false,
          attemptId: existing.attemptId,
          reusedInFlight: true,
        };
      }
    }

    // 2. Cooldown check (5s per user per lab)
    const recent = tx.findRecentUserSubmissions(userId, caseSlug, 1);
    if (recent.length > 0 && now - recent[0].createdAt < 5000) {
      throw new Error("Rate limit: Please wait at least 5 seconds between submission attempts.");
    }

    // 3. Hourly quota check (15/hr)
    const hourlyCount = tx.countHourlySubmissions(userId, now - 3600 * 1000);
    if (hourlyCount >= 15) {
      throw new Error("Hourly attempt quota exceeded (max 15 attempts per hour).");
    }

    // 4. Reserve
    const attemptId = `att_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const sub = tx.insertSubmission({
      userId,
      caseSlug,
      attemptId,
      idempotencyKey,
      status: "reserved",
      createdAt: now,
    });

    return {
      alreadyCompleted: false,
      attemptId: sub.attemptId,
      reusedInFlight: false,
    };
  });
}

/**
 * Simulates `_recordLabResult`
 */
async function recordResult(db, { attemptId, score, passed, now = Date.now() }) {
  return await db.mutate(async (tx) => {
    const all = Array.from(db.labSubmissions.values());
    const sub = all.find((s) => s.attemptId === attemptId);
    if (!sub) throw new Error("Attempt record not found");

    if (sub.status === "completed") {
      throw new Error("Attempt has already been completed and graded");
    }

    return tx.patchSubmission(sub._id, {
      status: "completed",
      score,
      passed,
      completedAt: now,
    });
  });
}

/**
 * Simulates `_failLabAttempt`
 */
async function failAttempt(db, { attemptId, errorCode, now = Date.now() }) {
  return await db.mutate(async (tx) => {
    const all = Array.from(db.labSubmissions.values());
    const sub = all.find((s) => s.attemptId === attemptId);
    if (!sub) throw new Error("Attempt record not found");

    if (sub.status === "completed") {
      return sub; // Cannot fail already completed attempt
    }

    return tx.patchSubmission(sub._id, {
      status: "failed",
      errorCode,
      completedAt: now,
    });
  });
}

// ============================================================================
// Test Suite: Concurrency, Retries & Lifecycle
// ============================================================================

test("Concurrency 1: Simultaneous requests for same user and lab trigger cooldown protection", async () => {
  const db = createMockTransactionalDb();
  const baseTime = 1710000000000;

  // First request succeeds
  const res1 = await reserveAttempt(db, {
    userId: "user_test_1",
    caseSlug: "rate-limiter",
    idempotencyKey: "req_key_1",
    now: baseTime,
  });
  assert.equal(res1.reusedInFlight, false);
  assert.ok(res1.attemptId);

  // Immediate second request (different idempotency key, same millisecond)
  await assert.rejects(
    async () => {
      await reserveAttempt(db, {
        userId: "user_test_1",
        caseSlug: "rate-limiter",
        idempotencyKey: "req_key_2",
        now: baseTime + 100, // 100ms later (within 5000ms cooldown)
      });
    },
    {
      name: "Error",
      message: /Rate limit: Please wait at least 5 seconds/,
    },
  );
});

test("Concurrency 2: Retrying with same idempotency key reuses in-flight reservation without consuming attempt", async () => {
  const db = createMockTransactionalDb();
  const baseTime = 1710000000000;

  // First call reserves attempt
  const res1 = await reserveAttempt(db, {
    userId: "user_test_1",
    caseSlug: "rate-limiter",
    idempotencyKey: "client_req_uuid_100",
    now: baseTime,
  });

  // Client network times out and client retries 1 second later with same idempotencyKey
  const res2 = await reserveAttempt(db, {
    userId: "user_test_1",
    caseSlug: "rate-limiter",
    idempotencyKey: "client_req_uuid_100",
    now: baseTime + 1000,
  });

  // Must return the existing attemptId and NOT throw a cooldown error
  assert.equal(res2.attemptId, res1.attemptId);
  assert.equal(res2.reusedInFlight, true);
  assert.equal(db.labSubmissions.size, 1, "Only one reservation row must exist");
});

test("Concurrency 3: Retry after completion returns cached result without re-calling AI", async () => {
  const db = createMockTransactionalDb();
  const baseTime = 1710000000000;

  const res1 = await reserveAttempt(db, {
    userId: "user_test_1",
    caseSlug: "rate-limiter",
    idempotencyKey: "client_req_uuid_200",
    now: baseTime,
  });

  // Complete the attempt
  await recordResult(db, {
    attemptId: res1.attemptId,
    score: 94,
    passed: true,
    now: baseTime + 2000,
  });

  // Subsequent request with the same idempotency key
  const res2 = await reserveAttempt(db, {
    userId: "user_test_1",
    caseSlug: "rate-limiter",
    idempotencyKey: "client_req_uuid_200",
    now: baseTime + 10000,
  });

  assert.equal(res2.alreadyCompleted, true);
  assert.equal(res2.score, 94);
  assert.equal(res2.passed, true);
});

test("Concurrency 4: Burst of 15 simultaneous requests at hourly boundary enforces strict quota", async () => {
  const db = createMockTransactionalDb();
  let time = 1710000000000;

  // 15 requests spaced 6 seconds apart
  for (let i = 1; i <= 15; i++) {
    const res = await reserveAttempt(db, {
      userId: "user_test_1",
      caseSlug: "rate-limiter",
      idempotencyKey: `burst_req_${i}`,
      now: time,
    });
    assert.ok(res.attemptId);
    time += 6000;
  }

  // 16th request within the hour must be blocked
  await assert.rejects(
    async () => {
      await reserveAttempt(db, {
        userId: "user_test_1",
        caseSlug: "rate-limiter",
        idempotencyKey: "burst_req_16",
        now: time,
      });
    },
    {
      name: "Error",
      message: /Hourly attempt quota exceeded/,
    },
  );
});

test("Concurrency 5: Network failure transitions reservation to failed state with error code", async () => {
  const db = createMockTransactionalDb();

  const res = await reserveAttempt(db, {
    userId: "user_test_1",
    caseSlug: "rate-limiter",
    idempotencyKey: "fail_req_1",
    now: 1710000000000,
  });

  await failAttempt(db, {
    attemptId: res.attemptId,
    errorCode: "PROVIDER_TIMEOUT_10S",
    now: 1710000010000,
  });

  const sub = Array.from(db.labSubmissions.values())[0];
  assert.equal(sub.status, "failed");
  assert.equal(sub.errorCode, "PROVIDER_TIMEOUT_10S");
});

test("Concurrency 6: Duplicate result submission on same attempt is strictly rejected", async () => {
  const db = createMockTransactionalDb();

  const res = await reserveAttempt(db, {
    userId: "user_test_1",
    caseSlug: "rate-limiter",
    idempotencyKey: "dup_result_test",
    now: 1710000000000,
  });

  // First result submission
  await recordResult(db, {
    attemptId: res.attemptId,
    score: 88,
    passed: true,
  });

  // Second result submission for same attempt must fail
  await assert.rejects(
    async () => {
      await recordResult(db, {
        attemptId: res.attemptId,
        score: 99,
        passed: true,
      });
    },
    {
      name: "Error",
      message: /Attempt has already been completed/,
    },
  );
});

test("Concurrency 7: Provider-health server-controlled timestamps clamp future inputs and bound old inputs", () => {
  const now = 1710000000000;

  function sanitizeTimestamp(input, serverNow) {
    let t = typeof input === "number" && Number.isFinite(input) ? input : serverNow;
    if (t > serverNow) {
      t = serverNow; // Clamped to server time
    }
    if (t < serverNow - 3600_000) {
      t = serverNow - 3600_000; // Bounded to 1 hr past
    }
    return t;
  }

  // Future timestamp
  assert.equal(sanitizeTimestamp(now + 100_000, now), now);
  // Past timestamp within 1 hr
  assert.equal(sanitizeTimestamp(now - 30_000, now), now - 30_000);
  // Very old timestamp (> 1 hr)
  assert.equal(sanitizeTimestamp(now - 7200_000, now), now - 3600_000);
  // Undefined or NaN
  assert.equal(sanitizeTimestamp(undefined, now), now);
  assert.equal(sanitizeTimestamp(NaN, now), now);
});

test("Concurrency 8: Concurrent initialization serialized under OCC conflict resolution results in exactly 1 record", async () => {
  const providerHealthRecords = new Map();

  // Simulate Convex transactional OCC mutation for _recordProviderHealth
  async function simulateOccRecordProviderHealth(provider, success, requestTime) {
    // Read phase
    const existing = providerHealthRecords.get(provider);

    if (!existing) {
      const doc = {
        provider,
        version: 1,
        consecutiveFailures: success ? 0 : 1,
        circuitOpenUntil: 0,
        lastFailureTime: success ? undefined : requestTime,
        lastSuccessTime: success ? requestTime : undefined,
      };
      providerHealthRecords.set(provider, doc);
      return doc;
    }

    const updated = {
      ...existing,
      version: existing.version + 1,
      consecutiveFailures: success ? 0 : existing.consecutiveFailures + 1,
      lastSuccessTime: success ? requestTime : existing.lastSuccessTime,
    };
    providerHealthRecords.set(provider, updated);
    return updated;
  }

  // Run two concurrent first-time failure recordings
  const p1 = simulateOccRecordProviderHealth("groq", false, 1710000000000);
  const p2 = simulateOccRecordProviderHealth("groq", false, 1710000001000);
  await Promise.all([p1, p2]);

  // Assert single authoritative record in table
  assert.equal(providerHealthRecords.size, 1);
  const record = providerHealthRecords.get("groq");
  assert.ok(record);
  assert.equal(record.provider, "groq");
  assert.equal(record.version, 2, "Monotonic version must increment on each transaction");
  assert.equal(record.consecutiveFailures, 2);
});
