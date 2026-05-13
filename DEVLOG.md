# Dev Log

---

## Day 1 — 2026-05-07

**Hours worked:** 3

**What I did:**
Read the full assignment brief twice. Set up the Next.js project with TypeScript and Tailwind v4. Created the types file (`src/types/index.ts`) — designed the full data model before writing a line of product code. Defined `AuditFormData`, `AuditResult`, `Recommendation`, and DB types. Set up Supabase project and created the `audits` and `leads` tables with correct schemas.

**What I learned:**
Next.js 16 has breaking changes around `params` — it's now a `Promise<{id: string}>` in dynamic routes, not a plain object. Caught this early by reading the docs before writing route handlers.

**Blockers / what I'm stuck on:**
Deciding whether the share page should be a full server component or a client-hydrated page. Going with server component + client `LeadCaptureForm` child — cleaner SEO and OG generation.

**Plan for tomorrow:**
Build the pricing data layer and audit engine rules 1–4.

---

## Day 2 — 2026-05-08

**Hours worked:** 4

**What I did:**
Built `PRICING_DATA.md` first — verified every number against official pricing pages before writing code. Built `src/lib/pricing-data.ts` with all 8 tools. Started the audit engine: rules 1–4 (duplicate tools, Claude Team mismatch, ChatGPT Team vs Plus, Claude Max overkill). Wrote tests for each rule as I went.

**What I learned:**
The Claude Team plan has a 5-seat minimum ($150/mo floor) that isn't obvious from the pricing page at first glance — you have to click through to the FAQ. This is exactly the kind of thing users wouldn't notice. Made sure the recommendation copy calls it out explicitly.

**Blockers / what I'm stuck on:**
Rule 6 (API vs flat plan) is tricky — need to be careful not to flag API users who are doing automation (where per-token pricing is genuinely better). Added `useCase` check.

**Plan for tomorrow:**
Finish rules 5–8, write the Credex credits recommendation, complete the engine, and run the full test suite.

---

## Day 3 — 2026-05-09

**Hours worked:** 5

**What I did:**
Finished audit engine rules 5–8. Added `checkCredexCreditOpportunity` as the final additive recommendation. Wrote comprehensive tests — 12 test cases covering all rules, edge cases, and aggregate calculations. Tests pass. Set up the Anthropic integration with proper fallback. Built the Resend email templates (confirmation + high-value team alert).

**What I learned:**
The Credex credits recommendation needs to run last and operate on *remaining spend after optimizations*, not total spend — otherwise you're double-counting savings. Got this wrong in the first version and caught it when a test showed savings > 100% of current spend.

**Blockers / what I'm stuck on:**
Deciding on the form UX — one big scrolling page vs. a multi-step wizard. Going with single page because users need to see all their tools at once to notice gaps/overlaps.

**Plan for tomorrow:**
Build the full form UI and results display. Wire up the API route.

---

## Day 4 — 2026-05-10

**Hours worked:** 6

**What I did:**
Built the complete `AuditApp.tsx` component — form with tool picker, plan/spend/seats inputs, localStorage persistence, and the full results view. Built `RecommendationCard` and the savings hero. Wired up all three API routes (`/api/audit`, `/api/summary`, `/api/leads`). Built the share page as a server component with `generateMetadata` for OG tags. Rate limiting and honeypot in place.

**What I learned:**
React 19 strict mode fires `useEffect` twice in development, which causes the localStorage load to run twice — not a problem since the second call just overwrites with the same value, but it confused me briefly.

**Blockers / what I'm stuck on:**
The `src/lib/supabase.ts` admin client initialization throws if env vars are undefined at import time. Added placeholder env vars to the CI workflow for test runs that don't touch Supabase.

**Plan for tomorrow:**
Polish the UI, write all required markdown files, run a full end-to-end test.

---

## Day 5 — 2026-05-11

**Hours worked:** 4

**What I did:**
UI polish pass — improved spacing, added loading skeleton for AI summary, tightened the recommendation cards. Wrote ARCHITECTURE.md, PROMPTS.md, PRICING_DATA.md. Set up GitHub Actions CI. Ran full test suite — 12/12 passing.

**What I learned:**
Tailwind v4 uses `@import "tailwindcss"` instead of the three-directive pattern from v3. The `@theme inline` block replaces `extend` in v3. Had to read the Tailwind v4 docs instead of relying on muscle memory.

**Blockers / what I'm stuck on:**
Need to verify Lighthouse scores on deployed URL. Will deploy to Vercel tomorrow.

**Plan for tomorrow:**
Deploy to Vercel, run Lighthouse, write GTM/ECONOMICS/METRICS, conduct user interviews.

---

## Day 6 — 2026-05-12

**Hours worked:** 5

**What I did:**
Deployed to Vercel. Set up environment variables in Vercel dashboard. Ran Lighthouse — Performance 91, Accessibility 94, Best Practices 96. Wrote GTM.md, ECONOMICS.md, METRICS.md, LANDING_COPY.md. Conducted two of three user interviews (a co-founder at a 6-person dev tool startup, a freelance ML engineer). Key finding: neither person knew what plan their team was on for Copilot — they just paid the invoice.

**What I learned:**
The most surprising interview insight: users don't audit AI spend because they *don't know they should*, not because they *don't care*. The problem is invisibility, not indifference. This shaped the landing page copy — lead with "find out" not "save money."

**Blockers / what I'm stuck on:**
Third user interview scheduled for Day 7.

**Plan for tomorrow:**
Final user interview, write USER_INTERVIEWS.md and REFLECTION.md, final commit, submit.

---

## Day 7 — 2026-05-13

**Hours worked:** 4

**What I did:**
Third user interview (engineering manager at a 20-person SaaS). Wrote USER_INTERVIEWS.md and REFLECTION.md. Final code review pass — cleaned up any console.logs, verified all env var references use `process.env`. Wrote README.md with screenshots section and decisions. Final git commit. Submitted.

**What I learned:**
The engineering manager interview was the most useful — she said she'd never clicked through to compare Copilot Individual vs Business pricing because "we have 15 engineers, it's obviously Business." But she didn't realize Enterprise ($39/user) adds almost nothing at her scale. That exact scenario is covered by Rule 5 in the engine.

**Blockers / what I'm stuck on:**
Nothing blocking. Shipped.

**Plan for tomorrow:**
Wait for Round 2 feedback.
