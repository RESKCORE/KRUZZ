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
import { gradeLabAttempt } from "./ai";
import { awardPointsInternal } from "./awards";
import { touchStreakForUser } from "./streaks";

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

  // 2. Award completion bonus (idempotent, 20 RC)
  await awardPointsInternal(ctx, user, `case:${caseSlug}:complete`, 20);

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

    const user = await getOrCreateUser(ctx, identity);
    await touchStreakForUser(ctx, user._id);

    const existingProgress = await ctx.db
      .query("caseProgress")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .unique();

    const now = Date.now();

    const added = (args.completedSections ?? []).filter(
      (s) => !(existingProgress?.completedSections ?? []).includes(s),
    );
    for (const sec of added) {
      await awardPointsInternal(ctx, user, `case:${args.caseSlug}:section:${sec}`, 1);
    }

    if (existingProgress) {
      const updates: {
        completedSections?: number[];
        reflection?: string;
        updatedAt: number;
      } = { updatedAt: now };

      if (args.completedSections !== undefined) {
        const merged = Array.from(
          new Set([...existingProgress.completedSections, ...args.completedSections]),
        ).sort((a, b) => a - b);
        updates.completedSections = merged;
      }

      // FIX: persist reflection on existing rows (was silently dropped before)
      if (args.reflection !== undefined) updates.reflection = args.reflection;

      await ctx.db.patch(existingProgress._id, updates);

      // Auto-award case completion bonus and release next free case if lab is passed and all reading sections viewed
      const allSections = [0, 1, 2, 3, 4, 5, 7];
      const finalSections = updates.completedSections ?? existingProgress.completedSections;
      if (existingProgress.passed && allSections.every((s) => finalSections.includes(s))) {
        await completeCaseInternal(ctx, user, args.caseSlug, existingProgress._id);
      }

      return existingProgress._id;
    }

    const progressDoc: {
      userId: typeof user._id;
      caseSlug: string;
      completedSections: number[];
      updatedAt: number;
      reflection?: string;
    } = {
      userId: user._id,
      caseSlug: args.caseSlug,
      completedSections: args.completedSections ?? [],
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

    // Verify that the lab was passed
    if (!progress?.passed) {
      throw new Error("Lab must be passed before marking case complete");
    }

    // Check if all 8 sections (0-7) are completed
    const allSections = [0, 1, 2, 3, 4, 5, 6, 7];
    const hasAllSections = allSections.every(
      (sec) => progress.completedSections.includes(sec) || sec === 6, // section 6 is the lab itself
    );

    if (!hasAllSections) {
      throw new Error("All sections must be viewed before marking case complete");
    }

    // Server-side reflection validation (mirrors frontend MIN_REFLECTION_CHARS/WORDS)
    const reflectionRaw = progress.reflection ?? "";
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

    return await completeCaseInternal(ctx, user, args.caseSlug, progress._id);
  },
});

/**
 * Internal mutation — writes the grade result + optional RC award to the DB.
 * Called from submitCaseLab (action) after fetch-based AI grading completes.
 * Actions cannot write to DB directly, so all DB work is done here.
 */
export const _recordLabResult = internalMutation({
  args: {
    caseSlug: v.string(),
    tokenIdentifier: v.string(),
    score: v.number(),
    passed: v.boolean(),
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

    const existingProgress = await ctx.db
      .query("caseProgress")
      .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", args.caseSlug))
      .unique();

    if (args.passed) {
      // Award RC (idempotent — safe to call even if already awarded)
      await awardPointsInternal(ctx, user, `case:${args.caseSlug}:lab`, 10);

      if (existingProgress) {
        await ctx.db.patch(existingProgress._id, {
          bestScore: args.score,
          passed: true,
          updatedAt: Date.now(),
        });

        // Check if all reading sections (0-5, 7) are already completed
        const allSections = [0, 1, 2, 3, 4, 5, 7];
        const sections = existingProgress.completedSections ?? [];
        if (allSections.every((s) => sections.includes(s))) {
          await completeCaseInternal(ctx, user, args.caseSlug, existingProgress._id);
        }
      } else {
        await ctx.db.insert("caseProgress", {
          userId: user._id,
          caseSlug: args.caseSlug,
          completedSections: [],
          bestScore: args.score,
          passed: true,
          updatedAt: Date.now(),
        });
      }
    } else {
      // Record best-so-far score without awarding points
      const currentBest = existingProgress?.bestScore ?? 0;
      if (args.score > currentBest) {
        if (existingProgress) {
          await ctx.db.patch(existingProgress._id, {
            bestScore: args.score,
            updatedAt: Date.now(),
          });
        } else {
          await ctx.db.insert("caseProgress", {
            userId: user._id,
            caseSlug: args.caseSlug,
            completedSections: [],
            bestScore: args.score,
            passed: false,
            updatedAt: Date.now(),
          });
        }
      }
    }
  },
});

/**
 * Grades a student's code + explanation using the free-tier AI models,
 * then (only on pass >= 80%) awards the RC and records the score.
 *
 * ⚠️  This MUST be an **action** (not a mutation) because it calls fetch()
 *     via gradeLabAttempt. All DB writes are delegated to the internal
 *     mutation _recordLabResult so atomicity is preserved per-write.
 *
 * The student's code and explanation are sent to the model and then
 * DISCARDED — only the score and pass flag are persisted. Security is
 * maintained on the server: the client cannot award itself RC.
 */
export const submitCaseLab = action({
  args: {
    caseSlug: v.string(),
    language: v.string(),
    code: v.string(),
    explanation: v.string(),
    labTitle: v.string(),
    labPrompt: v.string(),
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

    // Validate input — prevent empty submissions
    if (!args.code || args.code.trim().length < 10) {
      throw new Error("Code submission is too short or empty");
    }

    if (!args.explanation || args.explanation.trim().split(/\s+/).length < 20) {
      throw new Error("Explanation must be at least 20 words");
    }

    // Check if already passed — read via runQuery (no mutation context needed)
    const existingProgress: { passed?: boolean; bestScore?: number } | null = await ctx.runQuery(
      internal.caseProgress.getProgressForAction,
      {
        caseSlug: args.caseSlug,
        tokenIdentifier: identity.tokenIdentifier,
      },
    );

    if (existingProgress?.passed) {
      return {
        score: existingProgress.bestScore ?? 100,
        passed: true,
        summary: "You already passed this lab.",
        strengths: ["Lab previously completed"],
        mistakes: [],
        nextStep: "Proceed to the Reflection section.",
      };
    }

    // ── fetch() is allowed here because this is an action ──
    const grade = await gradeLabAttempt(
      args.labTitle,
      args.labPrompt,
      args.language,
      args.code,
      args.explanation,
    );

    // Persist the result via internal mutation (mutations can write to DB)
    await ctx.runMutation(internal.caseProgress._recordLabResult, {
      caseSlug: args.caseSlug,
      tokenIdentifier: identity.tokenIdentifier,
      score: grade.score,
      passed: grade.passed,
    });

    // mistakes returned to client for display only — never stored
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
