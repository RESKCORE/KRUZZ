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
    imageStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
    points: v.number(),
    rank: v.string(),
    isPublic: v.optional(v.boolean()),
    publicProfileId: v.optional(v.string()),
    university: v.optional(v.string()),
    role: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_public_profile_id", ["publicProfileId"])
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
    completedAgainstVersion: v.optional(v.string()),
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
    contentVersion: v.optional(v.string()),
    rubricVersion: v.optional(v.string()),
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

  labSubmissions: defineTable({
    userId: v.id("users"),
    caseSlug: v.string(),
    labId: v.string(),
    attemptId: v.string(),
    reservationId: v.optional(v.string()),
    idempotencyKey: v.string(),
    language: v.optional(v.string()),
    status: v.string(), // "reserved" | "processing" | "completed" | "learner_failed" | "provider_failed" | "expired"
    score: v.optional(v.number()),
    passed: v.optional(v.boolean()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    rubricVersion: v.optional(v.string()),
    promptVersion: v.optional(v.string()),
    contentVersion: v.optional(v.string()),
    payloadHash: v.optional(v.string()),
    inputCodeBytes: v.optional(v.number()),
    inputExplanationBytes: v.optional(v.number()),
    estimatedInputTokens: v.optional(v.number()),
    estimatedOutputTokens: v.optional(v.number()),
    estimatedCostUsd: v.optional(v.number()),
    latencyMs: v.optional(v.number()),
    isEstimatedUsage: v.optional(v.boolean()),
    errorCode: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user_case", ["userId", "caseSlug"])
    .index("by_user_case_status", ["userId", "caseSlug", "status"])
    .index("by_user_created", ["userId", "createdAt"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_idempotency", ["idempotencyKey"])
    .index("by_attempt_id", ["attemptId"]),

  providerHealth: defineTable({
    provider: v.string(), // "groq" | "openrouter" | "gemini" | "default"
    version: v.number(), // Monotonic sequence version
    consecutiveFailures: v.number(),
    circuitOpenUntil: v.number(),
    lastFailureTime: v.optional(v.number()),
    lastSuccessTime: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_provider", ["provider"]),

  broadcasts: defineTable({
    subject: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.string(), // "announcement" | "update" | "alert" | "challenge"
    actionLabel: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    recipientCount: v.number(),
    sentBy: v.string(),
    sentAt: v.number(),
    status: v.string(), // "sent" | "test" | "failed"
    testEmail: v.optional(v.string()),
  }).index("by_sent_at", ["sentAt"]),
});
