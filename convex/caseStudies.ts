import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { CASE_STUDY_SEQUENCE } from "./caseProgress";

/**
 * Public topic catalog for all visitors (including unauthenticated guests).
 * Returns ONLY safe metadata: title, summary, category, difficulty, time, objectives.
 * Strictly excludes case bodies, architecture diagrams, implementation samples,
 * decisions, practice, reflection, and code-lab details.
 */
export const listPublicTopics = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let studies;
    if (args.category && args.category !== "All") {
      studies = await ctx.db
        .query("caseStudies")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      studies = await ctx.db.query("caseStudies").collect();
    }

    // Sort by index "01", "02", ...
    const sorted = studies.sort((a, b) =>
      a.index.localeCompare(b.index, undefined, { numeric: true }),
    );

    // Return strictly projected safe topic metadata
    return sorted.map((s) => ({
      slug: s.slug,
      index: s.index,
      title: s.title,
      shortTitle: s.shortTitle ?? s.title,
      category: s.category,
      subcategory: s.subcategory ?? "",
      difficulty: s.difficulty,
      learnerLevel: s.learnerLevel,
      estimatedTime: s.estimatedTime,
      minutes: s.minutes,
      status: s.status,
      tier: s.tier,
      rcCost: s.rcCost,
      summary: s.summary,
      learningObjectives: s.learningObjectives ?? [],
      prerequisites: s.prerequisites ?? [],
      engineeringConcepts: s.engineeringConcepts ?? [],
      technologies: s.technologies ?? [],
      tech: s.tech ?? [],
      tags: s.tags ?? [],
    }));
  },
});

/**
 * Backwards-compatible alias for topic catalog.
 * Guarantees that public list calls receive only safe metadata.
 */
export const list = listPublicTopics;

/**
 * Authenticated case-study retriever.
 * Rejects unauthenticated callers.
 * Evaluates authorization:
 * - Unlocked users receive the full case study.
 * - Locked users receive an intentional locked-state projection without
 *   architecture, decisions, implementation, practice, or code-lab data.
 */
export const getAuthenticatedCase = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to access case studies");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new Error("User record not found");
    }

    const study = await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!study) {
      return null;
    }

    // Check unlock status
    let isUnlocked = false;

    // 1. First 3 cases or tier === "free" are available to all authenticated users
    const seqMeta = CASE_STUDY_SEQUENCE.find((c) => c.slug === study.slug);
    const resolvedTier = seqMeta?.tier ?? study.tier;
    const isFreeTier = resolvedTier === "free" || Number(study.index) <= 3;

    if (isFreeTier) {
      isUnlocked = true;
    }

    // 2. Check explicit caseUnlocks table
    if (!isUnlocked) {
      const unlockDoc = await ctx.db
        .query("caseUnlocks")
        .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", study.slug))
        .unique();
      if (unlockDoc) isUnlocked = true;
    }

    // 3. Check sequential progression from completed cases
    if (!isUnlocked) {
      const idx = CASE_STUDY_SEQUENCE.findIndex((c) => c.slug === study.slug);
      if (idx > 0 && CASE_STUDY_SEQUENCE[idx - 1]) {
        const prevSlug = CASE_STUDY_SEQUENCE[idx - 1]!.slug;
        const prevProgress = await ctx.db
          .query("caseProgress")
          .withIndex("by_user_case", (q) => q.eq("userId", user._id).eq("caseSlug", prevSlug))
          .unique();
        const prevCompleted =
          prevProgress?.status === "completed" ||
          Boolean(prevProgress?.passed && (prevProgress?.completedSections?.length ?? 0) >= 7);
        if (prevCompleted && resolvedTier === "free") {
          isUnlocked = true;
        }
      }
    }

    // Full case content for unlocked users
    if (isUnlocked) {
      return {
        ...study,
        isLocked: false,
      };
    }

    // Locked-state projection (metadata only — no learning body, diagrams, or code)
    return {
      slug: study.slug,
      index: study.index,
      title: study.title,
      shortTitle: study.shortTitle ?? study.title,
      category: study.category,
      subcategory: study.subcategory ?? "",
      difficulty: study.difficulty,
      learnerLevel: study.learnerLevel,
      estimatedTime: study.estimatedTime,
      minutes: study.minutes,
      status: study.status,
      tier: resolvedTier,
      rcCost: study.rcCost,
      summary: study.summary,
      learningObjectives: study.learningObjectives ?? [],
      prerequisites: study.prerequisites ?? [],
      engineeringConcepts: study.engineeringConcepts ?? [],
      technologies: study.technologies ?? [],
      tech: study.tech ?? [],
      tags: study.tags ?? [],
      isLocked: true,
    };
  },
});

/**
 * Backwards-compatible getBySlug. Delegates to getAuthenticatedCase.
 * Rejects unauthenticated callers.
 */
export const getBySlug = getAuthenticatedCase;

