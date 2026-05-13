import { Resend } from "resend";
import type { AuditResult } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "SpendLens <audit@spendlens.io>";
const CREDEX_TEAM_EMAIL = process.env.CREDEX_NOTIFY_EMAIL ?? "team@credex.rocks";

export async function sendAuditConfirmation(
  email: string,
  auditResult: AuditResult,
  shareId: string
): Promise<void> {
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/share/${shareId}`;
  const isHighValue = auditResult.isHighValue;

  const topRecs = auditResult.recommendations
    .filter((r) => r.action !== "use_credits")
    .slice(0, 3)
    .map(
      (r) =>
        `<li><strong>${r.toolName}:</strong> ${r.actionLabel} — save $${Math.round(r.monthlySavings)}/mo</li>`
    )
    .join("");

  const credexCta = isHighValue
    ? `<p style="background:#f0fdf4;border:1px solid #86efac;padding:16px;border-radius:8px;margin-top:24px">
        <strong>🎯 You qualify for a Credex credits consultation.</strong><br/>
        With $${Math.round(auditResult.totalMonthlySavings)}/mo in savings identified, we can help you capture even more through discounted AI credits.
        <a href="https://credex.rocks" style="color:#16a34a;font-weight:bold">Book a free 20-min call →</a>
      </p>`
    : "";

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your AI Spend Audit — $${Math.round(auditResult.totalAnnualSavings)}/yr in savings found`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h1 style="color:#1e293b">Your AI Spend Audit Results</h1>
          <p>Here's a summary of your audit from SpendLens:</p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
            <p style="margin:0;font-size:14px;color:#64748b">Monthly savings identified</p>
            <p style="margin:4px 0 0;font-size:32px;font-weight:bold;color:#16a34a">
              $${Math.round(auditResult.totalMonthlySavings)}<span style="font-size:16px">/mo</span>
            </p>
            <p style="margin:4px 0 0;font-size:14px;color:#64748b">
              $${Math.round(auditResult.totalAnnualSavings)}/year · ${auditResult.savingsPercentage}% reduction
            </p>
          </div>

          <h2 style="color:#1e293b">Top Recommendations</h2>
          <ul>${topRecs || "<li>Your stack looks well-optimized — check back as new plans launch.</li>"}</ul>

          ${credexCta}

          <p style="margin-top:24px">
            <a href="${shareUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">
              View Your Full Report →
            </a>
          </p>

          <p style="font-size:12px;color:#94a3b8;margin-top:32px">
            SpendLens by Credex · <a href="https://credex.rocks">credex.rocks</a><br/>
            You received this because you completed an AI spend audit.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[resend] Failed to send audit confirmation:", err);
    // Non-fatal — don't block the lead capture response
  }
}

export async function notifyTeamHighValue(
  email: string,
  auditResult: AuditResult,
  shareId: string
): Promise<void> {
  if (!auditResult.isHighValue) return;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: CREDEX_TEAM_EMAIL,
      subject: `🔥 High-Value Lead: $${Math.round(auditResult.totalMonthlySavings)}/mo savings — ${email}`,
      html: `
        <p><strong>New high-value audit completed.</strong></p>
        <ul>
          <li>Email: ${email}</li>
          <li>Monthly savings: $${Math.round(auditResult.totalMonthlySavings)}</li>
          <li>Annual savings: $${Math.round(auditResult.totalAnnualSavings)}</li>
          <li>Team size: ${auditResult.formData.teamSize}</li>
          <li>Use case: ${auditResult.formData.useCase}</li>
          <li>Share URL: ${process.env.NEXT_PUBLIC_APP_URL}/share/${shareId}</li>
        </ul>
      `,
    });
  } catch (err) {
    console.error("[resend] Failed to notify team:", err);
  }
}
