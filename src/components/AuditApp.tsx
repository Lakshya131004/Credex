"use client";

import { useState, useEffect, useRef } from "react";
import type {
  AuditFormData,
  AuditResult,
  ToolEntry,
  ToolId,
  UseCase,
  Recommendation,
} from "@/types";
import { TOOLS, getAllTools } from "@/lib/pricing-data";
import { fmt } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = "form" | "submitting" | "results";

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_FORM: AuditFormData = { tools: [], teamSize: 5, useCase: "coding" };

const USE_CASES: { value: UseCase; label: string }[] = [
  { value: "coding", label: "Coding / Engineering" },
  { value: "writing", label: "Writing / Content" },
  { value: "data", label: "Data / Analytics" },
  { value: "research", label: "Research" },
  { value: "mixed", label: "Mixed / General" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditApp() {
  const [phase, setPhase] = useState<Phase>("form");
  const [formData, setFormData] = useState<AuditFormData>(() => {
    if (typeof window === "undefined") return INITIAL_FORM;
    try {
      const s = localStorage.getItem("spendlens_v1");
      if (s) return JSON.parse(s) as AuditFormData;
    } catch {}
    return INITIAL_FORM;
  });
  const [result, setResult] = useState<AuditResult | null>(null);
  const [shareId, setShareId] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [leadDone, setLeadDone] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState("");
  const [showToolPicker, setShowToolPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Persist form state
  useEffect(() => {
    try {
      localStorage.setItem("spendlens_v1", JSON.stringify(formData));
    } catch {}
  }, [formData]);

  // Close tool picker on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowToolPicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function addTool(toolId: ToolId) {
    if (formData.tools.find((t) => t.toolId === toolId)) {
      setShowToolPicker(false);
      return;
    }
    const tool = TOOLS[toolId];
    const plan =
      tool.plans.find((p) => p.pricePerUserPerMonth > 0) ?? tool.plans[0];
    const seats = Math.max(1, formData.teamSize);
    setFormData((prev) => ({
      ...prev,
      tools: [
        ...prev.tools,
        {
          toolId,
          planId: plan.id,
          seats,
          monthlySpend:
            plan.pricePerUserPerMonth > 0
              ? Math.round(plan.pricePerUserPerMonth * seats)
              : 0,
        },
      ],
    }));
    setShowToolPicker(false);
  }

  function removeTool(toolId: ToolId) {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.filter((t) => t.toolId !== toolId),
    }));
  }

  function updateTool(toolId: ToolId, patch: Partial<ToolEntry>) {
    setFormData((prev) => ({
      ...prev,
      tools: prev.tools.map((t) =>
        t.toolId === toolId ? { ...t, ...patch } : t
      ),
    }));
  }

  async function runAudit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.tools.length === 0) {
      setFormError("Add at least one AI tool to audit.");
      return;
    }
    setFormError("");
    setPhase("submitting");
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Audit failed");
      }
      const data = await res.json();
      setResult(data.auditResult);
      setShareId(data.shareId);
      setPhase("results");

      // AI summary — non-blocking
      setSummaryLoading(true);
      fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditResult: data.auditResult,
          shareId: data.shareId,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.summary) setAiSummary(d.summary);
        })
        .catch(() => {})
        .finally(() => setSummaryLoading(false));
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setPhase("form");
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !shareId) return;
    setLeadLoading(true);
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyName: company, role, shareId }),
      });
      setLeadDone(true);
    } catch {}
    setLeadLoading(false);
  }

  function copyLink() {
    navigator.clipboard
      .writeText(`${location.origin}/share/${shareId}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium text-lg">
            Analyzing your AI spend…
          </p>
          <p className="text-slate-400 text-sm">
            Running spend rules across your tools
          </p>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (phase === "results" && result) {
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareId}`;

    return (
      <div className="min-h-screen bg-slate-50">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-indigo-600 text-lg tracking-tight">
              SpendLens
            </span>
            <button
              onClick={() => {
                setPhase("form");
                setResult(null);
                setAiSummary(null);
                setLeadDone(false);
              }}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← New Audit
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Hero savings */}
          <div
            className={`rounded-2xl p-8 text-center ${
              result.isAlreadyOptimal
                ? "bg-emerald-50 border border-emerald-200"
                : "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white"
            }`}
          >
            {result.isAlreadyOptimal ? (
              <>
                <div className="text-5xl mb-2">✓</div>
                <h1 className="text-2xl font-bold text-emerald-800 mb-1">
                  You&apos;re spending well
                </h1>
                <p className="text-emerald-700">
                  Your AI stack looks well-optimized — no major plan changes
                  recommended right now.
                </p>
                <p className="text-emerald-600 text-sm mt-3">
                  Current spend: {fmt(result.totalCurrentMonthlySpend)}/mo ·
                  Leave your email below and we&apos;ll notify you when new
                  optimizations apply to your stack.
                </p>
              </>
            ) : (
              <>
                <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-2">
                  Savings identified
                </p>
                <div className="text-6xl font-bold mb-1">
                  {fmt(result.totalMonthlySavings)}
                  <span className="text-3xl font-medium text-indigo-200">
                    /mo
                  </span>
                </div>
                <div className="text-indigo-200 text-lg">
                  {fmt(result.totalAnnualSavings)}/year ·{" "}
                  {result.savingsPercentage}% reduction
                </div>
                <div className="mt-4 text-indigo-100 text-sm">
                  Current: {fmt(result.totalCurrentMonthlySpend)}/mo →
                  Optimized:{" "}
                  {fmt(result.totalRecommendedMonthlySpend)}/mo
                </div>
              </>
            )}
          </div>

          {/* High-value Credex CTA */}
          {result.isHighValue && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🎯</div>
                <div>
                  <h3 className="font-bold text-amber-900 text-lg mb-1">
                    You qualify for discounted AI credits via Credex
                  </h3>
                  <p className="text-amber-800 text-sm leading-relaxed">
                    Beyond plan optimizations, Credex sources unused AI credits
                    from companies that over-forecast — typically 20–40% below
                    retail. At your spend level (
                    {fmt(result.totalCurrentMonthlySpend)}/mo), this
                    could mean an additional{" "}
                    <strong>
                      {fmt(result.totalCurrentMonthlySpend * 0.3)}/mo
                    </strong>{" "}
                    in savings on top of the plan changes above.
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
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <h2 className="font-semibold text-slate-800">AI Analysis</h2>
              {summaryLoading && (
                <span className="text-xs text-slate-400 ml-1">
                  Generating…
                </span>
              )}
            </div>
            {summaryLoading && !aiSummary ? (
              <div className="space-y-2">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-full" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-4/5" />
              </div>
            ) : (
              <p className="text-slate-600 leading-relaxed text-sm">
                {aiSummary ??
                  "Your AI spend audit is complete. See the recommendations below for specific actions."}
              </p>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-800 mb-3">
                Recommendations
              </h2>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Lead capture */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            {leadDone ? (
              <div className="text-center py-4">
                <div className="text-3xl mb-2">✉️</div>
                <h3 className="font-bold text-slate-800 mb-1">
                  Report sent!
                </h3>
                <p className="text-slate-500 text-sm">
                  Check your inbox for your full audit report.{" "}
                  {result.isHighValue &&
                    "Our team will reach out shortly about Credex credits."}
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-slate-800 mb-1">
                  {result.isAlreadyOptimal
                    ? "Get notified when new optimizations apply"
                    : "Get your full report by email"}
                </h2>
                <p className="text-slate-500 text-sm mb-4">
                  {result.isAlreadyOptimal
                    ? "We'll alert you when pricing changes or new tools create savings opportunities for your stack."
                    : "Receive a permanent copy of this audit with all recommendations and savings breakdown."}
                </p>
                <form onSubmit={submitLead} className="space-y-3">
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="website"
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Company name (optional)"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Your role (optional)"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={leadLoading}
                    className="w-full bg-indigo-600 text-white rounded-lg py-2.5 font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                  >
                    {leadLoading ? "Sending…" : "Send Report →"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Share */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-800 mb-1">
              Share this audit
            </h2>
            <p className="text-slate-500 text-sm mb-3">
              Unique public link — company name and email are never included.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500 bg-slate-50 font-mono"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors min-w-[80px]"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  const allTools = getAllTools();
  const addedToolIds = new Set(formData.tools.map((t) => t.toolId));
  const availableTools = allTools.filter((t) => !addedToolIds.has(t.id));
  const totalMonthly = formData.tools.reduce(
    (sum, t) => sum + (t.monthlySpend || 0),
    0
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-bold text-indigo-600 text-xl tracking-tight">
            SpendLens
          </span>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            by Credex
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wide">
          Free · No signup required · 2 minutes
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
          Find out if you&apos;re overpaying
          <br className="hidden sm:block" /> for AI tools
        </h1>
        <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
          Most startup teams spend 20–40% more than they need to on Cursor,
          Claude, ChatGPT, and Copilot. This audit finds exactly where.
        </p>
      </section>

      {/* Form */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <form onSubmit={runAudit} className="space-y-6">
          {/* Team info */}
          <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-slate-800">Your team</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Team size
                </label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  required
                  value={formData.teamSize}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      teamSize: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Primary use case
                </label>
                <select
                  value={formData.useCase}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      useCase: e.target.value as UseCase,
                    }))
                  }
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {USE_CASES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tools section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">
                AI tools you pay for
              </h2>
              {totalMonthly > 0 && (
                <span className="text-sm text-slate-500">
                  Total: <strong className="text-slate-800">{fmt(totalMonthly)}/mo</strong>
                </span>
              )}
            </div>

            {/* Tool cards */}
            {formData.tools.length === 0 && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <p className="text-slate-400 text-sm">
                  No tools added yet — click &quot;Add tool&quot; to start
                </p>
              </div>
            )}

            {formData.tools.map((entry) => {
              const tool = TOOLS[entry.toolId];
              return (
                <ToolCard
                  key={entry.toolId}
                  entry={entry}
                  tool={tool}
                  onRemove={() => removeTool(entry.toolId)}
                  onUpdate={(patch) => updateTool(entry.toolId, patch)}
                />
              );
            })}

            {/* Add tool button */}
            <div className="relative" ref={pickerRef}>
              <button
                type="button"
                onClick={() => setShowToolPicker((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors w-full justify-center"
              >
                <span className="text-lg leading-none">+</span>
                Add tool
              </button>

              {showToolPicker && availableTools.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {availableTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => addTool(tool.id)}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-50 transition-colors text-left text-sm"
                    >
                      <span
                        className={`${tool.color} text-white text-xs font-bold w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}
                      >
                        {tool.logoInitials}
                      </span>
                      <span className="font-medium text-slate-800">
                        {tool.name}
                      </span>
                    </button>
                  ))}
                  {availableTools.length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400">
                      All tools added
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={formData.tools.length === 0}
            className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold text-base hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            Run Free Audit →
          </button>

          <p className="text-center text-xs text-slate-400">
            No account required. Your data stays in your browser until you
            choose to share it.
          </p>
        </form>
      </section>
    </div>
  );
}

// ─── ToolCard ─────────────────────────────────────────────────────────────────

function ToolCard({
  entry,
  tool,
  onRemove,
  onUpdate,
}: {
  entry: ToolEntry;
  tool: (typeof TOOLS)[ToolId];
  onRemove: () => void;
  onUpdate: (patch: Partial<ToolEntry>) => void;
}) {
  const selectedPlan =
    tool.plans.find((p) => p.id === entry.planId) ?? tool.plans[0];

  function handlePlanChange(planId: string) {
    const plan = tool.plans.find((p) => p.id === planId);
    if (!plan) return;
    const newSpend =
      plan.pricePerUserPerMonth > 0
        ? Math.round(plan.pricePerUserPerMonth * entry.seats)
        : 0;
    onUpdate({ planId, monthlySpend: newSpend });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`${tool.color} text-white text-xs font-bold w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}
        >
          {tool.logoInitials}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-slate-800 text-sm">
              {tool.name}
            </span>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${tool.name}`}
              className="text-slate-300 hover:text-red-400 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Plan</label>
              <select
                value={entry.planId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {tool.plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.pricePerUserPerMonth > 0
                      ? ` ($${p.pricePerUserPerMonth}/user)`
                      : p.pricePerUserPerMonth === -1
                      ? " (usage)"
                      : p.pricePerUserPerMonth === -2
                      ? " (custom)"
                      : " (free)"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Seats
              </label>
              <input
                type="number"
                min={1}
                max={10000}
                value={entry.seats}
                onChange={(e) => {
                  const seats = Math.max(1, parseInt(e.target.value) || 1);
                  const newSpend =
                    selectedPlan.pricePerUserPerMonth > 0
                      ? Math.round(selectedPlan.pricePerUserPerMonth * seats)
                      : entry.monthlySpend;
                  onUpdate({ seats, monthlySpend: newSpend });
                }}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                $/month
              </label>
              <input
                type="number"
                min={0}
                max={1000000}
                step={1}
                value={entry.monthlySpend}
                onChange={(e) =>
                  onUpdate({
                    monthlySpend: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RecommendationCard ───────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
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
  const actionStyles = {
    downgrade_plan: "↓ Downgrade",
    switch_tool: "↔ Switch",
    use_credits: "💰 Credits",
    reduce_seats: "↓ Reduce seats",
    upgrade_plan: "↑ Upgrade",
    already_optimal: "✓ Optimal",
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
            <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              {actionStyles[rec.action] ?? rec.actionLabel}
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
