import { Resend } from "@convex-dev/resend";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { timingSafeEqualStr } from "./caseStudies";
import { internalMutation, type MutationCtx } from "./_generated/server";

/**
 * Email sending via Resend's official Convex component.
 * Sends are enqueued, batched and retried by the component, so callers return fast.
 *
 * Required env (set with `npx convex env set`):
 *   RESEND_API_KEY
 *   RESEND_WEBHOOK_SECRET  (delivery/bounce status)
 */
export const resend = new Resend(components.resend, { testMode: false });

const FROM = "KRUZZ <noreply@kruzz.indevs.in>";

function layout(title: string, body: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
<h1 style="font-size:20px">${title}</h1>
${body}
<p style="color:#888;font-size:12px">KRUZZ — sent because you have an account.</p>
</div>`;
}

/** Enqueue an email to a single user. Returns null when the user has no stored email. */
export async function sendToUser(
  ctx: MutationCtx,
  args: { tokenIdentifier: string; title: string; body: string; subject?: string },
): Promise<string | null> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
    .unique();
  if (!user?.email) return null;
  return resend.sendEmail(ctx, {
    from: FROM,
    to: user.email,
    subject: args.subject ?? args.title,
    html: layout(args.title, args.body),
  });
}

/** Admin-protected: verify the pipe end-to-end without wiring a real trigger. */
export const sendTestEmail = internalMutation({
  args: { to: v.string(), adminKey: v.string() },
  handler: async (ctx, args) => {
    const expectedKey = (process.env["ADMIN_KEY"] || process.env["CONVEX_ADMIN_KEY"] || "").trim();
    if (!expectedKey || expectedKey.length < 16) {
      throw new Error("Unauthorized: Email sending is disabled (server ADMIN_KEY unconfigured)");
    }
    if (!timingSafeEqualStr(args.adminKey.trim(), expectedKey)) {
      throw new Error("Unauthorized: Invalid administrative credentials");
    }
    return resend.sendEmail(ctx, {
      from: FROM,
      to: args.to,
      subject: "KRUZZ test email",
      html: layout("It works", "<p>Resend is wired up to KRUZZ.</p>"),
    });
  },
});
