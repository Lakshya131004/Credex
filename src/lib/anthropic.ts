import Anthropic from "@anthropic-ai/sdk";
import type { AuditResult } from "@/types";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generates a ~100-word personalized audit summary.
 * Full prompt documented in PROMPTS.md.
 */
export async function generateAuditSummary(
  auditResult: AuditResult
): Promise<{ summary: string; isAiGenerated: boolean }> {
  const { formData, recommendations, totalMonthlySavings, totalAnnualSavings, savingsPercentage } =
    auditResult;

  const topRecommendations = recommendations
    .filter((r) => r.action !== "use_credits")
    .slice(0, 3)
    .map(
      (r) =>
        `• ${r.toolName} (${r.currentPlanName}): ${r.actionLabel} — saves $${Math.round(r.monthlySavings)}/mo`
    )
    .join("\n");

  const prompt = `You are a concise, direct financial advisor specializing in AI tool spend optimization.
Write a personalized ~100-word summary for a startup team's AI spend audit.
Be specific, use their actual numbers, and end with a clear action item.
Tone: professional, direct, slightly urgent — like a CFO giving a 30-second briefing.
Do NOT use bullet points. Write in flowing prose. Do NOT mention Credex unless instructed.

Audit data:
- Team size: ${formData.teamSize} people
- Primary use case: ${formData.useCase}
- Current monthly AI spend: $${Math.round(auditResult.totalCurrentMonthlySpend)}
- Total tools: ${formData.tools.length}
- Monthly savings identified: $${Math.round(totalMonthlySavings)} (${savingsPercentage}% reduction)
- Annual savings potential: $${Math.round(totalAnnualSavings)}

Top recommendations:
${topRecommendations || "No major optimizations — your stack appears well-optimized."}

Write the summary now:`;

  try {
    const message = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      return { summary: content.text.trim(), isAiGenerated: true };
    }
    return { summary: getFallbackSummary(auditResult), isAiGenerated: false };
  } catch (error) {
    console.error("[anthropic] Summary generation failed:", error);
    return { summary: getFallbackSummary(auditResult), isAiGenerated: false };
  }
}

/**
 * Template fallback when Anthropic API is unavailable.
 * Always returns a coherent, useful summary.
 */
function getFallbackSummary(auditResult: AuditResult): string {
  const {
    formData,
    totalCurrentMonthlySpend,
    totalMonthlySavings,
    totalAnnualSavings,
    recommendations,
    isAlreadyOptimal,
  } = auditResult;

  if (isAlreadyOptimal || totalMonthlySavings < 10) {
    return `Your ${formData.teamSize}-person team is spending $${Math.round(totalCurrentMonthlySpend)}/mo across ${formData.tools.length} AI tool(s) for ${formData.useCase} work — and you're doing it efficiently. Your current plan selections are well-matched to your team size and use case. No immediate action required, but revisit this audit quarterly as your team grows or new plans launch.`;
  }

  const topRec = recommendations.find((r) => r.action !== "use_credits");
  const topRecText = topRec
    ? `The highest-impact change is to ${topRec.actionLabel.toLowerCase()} on ${topRec.toolName}, which would save $${Math.round(topRec.monthlySavings)}/mo alone.`
    : "";

  return `Your ${formData.teamSize}-person team is spending $${Math.round(totalCurrentMonthlySpend)}/mo on AI tools, but this audit identified $${Math.round(totalMonthlySavings)}/mo in savings — that's $${Math.round(totalAnnualSavings)} back annually. ${topRecText} These are straightforward plan adjustments, not capability trade-offs: you would keep the same tools, just on better-matched plans for your ${formData.useCase} workflow. Implement the top recommendation this week.`;
}
