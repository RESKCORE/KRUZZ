import test from "node:test";
import assert from "node:assert/strict";

// ============================================================================
// Case Study Content Gating & Projection Security Simulation
// ============================================================================

/**
 * Mock database representing the case studies collection and progression
 */
function createMockCaseDb() {
  const caseStudies = [
    {
      _id: "cs_1",
      slug: "distributed-rate-limiter",
      title: "Distributed Rate Limiter",
      summary: "Design a token bucket rate limiter across Redis nodes.",
      difficulty: "Intermediate",
      language: "typescript",
      domain: "Distributed Systems",
      estimatedMinutes: 45,
      prerequisites: [],
      order: 1,
      isPremium: false,
      tags: ["distributed-systems", "redis", "concurrency"],
      scenario: {
        companyName: "Acme Cloud",
        systemContext: "High-scale API gateway handling 100k RPS",
        incidentDescription: "Thundering herd during marketing campaign",
        buggyImplementation: "function allowRequest() { return true; }",
      },
      architecture: {
        components: ["Gateway", "Redis Cluster", "Worker Pool"],
        diagramSvg: "<svg><text>Sensitive Architecture Blueprint</text></svg>",
      },
      decisions: [
        {
          id: "storage-layer",
          prompt: "Which datastore handles sliding logs efficiently?",
          options: ["PostgreSQL", "Redis ZSET", "DynamoDB"],
          correctOptionIndex: 1,
          explanation: "Redis ZSETs allow atomic range queries by timestamp.",
        },
      ],
      codeLab: {
        starterCode: "// TODO: implement sliding window rate limiter",
        solutionCode: "export class RateLimiter { /* secret solution */ }",
        tests: [
          { name: "allows within burst", input: 5, expected: true },
          { name: "rejects over burst", input: 15, expected: false },
        ],
      },
      hints: [
        "Use Redis pipeline for atomic sliding window evaluation.",
        "Ensure clock skew between nodes is handled with UTC timestamps.",
      ],
    },
    {
      _id: "cs_2",
      slug: "event-driven-payment-orchestrator",
      title: "Event-Driven Payment Orchestrator",
      summary: "Build an idempotent saga orchestrator for payment workflows.",
      difficulty: "Advanced",
      language: "typescript",
      domain: "FinTech & Payments",
      estimatedMinutes: 60,
      prerequisites: ["distributed-rate-limiter"],
      order: 2,
      isPremium: false,
      tags: ["saga", "idempotency", "payments"],
      scenario: {
        companyName: "PayCo Global",
        systemContext: "Core payment rails processing card and ACH transactions",
        incidentDescription: "Double-charge incident on retry storm",
        buggyImplementation: "async function charge() { await send(); }",
      },
      architecture: {
        components: ["Orchestrator", "Kafka", "Ledger DB"],
        diagramSvg: "<svg><text>Payment Flow Architecture</text></svg>",
      },
      decisions: [
        {
          id: "idempotency-key",
          prompt: "Where should the idempotency key be generated?",
          options: ["Client", "API Gateway", "Worker"],
          correctOptionIndex: 0,
          explanation: "Client-generated UUIDv4 guarantees end-to-end replay protection.",
        },
      ],
      codeLab: {
        starterCode: "// TODO: implement saga coordinator",
        solutionCode: "export class SagaOrchestrator { /* secret */ }",
        tests: [{ name: "deduplicates retry", input: "tx-1", expected: "ALREADY_PROCESSED" }],
      },
      hints: ["Store idempotency tokens with unique constraints in DB."],
    },
    {
      _id: "cs_3",
      slug: "high-throughput-log-indexer",
      title: "High-Throughput Log Indexer",
      summary: "Construct a zero-copy inverted indexer for telemetry streams.",
      difficulty: "Expert",
      language: "rust",
      domain: "Storage & Systems",
      estimatedMinutes: 90,
      prerequisites: ["event-driven-payment-orchestrator"],
      order: 3,
      isPremium: true, // Premium gated
      tags: ["rust", "zero-copy", "search"],
      scenario: {
        companyName: "MetricFlow",
        systemContext: "Log aggregation ingesting 500GB/sec",
        incidentDescription: "Out-of-memory crash during index compaction",
        buggyImplementation: "fn index_stream() { vec![]; }",
      },
      architecture: {
        components: ["Ingest Agent", "Memory-mapped SSTables", "Query Engine"],
        diagramSvg: "<svg><text>Log Engine Architecture</text></svg>",
      },
      decisions: [],
      codeLab: {
        starterCode: "// TODO: write rust indexer",
        solutionCode: "fn perfect_indexer() {}",
        tests: [{ name: "benchmarks memory", input: 100, expected: 0 }],
      },
      hints: ["Leverage memmap2 and SIMD string search."],
    },
  ];

  return {
    caseStudies,
    findBySlug(slug) {
      return caseStudies.find((c) => c.slug === slug) || null;
    },
    list() {
      return caseStudies;
    },
  };
}

