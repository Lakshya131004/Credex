import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { sendAuditConfirmation, notifyTeamHighValue } from "@/lib/resend";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { DbAudit } from "@/types";

const leadSchema = z.object({
  shareId: z.string().min(1).max(50),
  email: z.string().email().max(320),
  companyName: z.string().max(200).optional(),
  role: z.string().max(200).optional(),
  // Honeypot — bots fill this, humans don't
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`leads:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Honeypot check
  if (parsed.data.website) {
    return NextResponse.json({ success: true, message: "Report sent." });
  }

  const { shareId, email, companyName, role } = parsed.data;

  // Look up the audit
  let audit: DbAudit | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (!error && data) audit = data as DbAudit;
  } catch (err) {
    console.error("[supabase] Audit lookup failed:", err);
  }

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  // Store lead
  try {
    const { error } = await supabaseAdmin.from("leads").insert({
      audit_id: audit.id,
      email,
      company_name: companyName ?? null,
      role: role ?? null,
      team_size: audit.team_size,
      monthly_savings: audit.total_monthly_savings,
      is_high_value: audit.is_high_value,
    });

    if (error) {
      // Duplicate email for same audit is OK — just skip
      if (error.code !== "23505") {
        console.error("[supabase] Lead insert failed:", error);
      }
    }
  } catch (err) {
    console.error("[supabase] Unexpected lead error:", err);
  }

  // Reconstruct AuditResult for email (best-effort)
  const auditResult = {
    formData: {
      tools: audit.tools,
      teamSize: audit.team_size,
      useCase: audit.use_case,
    },
    recommendations: audit.recommendations,
    totalCurrentMonthlySpend: audit.total_monthly_spend,
    totalRecommendedMonthlySpend:
      audit.total_monthly_spend - audit.total_monthly_savings,
    totalMonthlySavings: audit.total_monthly_savings,
    totalAnnualSavings: audit.total_annual_savings,
    savingsPercentage: audit.savings_percentage,
    isHighValue: audit.is_high_value,
    isAlreadyOptimal: audit.total_monthly_savings < 100,
    aiSummary: audit.ai_summary ?? undefined,
  };

  // Send emails (non-blocking)
  await Promise.allSettled([
    sendAuditConfirmation(email, auditResult as never, shareId),
    notifyTeamHighValue(email, auditResult as never, shareId),
  ]);

  return NextResponse.json({ success: true, message: "Report sent." });
}
