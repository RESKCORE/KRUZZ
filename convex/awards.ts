import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getOrCreateUser } from "./users";
import { rankForPoints, STORE_CATALOG } from "./rules";
import type { Doc } from "./_generated/dataModel";

/**
 * Internal award primitive shared by mutations. Idempotent — awarding the same
 * awardId twice is a no-op. Recomputes the user's rank after the change.
 *
 * Clients cannot call this directly. Points are strictly calculated and awarded
 * by internal server-side mutation logic.
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

/**
 * Server-owned store purchase redemption.
 * Validates the item against the canonical store catalog, verifies sufficient balance,
 * atomically patches balance, and inserts the award idempotently.
 */
export const redeemStoreItem = mutation({
  args: {
    itemId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be signed in to redeem store items");
    }

    const item = STORE_CATALOG[args.itemId];
    if (!item) {
      throw new Error(`Unknown store item: ${args.itemId}`);
    }

    const user = await getOrCreateUser(ctx, identity);
    const awardId = `store:${item.id}`;

    // One-time ownership check: prevent duplicate purchases for permanent items
    if (item.type === "one_time_ownership" || item.type === "cosmetic_equipable") {
      const existingAward = await ctx.db
        .query("awards")
        .withIndex("by_user_award", (q) => q.eq("userId", user._id).eq("awardId", awardId))
        .unique();

      if (existingAward) {
        return { success: true, alreadyOwned: true, item };
      }
    }

    if (user.points < item.cost) {
      throw new Error(
        `Insufficient RC balance. Requires ${item.cost} RC, current balance is ${user.points} RC.`,
      );
    }

    const now = Date.now();
    await ctx.db.insert("awards", {
      userId: user._id,
      awardId,
      points: -item.cost,
      awardedAt: now,
    });

    const newPoints = user.points - item.cost;
    await ctx.db.patch(user._id, {
      points: newPoints,
      rank: rankForPoints(newPoints),
    });

    return { success: true, alreadyOwned: false, item, remainingPoints: newPoints };
  },
});
