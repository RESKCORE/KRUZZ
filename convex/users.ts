import { mutation, query, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { v } from "convex/values";
import type { UserIdentity } from "convex/server";
import { touchStreakForUser } from "./streaks";

export function rankForPoints(points: number): string {
  if (points >= 5000) return "Systems Thinker";
  if (points >= 2000) return "Engineer";
  if (points >= 500) return "Investigator";
  if (points >= 200) return "Apprentice";
  return "Observer";
}

export async function getOrCreateUser(ctx: MutationCtx, identity: UserIdentity) {
  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  if (existingUser) {
    return existingUser;
  }

  const doc: {
    tokenIdentifier: string;
    clerkId: string;
    points: number;
    rank: string;
    isPublic?: boolean;
    createdAt: number;
    name?: string;
    email?: string;
    imageUrl?: string;
  } = {
    tokenIdentifier: identity.tokenIdentifier,
    clerkId: identity.subject,
    points: 0,
    rank: "Observer",
    isPublic: true,
    createdAt: Date.now(),
  };

  const name = identity.name ?? identity.nickname;
  if (name) doc.name = name;
  if (identity.email) doc.email = identity.email;
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
      const updates: { name?: string; email?: string; imageUrl?: string } = {};
      if (name && existingUser.name !== name) updates.name = name;
      if (email && existingUser.email !== email) updates.email = email;
      if (imageUrl && existingUser.imageUrl !== imageUrl) updates.imageUrl = imageUrl;

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(existingUser._id, updates);
      }
      userId = existingUser._id;
    } else {
      const created = await getOrCreateUser(ctx, identity);
      userId = created._id;
    }

    // Automatically trigger daily login streak update on authenticated login
    await touchStreakForUser(ctx, userId, args.timezone);

    return userId;
  },
});

export const syncGuestData = mutation({
  args: {
    awards: v.record(v.string(), v.number()),
    streak: v.object({
      current: v.number(),
      longest: v.number(),
      lastActive: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be signed in to sync guest data");
    }

    const user = await getOrCreateUser(ctx, identity);

    let pointsToAdd = 0;
    const now = Date.now();

    for (const [awardId, points] of Object.entries(args.awards)) {
      const existingAward = await ctx.db
        .query("awards")
        .withIndex("by_user_award", (q) => q.eq("userId", user._id).eq("awardId", awardId))
        .unique();

      if (!existingAward && points > 0) {
        await ctx.db.insert("awards", {
          userId: user._id,
          awardId,
          points,
          awardedAt: now,
        });
        pointsToAdd += points;
      }
    }

    if (pointsToAdd > 0) {
      const newPoints = user.points + pointsToAdd;
      await ctx.db.patch(user._id, {
        points: newPoints,
        rank: rankForPoints(newPoints),
      });
    }

    const existingStreak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existingStreak) {
      const newCurrent = Math.max(existingStreak.current, args.streak.current);
      const newLongest = Math.max(existingStreak.longest, args.streak.longest, newCurrent);
      const newLastActive = args.streak.lastActive ?? existingStreak.lastActive;

      await ctx.db.patch(existingStreak._id, {
        current: newCurrent,
        longest: newLongest,
        lastActive: newLastActive,
      });
    } else {
      await ctx.db.insert("streaks", {
        userId: user._id,
        current: args.streak.current,
        longest: Math.max(args.streak.current, args.streak.longest),
        lastActive: args.streak.lastActive ?? "",
      });
    }

    return await ctx.db.get(user._id);
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

export const setProfileMedia = mutation({
  args: {
    imageStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in to update profile media");
    const user = await getOrCreateUser(ctx, identity);

    const updates: { customImageUrl?: string; bannerUrl?: string } = {};
    if (args.imageStorageId) {
      const url = await ctx.storage.getUrl(args.imageStorageId);
      if (url) updates.customImageUrl = url;
    }
    if (args.bannerStorageId) {
      const url = await ctx.storage.getUrl(args.bannerStorageId);
      if (url) updates.bannerUrl = url;
    }
    if (Object.keys(updates).length > 0) await ctx.db.patch(user._id, updates);
    return updates;
  },
});
