import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { v } from "convex/values";
import type { UserIdentity } from "convex/server";
import { touchStreakForUser } from "./streaks";
import { sendToUser } from "./emails";
import {
  rankForPoints,
  validateImageSignatureBytes,
  parseImageDimensionsAndValidate,
  IMAGE_LIMITS,
} from "./rules";

export {
  rankForPoints,
  validateImageSignatureBytes,
  parseImageDimensionsAndValidate,
  IMAGE_LIMITS,
};

/**
 * Generate a cryptographically secure, 128-bit entropy, opaque publicProfileId.
 * Format: krz_<32 lowercase hex characters> (e.g. krz_8f1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d).
 */
export function generatePublicProfileId(): string {
  const bytes = new Uint8Array(16); // 128 bits of cryptographic entropy
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `krz_${hex}`;
}

/**
 * Ensures unique publicProfileId with collision check and retry loop.
 */
export async function generateUniquePublicProfileId(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generatePublicProfileId();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_public_profile_id", (q) => q.eq("publicProfileId", candidate))
      .unique();
    if (!existing) {
      return candidate;
    }
  }
  throw new Error("Failed to generate a unique public profile ID after 5 attempts");
}

export async function getOrCreateUser(ctx: MutationCtx, identity: UserIdentity) {
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (existingUser) {
    if (!existingUser.publicProfileId) {
      const publicProfileId = await generateUniquePublicProfileId(ctx);
      await ctx.db.patch(existingUser._id, { publicProfileId });
      return (await ctx.db.get(existingUser._id))!;
    }
    return existingUser;
  }

  const publicProfileId = await generateUniquePublicProfileId(ctx);

  const doc: {
    tokenIdentifier: string;
    clerkId: string;
    points: number;
    rank: string;
    isPublic: boolean;
    publicProfileId: string;
    createdAt: number;
    name?: string;
    email?: string;
    imageUrl?: string;
  } = {
    tokenIdentifier: identity.tokenIdentifier,
    clerkId: identity.subject,
    points: 0,
    rank: "Observer",
    isPublic: false,
    publicProfileId,
    createdAt: Date.now(),
  };

  const name = identity.name ?? identity.nickname;
  if (name) doc.name = name;
  if (identity.email) {
    doc.email = identity.email;
    if (identity.email.trim().toLowerCase() === "reddysantosh1310@gmail.com") {
      (doc as any).role = "admin";
    }
  }
  if (identity.pictureUrl) doc.imageUrl = identity.pictureUrl;

  const newUserId = await ctx.db.insert("users", doc);

  await ctx.db.insert("streaks", {
    userId: newUserId,
    current: 0,
    longest: 0,
    lastActive: "",
  });

  const created = await ctx.db.get(newUserId);
  if (!created) throw new Error("Failed to create user record");

  // Never let email failure block signup.
  await sendToUser(ctx, {
    tokenIdentifier: identity.tokenIdentifier,
    title: "Welcome to KRUZZ",
    body: "<p>Your account is ready. Work through the case studies to start climbing the leaderboard.</p>",
  }).catch((err) => console.error("[email] welcome send failed", err));

  return created;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    return user;
  },
});

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) return null;

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return {
      _id: user._id,
      publicProfileId: user.publicProfileId,
      name: user.name,
      email: user.email,
      imageUrl: user.customImageUrl || user.imageUrl,
      bannerUrl: user.bannerUrl,
      points: user.points,
      rank: user.rank,
      university: user.university ?? "",
      role:
        user.role ??
        (user.email?.toLowerCase() === "reddysantosh1310@gmail.com" ? "admin" : "member"),
      isPublic: user.isPublic ?? false,
      createdAt: user.createdAt,
      streak: {
        current: streak?.current ?? 0,
        longest: streak?.longest ?? 0,
        lastActive: streak?.lastActive ?? "",
      },
    };
  },
});