/**
 * Shared helper to perform case study upsert logic with schema validation.
 */
async function performCaseStudyUpsert(ctx: any, study: any) {
  if (!study.slug || !study.index || !study.title) {
    throw new Error("Invalid case study: missing required slug, index, or title");
  }

  const existing = await ctx.db
    .query("caseStudies")
    .withIndex("by_slug", (q: any) => q.eq("slug", study.slug))
    .unique();

  const seqMeta = CASE_STUDY_SEQUENCE.find((c) => c.slug === study.slug);
  const resolvedTier = seqMeta
    ? seqMeta.tier
    : (study.tier ?? (Number(study.index) <= 3 ? "free" : "premium"));
  const resolvedRcCost =
    resolvedTier === "free"
      ? 0
      : study.rcCost !== undefined && study.rcCost > 0
        ? study.rcCost
        : 50;

  const record = {
    slug: study.slug,
    index: study.index,
    title: study.title,
    shortTitle: study.shortTitle ?? study.title,
    category: study.category ?? "Foundations (OOP)",
    subcategory: study.subcategory ?? "",
    difficulty: study.difficulty ?? "Beginner",
    learnerLevel: study.learnerLevel ?? "Explorer",
    estimatedTime: study.estimatedTime ?? "30-45 minutes",
    minutes: study.minutes ?? 40,
    status: study.status ?? "published",
    tier: resolvedTier,
    rcCost: resolvedRcCost,
    summary: study.summary ?? "",
    learningObjectives: study.learningObjectives ?? [],
    prerequisites: study.prerequisites ?? [],
    engineeringConcepts: study.engineeringConcepts ?? [],
    technologies: study.technologies ?? [],
    tech: study.tech ?? [],
    tags: study.tags ?? [],
    glossary: study.glossary,
    primers: study.primers,
    discover: study.discover,
    understand: study.understand,
    concepts: study.concepts,
    architecture: study.architecture,
    decisions: study.decisions,
    tradeOffs: study.tradeOffs,
    implementation: study.implementation,
    practice: study.practice,
    failureModes: study.failureModes,
    microDrills: study.microDrills,
    reflection: study.reflection,
    techNotes: study.techNotes,
    codeLab: study.codeLab,
    contentVersion: study.contentVersion ?? "v1.0",
    rubricVersion: study.rubricVersion ?? "v1.0",
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.replace(existing._id, record);
    return { id: existing._id, action: "updated", slug: study.slug };
  } else {
    const id = await ctx.db.insert("caseStudies", record);
    return { id, action: "inserted", slug: study.slug };
  }
}

/**
 * Trusted internal mutation for curriculum updates (e.g. seed scripts and automated pipelines).
 * Accessible only by server functions and CLI runners via `npx convex run`.
 */
export const getAllInternal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("caseStudies").collect();
  },
});

export const upsertInternal = internalMutation({
  args: {
    caseStudy: v.any(),
  },
  handler: async (ctx: MutationCtx, args: { caseStudy: any }) => {
    return await performCaseStudyUpsert(ctx, args.caseStudy);
  },
});

export const updateDecisionsInternal = internalMutation({
  args: {
    updates: v.array(
      v.object({
        slug: v.string(),
        decisions: v.any(),
      })
    ),
  },
  handler: async (ctx: MutationCtx, args: { updates: Array<{ slug: string; decisions: any }> }) => {
    let count = 0;
    for (const update of args.updates) {
      const existing = await ctx.db
        .query("caseStudies")
        .withIndex("by_slug", (q) => q.eq("slug", update.slug))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          decisions: update.decisions,
          updatedAt: Date.now(),
        });
        count++;
      }
    }
    return { updatedCount: count };
  },
});

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Admin-protected mutation for external CI/CD scripts.
 * Requires server-side configured secret; fails closed if secret is not set.
 */
export const upsert = mutation({
  args: {
    caseStudy: v.any(),
    adminKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rawExpectedKey = process.env["ADMIN_KEY"] || process.env["CONVEX_ADMIN_KEY"] || "";
    const expectedKey = rawExpectedKey.trim();

    // Fail closed if server secret is missing, empty, or default placeholder
    if (!expectedKey || expectedKey.length < 16) {
      throw new Error(
        "Unauthorized: Curriculum mutation is disabled (server ADMIN_KEY unconfigured or insufficient)",
      );
    }

    if (!args.adminKey || !timingSafeEqualStr(args.adminKey.trim(), expectedKey)) {
      throw new Error("Unauthorized: Invalid administrative credentials");
    }

    if (!args.caseStudy || typeof args.caseStudy.slug !== "string" || !args.caseStudy.slug.trim()) {
      throw new Error("Invalid case study payload: missing or empty slug");
    }

    console.info(
      `[ADMIN_AUDIT] Case study upserted: slug=${args.caseStudy.slug} timestamp=${Date.now()}`,
    );

    return await performCaseStudyUpsert(ctx, args.caseStudy);
  },
});
