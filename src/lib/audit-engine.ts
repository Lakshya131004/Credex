/**
 * Audit Engine — Rule-based, no AI.
 *
 * Design principle: every recommendation must be defensible to a finance-literate
 * person. Numbers come from PRICING_DATA.md. Reasoning is one sentence per rule.
 * We never manufacture savings — if a user's stack is already optimal, we say so.
 */

import type {
  AuditFormData,
  AuditResult,
  Recommendation,
  UseCase,
} from "@/types";
import { TOOLS, getPlan, CREDEX_DISCOUNT_RATE } from "./pricing-data";

// ─── Rule Helpers ─────────────────────────────────────────────────────────────

function monthlyToAnnual(monthly: number) {
  return monthly * 12;
}

// ─── Individual Rule Functions ────────────────────────────────────────────────

/**
 * Rule 1 — Duplicate Coding Tools
 * If a team pays for BOTH Cursor Pro/Business AND GitHub Copilot for the same
 * coding use case, one is redundant. Cursor provides a superset of Copilot's
 * functionality (completions + chat + agent) at a comparable per-seat cost.
 */
function checkDuplicateCodingTools(
  formData: AuditFormData,
  recommendations: Recommendation[]
) {
  const cursorEntry = formData.tools.find((t) => t.toolId === "cursor");
  const copilotEntry = formData.tools.find((t) => t.toolId === "github_copilot");

  if (!cursorEntry || !copilotEntry) return;

  const cursorPlan = getPlan("cursor", cursorEntry.planId);
  const copilotPlan = getPlan("github_copilot", copilotEntry.planId);
  if (!cursorPlan || !copilotPlan) return;

  // Only flag if cursor is on a paid plan (Pro or Business)
  if (
    cursorPlan.pricePerUserPerMonth <= 0 ||
    copilotPlan.pricePerUserPerMonth <= 0
  )
    return;

  // Cursor Pro ($20/user) already includes unlimited completions + chat.
  // GitHub Copilot Business ($19/user) adds no unique value on top of Cursor.
  const monthlySavings = copilotEntry.monthlySpend;

  if (monthlySavings <= 0) return;

  recommendations.push({
    toolId: "github_copilot",
    toolName: "GitHub Copilot",
    currentPlanName: copilotPlan.name,
    currentMonthlySpend: copilotEntry.monthlySpend,
    action: "switch_tool",
    actionLabel: "Cancel GitHub Copilot",
    recommendedToolId: "cursor",
    recommendedPlanName: cursorPlan.name,
    recommendedMonthlySpend: 0,
    monthlySavings,
    annualSavings: monthlyToAnnual(monthlySavings),
    reason: `Cursor Pro already includes unlimited AI completions and chat; paying separately for GitHub Copilot (${copilotPlan.name}) duplicates functionality at $${copilotEntry.monthlySpend}/mo with no added capability.`,
    priority: "high",
  });
}

/**
 * Rule 2 — Claude Team for Small Teams
 * Claude Team has a 5-seat minimum at $30/seat. For teams of 1–4 using <5 seats,
 * individual Claude Pro ($20/seat) is cheaper with equivalent per-user capability.
 */
function checkClaudeTeamSeatMismatch(
  formData: AuditFormData,
  recommendations: Recommendation[]
) {
  const entry = formData.tools.find(
    (t) => t.toolId === "claude" && t.planId === "claude_team"
  );
  if (!entry) return;

  const teamPlan = getPlan("claude", "claude_team");
  const proPlan = getPlan("claude", "claude_pro");
  if (!teamPlan || !proPlan) return;

  // Team plan requires min 5 seats @ $30/seat = $150/mo minimum
  // If user has <5 seats, they are either paying wrong or overpaying
  const effectiveSeatCount = Math.max(entry.seats, 1);
  if (effectiveSeatCount >= 5) return; // correctly using team plan

  const recommendedMonthlyCost = proPlan.pricePerUserPerMonth * effectiveSeatCount;
  const monthlySavings = entry.monthlySpend - recommendedMonthlyCost;

  if (monthlySavings <= 0) return;

  recommendations.push({
    toolId: "claude",
    toolName: "Claude",
    currentPlanName: teamPlan.name,
    currentMonthlySpend: entry.monthlySpend,
    action: "downgrade_plan",
    actionLabel: "Switch to Claude Pro (per seat)",
    recommendedPlanId: "claude_pro",
    recommendedPlanName: "Claude Pro",
    recommendedMonthlySpend: recommendedMonthlyCost,
    monthlySavings,
    annualSavings: monthlyToAnnual(monthlySavings),
    reason: `Claude Team has a 5-seat minimum ($150/mo floor), but your team uses only ${effectiveSeatCount} seat(s); ${effectiveSeatCount} × Claude Pro ($20/seat) costs $${recommendedMonthlyCost}/mo — same per-user capabilities for $${monthlySavings}/mo less.`,
    priority: "high",
  });
}

