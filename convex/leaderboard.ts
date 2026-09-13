import { query } from "./_generated/server";

export const getTopLearners = query({
  args: {},
  handler: async (ctx) => {
    const topUsers = await ctx.db.query("users").withIndex("by_points").order("desc").take(10);

    return topUsers.map((u) => ({
      _id: u._id,
      name: u.name || "Anonymous Learner",
      points: u.points,
      rank: u.rank,
      imageUrl: u.customImageUrl ?? u.imageUrl,
    }));
  },
});