export const storeUser = mutation({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication");
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    const name = identity.name ?? identity.nickname;
    const email = identity.email;
    const imageUrl = identity.pictureUrl;

    let userId: Id<"users">;

    if (existingUser !== null) {
      const updates: {
        name?: string;
        email?: string;
        imageUrl?: string;
        publicProfileId?: string;
        role?: string;
      } = {};
      if (name && existingUser.name !== name) updates.name = name;
      if (email && existingUser.email !== email) updates.email = email;
      if (imageUrl && existingUser.imageUrl !== imageUrl) updates.imageUrl = imageUrl;
      if (!existingUser.publicProfileId) updates.publicProfileId = generatePublicProfileId();

      const currentEmail = (email || existingUser.email || "").trim().toLowerCase();
      if (currentEmail === "reddysantosh1310@gmail.com" && existingUser.role !== "admin") {
        updates.role = "admin";
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existingUser._id, updates);
      }
      userId = existingUser._id;
    } else {
      const created = await getOrCreateUser(ctx, identity);
      userId = created._id;
    }

    await touchStreakForUser(ctx, userId, args.timezone);

    return userId;
  },
});

export const updateProfilePrivacy = mutation({
  args: {
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in to update privacy settings");
    const user = await getOrCreateUser(ctx, identity);
    await ctx.db.patch(user._id, { isPublic: args.isPublic });
    return { isPublic: args.isPublic };
  },
});

export const updateUniversity = mutation({
  args: {
    university: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in to update university");
    const user = await getOrCreateUser(ctx, identity);
    const cleaned = args.university.trim().slice(0, 80);
    await ctx.db.patch(user._id, { university: cleaned });
    return { university: cleaned };
  },
});

export const generateProfileUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in to upload profile media");
    return await ctx.storage.generateUploadUrl();
  },
});

export async function validateStorageImageMetadata(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  maxBytes: number,
  label: string,
): Promise<void> {
  const meta = await ctx.db.system.get(storageId);
  if (!meta) {
    throw new Error(`${label} object not found in storage`);
  }
  if (meta.size > maxBytes) {
    throw new Error(`${label} exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit`);
  }
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!meta.contentType || !allowedTypes.includes(meta.contentType)) {
    throw new Error(
      `Invalid ${label.toLowerCase()} MIME type. Only JPEG, PNG, and WebP are allowed`,
    );
  }
}

export const setProfileMedia = mutation({
  args: {
    imageStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in to update profile media");
    const user = await getOrCreateUser(ctx, identity);

    const maxAvatarSizeBytes = 2 * 1024 * 1024; // 2MB
    const maxBannerSizeBytes = 5 * 1024 * 1024; // 5MB

    const updates: {
      customImageUrl?: string;
      bannerUrl?: string;
      imageStorageId?: Id<"_storage">;
      bannerStorageId?: Id<"_storage">;
    } = {};

    if (args.imageStorageId) {
      await validateStorageImageMetadata(
        ctx,
        args.imageStorageId,
        maxAvatarSizeBytes,
        "Avatar image",
      );
      const url = await ctx.storage.getUrl(args.imageStorageId);
      if (url) {
        updates.customImageUrl = url;
        updates.imageStorageId = args.imageStorageId;
      }
    }

    if (args.bannerStorageId) {
      await validateStorageImageMetadata(
        ctx,
        args.bannerStorageId,
        maxBannerSizeBytes,
        "Banner image",
      );
      const url = await ctx.storage.getUrl(args.bannerStorageId);
      if (url) {
        updates.bannerUrl = url;
        updates.bannerStorageId = args.bannerStorageId;
      }
    }

    try {
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);

        // Clean up previous storage objects only after successful patch
        if (
          args.imageStorageId &&
          user.imageStorageId &&
          user.imageStorageId !== args.imageStorageId
        ) {
          try {
            await ctx.storage.delete(user.imageStorageId);
          } catch {
            // Non-blocking cleanup
          }
        }

        if (
          args.bannerStorageId &&
          user.bannerStorageId &&
          user.bannerStorageId !== args.bannerStorageId
        ) {
          try {
            await ctx.storage.delete(user.bannerStorageId);
          } catch {
            // Non-blocking cleanup
          }
        }
      }
    } catch (err) {
      // If patch or processing fails, clean up newly uploaded objects to avoid orphan storage
      if (args.imageStorageId) {
        try {
          await ctx.storage.delete(args.imageStorageId);
        } catch {
          // ignore
        }
      }
      if (args.bannerStorageId) {
        try {
          await ctx.storage.delete(args.bannerStorageId);
        } catch {
          // ignore
        }
      }
      throw err;
    }

    return updates;
  },
});

