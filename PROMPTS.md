# Prompts

## AI Summary Generation

**Where used:** `src/lib/anthropic.ts` — `generateAuditSummary()`  
**Model:** `claude-3-5-haiku-20241022` (fast, cheap, sufficient for ~100-word summaries)

### Final Prompt

```
You are a concise, direct financial advisor specializing in AI tool spend optimization.
Write a personalized ~100-word summary for a startup team's AI spend audit.
Be specific, use their actual numbers, and end with a clear action item.
Tone: professional, direct, slightly urgent — like a CFO giving a 30-second briefing.
Do NOT use bullet points. Write in flowing prose. Do NOT mention Credex unless instructed.

Audit data:
- Team size: {teamSize} people
- Primary use case: {useCase}
- Current monthly AI spend: ${currentMonthlySpend}
- Total tools: {toolCount}
- Monthly savings identified: ${monthlySavings} ({savingsPercentage}% reduction)
- Annual savings potential: ${annualSavings}

Top recommendations:
{topRecommendations}

Write the summary now:
```

### Design decisions

**Why Haiku and not Sonnet/Opus?**  
This is a ~100-word summary of structured data we already have. The task doesn't require deep reasoning — it's formatting and tone. Haiku is 10× cheaper than Sonnet and completes in <1 second. Sonnet would add latency and cost with no quality benefit here.

**Why `max_tokens: 200`?**  
The prompt says ~100 words. 200 tokens gives headroom for the model to breathe (tokens ≠ words) while hard-capping any runaway generation. In testing, the output consistently landed at 90–120 words.

**Why prose, no bullets?**  
The result page already shows structured recommendation cards. The AI summary is meant to be the "CFO briefing" — a synthesizing paragraph, not a list. Bullets would duplicate what the cards show.

**Why not include Credex in the prompt?**  
The tool must feel genuinely useful and independent, not like a sales pitch. Trust is built by giving real value first. The Credex CTA is surfaced separately in the UI, clearly labeled, only for high-value audits. Putting Credex in the AI summary would undermine credibility.

### What I tried that didn't work

**Attempt 1 — GPT-4o-mini with structured JSON output:**  
Asked for JSON `{ summary: string, keyInsight: string }`. The model frequently hallucinated tool names and made up savings numbers it wasn't given. Switched to Claude because it followed the "use their actual numbers" instruction more reliably.

**Attempt 2 — Longer prompt with chain-of-thought:**  
Added "First, identify the team's biggest waste. Then write the summary." This made the output longer and more verbose — the opposite of what we needed. Removed the chain-of-thought instruction.

**Attempt 3 — Per-tool bullet list in prompt:**  
Passed all recommendations as a full list. This caused the model to enumerate each one rather than synthesize. Capped at top 3 recommendations in the final version.

### Fallback behavior

If the Anthropic API is unavailable (429, 5xx, network error), `getFallbackSummary()` generates a templated paragraph using the same audit data. The UI does not show an error — users see a coherent summary either way. The `isAiGenerated: false` flag is returned in the API response for observability.