/**
 * Rule 3 — ChatGPT Team vs Plus for Small Headcount
 * ChatGPT Team is $30/user/mo (min 2 seats). For 1–2 person teams with
 * primarily writing/research use, Plus ($20/user) provides sufficient
 * message caps and eliminates the team overhead cost.
 */
function checkChatGPTTeamVsPlus(
  formData: AuditFormData,
  recommendations: Recommendation[]
) {
  const entry = formData.tools.find(
    (t) => t.toolId === "chatgpt" && t.planId === "chatgpt_team"
  );
  if (!entry) return;

  // Team makes sense at 3+ seats; at 1–2 seats the admin overhead adds $10/user with minimal benefit
  if (entry.seats > 3) return;

  // Data-exclusion from training is the main Team differentiator.
  // For non-Enterprise use cases, Plus is sufficient.
  const useCasesWhereTeamIsJustified: UseCase[] = ["data"]; // privacy-sensitive
  if (useCasesWhereTeamIsJustified.includes(formData.useCase)) return;

  const plusPlan = getPlan("chatgpt", "chatgpt_plus");
  const teamPlan = getPlan("chatgpt", "chatgpt_team");
  if (!plusPlan || !teamPlan) return;

  const recommendedMonthlyCost = plusPlan.pricePerUserPerMonth * entry.seats;
  const monthlySavings = entry.monthlySpend - recommendedMonthlyCost;

  if (monthlySavings <= 0) return;

  recommendations.push({
    toolId: "chatgpt",
    toolName: "ChatGPT",
    currentPlanName: teamPlan.name,
    currentMonthlySpend: entry.monthlySpend,
    action: "downgrade_plan",
    actionLabel: "Switch to ChatGPT Plus",
    recommendedPlanId: "chatgpt_plus",
    recommendedPlanName: "ChatGPT Plus",
    recommendedMonthlySpend: recommendedMonthlyCost,
    monthlySavings,
    annualSavings: monthlyToAnnual(monthlySavings),
    reason: `ChatGPT Team costs $10/user more than Plus; for a ${entry.seats}-person team with ${formData.useCase} use case, Plus provides equivalent GPT-4o access — the Team plan's extra admin controls and data exclusion are not needed at this team size.`,
    priority: entry.seats === 1 ? "high" : "medium",
  });
}

/**
 * Rule 4 — Claude Max Overkill for Non-Power Users
 * Claude Max ($100–$200/user/mo) is 5–20× the usage quota of Pro.
 * Users primarily doing writing/research at team sizes <5 are unlikely to
 * exceed Pro's quota; the 5× uplift is only justified for heavy coding/research.
 */
function checkClaudeMaxOverkill(
  formData: AuditFormData,
  recommendations: Recommendation[]
) {
  const entry = formData.tools.find(
    (t) =>
      t.toolId === "claude" &&
      (t.planId === "claude_max_5x" || t.planId === "claude_max_20x")
  );
  if (!entry) return;

  // Max is justified for heavy coding or data/research power users
  const useCasesWhereMaxJustified: UseCase[] = ["coding", "data"];
  if (useCasesWhereMaxJustified.includes(formData.useCase)) return;

  const maxPlan = getPlan("claude", entry.planId);
  const proPlan = getPlan("claude", "claude_pro");
  if (!maxPlan || !proPlan) return;

  const recommendedMonthlyCost = proPlan.pricePerUserPerMonth * entry.seats;
  const monthlySavings = entry.monthlySpend - recommendedMonthlyCost;

  if (monthlySavings <= 0) return;

  recommendations.push({
    toolId: "claude",
    toolName: "Claude",
    currentPlanName: maxPlan.name,
    currentMonthlySpend: entry.monthlySpend,
    action: "downgrade_plan",
    actionLabel: "Downgrade to Claude Pro",
    recommendedPlanId: "claude_pro",
    recommendedPlanName: "Claude Pro",
    recommendedMonthlySpend: recommendedMonthlyCost,
    monthlySavings,
    annualSavings: monthlyToAnnual(monthlySavings),
    reason: `Claude Max provides ${entry.planId === "claude_max_20x" ? "20×" : "5×"} Pro's usage quota, which is primarily valuable for heavy coding or automated pipelines — for ${formData.useCase} use, Claude Pro's quota is sufficient and costs $${monthlySavings}/mo less per ${entry.seats} seat(s).`,
    priority: "high",
  });
}

