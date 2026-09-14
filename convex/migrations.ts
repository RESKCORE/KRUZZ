import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { generateUniquePublicProfileId } from "./users";
import { completeCaseInternal } from "./caseProgress";

const PUBLIC_PROFILE_ID_REGEX = /^krz_[a-f0-9]{32}$/;

/**
 * Backfill migration to ensure every existing user in the database has a unique,
 * cryptographically random 128-bit publicProfileId (`krz_[a-f0-9]{32}`).
 * Safe to execute repeatedly (idempotent).
 */
export const backfillPublicProfileIds = internalMutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const allUsers = await ctx.db.query("users").collect();
    let updatedCount = 0;
    let alreadyValidCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    const existingPublicIds = new Set<string>();

    // First pass: collect existing valid IDs to detect duplicates
    for (const user of allUsers) {
      if (user.publicProfileId && PUBLIC_PROFILE_ID_REGEX.test(user.publicProfileId)) {
        if (existingPublicIds.has(user.publicProfileId)) {
          // Collision detected among legacy or malformed records
          errors.push({
            userId: user._id,
            error: `Duplicate publicProfileId found: ${user.publicProfileId}`,
          });
        } else {
          existingPublicIds.add(user.publicProfileId);
        }
      }
    }

    // Second pass: assign new unique 128-bit publicProfileId to users needing one
    for (const user of allUsers) {
      const needsBackfill =
        !user.publicProfileId ||
        !PUBLIC_PROFILE_ID_REGEX.test(user.publicProfileId) ||
        errors.some((e) => e.userId === user._id);

      if (needsBackfill) {
        try {
          const newPublicId = await generateUniquePublicProfileId(ctx);
          await ctx.db.patch(user._id, { publicProfileId: newPublicId });
          existingPublicIds.add(newPublicId);
          updatedCount++;
        } catch (err) {
          errors.push({
            userId: user._id,
            error: (err as Error).message,
          });
        }
      } else {
        alreadyValidCount++;
      }
    }

    return {
      status: errors.length === 0 ? "SUCCESS" : "COMPLETED_WITH_WARNINGS",
      totalUsers: allUsers.length,
      updatedCount,
      alreadyValidCount,
      errors,
    };
  },
});

/**
 * Diagnostic query to verify profile ID integrity and uniqueness.
 */
export const verifyProfileIntegrity = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const seenIds = new Map<string, string>();
    const missing: string[] = [];
    const invalidFormat: string[] = [];
    const duplicates: Array<{ publicProfileId: string; userIds: string[] }> = [];

    for (const user of allUsers) {
      if (!user.publicProfileId) {
        missing.push(user._id);
        continue;
      }

      if (!PUBLIC_PROFILE_ID_REGEX.test(user.publicProfileId)) {
        invalidFormat.push(user._id);
        continue;
      }

      if (seenIds.has(user.publicProfileId)) {
        duplicates.push({
          publicProfileId: user.publicProfileId,
          userIds: [seenIds.get(user.publicProfileId)!, user._id],
        });
      } else {
        seenIds.set(user.publicProfileId, user._id);
      }
    }

    return {
      totalUsers: allUsers.length,
      validProfiles: seenIds.size,
      missingCount: missing.length,
      missingUserIds: missing,
      invalidFormatCount: invalidFormat.length,
      invalidFormatUserIds: invalidFormat,
      duplicateCount: duplicates.length,
      duplicates,
      isClean: missing.length === 0 && invalidFormat.length === 0 && duplicates.length === 0,
    };
  },
});

/**
 * Migration to ensure privacy by default for all user accounts.
 * Explicitly sets `isPublic: false` for all users where `isPublic !== true`.
 * Preserves users who have intentionally opted into public sharing (`isPublic === true`).
 * Idempotent, bounded batch execution, and reportable.
 */
export const enforcePrivateProfileDefault = internalMutation({
  args: {
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const limit = args.batchSize ?? 200;
    const allUsers = await ctx.db.query("users").take(limit);
    let scannedCount = 0;
    let updatedCount = 0;
    let preservedPublicCount = 0;
    let alreadyPrivateCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const user of allUsers) {
      scannedCount++;
      if (user.isPublic === true) {
        preservedPublicCount++;
        continue;
      }

      if (user.isPublic === false) {
        alreadyPrivateCount++;
        continue;
      }

      // user.isPublic is undefined / missing -> patch explicitly to false
      try {
        await ctx.db.patch(user._id, { isPublic: false });
        updatedCount++;
      } catch (err) {
        // Log only document ID, strictly avoiding personal data (name, email)
        errors.push({
          userId: user._id,
          error: (err as Error).message,
        });
      }
    }

    return {
      status: errors.length === 0 ? "SUCCESS" : "COMPLETED_WITH_ERRORS",
      batchSize: limit,
      scannedCount,
      updatedCount,
      preservedPublicCount,
      alreadyPrivateCount,
      hasMore: allUsers.length === limit,
      errors,
    };
  },
});

