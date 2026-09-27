import {
  internalMutation,
  internalQuery,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { type Id } from "./_generated/dataModel";

export const ADMIN_EMAILS = ["reddysantosh1310@gmail.com"];

/**
 * Validates that an email address is RFC compliant and not a dummy/test domain
 * (e.g. example.com, test.com, clerk test users) that would cause Resend to reject
 * batches with HTTP 422.
 */
export function isValidBroadcastEmail(rawEmail?: string | null): boolean {
  if (!rawEmail) return false;
  const email = rawEmail.trim().toLowerCase();
  if (email.length < 5 || email.length > 254) return false;

  // RFC standard email validation
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email)) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [localPart, domain] = parts;
  if (!localPart || !domain) return false;

  const rejectedDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "example.edu",
    "test.com",
    "test.org",
    "test.net",
    "invalid",
    "localhost",
    "local",
    "domain.com",
    "test.invalid",
  ]);

  if (rejectedDomains.has(domain)) return false;
  if (
    domain.endsWith(".test") ||
    domain.endsWith(".example") ||
    domain.endsWith(".invalid") ||
    domain.endsWith(".localhost")
  ) {
    return false;
  }

  // Reject Clerk test artifacts (e.g., alex+clerk_test@...)
  if (localPart.includes("clerk_test") || domain.includes("clerk.accounts.dev")) {
    return false;
  }

  return true;
}

/**
 * Validates that the active session belongs to an authorized administrator.
 */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized: Sign in required to access administration");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();

  const userEmail = (identity.email || user?.email || "").trim().toLowerCase();
  const isAdminEmail = ADMIN_EMAILS.includes(userEmail);
  const hasAdminRole = user?.role === "admin";

  if (!isAdminEmail && !hasAdminRole) {
    throw new Error("Access Denied: Administrative privileges required");
  }

  return { identity, user, email: userEmail };
}

/**
 * Internal query to fetch validated recipients and admin identity.
 */
export const getAdminRecipients = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();

    const userEmail = (user?.email || "").trim().toLowerCase();
    const isAdminEmail = ADMIN_EMAILS.includes(userEmail);
    const hasAdminRole = user?.role === "admin";

    if (!isAdminEmail && !hasAdminRole) {
      throw new Error("Access Denied: Administrative privileges required");
    }

    const allUsers = await ctx.db.query("users").collect();
    const validEmails = new Set<string>();

    for (const u of allUsers) {
      if (isValidBroadcastEmail(u.email)) {
        validEmails.add(u.email!.trim().toLowerCase());
      }
    }

    return {
      adminEmail: userEmail || "reddysantosh1310@gmail.com",
      adminName: user?.name || "Santosh Reddy",
      recipientEmails: Array.from(validEmails),
    };
  },
});

/**
 * Internal query to fetch all validated recipient emails for platform operations.
 */
export const getAllValidRecipients = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const validEmails = new Set<string>();
    for (const u of allUsers) {
      if (isValidBroadcastEmail(u.email)) {
        validEmails.add(u.email!.trim().toLowerCase());
      }
    }
    return Array.from(validEmails);
  },
});

/**
 * Internal query to get a broadcast record by ID.
 */
export const getBroadcastById = internalQuery({
  args: { broadcastId: v.id("broadcasts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.broadcastId);
  },
});

/**
 * Internal mutation to record a broadcast send result.
 */
export const recordBroadcastResult = internalMutation({
  args: {
    subject: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    actionLabel: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    recipientCount: v.number(),
    deliveredCount: v.optional(v.number()),
    failedCount: v.optional(v.number()),
    sentBy: v.string(),
    sentAt: v.number(),
    status: v.string(),
    testEmail: v.optional(v.string()),
    resendIds: v.optional(v.array(v.string())),
    errorSummary: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"broadcasts">> => {
    const record: {
      subject: string;
      title: string;
      body: string;
      type: string;
      recipientCount: number;
      sentBy: string;
      sentAt: number;
      status: string;
      actionLabel?: string;
      actionUrl?: string;
      deliveredCount?: number;
      failedCount?: number;
      testEmail?: string;
      resendIds?: string[];
      errorSummary?: string;
    } = {
      subject: args.subject,
      title: args.title,
      body: args.body,
      type: args.type,
      recipientCount: args.recipientCount,
      sentBy: args.sentBy,
      sentAt: args.sentAt,
      status: args.status,
    };

    if (args.actionLabel !== undefined) record.actionLabel = args.actionLabel;
    if (args.actionUrl !== undefined) record.actionUrl = args.actionUrl;
    if (args.deliveredCount !== undefined) record.deliveredCount = args.deliveredCount;
    if (args.failedCount !== undefined) record.failedCount = args.failedCount;
    if (args.testEmail !== undefined) record.testEmail = args.testEmail;
    if (args.resendIds !== undefined) record.resendIds = args.resendIds;
    if (args.errorSummary !== undefined) record.errorSummary = args.errorSummary;

    return await ctx.db.insert("broadcasts", record);
  },
});

/**
 * Internal mutation to update an existing broadcast delivery status.
 */
export const updateBroadcastDelivery = internalMutation({
  args: {
    broadcastId: v.id("broadcasts"),
    deliveredCount: v.number(),
    failedCount: v.number(),
    status: v.string(),
    resendIds: v.array(v.string()),
    errorSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: {
      deliveredCount: number;
      failedCount: number;
      status: string;
      resendIds: string[];
      errorSummary?: string;
    } = {
      deliveredCount: args.deliveredCount,
      failedCount: args.failedCount,
      status: args.status,
      resendIds: args.resendIds,
    };
    if (args.errorSummary !== undefined) {
      patch.errorSummary = args.errorSummary;
    }
    await ctx.db.patch(args.broadcastId, patch);
  },
});

/**
 * Clean up test/mock accounts from the database.
 */
export const cleanUpTestUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    const removed: string[] = [];

    for (const u of allUsers) {
      const email = (u.email || "").toLowerCase().trim();
      const isTestUser =
        !isValidBroadcastEmail(email) ||
        email.includes("+clerk_test") ||
        email.endsWith("@example.com") ||
        email.endsWith("@kruzz.dev");

      if (isTestUser) {
        const awards = await ctx.db
          .query("awards")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();
        for (const a of awards) await ctx.db.delete(a._id);

        const streaks = await ctx.db
          .query("streaks")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();
        for (const s of streaks) await ctx.db.delete(s._id);

        const caseProgress = await ctx.db
          .query("caseProgress")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();
        for (const cp of caseProgress) await ctx.db.delete(cp._id);

        const caseUnlocks = await ctx.db
          .query("caseUnlocks")
          .withIndex("by_user", (q) => q.eq("userId", u._id))
          .collect();
        for (const cu of caseUnlocks) await ctx.db.delete(cu._id);

        await ctx.db.delete(u._id);
        removed.push(`${u.name || "Test User"} (${u.email}) [id: ${u._id}]`);
      }
    }

    return { success: true, removedCount: removed.length, removed };
  },
});
