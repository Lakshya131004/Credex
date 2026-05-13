import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase";
import type { DbAudit, Recommendation } from "@/types";
import { fmt } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit) {
    return { title: "Audit not found — SpendLens" };
  }

  const savings = Math.round(audit.total_monthly_savings);
  const annual = Math.round(audit.total_annual_savings);
  const title = `AI Spend Audit — ${fmt(savings)}/mo in savings found`;
  const description = `This team identified ${fmt(savings)}/mo (${fmt(annual)}/yr) in AI tool savings. See the full breakdown on SpendLens.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "SpendLens",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getAudit(shareId: string): Promise<DbAudit | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("audits")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (error || !data) return null;
    return data as DbAudit;
  } catch {
    return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit) notFound();

  const monthlySavings = Math.round(audit.total_monthly_savings);
  const annualSavings = Math.round(audit.total_annual_savings);
  const currentSpend = Math.round(audit.total_monthly_spend);
  const isAlreadyOptimal = monthlySavings < 100;
  const isHighValue = monthlySavings > 500;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-indigo-600 text-lg tracking-tight">
            SpendLens
          </Link>
          <Link
            href="/"
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Audit my stack →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Shared badge */}
        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider text-center">
          Shared audit report · {new Date(audit.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>

        {/* Hero */}
        <div
          className={`rounded-2xl p-8 text-center ${
            isAlreadyOptimal
              ? "bg-emerald-50 border border-emerald-200"
              : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white"
          }`}
        >
          {isAlreadyOptimal ? (
            <>
              <div className="text-5xl mb-2">✓</div>
              <h1 className="text-2xl font-bold text-emerald-800 mb-1">
                Well-optimized AI stack
              </h1>
              <p className="text-emerald-700">
                No major plan changes recommended at audit time.
              </p>
              <p className="text-emerald-600 text-sm mt-3">
                Current spend: {fmt(currentSpend)}/mo
              </p>
            </>
          ) : (
            <>
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-2">
                Savings identified
              </p>
              <div className="text-6xl font-bold mb-1">
                {fmt(monthlySavings)}
                <span className="text-3xl font-medium text-indigo-200">/mo</span>
              </div>
              <div className="text-indigo-200 text-lg">
                {fmt(annualSavings)}/year · {audit.savings_percentage}% reduction
              </div>
              <div className="mt-4 text-indigo-100 text-sm">
                Team: {audit.team_size} people · Use case: {audit.use_case}
              </div>
            </>
          )}
        </div>

        {/* High-value Credex CTA */}
        {isHighValue && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div>
                <h3 className="font-bold text-amber-900 text-lg mb-1">
                  Want to capture even more savings?
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Credex sources unused AI credits from companies that
                  over-forecast — typically 20–40% below retail. At this spend
                  level, that could mean an additional{" "}
                  <strong>{fmt(currentSpend * 0.3)}/mo</strong> in savings
                  beyond the plan changes below.
                </p>
                <a
                  href="https://credex.rocks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 bg-amber-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors"
                >
                  Book a free Credex consultation →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* AI Summary */}
        {audit.ai_summary && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <h2 className="font-semibold text-slate-800">AI Analysis</h2>
            </div>
            <p className="text-slate-600 leading-relaxed text-sm">
              {audit.ai_summary}
            </p>
          </div>
        )}

        {/* Recommendations */}
        {audit.recommendations && audit.recommendations.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3">
              Recommendations
            </h2>
            <div className="space-y-3">
              {(audit.recommendations as Recommendation[]).map((rec, i) => (
                <SharedRecommendationCard key={i} rec={rec} />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
          <h2 className="font-bold text-slate-800 mb-2">
            Want to audit your own AI spend?
          </h2>
          <p className="text-slate-500 text-sm mb-4">
            Free, no signup required. Takes 2 minutes.
          </p>
          <Link
            href="/"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
          >
            Start Your Free Audit →
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400">
          SpendLens by{" "}
          <a
            href="https://credex.rocks"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-600"
          >
            Credex
          </a>{" "}
          · AI spend optimization for startups
        </p>
      </main>
    </div>
  );
}

// ─── Recommendation Card (server-renderable) ──────────────────────────────────

function SharedRecommendationCard({ rec }: { rec: Recommendation }) {
  const priorityStyles = {
    high: "bg-red-50 border-red-200",
    medium: "bg-amber-50 border-amber-200",
    low: "bg-slate-50 border-slate-200",
  };
  const badgeStyles = {
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-600",
  };

  return (
    <div
      className={`border rounded-xl p-5 ${priorityStyles[rec.priority]}`}
      role="article"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-slate-800 text-sm">
              {rec.toolName}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyles[rec.priority]}`}
            >
              {rec.priority}
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed mb-2">
            {rec.reason}
          </p>
          <div className="text-xs text-slate-500">
            {rec.currentPlanName}
            {rec.recommendedPlanName && (
              <>
                {" "}
                →{" "}
                <span className="font-medium text-slate-700">
                  {rec.recommendedPlanName}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold text-emerald-600">
            {fmt(rec.monthlySavings)}
          </div>
          <div className="text-xs text-slate-400">/mo saved</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {fmt(rec.annualSavings)}/yr
          </div>
        </div>
      </div>
    </div>
  );
}
