import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { type Doc, type Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getOrCreateUser } from "./users";
import { gradeLabAttempt, SCORE_PROMPT } from "./ai";
import { awardPointsInternal } from "./awards";
import { touchStreakForUser } from "./streaks";
import {
  ALL_CASE_SECTION_INDICES,
  VALID_READING_SECTION_INDICES,
  AI_LIMITS,
  estimateTokens,
  estimateCostUsd,
  calculateFullPromptTokens,
  getCaseCompletionReward,
} from "./rules";

/**
 * Deterministically computes a SHA-256 hash covering all fields that affect grading.
 */
export async function computePayloadHash(payload: {
  caseSlug: string;
  labId: string;
  language: string;
  code: string;
  explanation: string;
  contentVersion: string;
  rubricVersion: string;
  promptVersion: string;
}): Promise<string> {
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

  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Minimum reflection requirements enforced on both server (markCaseComplete)
 * and client (cases.$slug.tsx). Keep these values in sync with
 * MIN_REFLECTION_CHARS / MIN_REFLECTION_WORDS in src/data/schema.ts.
 */
export const MIN_REFLECTION_CHARS = 300;
export const MIN_REFLECTION_WORDS = 50;

/**
 * Canonical ordering and metadata of case studies for sequence progression.
 */
export interface CaseMetadata {
  slug: string;
  order: number;
  tier: "free" | "premium";
  title: string;
}

// Beginner OOP (Foundations) is free; every other track is premium.
export const CASE_STUDY_SEQUENCE: CaseMetadata[] = [
  // Track 0: Foundations (OOP) — free
  { slug: "atm-machine", order: 1, tier: "free", title: "ATM Machine" },
  { slug: "library-management", order: 2, tier: "free", title: "Library Management" },
  { slug: "banking-system-transfers", order: 3, tier: "free", title: "Banking System Transfers" },
  { slug: "parking-lot-allocation", order: 4, tier: "free", title: "Parking Lot Allocation" },
  { slug: "vending-machine-states", order: 5, tier: "free", title: "Vending Machine States" },
  { slug: "seat-booking-system", order: 6, tier: "free", title: "Seat Booking System" },
  { slug: "inventory-stock-tracker", order: 7, tier: "free", title: "Inventory Stock Tracker" },

  // Track 1: Web Systems
  {
    slug: "client-server-architecture",
    order: 8,
    tier: "premium",
    title: "Client & Server Architecture",
  },
  { slug: "dns-domain-lookup", order: 9, tier: "premium", title: "DNS Domain Lookup" },
  { slug: "image-cdn-delivery", order: 10, tier: "premium", title: "Image CDN Delivery" },
  {
    slug: "ecommerce-cart-checkout",
    order: 11,
    tier: "premium",
    title: "E-Commerce Cart & Checkout",
  },
  { slug: "search-autocomplete", order: 12, tier: "premium", title: "Search Autocomplete" },

  // Track 2: Security & Identity
  {
    slug: "authentication-workings",
    order: 13,
    tier: "premium",
    title: "Authentication Fundamentals",
  },
  { slug: "password-hashing-salts", order: 14, tier: "premium", title: "Password Hashing & Salts" },
  { slug: "api-key-auth", order: 15, tier: "premium", title: "API Keys & Secret Tokens" },
  { slug: "two-factor-totp", order: 16, tier: "premium", title: "Two-Factor Authentication (OTP)" },
  { slug: "session-tokens-cookies", order: 17, tier: "premium", title: "Session Tokens & Cookies" },

  // Track 3: Distributed Data & Storage
  { slug: "url-shortener", order: 18, tier: "premium", title: "High-Scale URL Shortener" },
  { slug: "key-value-caching", order: 19, tier: "premium", title: "In-Memory Key-Value Cache" },
  { slug: "database-indexing", order: 20, tier: "premium", title: "Database Indexing" },
  {
    slug: "cloud-data-deduplication",
    order: 21,
    tier: "premium",
    title: "Cloud Data Deduplication",
  },

  // Track 4: Realtime & Communication
  {
    slug: "realtime-chat-websocket",
    order: 22,
    tier: "premium",
    title: "Real-Time Chat & WebSockets",
  },
  {
    slug: "push-notification-service",
    order: 23,
    tier: "premium",
    title: "Push Notifications Service",
  },
  { slug: "gaming-live-leaderboard", order: 24, tier: "premium", title: "Gaming Live Leaderboard" },
  { slug: "webhook-event-delivery", order: 25, tier: "premium", title: "Webhook Event Delivery" },

  // Track 5: Reliability & Scalability
  { slug: "api-rate-limiting", order: 26, tier: "premium", title: "Distributed API Rate Limiting" },
  { slug: "background-job-queue", order: 27, tier: "premium", title: "Background Job Queue" },
  { slug: "circuit-breaker-pattern", order: 28, tier: "premium", title: "Circuit Breaker Pattern" },
  {
    slug: "server-health-monitoring",
    order: 29,
    tier: "premium",
    title: "Health Checks & Failover",
  },
  {
    slug: "idempotent-payment-processing",
    order: 30,
    tier: "premium",
    title: "Idempotent Payment Processing",
  },

  // Track 6: Advanced Distributed Architectures
  {
    slug: "two-phase-commit-transactions",
    order: 31,
    tier: "premium",
    title: "Two-Phase Commit Transactions",
  },
  {
    slug: "event-streaming-partitioned-log",
    order: 32,
    tier: "premium",
    title: "Event Streaming Partitioned Log",
  },
  {
    slug: "consistent-hashing-shard-ring",
    order: 33,
    tier: "premium",
    title: "Consistent Hashing Shard Ring",
  },
  {
    slug: "leader-election-consensus",
    order: 34,
    tier: "premium",
    title: "Leader Election Consensus",
  },
  {
    slug: "quorum-reads-writes",
    order: 35,
    tier: "premium",
    title: "Quorum Reads & Writes",
  },
];

/**
 * Shared internal helper executed inside an ACID transaction to mark a case study
 * as completed, award completion RC, update daily streak, and unlock the next free case study.
 */
export async function completeCaseInternal(
  ctx: MutationCtx,
  user: Doc<"users">,
  caseSlug: string,
  progressId: Id<"caseProgress">,
) {
  const now = Date.now();

  // 1. Mark status and completed timestamp
  await ctx.db.patch(progressId, {
    status: "completed",
    completedAt: now,
    updatedAt: now,
  });

  const study = await ctx.db
    .query("caseStudies")
    .withIndex("by_slug", (q) => q.eq("slug", caseSlug))
    .unique();
  const completionPoints = getCaseCompletionReward(study?.difficulty);

  // 2. Award completion bonus (idempotent, 20/30/50 RC based on difficulty)
  await awardPointsInternal(ctx, user, `case:${caseSlug}:complete`, completionPoints);

  // 3. Touch user's streak
  await touchStreakForUser(ctx, user._id);

  // 4. Sequential progression: unlock next free-tier case study
  const currentIndex = CASE_STUDY_SEQUENCE.findIndex((c) => c.slug === caseSlug);
  let nextUnlockedSlug: string | null = null;

  if (currentIndex !== -1 && currentIndex + 1 < CASE_STUDY_SEQUENCE.length) {
    const nextCase = CASE_STUDY_SEQUENCE[currentIndex + 1];

    // Explicit check: only free tier cases are automatically unlocked!
    if (nextCase && nextCase.tier === "free") {
      const existingUnlock = await ctx.db
        .query("caseUnlocks")
        .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", nextCase.slug))
        .unique();

      if (!existingUnlock) {
        await ctx.db.insert("caseUnlocks", {
          userId: user._id,
          caseSlug: nextCase.slug,
          unlockedAt: now,
          reason: "progression",
        });
      }
      nextUnlockedSlug = nextCase.slug;
    }
  }

  return {
    success: true,
    completedSlug: caseSlug,
    nextUnlockedSlug,
  };
}

export const getCaseProgress = query({
  args: {
    caseSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    const progress = await ctx.db
      .query("caseProgress")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .unique();

    return progress;
  },
});

export const getAllUserProgress = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("caseProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const saveCaseProgress = mutation({
  args: {
    caseSlug: v.string(),
    completedSections: v.optional(v.array(v.number())),
    reflection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be signed in to save case progress");
    }

    const study = await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.caseSlug))
      .unique();
    if (!study) {
      throw new Error(`Case study not found: ${args.caseSlug}`);
    }

    const user = await getOrCreateUser(ctx, identity);
    await touchStreakForUser(ctx, user._id);

    const existingProgress = await ctx.db
      .query("caseProgress")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .unique();

    const now = Date.now();

    // Valid reading section indices (0-5 and 7; section 6 is the lab evaluated exclusively by AI)
    const sanitizedIncoming = (args.completedSections ?? []).filter((s) =>
      VALID_READING_SECTION_INDICES.has(s),
    );

    // Individual reading sections track completion progress but do not award standalone points.
    // Points are strictly awarded upon complete 8-section case mastery.

    if (existingProgress) {
      const updates: {
        completedSections?: number[];
        reflection?: string;
        completedAgainstVersion?: string;
        updatedAt: number;
      } = {
        updatedAt: now,
        completedAgainstVersion: study.contentVersion ?? "v1.0",
      };

      if (args.completedSections !== undefined) {
        const merged = Array.from(
          new Set([...existingProgress.completedSections, ...sanitizedIncoming]),
        ).sort((a, b) => a - b);
        updates.completedSections = merged;
      }

      // Persist reflection on existing rows
      if (args.reflection !== undefined) updates.reflection = args.reflection;

      await ctx.db.patch(existingProgress._id, updates);

      // Auto-award case completion bonus and release next free case if lab is passed and all 8 sections completed
      const finalSections = updates.completedSections ?? existingProgress.completedSections;
      if (
        existingProgress.passed &&
        ALL_CASE_SECTION_INDICES.every((s) => finalSections.includes(s))
      ) {
        await completeCaseInternal(ctx, user, args.caseSlug, existingProgress._id);
      }

      return existingProgress._id;
    }

    const progressDoc: {
      userId: typeof user._id;
      caseSlug: string;
      completedSections: number[];
      completedAgainstVersion?: string;
      updatedAt: number;
      reflection?: string;
    } = {
      userId: user._id,
      caseSlug: args.caseSlug,
      completedSections: sanitizedIncoming,
      completedAgainstVersion: study.contentVersion ?? "v1.0",
      updatedAt: now,
    };

    if (args.reflection !== undefined) progressDoc.reflection = args.reflection;

    const newId = await ctx.db.insert("caseProgress", progressDoc);
    return newId;
  },
});

