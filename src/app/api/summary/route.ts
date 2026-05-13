import { NextRequest, NextResponse } from "next/server";
import { generateAuditSummary } from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { AuditResult } from "@/types";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`summary:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { auditResult: AuditResult; shareId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.auditResult) {
    return NextResponse.json({ error: "auditResult required" }, { status: 400 });
  }

  const { summary, isAiGenerated } = await generateAuditSummary(body.auditResult);

  // Persist summary back to the audit row
  if (body.shareId) {
    try {
      await supabaseAdmin
        .from("audits")
        .update({ ai_summary: summary })
        .eq("share_id", body.shareId);
    } catch (err) {
      console.error("[supabase] Summary update failed:", err);
    }
  }

  return NextResponse.json({ summary, isAiGenerated });
}
