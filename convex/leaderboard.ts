import { query } from "./_generated/server";

/**
 * Global Leaderboard:
 * Ranks investigators primarily by case studies completion count (curriculum mastery),
 * using RC balance as tie-breaker.
 *
 * Strictly returns `completedCasesCount` instead of user points.
 */
export const getTopLearners = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    const results = await Promise.all(
      users.map(async (u) => {
        const progressList = await ctx.db
          .query("caseProgress")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();

        const completedCasesCount = progressList.filter(
          (p) =>
            p.status === "completed" ||
            Boolean(p.passed && (p.completedSections?.length ?? 0) >= 7),
        ).length;

        return {
          _id: u._id,
          name: u.name || "Anonymous Investigator",
          completedCasesCount,
          points: u.points,
          rank: u.rank,
          imageUrl: u.customImageUrl ?? u.imageUrl,
          publicProfileId: u.publicProfileId,
          clerkId: u.clerkId,
          createdAt: u.createdAt ?? 0,
        };
      }),
    );

    // Sort primarily by completedCasesCount (descending), tie-break with points and createdAt
    results.sort((a, b) => {
      if (b.completedCasesCount !== a.completedCasesCount) {
        return b.completedCasesCount - a.completedCasesCount;
      }
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return a.createdAt - b.createdAt;
    });

    return results.slice(0, 50).map((u) => ({
      _id: u._id,
      name: u.name,
      completedCasesCount: u.completedCasesCount,
      rank: u.rank,
      imageUrl: u.imageUrl,
      publicProfileId: u.publicProfileId,
      clerkId: u.clerkId,
    }));
  },
});
