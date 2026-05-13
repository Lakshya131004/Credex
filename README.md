# SpendLens — Free AI Spend Audit

SpendLens is a free audit tool that tells startup founders and engineering managers exactly where they're overpaying for AI tools like Cursor, Claude, ChatGPT, and GitHub Copilot. It takes 2 minutes, requires no signup, and surfaces specific plan changes with defensible savings numbers.

Built by Credex — the company that sells discounted AI credits to teams that discover they need them.

---

## Screenshots

> *Add 3+ screenshots or a Loom/YouTube link here before submitting.*
> 
> Example:
> - `screenshots/01-form.png` — Form with tools added
> - `screenshots/02-results-high-value.png` — Results showing $800/mo in savings
> - `screenshots/03-share-page.png` — Public share URL on a mobile device

**Live demo:** [deployed URL here]

---

## Quick Start

### Prerequisites
- Node.js 20+
- A Supabase project (free tier is fine)
- An Anthropic API key (for AI summaries; falls back gracefully if missing)
- A Resend account (for transactional email; optional for local dev)

### Install and run locally

```bash
git clone https://github.com/your-username/spendlens
cd spendlens
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your real values

npm run dev
# Open http://localhost:3000
```

### Run tests

```bash
npm test
```

Tests cover the audit engine rules and aggregate calculations. No external services needed.

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set the environment variables from `.env.example` in your Vercel dashboard before deploying.

### Supabase setup

Run these SQL statements in your Supabase SQL editor to create the required tables:

```sql
create table audits (
  id uuid primary key default gen_random_uuid(),
  share_id text unique not null,
  tools jsonb not null,
  team_size int not null,
  use_case text not null,
  total_monthly_spend numeric not null,
  total_monthly_savings numeric not null,
  total_annual_savings numeric not null,
  savings_percentage int not null,
  recommendations jsonb not null,
  ai_summary text,
  is_high_value boolean not null default false,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid references audits(id),
  email text not null,
  company_name text,
  role text,
  team_size int,
  monthly_savings numeric,
  is_high_value boolean default false,
  created_at timestamptz not null default now(),
  unique(audit_id, email)
);

create index on audits(share_id);
create index on leads(email);
```

---

## Decisions

Five trade-offs made and why:

**1. Rule-based audit engine, not AI**
Every recommendation must be defensible to a finance person — a model can hallucinate thresholds or reason from stale data. A finance-literate person reading the rules can verify them. We use AI exactly once (for the narrative summary) where hallucination risk is low and graceful fallback is easy.

**2. localStorage persistence, no accounts**
Requiring login before seeing the audit would tank conversion. The most important UX principle: show value before asking for anything. localStorage persists the form across reloads, and email is captured after results are shown — never before.

**3. In-memory rate limiting over Redis**
Adding Upstash Redis would be the "right" production choice, but it's another service dependency, another secret, and another failure mode. At MVP scale (hundreds of users/day), an in-memory store is sufficient. The trade-off is documented; the fix is one dependency swap.

**4. Supabase over Firebase/PlanetScale**
Postgres over NoSQL because the data is relational (audits → leads) and I wanted to query it with SQL later. Supabase's JavaScript client is excellent and the free tier handles the MVP comfortably. Firebase would have required schema design discipline I didn't want to enforce without types.

**5. Share page as server component**
The share page renders server-side so the OG tags (`og:title`, `og:description`) are populated with real savings numbers at request time — critical for Twitter/Slack link previews. A client-rendered page would show the default "SpendLens" meta tags in previews, undermining the viral loop.
