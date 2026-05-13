# Reflection

---

## 1. The hardest bug you hit this week, and how you debugged it

The hardest bug was in the Credex credits recommendation logic. My first implementation computed `potentialCreditSavings` as `totalCurrentMonthlySpend * CREDEX_DISCOUNT_RATE` — but this was wrong. The function was supposed to represent *additional* savings on top of the plan optimizations, not savings on top of total current spend. The result was that for a team spending $1,000/mo with $400 in plan-optimization savings, we were showing $300 in credit savings ($1,000 × 30%) when the correct number was $180 ($600 remaining retail spend × 30%).

I caught it because one of my tests was checking that the total savings percentage never exceeded 100% — and it failed. My first hypothesis was a sign error somewhere in the arithmetic. I added `console.log` statements at each step of the savings calculation and traced the numbers by hand against a known fixture. The logs showed `alreadyRecommendedSavings` was being passed correctly, but `spendAfterOptimizations = totalCurrentSpend - alreadyRecommendedSavings` was computing the right number — the *credits percentage* was still being applied to `totalCurrentSpend` rather than `spendAfterOptimizations`.

One-line fix: change `totalCurrentMonthlySpend * CREDEX_DISCOUNT_RATE` to `spendAfterOptimizations * CREDEX_DISCOUNT_RATE`. After the fix, re-ran all tests — 12/12 green. The lesson: even simple math bugs in financial calculations hide behind plausible-looking numbers. Writing the test that assumed "you can't save more than you spend" was what made the bug catchable.

---

## 2. A decision you reversed mid-week, and what made you reverse it

I initially designed the form as a multi-step wizard: Step 1 (team info) → Step 2 (add tools) → Step 3 (confirm & submit). My reasoning was that step-by-step flows reduce cognitive load and feel more app-like.

I reversed this on Day 4 after trying to fill it out myself with my own (hypothetical) tool stack. The problem was that on Step 3, I wanted to go back and adjust a seat count I'd set in Step 2 — and the wizard made that awkward. More importantly, I realized that the whole *point* of the form is to show all your tools at once so you can notice patterns: "wait, I have both Cursor and Copilot — that's the exact thing the audit might flag." A wizard hides that.

I switched to a single scrolling page where all tool cards are visible simultaneously. This is less "polished" in the wizard sense but more useful — users can see their full stack, spot duplication themselves before even running the audit, and edit any field at any time. The best UX is the one that serves the task, not the one that looks most like a mobile onboarding flow.

---

## 3. What you would build in week 2 if you had it

**Priority 1 — Benchmark mode.** The most consistent thing across all three user interviews: "Is this normal? What do companies our size spend?" Users want to know not just if they're overpaying relative to themselves, but relative to peers. I'd add a benchmark layer that shows "your AI spend per developer is $X — teams your size (10–25 people) average $Y." Even rough estimates grounded in real survey data would be enormously valuable.

**Priority 2 — Slack/email-based re-audit nudge.** Pricing changes constantly (Claude Max didn't exist 6 months ago). A user who is optimal today might be overpaying in 3 months. I'd build a lightweight "notify me when this changes" feature — monthly digest of pricing changes that affect their saved stack. This creates a reason to come back without requiring logins or accounts.

**Priority 3 — PDF export.** Multiple interviewees said they'd want to share the report with their CFO or an operations person. A formatted PDF export (using something like `@react-pdf/renderer` or a headless Puppeteer screenshot) would make the tool useful for internal budget conversations, not just individual discovery.

---

## 4. How you used AI tools

I used Claude (Sonnet) and Cursor throughout the week. Here's the breakdown:

**What I used AI for:**
- First drafts of boilerplate (Zod schemas, Supabase client setup, Resend email HTML)
- Debugging the TypeScript path alias issue in `jest.config.ts`
- Drafting the system diagram in Mermaid syntax
- Reviewing my ECONOMICS.md math for obvious errors

**What I didn't trust AI with:**
- The audit engine rules themselves. Each rule involves a business decision (e.g., "at what team size does Team make sense over Pro?") that requires reading the actual pricing pages and making a defensible judgment call. AI would have generated plausible-sounding rules with made-up thresholds. I wrote every rule by hand and traced each number to a cited source.
- The user interview notes. Obviously.
- The test cases. Tests are specifications — I needed to be precise about what the expected behavior is, which means I had to understand it myself.

**One specific time AI was wrong and I caught it:**
When I asked Claude to help me write the `checkApiVsPlan` rule, it suggested checking if `monthlySpend > proPlan.pricePerUserPerMonth * seats` — comparing API spend to per-seat Pro pricing. But this is wrong: a team of 5 spending $40/mo on the Anthropic API shouldn't switch to 5 × Claude Pro ($100/mo). The right comparison is whether the API spend exceeds the *minimum useful flat-plan cost*, not the *per-seat cost times seats*. The AI was pattern-matching to the other rules without understanding the economic logic. I rewrote the rule to estimate `suggestedSeats = round(apiSpend / 20)` — how many Pro seats would cover equivalent usage — which is the right framing.

---

## 5. Self-ratings

| Dimension | Rating | Reason |
|---|---|---|
| **Discipline** | 7/10 | Committed work spread across 7 days, but Day 3 ran long and I compressed some Day 5 work into Day 6. |
| **Code quality** | 8/10 | Types are tight, rules are defensible, abstractions are the right size. Some components could be split further, but I prioritized shipping over premature structure. |
| **Design sense** | 7/10 | The UI is clean and functional but not visually distinctive. I used Tailwind competently, not creatively. The results page is the one place where visual design matters most (it gets shared) and I spent more time there — but it's still more "correct" than "memorable." |
| **Problem-solving** | 8/10 | The core insight — hardcoded rules for audit math, AI only for the narrative summary — was the right call and I committed to it early. The Credex credits bug was debugged methodically. |
| **Entrepreneurial thinking** | 7/10 | I understand the product and the economics. The GTM is specific. The user interviews were real and changed my thinking. Deducting points because I didn't ship the benchmark feature (the most user-requested thing) and my distribution channel is more "sensible" than "unfair." |