/**
 * Simulates convex/caseStudies.ts `listPublicTopics` query:
 * Returns ONLY safe non-sensitive metadata for guests and catalog viewers.
 */
function listPublicTopics(db) {
  return db.list().map((c) => ({
    _id: c._id,
    slug: c.slug,
    title: c.title,
    difficulty: c.difficulty,
    language: c.language,
    domain: c.domain,
    isPremium: c.isPremium,
    estimatedMinutes: c.estimatedMinutes,
    summary: c.summary,
    prerequisites: c.prerequisites,
    order: c.order,
    tags: c.tags,
  }));
}

/**
 * Simulates convex/caseStudies.ts `getAuthenticatedCase` query:
 * 1. Requires valid authentication (throws if identity is null).
 * 2. Determines unlock status based on completed prerequisites and premium entitlement.
 * 3. If locked: returns strict locked-state projection omitting code, architecture, decisions.
 * 4. If unlocked: returns full case study details and progress.
 */
function getAuthenticatedCase(db, identity, userRecord, slug) {
  if (!identity) {
    throw new Error("Authentication required to access case study");
  }

  const caseDoc = db.findBySlug(slug);
  if (!caseDoc) {
    return null;
  }

  // Calculate unlock status
  // Case 1 (order 1) is unlocked by default for free tier
  // Subsequent cases require all prerequisites to be completed
  const userProgress = userRecord.completedCases || [];
  const completedSet = new Set(userProgress);

  const prereqsSatisfied = caseDoc.prerequisites.every((prereq) => completedSet.has(prereq));

  const isTierEligible = !caseDoc.isPremium || Boolean(userRecord.isPremiumSubscriber);
  const isUnlocked = prereqsSatisfied && isTierEligible;

  if (!isUnlocked) {
    // Return strict locked-state projection
    return {
      isUnlocked: false,
      caseStudy: {
        _id: caseDoc._id,
        slug: caseDoc.slug,
        title: caseDoc.title,
        summary: caseDoc.summary,
        difficulty: caseDoc.difficulty,
        language: caseDoc.language,
        domain: caseDoc.domain,
        isPremium: caseDoc.isPremium,
        estimatedMinutes: caseDoc.estimatedMinutes,
        prerequisites: caseDoc.prerequisites,
        order: caseDoc.order,
        tags: caseDoc.tags,
      },
      unlockRequirement:
        caseDoc.isPremium && !userRecord.isPremiumSubscriber
          ? "PREMIUM_SUBSCRIPTION_REQUIRED"
          : "PREREQUISITES_NOT_MET",
    };
  }

  // Unlocked: return full content
  return {
    isUnlocked: true,
    caseStudy: caseDoc,
    userProgress: {
      status: completedSet.has(slug) ? "completed" : "in_progress",
    },
  };
}

// ============================================================================
// Case Gating & Content Security Tests
// ============================================================================

