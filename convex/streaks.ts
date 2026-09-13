import { mutation, query, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { v } from "convex/values";

/**
 * Get calendar date in 'YYYY-MM-DD' format according to the given timezone (or UTC).
 */
export function getCalendarDate(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch {
      // Invalid timezone fallback
    }
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Calculate difference in calendar days between two 'YYYY-MM-DD' dates.
 * e.g., '2026-09-04' and '2026-09-05' returns 1.
 */
export function calendarDayDiff(fromDateStr: string, toDateStr: string): number {
  const parts1 = fromDateStr.split("-").map(Number);
  const parts2 = toDateStr.split("-").map(Number);
  const y1 = parts1[0] ?? 2026;
  const m1 = parts1[1] ?? 1;
  const d1 = parts1[2] ?? 1;
  const y2 = parts2[0] ?? 2026;
  const m2 = parts2[1] ?? 1;
  const d2 = parts2[2] ?? 1;
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / MS_PER_DAY);
}

/**
 * Shared helper to update or initialize a user's streak.
 * Idempotent for the current calendar day in the user's timezone.
 */
export async function touchStreakForUser(ctx: MutationCtx, userId: Id<"users">, timeZone?: string) {
  const streak = await ctx.db
    .query("streaks")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();

  const userTimezone = timeZone || streak?.timezone;
  const today = getCalendarDate(new Date(), userTimezone);

  // If already recorded for today, streak is unchanged
  if (streak && streak.lastActive === today) {
    return {
      streakCurrent: streak.current,
      streakLongest: streak.longest,
      lastActive: streak.lastActive,
      updated: false,
      previousStreak: streak.current,
    };
  }

  let newStreak = 1;
  const longest = streak?.longest ?? 0;

  if (streak && streak.lastActive) {
    const diffDays = calendarDayDiff(streak.lastActive, today);

    if (diffDays === 1) {
      // Consecutive calendar day
      newStreak = streak.current + 1;
    } else if (diffDays <= 0) {
      // Clock skew or earlier check-in on same day
      newStreak = Math.max(1, streak.current);
    } else {
      // Missed 1 or more calendar days: reset to 1
      newStreak = 1;
    }
  }

  const newLongest = Math.max(longest, newStreak);

  if (streak) {
    await ctx.db.patch(streak._id, {
      current: newStreak,
      longest: newLongest,
      lastActive: today,
      ...(timeZone ? { timezone: timeZone } : {}),
    });
  } else {
    await ctx.db.insert("streaks", {
      userId,
      current: newStreak,
      longest: newLongest,
      lastActive: today,
      ...(timeZone ? { timezone: timeZone } : {}),
    });
  }

  return {
    streakCurrent: newStreak,
    streakLongest: newLongest,
    lastActive: today,
    updated: true,
    previousStreak: streak?.current ?? 0,
  };
}

export const getUserStreak = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { current: 0, longest: 0, lastActive: null };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return { current: 0, longest: 0, lastActive: null };
    }

    const streak = await ctx.db
      .query("streaks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!streak) {
      return { current: 0, longest: 0, lastActive: null };
    }

    return {
      current: streak.current,
      longest: streak.longest,
      lastActive: streak.lastActive || null,
      timezone: streak.timezone || null,
    };
  },
});

export const touchStreak = mutation({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { updated: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return { updated: false };
    }

    return await touchStreakForUser(ctx, user._id, args.timezone);
  },
});