/**
 * Mark a case as fully completed after all sections viewed and lab passed.
 * Awards the 20 RC completion bonus and unlocks the next free case study (idempotent).
 */
export const markCaseComplete = mutation({
  args: {
    caseSlug: v.string(),
    reflection: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be signed in to complete a case");
    }

    const user = await getOrCreateUser(ctx, identity);
    await touchStreakForUser(ctx, user._id);

    const progress = await ctx.db
      .query("caseProgress")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .unique();

    if (!progress) {
      throw new Error("No progress record found for this case study");
    }

    // Verify that the lab was passed
    if (!progress.passed) {
      throw new Error("Practice code lab must be passed before completing case study");
    }

    // Server-side reflection validation (mirrors frontend MIN_REFLECTION_CHARS/WORDS)
    const reflectionRaw = args.reflection ?? progress.reflection ?? "";
    const reflectionTrimmed = reflectionRaw.trim();
    if (reflectionTrimmed.length < MIN_REFLECTION_CHARS) {
      throw new Error(
        `Reflection must be at least ${MIN_REFLECTION_CHARS} characters (currently ${reflectionTrimmed.length}).`,
      );
    }
    const reflectionWords = reflectionTrimmed.split(/\s+/).filter(Boolean);
    if (reflectionWords.length < MIN_REFLECTION_WORDS) {
      throw new Error(
        `Reflection must be at least ${MIN_REFLECTION_WORDS} meaningful words (currently ${reflectionWords.length}).`,
      );
    }
    // Spam detection: reject if fewer than 10% of words are unique
    const uniqueWordRatio =
      new Set(reflectionWords.map((w) => w.toLowerCase())).size / reflectionWords.length;
    if (uniqueWordRatio < 0.1) {
      throw new Error(
        "Reflection appears to be repeated or spammy. Please write a genuine reflection.",
      );
    }

    // Mark all sections as completed and persist reflection
    const allSections = ALL_CASE_SECTION_INDICES;
    await ctx.db.patch(progress._id, {
      completedSections: allSections,
      reflection: reflectionTrimmed,
      updatedAt: Date.now(),
    });

    return await completeCaseInternal(ctx, user, args.caseSlug, progress._id);
  },
});

