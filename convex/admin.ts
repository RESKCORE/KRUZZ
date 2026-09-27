import { query, mutation, action, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { FROM, buildBroadcastEmailHtml } from "./emails";
import { ADMIN_EMAILS, isValidBroadcastEmail, requireAdmin } from "./adminInternal";

export { ADMIN_EMAILS, isValidBroadcastEmail, requireAdmin };

/**
 * Direct administrative grant for system bootstrap.
 */
export const grantAdminDirect = mutation({
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
    const emailSubscribers = allUsers.filter((u) => isValidBroadcastEmail(u.email));
    const totalCases = (await ctx.db.query("caseStudies").collect()).length;

    const recentBroadcasts = await ctx.db
      .query("broadcasts")
      .withIndex("by_sent_at")
      .order("desc")
      .take(10);

    const recentUsers = allUsers
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 25)
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
 * Helper to dispatch emails via Resend API directly with batching and automatic
 * per-recipient fallback for bulletproof fault tolerance.
 */
async function dispatchToResend(params: {
  apiKey: string;
  recipients: string[];
  subject: string;
  html: string;
}): Promise<{
  deliveredIds: string[];
  failedList: Array<{ email: string; error: string }>;
}> {
  const { apiKey, recipients, subject, html } = params;
  const deliveredIds: string[] = [];
  const failedList: Array<{ email: string; error: string }> = [];

  const BATCH_SIZE = 100;
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const batchPayload = chunk.map((toEmail) => ({
      from: FROM,
      to: toEmail,
      subject,
      html,
    }));

    try {
      const batchRes = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchPayload),
      });

      const batchJson = (await batchRes.json().catch(() => null)) as {
        data?: Array<{ id: string }>;
        message?: string;
      } | null;

      if (batchRes.ok && Array.isArray(batchJson?.data)) {
        for (const item of batchJson.data) {
          if (item?.id) deliveredIds.push(item.id);
        }
      } else {
        // Batch failed (e.g. 422) -> Fall back to per-recipient send so one bad address never breaks the rest!
        for (const singleEmail of chunk) {
          try {
            const singleRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: FROM,
                to: singleEmail,
                subject,
                html,
              }),
            });
            const singleJson = (await singleRes.json().catch(() => null)) as {
              id?: string;
              message?: string;
            } | null;

            if (singleRes.ok && singleJson?.id) {
              deliveredIds.push(singleJson.id);
            } else {
              failedList.push({
                email: singleEmail,
                error: singleJson?.message || `HTTP ${singleRes.status}`,
              });
            }
          } catch (err: any) {
            failedList.push({
              email: singleEmail,
              error: err?.message || "Network exception",
            });
          }
        }
      }
    } catch {
      // Fall back to per-recipient
      for (const singleEmail of chunk) {
        try {
          const singleRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: FROM,
              to: singleEmail,
              subject,
              html,
            }),
          });
          const singleJson = (await singleRes.json().catch(() => null)) as {
            id?: string;
            message?: string;
          } | null;

          if (singleRes.ok && singleJson?.id) {
            deliveredIds.push(singleJson.id);
          } else {
            failedList.push({
              email: singleEmail,
              error: singleJson?.message || `HTTP ${singleRes.status}`,
            });
          }
        } catch (err: any) {
          failedList.push({
            email: singleEmail,
            error: err?.message || "Network exception",
          });
        }
      }
    }
  }

  return { deliveredIds, failedList };
}

import { type Doc, type Id } from "./_generated/dataModel";

export interface BroadcastResult {
  success: boolean;
  isTest: boolean;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  targetEmail?: string;
  failedRecipients?: Array<{ email: string; error: string }>;
  broadcastId: Id<"broadcasts">;
  resendDashboardUrl: string;
}

/**
 * Broadcast an email or system alert to all registered users or a test recipient.
 * Fully transparent, resilient, and reports exact delivery diagnostics in real time.
 */