/**
 * Rule 5 — GitHub Copilot Enterprise for Small Teams
 * Copilot Enterprise ($39/user) adds fine-tuned models and PR summaries on
 * GitHub.com — features that require 10+ developers to amortize meaningfully.
 * Teams under 10 should use Business ($19/user) instead.
 */
function checkCopilotEnterpriseTooSmall(
  formData: AuditFormData,
  recommendations: Recommendation[]
) {
  const entry = formData.tools.find(
    (t) =>
      t.toolId === "github_copilot" && t.planId === "copilot_enterprise"
  );
  if (!entry) return;

  if (formData.teamSize >= 10) return; // Enterprise is reasonable at scale

  const enterprisePlan = getPlan("github_copilot", "copilot_enterprise");
  const businessPlan = getPlan("github_copilot", "copilot_business");
  if (!enterprisePlan || !businessPlan) return;

  const recommendedMonthlyCost = businessPlan.pricePerUserPerMonth * entry.seats;
  const monthlySavings = entry.monthlySpend - recommendedMonthlyCost;

  if (monthlySavings <= 0) return;

  recommendations.push({
    toolId: "github_copilot",
    toolName: "GitHub Copilot",
    currentPlanName: enterprisePlan.name,
    currentMonthlySpend: entry.monthlySpend,
    action: "downgrade_plan",
    actionLabel: "Switch to Copilot Business",
    recommendedPlanId: "copilot_business",
    recommendedPlanName: "GitHub Copilot Business",
    recommendedMonthlySpend: recommendedMonthlyCost,
    monthlySavings,
    annualSavings: monthlyToAnnual(monthlySavings),
    reason: `Copilot Enterprise ($39/user) adds codebase-indexed chat and fine-tuned models that require large repositories to be useful; for a ${formData.teamSize}-person team, Copilot Business ($19/user) delivers the same IDE completions and policy controls at $${monthlySavings}/mo less.`,
    priority: "medium",
  });
}

/**
 * Rule 6 — Overpaying on Anthropic/OpenAI API vs a Fixed Plan
 * If a user spends more than Claude Pro's flat $20/user on API calls for
 * chat/writing/research (not automation), a flat plan is cheaper and simpler.
 * API direct makes sense for automation, not interactive use.
 */