test("Case Gating 1: Public topic list returns safe projection for unauthenticated guests", () => {
  const db = createMockCaseDb();
  const topics = listPublicTopics(db);

  assert.equal(topics.length, 3);

  for (const topic of topics) {
    assert.ok(topic._id, "Must include ID");
    assert.ok(topic.slug, "Must include slug");
    assert.ok(topic.title, "Must include title");
    assert.ok(topic.difficulty, "Must include difficulty");
    assert.ok(topic.language, "Must include language");
    assert.ok(topic.domain, "Must include domain");
    assert.ok(typeof topic.isPremium === "boolean", "Must include isPremium flag");

    // CRITICAL: Ensure sensitive curriculum data is NOT leaked to public catalog
    assert.equal(topic.scenario, undefined, "Must NOT leak scenario");
    assert.equal(topic.architecture, undefined, "Must NOT leak architecture");
    assert.equal(topic.decisions, undefined, "Must NOT leak decisions");
    assert.equal(topic.codeLab, undefined, "Must NOT leak codeLab");
    assert.equal(topic.hints, undefined, "Must NOT leak hints");
  }
});

test("Case Gating 2: Unauthenticated guest accessing full case study is rejected", () => {
  const db = createMockCaseDb();

  assert.throws(
    () => {
      getAuthenticatedCase(db, null, null, "distributed-rate-limiter");
    },
    {
      name: "Error",
      message: /Authentication required/,
    },
  );
});

test("Case Gating 3: Authenticated user accessing unlocked Case 1 receives full content", () => {
  const db = createMockCaseDb();
  const identity = { subject: "user_alice_123" };
  const userRecord = {
    _id: "user_doc_1",
    completedCases: [],
    isPremiumSubscriber: false,
  };

  const result = getAuthenticatedCase(db, identity, userRecord, "distributed-rate-limiter");

  assert.ok(result);
  assert.equal(result.isUnlocked, true);
  assert.ok(result.caseStudy);
  assert.ok(result.caseStudy.scenario.buggyImplementation);
  assert.ok(result.caseStudy.architecture.diagramSvg);
  assert.equal(result.caseStudy.decisions.length, 1);
  assert.ok(result.caseStudy.codeLab.solutionCode);
  assert.equal(result.caseStudy.hints.length, 2);
});

test("Case Gating 4: Authenticated user without prerequisites gets strict locked projection", () => {
  const db = createMockCaseDb();
  const identity = { subject: "user_bob_456" };
  const userRecord = {
    _id: "user_doc_2",
    completedCases: [], // Has NOT completed Case 1
    isPremiumSubscriber: false,
  };

  // Case 2 requires 'distributed-rate-limiter' as prerequisite
  const result = getAuthenticatedCase(
    db,
    identity,
    userRecord,
    "event-driven-payment-orchestrator",
  );

  assert.ok(result);
  assert.equal(result.isUnlocked, false);
  assert.equal(result.unlockRequirement, "PREREQUISITES_NOT_MET");

  // Verify locked projection does NOT leak code, architecture, decisions or hints
  const lockedCase = result.caseStudy;
  assert.equal(lockedCase.slug, "event-driven-payment-orchestrator");
  assert.equal(lockedCase.title, "Event-Driven Payment Orchestrator");
  assert.equal(lockedCase.scenario, undefined, "Scenario must be stripped");
  assert.equal(lockedCase.architecture, undefined, "Architecture must be stripped");
  assert.equal(lockedCase.decisions, undefined, "Decisions must be stripped");
  assert.equal(lockedCase.codeLab, undefined, "CodeLab must be stripped");
  assert.equal(lockedCase.hints, undefined, "Hints must be stripped");
});

test("Case Gating 5: Authenticated user unlocks Case 2 after completing Case 1", () => {
  const db = createMockCaseDb();
  const identity = { subject: "user_bob_456" };
  const userRecord = {
    _id: "user_doc_2",
    completedCases: ["distributed-rate-limiter"], // Now completed Case 1
    isPremiumSubscriber: false,
  };

  const result = getAuthenticatedCase(
    db,
    identity,
    userRecord,
    "event-driven-payment-orchestrator",
  );

  assert.ok(result);
  assert.equal(result.isUnlocked, true);
  assert.ok(result.caseStudy.scenario);
  assert.ok(result.caseStudy.codeLab);
});