/**
 * Reconciles awards and RC balance for users who completed cases
 * but did not receive their completion RC bonus.
 */
export const reconcileUserAwards = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { reconciled: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return { reconciled: 0 };

    const progressList = await ctx.db
      .query("caseProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    let count = 0;
    for (const p of progressList) {
      const isCompleted =
        Boolean(p.passed) && (p.status === "completed" || (p.completedSections?.length ?? 0) >= 7);

      if (isCompleted) {
        const awardKey = `case:${p.caseSlug}:complete`;
        const existingAward = await ctx.db
          .query("awards")
          .withIndex("by_user_award", (q) => q.eq("userId", user._id).eq("awardId", awardKey))
          .unique();

        if (!existingAward) {
          await completeCaseInternal(ctx, user, p.caseSlug, p._id);
          count++;
        }
      }
    }

    return { reconciled: count };
  },
});

const ALLOWED_LANGUAGES = ["python", "javascript", "typescript", "java", "c", "cpp", "go", "rust"];

/**
 * Atomic reservation of an AI lab attempt.
 * Enforces authentication, language allowlist, payload size limits,
 * per-user/per-lab 5-second cooldown, and hourly quota (15/hr) BEFORE calling AI.
 */
export const _reserveLabAttempt = internalMutation({
  args: {
    caseSlug: v.string(),
    tokenIdentifier: v.string(),
    language: v.string(),
    codeBytes: v.number(),
    explanationBytes: v.number(),
    idempotencyKey: v.string(),
    payloadHash: v.string(),
    estimatedInputTokens: v.number(),
    promptVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (!user) throw new Error("User not found");

    const langNormalized = args.language.trim().toLowerCase();
    if (!ALLOWED_LANGUAGES.includes(langNormalized)) {
      throw new Error(`Unsupported programming language: ${args.language}`);
    }

    if (args.codeBytes > 20000) {
      throw new Error("Code submission exceeds 20KB limit");
    }

    if (args.explanationBytes > 5000) {
      throw new Error("Explanation exceeds 5,000 character limit");
    } // Check idempotency: return completed result or in-flight reservation
    const existingAttempt = await ctx.db
      .query("labSubmissions")
      .withIndex("by_idempotency", (q) => q.eq("idempotencyKey", args.idempotencyKey))
      .unique();

    if (existingAttempt) {
      // 1. Must belong to the same authenticated user
      if (existingAttempt.userId !== user._id) {
        throw new Error("Unauthorized: Idempotency key belongs to another user");
      }
      // 2. Must target the same case
      if (existingAttempt.caseSlug !== args.caseSlug) {
        throw new Error("Invalid request: Idempotency key cannot be reused across case studies");
      }
      // 3. Must target the same lab
      if (existingAttempt.labId && existingAttempt.labId !== `lab:${args.caseSlug}`) {
        throw new Error("Invalid request: Idempotency key cannot be reused across labs");
      }
      // 4. Must target the same language
      if (existingAttempt.language && existingAttempt.language !== langNormalized) {
        throw new Error("Invalid request: Idempotency key cannot be reused across languages");
      }
      // 5. Payload hash MUST match exactly. If payload differs, reject!
      if (existingAttempt.payloadHash && existingAttempt.payloadHash !== args.payloadHash) {
        throw new Error(
          "Idempotency conflict: Reused idempotency key with different payload content",
        );
      }

      if (existingAttempt.status === "completed") {
        return {
          alreadyCompleted: true,
          attemptId: existingAttempt.attemptId,
          score: existingAttempt.score ?? 100,
          passed: existingAttempt.passed ?? true,
        };
      }
      // In-flight active reservation: return existing attemptId to prevent duplicate deduction
      if (existingAttempt.status === "reserved" || existingAttempt.status === "processing") {
        if (Date.now() - existingAttempt.createdAt < AI_LIMITS.RESERVATION_EXPIRY_MS) {
          return {
            alreadyCompleted: false,
            attemptId: existingAttempt.attemptId,
          };
        } else {
          // Stale in-flight reservation has expired: mark it expired and release reservation lock
          await ctx.db.patch(existingAttempt._id, {
            status: "expired",
            errorCode: "reservation_expired",
            completedAt: Date.now(),
          });
        }
      }
    }

    const now = Date.now();

    // Check per-user/per-lab 5-second cooldown
    const recentSubmissions = await ctx.db
      .query("labSubmissions")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .order("desc")
      .take(1);

    if (recentSubmissions.length > 0 && recentSubmissions[0]) {
      const lastAttempt = recentSubmissions[0];
      if (
        lastAttempt.status !== "expired" &&
        now - lastAttempt.createdAt < AI_LIMITS.COOLDOWN_SECONDS * 1000
      ) {
        throw new Error(
          `Rate limit: Please wait at least ${AI_LIMITS.COOLDOWN_SECONDS} seconds between submission attempts.`,
        );
      }
    }

    // Check per-user hourly quota (max 15 attempts/hour)
    const oneHourAgo = now - 3600 * 1000;
    const hourlySubmissions = await ctx.db
      .query("labSubmissions")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id).gte("createdAt", oneHourAgo))
      .collect();

    const activeHourlySubmissions = hourlySubmissions.filter((s) => s.status !== "expired");
    if (activeHourlySubmissions.length >= AI_LIMITS.MAX_ATTEMPTS_PER_HOUR) {
      throw new Error(
        `Hourly attempt quota exceeded (max ${AI_LIMITS.MAX_ATTEMPTS_PER_HOUR} attempts per hour). Please try again later.`,
      );
    }

    // Check per-user daily budget (max 30 attempts/day)
    const oneDayAgo = now - 24 * 3600 * 1000;
    const dailySubmissions = await ctx.db
      .query("labSubmissions")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id).gte("createdAt", oneDayAgo))
      .collect();

    // Lazily mark expired in-flight reservations to release stranded user budgets
    for (const s of dailySubmissions) {
      if (
        (s.status === "reserved" || s.status === "processing") &&
        now - s.createdAt >= AI_LIMITS.RESERVATION_EXPIRY_MS
      ) {
        await ctx.db.patch(s._id, {
          status: "expired",
          errorCode: "reservation_expired",
          completedAt: now,
        });
        s.status = "expired";
      }
    }

    const activeDailySubmissions = dailySubmissions.filter((s) => s.status !== "expired");
    if (activeDailySubmissions.length >= AI_LIMITS.MAX_ATTEMPTS_PER_DAY) {
      throw new Error(
        `Daily attempt quota exceeded (max ${AI_LIMITS.MAX_ATTEMPTS_PER_DAY} attempts per 24 hours). Please try again tomorrow.`,
      );
    }

    // Check per-user daily token quota (100,000 tokens/day)
    const dailyTokensUsed = activeDailySubmissions.reduce(
      (sum, s) => sum + (s.estimatedInputTokens ?? 0) + (s.estimatedOutputTokens ?? 0),
      0,
    );
    if (dailyTokensUsed + args.estimatedInputTokens > AI_LIMITS.DAILY_USER_TOKEN_CEILING) {
      throw new Error(
        `Daily token ceiling exceeded (max ${AI_LIMITS.DAILY_USER_TOKEN_CEILING.toLocaleString()} tokens per 24 hours). Please try again tomorrow.`,
      );
    }

    // Check per-user daily spend ceiling ($0.50/day)
    const dailySpendUsd = activeDailySubmissions.reduce(
      (sum, s) => sum + (s.estimatedCostUsd ?? 0),
      0,
    );
    if (dailySpendUsd >= AI_LIMITS.DAILY_USER_SPEND_CEILING_USD) {
      throw new Error(
        `Daily usage budget exceeded ($${AI_LIMITS.DAILY_USER_SPEND_CEILING_USD.toFixed(2)} USD limit per 24 hours). Please try again tomorrow.`,
      );
    }

    // Check system aggregate daily spend ceiling ($25.00/day)
    const systemDailySubmissions = await ctx.db
      .query("labSubmissions")
      .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
      .collect();
    const activeSystemDaily = systemDailySubmissions.filter((s) => s.status !== "expired");
    const systemSpendUsd = activeSystemDaily.reduce((sum, s) => sum + (s.estimatedCostUsd ?? 0), 0);
    if (systemSpendUsd >= AI_LIMITS.DAILY_SYSTEM_SPEND_CEILING_USD) {
      throw new Error("System daily capacity reached. Please try again tomorrow.");
    }

    // Look up study for versioning
    const study = await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.caseSlug))
      .unique();

    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    const attemptId = `att_${hex}`;

    // Atomically pre-reserve estimated spend
    const initialEstimatedCostUsd = estimateCostUsd(
      args.estimatedInputTokens,
      AI_LIMITS.MAX_OUTPUT_TOKENS_PER_ATTEMPT,
    );

    await ctx.db.insert("labSubmissions", {
      userId: user._id,
      caseSlug: args.caseSlug,
      labId: `lab:${args.caseSlug}`,
      attemptId,
      reservationId: attemptId,
      idempotencyKey: args.idempotencyKey,
      language: langNormalized,
      payloadHash: args.payloadHash,
      status: "reserved",
      rubricVersion: study?.rubricVersion ?? "v1.0",
      contentVersion: study?.contentVersion ?? "v1.0",
      promptVersion: args.promptVersion ?? "v1.0",
      inputCodeBytes: args.codeBytes,
      inputExplanationBytes: args.explanationBytes,
      estimatedInputTokens: args.estimatedInputTokens,
      estimatedCostUsd: initialEstimatedCostUsd,
      createdAt: now,
    });

    return {
      alreadyCompleted: false,
      attemptId,
    };
  },
});

