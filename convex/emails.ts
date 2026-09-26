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

export const FROM = "KRUZZ <noreply@kruzz.indevs.in>";

const SITE_URL = "https://kruzz.indevs.in";

export function buildBroadcastEmailHtml(options: {
  title: string;
  body: string;
  badge?: string;
  actionLabel?: string;
  actionUrl?: string;
}): string {
  const badgeHtml = options.badge
    ? `<div style="display:inline-block;padding:4px 10px;border-radius:6px;background:#f3f4f6;border:1px solid #d1d5db;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#111;margin-bottom:14px;">${options.badge}</div>`
    : "";

  const actionHtml =
    options.actionLabel && options.actionUrl
      ? `<div style="margin:28px 0 20px 0;">
          <a href="${options.actionUrl}" style="display:inline-block;background:#000000;color:#ffffff;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:13px;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:10px;border:2px solid #000000;">
            ${options.actionLabel} &rarr;
          </a>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;line-height:1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:580px;background:#ffffff;border:2px solid #000000;border-radius:18px;overflow:hidden;box-shadow:0 6px 0 0 #000000;padding:0;" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:20px 28px;background:#000000;color:#ffffff;border-bottom:2px solid #000000;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="48" valign="middle" style="vertical-align:middle;">
                    <img src="${SITE_URL}/email-logo.png" width="36" height="36" alt="KRUZZ" style="display:block;width:36px;height:36px;border:0;outline:none;text-decoration:none;">
                  </td>
                  <td valign="middle" style="vertical-align:middle;">
                    <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-weight:900;font-size:18px;letter-spacing:0.05em;color:#ffffff;">KRUZZ</span>
                    <span style="display:inline-block;margin-left:8px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:10px;color:#a3a3a3;text-transform:uppercase;letter-spacing:0.15em;">· System Architecture</span>
                  </td>
                  <td align="right" valign="middle" style="vertical-align:middle;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ffffff;"></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              ${badgeHtml}
              <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:900;color:#000000;line-height:1.25;letter-spacing:-0.02em;">
                ${options.title}
              </h1>

              <div style="font-size:14px;color:#374151;line-height:1.65;">
                ${options.body}
              </div>

              ${actionHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;color:#6b7280;line-height:1.5;">
              <p style="margin:0 0 4px 0;font-weight:700;color:#111827;">KRUZZ — Real-World System Architecture Platform</p>
              <p style="margin:0;">You are receiving this operational dispatch as a registered investigator on <a href="${SITE_URL}" style="color:#000000;font-weight:700;text-decoration:underline;">kruzz.indevs.in</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function layout(title: string, body: string): string {
  return buildBroadcastEmailHtml({ title, body });
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
