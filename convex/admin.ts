import {
  query,
  mutation,
  internalMutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { v } from "convex/values";
import { resend, FROM, buildBroadcastEmailHtml } from "./emails";

export const ADMIN_EMAILS = ["reddysantosh1310@gmail.com"];

/**
 * Direct administrative grant for system bootstrap.
 */
export const grantAdminDirect = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const targetEmail = args.email.trim().toLowerCase();
    const allUsers = await ctx.db.query("users").collect();
    let patchedCount = 0;
    for (const u of allUsers) {
      if (
        (u.email && u.email.trim().toLowerCase() === targetEmail) ||
        (u.name && u.name.toLowerCase().includes("santosh reddy"))
      ) {
        await ctx.db.patch(u._id, { role: "admin", email: targetEmail });
        patchedCount++;
      }
    }
    return { success: true, patchedCount };
  },
});

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
 * Checks if the current authenticated caller is an administrator.
 */
export const checkIsAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { isAdmin: false };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    const userEmail = (identity.email || user?.email || "").trim().toLowerCase();
    const isAdminEmail = ADMIN_EMAILS.includes(userEmail);
    const hasAdminRole = user?.role === "admin";

    return {
      isAdmin: Boolean(isAdminEmail || hasAdminRole),
      email: userEmail,
      name: user?.name ?? identity.name,
      role: hasAdminRole ? "admin" : isAdminEmail ? "admin" : "member",
    };
  },
});

/**
 * Synchronizes the admin role into the database record for authorized emails.
 */
export const syncAdminRole = mutation({
  args: {},
  handler: async (ctx) => {
    const { user, email } = await requireAdmin(ctx);
    if (user && user.role !== "admin") {
      await ctx.db.patch(user._id, { role: "admin" });
    }
    return { success: true, email, role: "admin" };
  },
});

/**
 * High-level operational statistics for the Admin Dashboard.
 */
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allUsers = await ctx.db.query("users").collect();
    const emailSubscribers = allUsers.filter((u) => u.email && u.email.trim().length > 3);
    const totalCases = (await ctx.db.query("caseStudies").collect()).length;

    const recentBroadcasts = await ctx.db
      .query("broadcasts")
      .withIndex("by_sent_at")
      .order("desc")
      .take(10);

    const recentUsers = allUsers
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 15)
      .map((u) => ({
        _id: u._id,
        name: u.name || "Anonymous Investigator",
        email: u.email || "No email stored",
        points: u.points,
        rank: u.rank,
        university: u.university || "",
        publicProfileId: u.publicProfileId || "",
        role: u.role || "member",
        createdAt: u.createdAt,
      }));

    return {
      totalUsers: allUsers.length,
      emailSubscribersCount: emailSubscribers.length,
      totalCases,
      recentBroadcasts,
      recentUsers,
    };
  },
});

/**
 * List all historical broadcasts.
 */
export const listBroadcasts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("broadcasts").withIndex("by_sent_at").order("desc").take(50);
  },
});

/**
 * Broadcast an email or system alert to all registered users or a test recipient.
 */
export const sendBroadcastEmail = mutation({
  args: {
    subject: v.string(),
    title: v.string(),
    body: v.string(),
    type: v.string(), // "announcement" | "update" | "alert" | "challenge"
    badge: v.optional(v.string()),
    actionLabel: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    isTest: v.boolean(),
    testEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity, user, email: adminEmail } = await requireAdmin(ctx);

    const cleanedSubject = args.subject.trim();
    const cleanedTitle = args.title.trim();
    const cleanedBody = args.body.trim();

    if (!cleanedSubject || !cleanedTitle || !cleanedBody) {
      throw new Error("Subject, Title, and Body are mandatory fields");
    }

    const html = buildBroadcastEmailHtml({
      title: cleanedTitle,
      body: cleanedBody,
      badge: args.badge?.trim() || args.type.toUpperCase(),
      ...(args.actionLabel?.trim() ? { actionLabel: args.actionLabel.trim() } : {}),
      ...(args.actionUrl?.trim() ? { actionUrl: args.actionUrl.trim() } : {}),
    });

    if (args.isTest) {
      const targetEmail = (
        args.testEmail?.trim() ||
        adminEmail ||
        "reddysantosh1310@gmail.com"
      ).toLowerCase();
      const sendSubject = `[TEST PREVIEW] ${cleanedSubject}`;

      await resend.sendEmail(ctx, {
        from: FROM,
        to: targetEmail,
        subject: sendSubject,
        html,
      });

      const broadcastId = await ctx.db.insert("broadcasts", {
        subject: sendSubject,
        title: cleanedTitle,
        body: cleanedBody,
        type: args.type,
        ...(args.actionLabel ? { actionLabel: args.actionLabel } : {}),
        ...(args.actionUrl ? { actionUrl: args.actionUrl } : {}),
        recipientCount: 1,
        sentBy: adminEmail || user?.name || "Admin",
        sentAt: Date.now(),
        status: "test",
        testEmail: targetEmail,
      });

      return {
        success: true,
        isTest: true,
        recipientCount: 1,
        targetEmail,
        broadcastId,
      };
    }

    // Production broadcast to ALL users
    const allUsers = await ctx.db.query("users").collect();
    const emailSet = new Set<string>();

    allUsers.forEach((u) => {
      if (u.email && u.email.trim().includes("@")) {
        emailSet.add(u.email.trim().toLowerCase());
      }
    });

    const recipientEmails = Array.from(emailSet);

    if (recipientEmails.length === 0) {
      throw new Error("No registered users with valid email addresses found in database");
    }

    // Enqueue emails in parallel using Resend's batch queue
    for (const email of recipientEmails) {
      await resend.sendEmail(ctx, {
        from: FROM,
        to: email,
        subject: cleanedSubject,
        html,
      });
    }

    const broadcastId = await ctx.db.insert("broadcasts", {
      subject: cleanedSubject,
      title: cleanedTitle,
      body: cleanedBody,
      type: args.type,
      ...(args.actionLabel ? { actionLabel: args.actionLabel } : {}),
      ...(args.actionUrl ? { actionUrl: args.actionUrl } : {}),
      recipientCount: recipientEmails.length,
      sentBy: adminEmail || user?.name || "Admin",
      sentAt: Date.now(),
      status: "sent",
    });

    return {
      success: true,
      isTest: false,
      recipientCount: recipientEmails.length,
      broadcastId,
    };
  },
});