/**
 * Durable Provider Health & Circuit Breaker State Check.
 * Cross-instance, shared state stored in Convex database.
 */
export const _checkProviderCircuit = internalQuery({
  args: {
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("providerHealth")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .collect();

    if (records.length === 0) {
      return { available: true, circuitVersion: 0, checkedAt: Date.now() };
    }

    const record = records[0]!;
    const now = Date.now();
    if (record.circuitOpenUntil > now) {
      return {
        available: false,
        retryAfterMs: record.circuitOpenUntil - now,
        circuitVersion: record.version ?? 0,
        checkedAt: now,
      };
    }

    return {
      available: true,
      circuitVersion: record.version ?? 0,
      checkedAt: now,
    };
  },
});

/**
 * Atomically records provider health outcome (success or failure) in shared DB.
 * Guarantees single-row authoritative state under concurrency and protects against
 * stale out-of-order provider responses resetting tripped circuits.
 */
export const _recordProviderHealth = internalMutation({
  args: {
    provider: v.string(),
    success: v.boolean(),
    requestTimestamp: v.optional(v.number()),
    circuitVersion: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("providerHealth")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .collect();

    const now = Date.now();
    // Clamp future timestamps to current server time; bound excessively stale timestamps (> 1 hour old)
    let requestTime =
      typeof args.requestTimestamp === "number" && Number.isFinite(args.requestTimestamp)
        ? args.requestTimestamp
        : now;
    if (requestTime > now) {
      requestTime = now;
    }
    if (requestTime < now - 3600_000) {
      requestTime = now - 3600_000;
    }

    // Self-healing single-row guarantee: if multiple records exist due to concurrent creation,
    // retain the latest version as primary and delete duplicate rows in the same transaction.
    let primary = records[0];
    if (records.length > 1) {
      records.sort((a, b) => (a.version ?? 0) - (b.version ?? 0));
      primary = records[records.length - 1];
      for (const rec of records) {
        if (rec._id !== primary!._id) {
          await ctx.db.delete(rec._id);
        }
      }
    }

    if (!primary) {
      const doc: {
        provider: string;
        version: number;
        consecutiveFailures: number;
        circuitOpenUntil: number;
        updatedAt: number;
        lastSuccessTime?: number;
        lastFailureTime?: number;
      } = {
        provider: args.provider,
        version: 1,
        consecutiveFailures: args.success ? 0 : 1,
        circuitOpenUntil: 0,
        updatedAt: now,
      };
      if (args.success) {
        doc.lastSuccessTime = requestTime;
      } else {
        doc.lastFailureTime = requestTime;
      }
      await ctx.db.insert("providerHealth", doc);
      return;
    }

    const currentVersion = primary.version ?? 1;

    if (!args.success) {
      const newFailures = primary.consecutiveFailures + 1;
      const circuitOpenUntil = newFailures >= 5 ? now + 30 * 1000 : 0; // 30s cooldown
      await ctx.db.patch(primary._id, {
        consecutiveFailures: newFailures,
        circuitOpenUntil:
          circuitOpenUntil > 0
            ? Math.max(primary.circuitOpenUntil, circuitOpenUntil)
            : primary.circuitOpenUntil,
        lastFailureTime: now,
        version: currentVersion + 1,
        updatedAt: now,
      });
      return;
    }

    // Success branch with STALE RESULT PROTECTION:
    // 1. If circuit is currently open:
    // Only close if recovery timeout has passed (now >= circuitOpenUntil)
    // AND request was sent after the failures that opened it (requestTime >= lastFailureTime).
    if (primary.circuitOpenUntil > now) {
      await ctx.db.patch(primary._id, {
        lastSuccessTime: Math.max(primary.lastSuccessTime ?? 0, requestTime),
        version: currentVersion + 1,
        updatedAt: now,
      });
      return;
    }

    // 2. If the success was dispatched BEFORE the latest failure:
    // It's a delayed out-of-order response; do not reset failure counter!
    if (primary.lastFailureTime && requestTime < primary.lastFailureTime) {
      await ctx.db.patch(primary._id, {
        lastSuccessTime: Math.max(primary.lastSuccessTime ?? 0, requestTime),
        version: currentVersion + 1,
        updatedAt: now,
      });
      return;
    }

    // Genuine fresh success: resets circuit state
    await ctx.db.patch(primary._id, {
      consecutiveFailures: 0,
      circuitOpenUntil: 0,
      lastSuccessTime: now,
      version: currentVersion + 1,
      updatedAt: now,
    });
  },
});