const PUBLIC_PROFILE_ID_REGEX = /^krz_[a-f0-9]{32}$/;

/**
 * Public profile lookup.
 * Resolves EXCLUSIVELY by the opaque `publicProfileId` (32 hex characters / 128-bit entropy).
 * Does NOT accept document IDs, Clerk IDs, email prefixes, token identifiers, or names.
 * Enforces isPublic === true. Scrubs all authentication and identity provider identifiers.
 */
export const getPublicProfile = query({
  args: {
    publicProfileId: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate format strictly before query
    if (!args.publicProfileId || !PUBLIC_PROFILE_ID_REGEX.test(args.publicProfileId)) {
      return null;
    }

    // Strict lookup: ONLY by opaque publicProfileId via index
    const user = await ctx.db
      .query("users")
      .withIndex("by_public_profile_id", (q) => q.eq("publicProfileId", args.publicProfileId))
      .unique();

    // Enforce privacy: anonymous public access strictly requires isPublic === true
    if (!user || user.isPublic !== true) {
      return null;
    }

    // Streak
    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Case progress
    const progressList = await ctx.db
      .query("caseProgress")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // All case studies to enrich names
    const allCases = await ctx.db.query("caseStudies").collect();

    // Completed case studies (capped at 50)
    const completedStudies = progressList
      .filter(
        (p) =>
          p.status === "completed" || Boolean(p.passed && (p.completedSections?.length ?? 0) >= 7),
      )
      .map((p) => {
        const caseStudy = allCases.find((c) => c.slug === p.caseSlug);
        return {
          caseSlug: p.caseSlug,
          title: caseStudy?.title ?? p.caseSlug,
          shortTitle: caseStudy?.shortTitle ?? caseStudy?.title ?? p.caseSlug,
          category: caseStudy?.category ?? "System Architecture",
          difficulty: caseStudy?.difficulty ?? "Beginner",
          completedAt: p.completedAt ?? p.updatedAt,
          bestScore: p.bestScore,
          passed: p.passed,
        };
      })
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 50);

    return {
      publicProfileId: user.publicProfileId!,
      name: user.name || "Anonymous Investigator",
      imageUrl: user.customImageUrl || user.imageUrl,
      bannerUrl: user.bannerUrl,
      points: user.points,
      rank: user.rank,
      university: user.university ?? "",
      createdAt: user.createdAt,
      streak: {
        current: streak?.current ?? 0,
        longest: streak?.longest ?? 0,
        lastActive: streak?.lastActive ?? "",
      },
      stats: {
        solvedCasesCount: completedStudies.length,
        totalCasesCount: allCases.length,
        totalRC: user.points,
        streakDays: streak?.current ?? 0,
        longestStreakDays: streak?.longest ?? 0,
      },
      completedCases: completedStudies,
    };
  },
});

/**
 * Scans and cleans up orphaned storage objects unassociated with any active user profile.
 * Targets files created >24h ago that are not referenced in imageStorageId or bannerStorageId.
 * Logs aggregated counts without any PII.
 */
export const cleanupOrphanedStorage = internalMutation({
  args: {
    maxBatch: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.maxBatch ?? 100;
    const now = Date.now();
    const olderThan = now - 24 * 3600 * 1000; // 24 hours retention for incomplete uploads

    // Collect all referenced storage IDs across all users
    const users = await ctx.db.query("users").collect();
    const activeStorageIds = new Set<string>();
    for (const u of users) {
      if (u.imageStorageId) activeStorageIds.add(u.imageStorageId);
      if (u.bannerStorageId) activeStorageIds.add(u.bannerStorageId);
    }

    // Query system storage records
    const storageRecords = await ctx.db.system.query("_storage").take(limit);
    let deletedCount = 0;
    let scannedCount = 0;

    for (const record of storageRecords) {
      scannedCount++;
      if (record._creationTime < olderThan && !activeStorageIds.has(record._id)) {
        try {
          await ctx.storage.delete(record._id);
          deletedCount++;
        } catch {
          // ignore already deleted
        }
      }
    }

    return {
      scanned: scannedCount,
      deleted: deletedCount,
      timestamp: now,
    };
  },
});