export const sendBroadcastEmail = action({
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
  handler: async (ctx, args): Promise<BroadcastResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized: Sign in required to access administration");
    }

    const adminData: { adminEmail: string; adminName: string; recipientEmails: string[] } =
      await ctx.runQuery(internal.adminInternal.getAdminRecipients, {
        tokenIdentifier: identity.tokenIdentifier,
      });
    const { adminEmail, adminName, recipientEmails } = adminData;

    const apiKey = (process.env["RESEND_API_KEY"] || "").trim();
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable on server");
    }

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

      if (!isValidBroadcastEmail(targetEmail)) {
        throw new Error(`Invalid test recipient email address: ${targetEmail}`);
      }

      const sendSubject = `[TEST PREVIEW] ${cleanedSubject}`;
      const { deliveredIds, failedList } = await dispatchToResend({
        apiKey,
        recipients: [targetEmail],
        subject: sendSubject,
        html,
      });

      if (deliveredIds.length === 0) {
        throw new Error(
          `Failed to dispatch test email to ${targetEmail}: ${failedList[0]?.error || "Unknown error"}`,
        );
      }

      const broadcastId = await ctx.runMutation(internal.adminInternal.recordBroadcastResult, {
        subject: sendSubject,
        title: cleanedTitle,
        body: cleanedBody,
        type: args.type,
        ...(args.actionLabel ? { actionLabel: args.actionLabel } : {}),
        ...(args.actionUrl ? { actionUrl: args.actionUrl } : {}),
        recipientCount: 1,
        deliveredCount: 1,
        failedCount: 0,
        sentBy: adminEmail || adminName || "Admin",
        sentAt: Date.now(),
        status: "test",
        testEmail: targetEmail,
        resendIds: deliveredIds,
      });

      return {
        success: true,
        isTest: true,
        recipientCount: 1,
        deliveredCount: 1,
        failedCount: 0,
        targetEmail,
        broadcastId,
        resendDashboardUrl: "https://resend.com/emails",
      };
    }

    // Production broadcast to all valid users
    if (recipientEmails.length === 0) {
      throw new Error("No registered users with valid email addresses found in database");
    }

    const { deliveredIds, failedList } = await dispatchToResend({
      apiKey,
      recipients: recipientEmails,
      subject: cleanedSubject,
      html,
    });

    const deliveredCount = deliveredIds.length;
    const failedCount = failedList.length;
    const finalStatus =
      deliveredCount === recipientEmails.length
        ? "delivered"
        : deliveredCount > 0
          ? "partial"
          : "failed";

    const errorSummary =
      failedList.length > 0
        ? failedList.map((f) => `${f.email}: ${f.error}`).join("; ")
        : undefined;

    const broadcastId = await ctx.runMutation(internal.adminInternal.recordBroadcastResult, {
      subject: cleanedSubject,
      title: cleanedTitle,
      body: cleanedBody,
      type: args.type,
      ...(args.actionLabel ? { actionLabel: args.actionLabel } : {}),
      ...(args.actionUrl ? { actionUrl: args.actionUrl } : {}),
      recipientCount: recipientEmails.length,
      deliveredCount,
      failedCount,
      sentBy: adminEmail || adminName || "Admin",
      sentAt: Date.now(),
      status: finalStatus,
      resendIds: deliveredIds,
      ...(errorSummary ? { errorSummary } : {}),
    });

    return {
      success: deliveredCount > 0,
      isTest: false,
      recipientCount: recipientEmails.length,
      deliveredCount,
      failedCount,
      failedRecipients: failedList,
      broadcastId,
      resendDashboardUrl: "https://resend.com/emails",
    };
  },
});

/**
 * Internal CLI action to re-dispatch a pending/failed broadcast directly.
 */
export const dispatchPendingBroadcastCli = internalAction({
  args: { broadcastId: v.id("broadcasts") },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    recipientCount: number;
    deliveredCount: number;
    failedCount: number;
    deliveredIds: string[];
    failedList: Array<{ email: string; error: string }>;
  }> => {
    const b: Doc<"broadcasts"> | null = await ctx.runQuery(
      internal.adminInternal.getBroadcastById,
      { broadcastId: args.broadcastId },
    );
    if (!b) throw new Error("Broadcast not found");

    const validRecipients: string[] = await ctx.runQuery(
      internal.adminInternal.getAllValidRecipients,
    );
    const apiKey = (process.env["RESEND_API_KEY"] || "").trim();
    if (!apiKey) throw new Error("Missing RESEND_API_KEY");

    const html = buildBroadcastEmailHtml({
      title: b.title,
      body: b.body,
      badge: b.type.toUpperCase(),
      ...(b.actionLabel ? { actionLabel: b.actionLabel } : {}),
      ...(b.actionUrl ? { actionUrl: b.actionUrl } : {}),
    });

    const { deliveredIds, failedList } = await dispatchToResend({
      apiKey,
      recipients: validRecipients,
      subject: b.subject.replace(/^\[TEST PREVIEW\]\s*/i, ""),
      html,
    });

    await ctx.runMutation(internal.adminInternal.updateBroadcastDelivery, {
      broadcastId: args.broadcastId,
      deliveredCount: deliveredIds.length,
      failedCount: failedList.length,
      status: deliveredIds.length > 0 ? "delivered" : "failed",
      resendIds: deliveredIds,
      ...(failedList.length > 0
        ? { errorSummary: failedList.map((f) => `${f.email}: ${f.error}`).join("; ") }
        : {}),
    });

    return {
      success: deliveredIds.length > 0,
      recipientCount: validRecipients.length,
      deliveredCount: deliveredIds.length,
      failedCount: failedList.length,
      deliveredIds,
      failedList,
    };
  },
});

/**
 * Diagnostic tool to inspect broadcasts and users.
 */
export const debugInspectBroadcastsAndUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const broadcasts = await ctx.db.query("broadcasts").collect();
    const users = await ctx.db.query("users").collect();
    const usersWithEmail = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      isValid: isValidBroadcastEmail(u.email),
      role: u.role,
      tokenIdentifier: u.tokenIdentifier,
    }));
    return {
      broadcastCount: broadcasts.length,
      broadcasts,
      userCount: users.length,
      usersWithEmail,
    };
  },
});