/**
 * Record a failed lab attempt (system, provider, or validation error).
 * Preserves learner score and completion integrity without mutating progression.
 */
export const _failLabAttempt = internalMutation({
  args: {
    attemptId: v.string(),
    status: v.optional(v.string()), // "provider_failed" | "validation_failed" | "failed"
    errorCode: v.string(),
  },
  handler: async (ctx, args) => {
    const attempt = await ctx.db
      .query("labSubmissions")
      .withIndex("by_attempt_id", (q) => q.eq("attemptId", args.attemptId))
      .unique();

    if (attempt && attempt.status !== "completed") {
      await ctx.db.patch(attempt._id, {
        status: args.status ?? "provider_failed",
        errorCode: args.errorCode,
        completedAt: Date.now(),
      });
    }
  },
});

/**
 * Sweeps and expires stale in-flight reservations (older than 5 minutes).
 * Releases reserved budget allocations and sets status to "expired".
 */
export const cleanupExpiredReservations = internalMutation({
  args: {
    maxBatch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cutoff = now - AI_LIMITS.RESERVATION_EXPIRY_MS;
    const limit = args.maxBatch ?? 100;

    const reserved = await ctx.db
      .query("labSubmissions")
      .withIndex("by_status_created", (q) => q.eq("status", "reserved").lt("createdAt", cutoff))
      .take(limit);

    const processing = await ctx.db
      .query("labSubmissions")
      .withIndex("by_status_created", (q) => q.eq("status", "processing").lt("createdAt", cutoff))
      .take(limit);

    let count = 0;
    for (const rec of [...reserved, ...processing]) {
      await ctx.db.patch(rec._id, {
        status: "expired",
        errorCode: "reservation_expired",
        completedAt: now,
      });
      count++;
    }
    return { expiredCount: count, timestamp: now };
  },
});

