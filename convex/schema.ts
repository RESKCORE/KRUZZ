import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    customImageUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    points: v.number(),
    rank: v.string(),
    isPublic: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_points", ["points"]),

  awards: defineTable({
    userId: v.id("users"),
    awardId: v.string(),
    points: v.number(),
    awardedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_award", ["userId", "awardId"]),

  streaks: defineTable({
    userId: v.id("users"),
    current: v.number(),
    longest: v.number(),
    lastActive: v.string(),
    timezone: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  caseProgress: defineTable({
    userId: v.id("users"),
    caseSlug: v.string(),
    completedSections: v.array(v.number()),
    reflection: v.optional(v.string()),
    bestScore: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    status: v.optional(v.string()), // "in_progress" | "completed"
    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_case", ["userId", "caseSlug"]),

  caseUnlocks: defineTable({
    userId: v.id("users"),
    caseSlug: v.string(),
    unlockedAt: v.number(),
    reason: v.string(), // "initial_free" | "progression" | "admin"
  })
    .index("by_user", ["userId"])
    .index("by_user_case", ["userId", "caseSlug"]),

  caseStudies: defineTable({
    slug: v.string(),
    index: v.string(),
    title: v.string(),
    shortTitle: v.string(),
    category: v.string(),
    subcategory: v.string(),
    difficulty: v.string(),
    learnerLevel: v.string(),
    estimatedTime: v.string(),
    minutes: v.number(),
    status: v.string(),
    tier: v.string(),
    rcCost: v.number(),
    summary: v.string(),
    learningObjectives: v.array(v.string()),
    prerequisites: v.array(v.string()),
    engineeringConcepts: v.array(v.string()),
    technologies: v.array(v.string()),
    tech: v.array(v.string()),
    tags: v.array(v.string()),
    glossary: v.optional(v.array(v.object({ term: v.string(), plainDefinition: v.string() }))),
    primers: v.optional(v.array(v.any())),
    discover: v.optional(v.any()),
    understand: v.optional(v.any()),
    concepts: v.optional(v.any()),
    architecture: v.optional(v.any()),
    decisions: v.optional(v.any()),
    tradeOffs: v.optional(v.any()),
    implementation: v.optional(v.any()),
    practice: v.optional(v.any()),
    failureModes: v.optional(v.any()),
    microDrills: v.optional(v.any()),
    reflection: v.optional(v.any()),
    techNotes: v.optional(v.any()),
    codeLab: v.optional(v.any()),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_index", ["index"])
    .index("by_category", ["category"]),
});
