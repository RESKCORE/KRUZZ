import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { generateUniquePublicProfileId } from "./users";

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