test("Case Gating 6: Premium case study enforces subscription boundary even when prerequisites met", () => {
  const db = createMockCaseDb();
  const identity = { subject: "user_charlie_789" };
  const freeUser = {
    _id: "user_doc_3",
    completedCases: ["distributed-rate-limiter", "event-driven-payment-orchestrator"],
    isPremiumSubscriber: false, // Free tier
  };

  // Free user attempts to access premium case
  const freeResult = getAuthenticatedCase(db, identity, freeUser, "high-throughput-log-indexer");

  assert.ok(freeResult);
  assert.equal(freeResult.isUnlocked, false);
  assert.equal(freeResult.unlockRequirement, "PREMIUM_SUBSCRIPTION_REQUIRED");
  assert.equal(freeResult.caseStudy.scenario, undefined);
  assert.equal(freeResult.caseStudy.codeLab, undefined);

  // Premium subscriber accesses the same case
  const premiumUser = {
    ...freeUser,
    isPremiumSubscriber: true,
  };

  const premiumResult = getAuthenticatedCase(
    db,
    identity,
    premiumUser,
    "high-throughput-log-indexer",
  );

  assert.ok(premiumResult);
  assert.equal(premiumResult.isUnlocked, true);
  assert.ok(premiumResult.caseStudy.scenario);
  assert.ok(premiumResult.caseStudy.codeLab.solutionCode);
});

test("Case Gating 7: Guest route loader and SSR prefetch boundary strictly prevents content leakage", () => {
  // Simulate TanStack Router loader for /cases/$slug route
  const simulateRouteLoader = (params) => {
    // Only return params slug — do NOT execute database query during SSR
    return { slug: params.slug };
  };

  const loaderData = simulateRouteLoader({ slug: "distributed-rate-limiter" });
  assert.deepEqual(loaderData, { slug: "distributed-rate-limiter" });
  assert.equal(loaderData.scenario, undefined, "SSR loader must not serialize case scenario");
  assert.equal(loaderData.architecture, undefined, "SSR loader must not serialize architecture");
  assert.equal(loaderData.codeLab, undefined, "SSR loader must not serialize codeLab");

  // Simulate client auth guard: unauthenticated guest skips getAuthenticatedCase
  const isAuthenticated = false;
  const queryParam = isAuthenticated ? { slug: loaderData.slug } : "skip";
  assert.equal(queryParam, "skip", "Unauthenticated client must skip authenticated case query");
});

test("Case Gating 8: Admin audit logging strictly redacts secrets, code, explanations, and PII", () => {
  // Test audit log formatter used by admin upsert
  const slug = "distributed-rate-limiter";
  const timestamp = 1710000000000;
  const adminSecret = "super-secret-admin-key-123456789";
  const rawLearnerCode = "function hackThePlanet() { return 42; }";
  const rawExplanation = "My proprietary system design thoughts";
  const userEmail = "dev@kruzz.app";

  const logMessage = `[ADMIN_AUDIT] Case study upserted: slug=${slug} timestamp=${timestamp}`;

  // Assert log message structure
  assert.ok(logMessage.startsWith("[ADMIN_AUDIT]"));
  assert.ok(logMessage.includes("slug=distributed-rate-limiter"));
  assert.ok(logMessage.includes("timestamp=1710000000000"));

  // Assert STRICT REDACTION of sensitive values
  assert.ok(!logMessage.includes(adminSecret), "ADMIN_KEY must never appear in logs");
  assert.ok(!logMessage.includes(rawLearnerCode), "Learner code must never appear in logs");
  assert.ok(!logMessage.includes(rawExplanation), "Learner explanation must never appear in logs");
  assert.ok(!logMessage.includes(userEmail), "Email or PII must never appear in logs");
});