/**
 * Rollback / recovery helper for private profile migration.
 * Allows restoring user profile privacy states from an audited snapshot of IDs.
 */
export const rollbackPrivateProfileDefault = internalMutation({
  args: {
    userIdsToRestorePublic: v.array(v.id("users")),
  },
  handler: async (ctx: MutationCtx, args) => {
    let restoredCount = 0;
    const errors: Array<{ userId: string; error: string }> = [];

    for (const userId of args.userIdsToRestorePublic) {
      try {
        await ctx.db.patch(userId, { isPublic: true });
        restoredCount++;
      } catch (err) {
        errors.push({ userId, error: (err as Error).message });
      }
    }

    return {
      status: errors.length === 0 ? "SUCCESS" : "COMPLETED_WITH_ERRORS",
      restoredCount,
      errors,
    };
  },
});

/**
 * Diagnostic query to inspect user case study progress and awards.
 */
export const inspectTodayCaseCompletions = internalQuery({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const progressList = await ctx.db.query("caseProgress").collect();
    const awards = await ctx.db.query("awards").collect();
    const caseStudies = await ctx.db.query("caseStudies").collect();

    const caseMap = new Map(caseStudies.map((c) => [c.slug, c]));

    const records = progressList.map((p) => {
      const user = users.find((u) => u._id === p.userId);
      const study = caseMap.get(p.caseSlug);
      const userAwards = awards.filter((a) => a.userId === p.userId);
      const hasCompleteAward = userAwards.some(
        (a) =>
          a.awardId === `case:${p.caseSlug}:complete` || a.awardId === `${p.caseSlug}:complete`,
      );
      const hasLabAward = userAwards.some(
        (a) => a.awardId === `case:${p.caseSlug}:lab` || a.awardId === `${p.caseSlug}:lab`,
      );

      return {
        userId: p.userId,
        userName: user?.name,
        userEmail: user?.email,
        userPoints: user?.points,
        caseSlug: p.caseSlug,
        caseTitle: study?.title,
        difficulty: study?.difficulty,
        passed: p.passed,
        bestScore: p.bestScore,
        status: p.status,
        completedSectionsCount: p.completedSections?.length ?? 0,
        completedSections: p.completedSections,
        reflectionLength: p.reflection?.length ?? 0,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : null,
        completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : null,
        hasCompleteAward,
        hasLabAward,
      };
    });

    return {
      totalUsers: users.length,
      totalProgress: progressList.length,
      totalAwards: awards.length,
      records,
    };
  },
});

/**
 * Mutation to award RC points and complete case studies for users who completed
 * case studies today (2026-09-14) but haven't received their RC points yet.
 */
export const awardTodayCompletedCases = internalMutation({
  args: {
    sinceMs: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // Midnight IST on 2026-09-14 is 2026-09-13T18:30:00.000Z
    const defaultSince = new Date("2026-09-13T18:30:00.000Z").getTime();
    const sinceTimestamp = args.sinceMs ?? defaultSince;

    const allProgress = await ctx.db.query("caseProgress").collect();
    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map((u) => [u._id, u]));

    const awarded: Array<{
      userId: string;
      userEmail?: string | undefined;
      userName?: string | undefined;
      caseSlug: string;
      bestScore: number;
      awardedAt: string;
    }> = [];

    for (const p of allProgress) {
      // Must be from today
      const progressTime = p.updatedAt ?? p.completedAt ?? 0;
      if (progressTime < sinceTimestamp) {
        continue;
      }

      // Must have passed the practice lab
      if (!p.passed) {
        continue;
      }

      const user = userMap.get(p.userId);
      if (!user) continue;

      // Check if user already has the completion award
      const awardKey = `case:${p.caseSlug}:complete`;
      const existingAward = await ctx.db
        .query("awards")
        .withIndex("by_user_award", (q) => q.eq("userId", user._id).eq("awardId", awardKey))
        .unique();

      if (!existingAward) {
        // Ensure all sections are marked complete
        await ctx.db.patch(p._id, {
          completedSections: [0, 1, 2, 3, 4, 5, 6, 7],
          status: "completed",
          completedAt: Date.now(),
          updatedAt: Date.now(),
        });

        // Award completion bonus and unlock next case
        await completeCaseInternal(ctx, user, p.caseSlug, p._id);

        awarded.push({
          userId: user._id,
          userEmail: user.email,
          userName: user.name,
          caseSlug: p.caseSlug,
          bestScore: p.bestScore ?? 100,
          awardedAt: new Date().toISOString(),
        });
      }
    }

    return {
      status: "SUCCESS",
      since: new Date(sinceTimestamp).toISOString(),
      awardedCount: awarded.length,
      awarded,
    };
  },
});
