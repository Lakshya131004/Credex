import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { DbAudit } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length > 50) {
    return NextResponse.json({ error: "Invalid share ID" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .select(
        "share_id, tools, team_size, use_case, total_monthly_spend, total_monthly_savings, total_annual_savings, savings_percentage, recommendations, ai_summary, is_high_value, created_at"
      )
      .eq("share_id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    // Strip any PII — only tool data and savings numbers are public
    const publicAudit = data as Omit<DbAudit, "id">;

    return NextResponse.json({ audit: publicAudit });
  } catch (err) {
    console.error("[share] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
