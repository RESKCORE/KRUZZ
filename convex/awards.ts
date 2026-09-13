import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser, rankForPoints } from "./users";
import type { Doc } from "./_generated/dataModel";

/**
 * Internal award primitive shared by mutations. Idempotent — awarding the same
 * awardId twice is a no-op. Recomputes the user's rank after the change.
 */
export async function awardPointsInternal(
  ctx: MutationCtx,
  user: Doc<"users">,
  awardId: string,
  points: number,
): Promise<boolean> {
  const existingAward = await ctx.db
    .query("awards")
    .withIndex("by_user_award", (q) => q.eq("userId", user._id).eq("awardId", awardId))
    .unique();

  if (existingAward) {
    return false; // already awarded
  }

  await ctx.db.insert("awards", {
    userId: user._id,
    awardId,
    points,
    awardedAt: Date.now(),
  });

  const newPoints = user.points + points;
  await ctx.db.patch(user._id, {
    points: newPoints,
    rank: rankForPoints(newPoints),
  });

  return true;
}

export const getUserAwards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {};
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return {};
    }

    const awardsList = await ctx.db
      .query("awards")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const map: Record<string, number> = {};
    for (const a of awardsList) {
      map[a.awardId] = a.points;
    }
    return map;
  },
});

export const awardPoints = mutation({
  args: {
    awardId: v.string(),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be signed in to earn points");
    }

    const user = await getOrCreateUser(ctx, identity);
    return awardPointsInternal(ctx, user, args.awardId, args.points);
  },
});