function checkApiVsPlan(
  formData: AuditFormData,
  recommendations: Recommendation[]
) {
  const anthropicEntry = formData.tools.find(
    (t) => t.toolId === "anthropic_api"
  );
  const openaiEntry = formData.tools.find((t) => t.toolId === "openai_api");

  // Anthropic API check
  if (anthropicEntry && anthropicEntry.monthlySpend > 0) {
    const proPlan = getPlan("claude", "claude_pro");
    // API makes sense for automation/coding pipelines
    const apiJustifiedUseCases: UseCase[] = ["coding", "data"];
    if (!apiJustifiedUseCases.includes(formData.useCase) && proPlan) {
      // Estimate equivalent Pro seats: $20/seat
      const suggestedSeats = Math.max(
        1,
        Math.round(anthropicEntry.monthlySpend / 20)
      );
      const recommendedMonthlyCost =
        proPlan.pricePerUserPerMonth * suggestedSeats;
      const monthlySavings = anthropicEntry.monthlySpend - recommendedMonthlyCost;

      if (monthlySavings > 5) {
        recommendations.push({
          toolId: "anthropic_api",
          toolName: "Anthropic API",
          currentPlanName: "API Direct",
          currentMonthlySpend: anthropicEntry.monthlySpend,
          action: "switch_tool",
          actionLabel: "Switch to Claude Pro",
          recommendedToolId: "claude",
          recommendedPlanId: "claude_pro",
          recommendedPlanName: "Claude Pro",
          recommendedMonthlySpend: recommendedMonthlyCost,
          monthlySavings,
          annualSavings: monthlyToAnnual(monthlySavings),
          reason: `You are spending $${anthropicEntry.monthlySpend}/mo on Anthropic API for ${formData.useCase} use — API pricing is per-token and efficient for automated pipelines, but ${suggestedSeats} × Claude Pro ($${recommendedMonthlyCost}/mo flat) likely covers your interactive usage at lower cost with no token-counting overhead.`,
          priority: monthlySavings > 50 ? "high" : "medium",
        });
      }
    }
  }

  // OpenAI API check
  if (openaiEntry && openaiEntry.monthlySpend > 0) {
    const plusPlan = getPlan("chatgpt", "chatgpt_plus");
    const apiJustifiedUseCases: UseCase[] = ["coding", "data"];
    if (!apiJustifiedUseCases.includes(formData.useCase) && plusPlan) {
      const suggestedSeats = Math.max(
        1,
        Math.round(openaiEntry.monthlySpend / 20)
      );
      const recommendedMonthlyCost =
        plusPlan.pricePerUserPerMonth * suggestedSeats;
      const monthlySavings = openaiEntry.monthlySpend - recommendedMonthlyCost;

      if (monthlySavings > 5) {
        recommendations.push({
          toolId: "openai_api",
          toolName: "OpenAI API",
          currentPlanName: "API Direct",
          currentMonthlySpend: openaiEntry.monthlySpend,
          action: "switch_tool",
          actionLabel: "Switch to ChatGPT Plus",
          recommendedToolId: "chatgpt",
          recommendedPlanId: "chatgpt_plus",
          recommendedPlanName: "ChatGPT Plus",
          recommendedMonthlySpend: recommendedMonthlyCost,
          monthlySavings,
          annualSavings: monthlyToAnnual(monthlySavings),
          reason: `You are spending $${openaiEntry.monthlySpend}/mo on OpenAI API for ${formData.useCase} use; ${suggestedSeats} × ChatGPT Plus ($${recommendedMonthlyCost}/mo flat) likely covers interactive usage at lower predictable cost.`,
          priority: monthlySavings > 50 ? "high" : "medium",
        });
      }
    }
  }
}

/**
 * Rule 7 — Cursor Business Overkill for Non-Enterprise Needs
 * Cursor Business ($40/user) adds SSO, admin dashboard, and zero-retention policy.
 * Teams <10 without compliance requirements get no value from Business over Pro.
 */
function checkCursorBusinessOverkill(
  formData: AuditFormData,
  recommendations: Recommendation[]
) {
  const entry = formData.tools.find(
    (t) => t.toolId === "cursor" && t.planId === "cursor_business"
  );
  if (!entry) return;

  if (formData.teamSize >= 10) return; // Business is reasonable at scale

  const businessPlan = getPlan("cursor", "cursor_business");
  const proPlan = getPlan("cursor", "cursor_pro");
  if (!businessPlan || !proPlan) return;

  const recommendedMonthlyCost = proPlan.pricePerUserPerMonth * entry.seats;
  const monthlySavings = entry.monthlySpend - recommendedMonthlyCost;

  if (monthlySavings <= 0) return;

  recommendations.push({
    toolId: "cursor",
    toolName: "Cursor",
    currentPlanName: businessPlan.name,
    currentMonthlySpend: entry.monthlySpend,
    action: "downgrade_plan",
    actionLabel: "Switch to Cursor Pro",
    recommendedPlanId: "cursor_pro",
    recommendedPlanName: "Cursor Pro",
    recommendedMonthlySpend: recommendedMonthlyCost,
    monthlySavings,
    annualSavings: monthlyToAnnual(monthlySavings),
    reason: `Cursor Business ($40/user) adds SSO and zero-retention policy, which are compliance features valuable at 10+ person teams; for your ${formData.teamSize}-person team, Cursor Pro ($20/user) provides identical AI capability at $${monthlySavings}/mo less.`,
    priority: "medium",
  });
}

