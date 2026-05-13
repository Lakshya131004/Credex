import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { runAuditEngine } from "@/lib/audit-engine";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { AuditFormData } from "@/types";

const toolEntrySchema = z.object({
  toolId: z.string(),
  planId: z.string(),
  monthlySpend: z.number().min(0).max(1_000_000),
  seats: z.number().min(1).max(10_000),
});

const auditRequestSchema = z.object({
  formData: z.object({
    tools: z.array(toolEntrySchema).min(1).max(20),
    teamSize: z.number().min(1).max(100_000),
    useCase: z.enum(["coding", "writing", "data", "research", "mixed"]),
  }),
  // Honeypot field — bots fill this, humans don't
  website: z.string().max(0).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 20 audits per IP per minute
  const ip = getClientIp(req);
  const rl = checkRateLimit(`audit:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = auditRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Honeypot check — if filled, silently return fake success
  if (parsed.data.website) {
    return NextResponse.json({ shareId: nanoid(10) }, { status: 200 });
  }

  const formData = parsed.data.formData as AuditFormData;
  const auditResult = runAuditEngine(formData);
  const shareId = nanoid(10);

  // Persist to Supabase (non-blocking on failure)
  let dbId: string | undefined;
  try {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .insert({
        share_id: shareId,
        tools: formData.tools,
        team_size: formData.teamSize,
        use_case: formData.useCase,
        total_monthly_spend: auditResult.totalCurrentMonthlySpend,
        total_monthly_savings: auditResult.totalMonthlySavings,
        total_annual_savings: auditResult.totalAnnualSavings,
        savings_percentage: auditResult.savingsPercentage,
        recommendations: auditResult.recommendations,
        is_high_value: auditResult.isHighValue,
      })
      .select("id")
      .single();

    if (error) console.error("[supabase] Audit insert failed:", error);
    else dbId = data?.id;
  } catch (err) {
    console.error("[supabase] Unexpected error:", err);
  }

  return NextResponse.json({
    auditResult: { ...auditResult, id: dbId, shareId },
    shareId,
  });
}