/**
 * Internal mutation — writes the grade result, audit record, and awards points.
 * Preserves monotonic score invariants:
 * - bestScore never decreases.
 * - Once passed, passed flag never reverts to false.
 */
export const _recordLabResult = internalMutation({
  args: {
    attemptId: v.string(),
    caseSlug: v.string(),
    tokenIdentifier: v.string(),
    score: v.number(),
    passed: v.boolean(),
    latencyMs: v.optional(v.number()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    reconciledInputTokens: v.optional(v.number()),
    estimatedOutputTokens: v.optional(v.number()),
    estimatedCostUsd: v.optional(v.number()),
    isEstimatedUsage: v.optional(v.boolean()),
    contentVersion: v.optional(v.string()),
    rubricVersion: v.optional(v.string()),
    promptVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await touchStreakForUser(ctx, user._id);

    const now = Date.now();

    // Update audit record in labSubmissions
    const attempt = await ctx.db
      .query("labSubmissions")
      .withIndex("by_attempt_id", (q) => q.eq("attemptId", args.attemptId))
      .unique();

    if (attempt) {
      if (attempt.status === "completed") {
        return; // Prevent duplicate scoring / replaying on the same reservation
      }
      if (attempt.status === "expired") {
        return; // Stale delayed response arriving after reservation expired; ignore to preserve budget and invariants
      }

      await ctx.db.patch(attempt._id, {
        status: args.passed ? "completed" : "learner_failed",
        score: args.score,
        passed: args.passed,
        provider: args.provider,
        model: args.model,
        latencyMs: args.latencyMs,
        estimatedOutputTokens: args.estimatedOutputTokens,
        ...(args.reconciledInputTokens !== undefined
          ? { estimatedInputTokens: args.reconciledInputTokens }
          : {}),
        ...(args.estimatedCostUsd !== undefined ? { estimatedCostUsd: args.estimatedCostUsd } : {}),
        ...(args.isEstimatedUsage !== undefined ? { isEstimatedUsage: args.isEstimatedUsage } : {}),
        ...(args.contentVersion ? { contentVersion: args.contentVersion } : {}),
        ...(args.rubricVersion ? { rubricVersion: args.rubricVersion } : {}),
        ...(args.promptVersion ? { promptVersion: args.promptVersion } : {}),
        completedAt: now,
      });
    }

    const existingProgress = await ctx.db
      .query("caseProgress")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .unique();

    // Clamp score and enforce monotonic non-decreasing transitions
    const clampedScore = Math.max(0, Math.min(100, Math.round(args.score)));
    const currentBest = existingProgress?.bestScore ?? 0;
    const newBestScore = Math.max(currentBest, clampedScore);
    const newPassed = Boolean(existingProgress?.passed || args.passed);

    if (args.passed) {
      // Record lab pass award with 0 points; full RC is awarded on 100% case completion
      await awardPointsInternal(ctx, user, `case:${args.caseSlug}:lab`, 0);
    }

    // Append section 6 (Practice / Code Lab) if passed
    const currentSections = existingProgress?.completedSections ?? [];
    const updatedSections = args.passed
      ? Array.from(new Set([...currentSections, 6])).sort((a, b) => a - b)
      : currentSections;

    if (existingProgress) {
      await ctx.db.patch(existingProgress._id, {
        bestScore: newBestScore,
        passed: newPassed,
        completedSections: updatedSections,
        updatedAt: now,
      });

      // Check if all 8 sections are completed
      if (newPassed && ALL_CASE_SECTION_INDICES.every((s) => updatedSections.includes(s))) {
        await completeCaseInternal(ctx, user, args.caseSlug, existingProgress._id);
      }
    } else {
      await ctx.db.insert("caseProgress", {
        userId: user._id,
        caseSlug: args.caseSlug,
        completedSections: updatedSections,
        bestScore: newBestScore,
        passed: newPassed,
        updatedAt: now,
      });
    }
  },
});

/**
 * Grades a student's code + explanation using the free-tier AI models,
 * reserving the attempt atomically before the provider call to prevent race abuse.
 */
export const submitCaseLab = action({
  args: {
    caseSlug: v.string(),
    language: v.string(),
    code: v.string(),
    explanation: v.string(),
    labTitle: v.string(),
    labPrompt: v.string(),
    idempotencyKey: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    score: number;
    passed: boolean;
    summary: string;
    strengths: string[];
    mistakes: { area: string; problem: string; suggestion: string }[];
    nextStep: string;
  }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be signed in to submit a lab");
    }

    // 1. Validate payload bounds
    if (!args.code || args.code.trim().length < 10) {
      throw new Error("Code submission is too short or empty");
    }
    if (args.code.length > AI_LIMITS.MAX_INPUT_CODE_BYTES) {
      throw new Error("Code submission exceeds 20KB limit");
    }

    if (!args.explanation || args.explanation.trim().split(/\s+/).length < 20) {
      throw new Error("Explanation must be at least 20 words");
    }
    if (args.explanation.length > AI_LIMITS.MAX_INPUT_EXPLANATION_BYTES) {
      throw new Error("Explanation exceeds 5,000 characters limit");
    }

    const idempotencyKey =
      args.idempotencyKey || `idem_${args.caseSlug}_${identity.subject}_${Date.now()}`;

    // Look up study versions for payload hashing
    const studyProgress = await ctx.runQuery(internal.caseProgress.getProgressForAction, {
      caseSlug: args.caseSlug,
      tokenIdentifier: identity.tokenIdentifier,
    });

    const contentVersion = studyProgress?.completedAgainstVersion ?? "v1.0";
    const rubricVersion = "v1.0";
    const promptVersion = "v1.0";

    const payloadHash = await computePayloadHash({
      caseSlug: args.caseSlug,
      labId: `lab:${args.caseSlug}`,
      language: args.language,
      code: args.code,
      explanation: args.explanation,
      contentVersion,
      rubricVersion,
      promptVersion,
    });

    const estimatedInputTokens = calculateFullPromptTokens(
      SCORE_PROMPT,
      args.labTitle,
      args.labPrompt,
      args.language,
      args.code,
      args.explanation,
      rubricVersion,
    );

    if (estimatedInputTokens > AI_LIMITS.MAX_TOTAL_PROMPT_TOKENS) {
      throw new Error(
        `Total prompt size (${estimatedInputTokens.toLocaleString()} tokens) exceeds maximum limit (${AI_LIMITS.MAX_TOTAL_PROMPT_TOKENS.toLocaleString()} tokens)`,
      );
    }

    // 2. Atomic attempt reservation before provider invocation
    const reservation: {
      alreadyCompleted: boolean;
      attemptId?: string;
      score?: number;
      passed?: boolean;
    } = await ctx.runMutation(internal.caseProgress._reserveLabAttempt, {
      caseSlug: args.caseSlug,
      tokenIdentifier: identity.tokenIdentifier,
      language: args.language,
      codeBytes: args.code.length,
      explanationBytes: args.explanation.length,
      idempotencyKey,
      payloadHash,
      estimatedInputTokens,
      promptVersion,
    });

    if (reservation.alreadyCompleted) {
      return {
        score: reservation.score ?? 100,
        passed: reservation.passed ?? true,
        summary: "You already passed this lab.",
        strengths: ["Lab previously completed"],
        mistakes: [],
        nextStep: "Proceed to the Reflection section.",
      };
    }

    // Check durable circuit breaker state before external network call
    const circuitState = await ctx.runQuery(internal.caseProgress._checkProviderCircuit, {
      provider: "default",
    });

    if (!circuitState.available) {
      throw new Error(
        "AI grading service is temporarily recovering from upstream provider issues. Please retry in a few moments.",
      );
    }

    const startMs = Date.now();
    let grade;
    try {
      grade = await gradeLabAttempt(
        args.labTitle,
        args.labPrompt,
        args.language,
        args.code,
        args.explanation,
      );

      // Record durable circuit breaker success with timestamp and version
      await ctx.runMutation(internal.caseProgress._recordProviderHealth, {
        provider: grade.provider ?? "default",
        success: true,
        requestTimestamp: startMs,
        circuitVersion: circuitState.circuitVersion,
      });
    } catch (err) {
      // Record durable circuit breaker failure with timestamp and version
      await ctx.runMutation(internal.caseProgress._recordProviderHealth, {
        provider: "default",
        success: false,
        requestTimestamp: startMs,
        circuitVersion: circuitState.circuitVersion,
      });

      if (reservation.attemptId) {
        await ctx.runMutation(internal.caseProgress._failLabAttempt, {
          attemptId: reservation.attemptId,
          status: "provider_failed",
          errorCode: (err as Error).message.slice(0, 100),
        });
      }
      throw new Error("AI grading service temporarily unavailable. Please retry in a moment.");
    }

    const latencyMs = Date.now() - startMs;
    const hasActualPrompt =
      typeof grade.actualPromptTokens === "number" && grade.actualPromptTokens > 0;
    const hasActualOutput =
      typeof grade.actualOutputTokens === "number" && grade.actualOutputTokens > 0;
    const isEstimatedUsage = !hasActualPrompt || !hasActualOutput;

    const finalInputTokens = hasActualPrompt ? grade.actualPromptTokens! : estimatedInputTokens;
    const finalOutputTokens = hasActualOutput
      ? grade.actualOutputTokens!
      : AI_LIMITS.MAX_OUTPUT_TOKENS_PER_ATTEMPT;
    const reconciledCostUsd = estimateCostUsd(finalInputTokens, finalOutputTokens);

    // 3. Atomically record result and enforce monotonic score progression
    await ctx.runMutation(internal.caseProgress._recordLabResult, {
      attemptId: reservation.attemptId!,
      caseSlug: args.caseSlug,
      tokenIdentifier: identity.tokenIdentifier,
      score: grade.score,
      passed: grade.passed,
      latencyMs,
      reconciledInputTokens: finalInputTokens,
      estimatedOutputTokens: finalOutputTokens,
      estimatedCostUsd: reconciledCostUsd,
      isEstimatedUsage,
      contentVersion,
      rubricVersion,
      promptVersion,
      ...(grade.provider ? { provider: grade.provider } : {}),
      ...(grade.model ? { model: grade.model } : {}),
    });

    return grade;
  },
});