/**
 * Rule 8 — Credex Credits Opportunity
 * For any tool where the user is paying retail and total potential savings via
 * credits is >$100/mo, surface the Credex credits opportunity.
 */
function checkCredexCreditOpportunity(
  formData: AuditFormData,
  recommendations: Recommendation[],
  totalCurrentSpend: number,
  alreadyRecommendedSavings: number
) {
  const spendAfterOptimizations = totalCurrentSpend - alreadyRecommendedSavings;
  const potentialCreditSavings =
    spendAfterOptimizations * CREDEX_DISCOUNT_RATE;

  // Only surface if the remaining retail spend is >$100 and savings are meaningful
  if (spendAfterOptimizations < 100 || potentialCreditSavings < 30) return;

  // Don't double-count — this is an additive opportunity ON TOP of plan optimizations
  const toolIds = formData.tools
    .map((t) => TOOLS[t.toolId]?.name)
    .filter(Boolean)
    .join(", ");

  recommendations.push({
    toolId: "cursor", // placeholder — this is a cross-tool recommendation
    toolName: "All AI Tools",
    currentPlanName: "Retail pricing",
    currentMonthlySpend: spendAfterOptimizations,
    action: "use_credits",
    actionLabel: "Buy via Credex credits",
    recommendedMonthlySpend: spendAfterOptimizations * (1 - CREDEX_DISCOUNT_RATE),
    monthlySavings: potentialCreditSavings,
    annualSavings: monthlyToAnnual(potentialCreditSavings),
    reason: `After plan optimizations, you are still paying ~$${Math.round(spendAfterOptimizations)}/mo retail for ${toolIds}; Credex sources unused AI credits at 20–40% below retail from companies that overforecast — estimated additional savings: ~$${Math.round(potentialCreditSavings)}/mo.`,
    priority: potentialCreditSavings > 100 ? "high" : "medium",
  });
}

// ─── Main Engine ──────────────────────────────────────────────────────────────

export function runAuditEngine(formData: AuditFormData): AuditResult {
  const recommendations: Recommendation[] = [];

  // Calculate total current spend
  const totalCurrentMonthlySpend = formData.tools.reduce(
    (sum, t) => sum + (t.monthlySpend || 0),
    0
  );

  // Run each rule
  checkDuplicateCodingTools(formData, recommendations);
  checkClaudeTeamSeatMismatch(formData, recommendations);
  checkChatGPTTeamVsPlus(formData, recommendations);
  checkClaudeMaxOverkill(formData, recommendations);
  checkCopilotEnterpriseTooSmall(formData, recommendations);
  checkApiVsPlan(formData, recommendations);
  checkCursorBusinessOverkill(formData, recommendations);

  // Calculate savings from rule-based recommendations
  const ruleBasedSavings = recommendations.reduce(
    (sum, r) => sum + r.monthlySavings,
    0
  );

  // Add Credex credits opportunity last (additive on top of rule savings)
  checkCredexCreditOpportunity(
    formData,
    recommendations,
    totalCurrentMonthlySpend,
    ruleBasedSavings
  );

  // Sort by priority (high → medium → low) then by savings descending
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.monthlySavings - a.monthlySavings;
  });

  const totalMonthlySavings = recommendations.reduce(
    (sum, r) => sum + r.monthlySavings,
    0
  );
  const totalAnnualSavings = monthlyToAnnual(totalMonthlySavings);
  const totalRecommendedMonthlySpend = Math.max(
    0,
    totalCurrentMonthlySpend - ruleBasedSavings // credits savings are on top
  );
  const savingsPercentage =
    totalCurrentMonthlySpend > 0
      ? Math.round((totalMonthlySavings / totalCurrentMonthlySpend) * 100)
      : 0;

  return {
    formData,
    recommendations,
    totalCurrentMonthlySpend,
    totalRecommendedMonthlySpend,
    totalMonthlySavings,
    totalAnnualSavings,
    savingsPercentage,
    isHighValue: totalMonthlySavings > 500,
    isAlreadyOptimal: totalMonthlySavings < 100,
  };
}