/**
 * Internal query used by submitCaseLab (action) to check existing progress
 * without needing a mutation context.
 */
export const getProgressForAction = internalQuery({
  args: {
    caseSlug: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    if (!user) return null;

    return await ctx.db
      .query("caseProgress")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .unique();
  },
});

/**
 * Query to get all case slugs currently unlocked for the user.
 * Initial free case is unlocked by default.
 */
export const getUserUnlockedCases = query({
  args: {},
  handler: async (ctx) => {
    const defaultSlug = CASE_STUDY_SEQUENCE[0]?.slug ?? "client-server-architecture";
    const defaultUnlocked = [defaultSlug];
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return defaultUnlocked;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return defaultUnlocked;
    }

    const unlocked = new Set<string>(defaultUnlocked);

    const userUnlocks = await ctx.db
      .query("caseUnlocks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const u of userUnlocks) {
      unlocked.add(u.caseSlug);
    }

    const progressList = await ctx.db
      .query("caseProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const p of progressList) {
      const isCompleted =
        p.status === "completed" || Boolean(p.passed && (p.completedSections?.length ?? 0) >= 7);

      if (isCompleted) {
        unlocked.add(p.caseSlug);
        const idx = CASE_STUDY_SEQUENCE.findIndex((c) => c.slug === p.caseSlug);
        if (idx !== -1 && idx + 1 < CASE_STUDY_SEQUENCE.length) {
          const next = CASE_STUDY_SEQUENCE[idx + 1];
          if (next && next.tier === "free") {
            unlocked.add(next.slug);
          }
        }
      }
    }

    return Array.from(unlocked);
  },
});
