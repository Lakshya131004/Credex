# Metrics

## North Star Metric

**Qualified leads generated per week** — defined as email submissions from audits that identified ≥$100/mo in savings.

**Why this and not "audits completed":**
Audits are inputs, not value. A thousand audits from users who close the tab before entering their email generates $0 in revenue for Credex and $0 in follow-up value for users. The North Star must capture *both* that the tool worked (identified real savings) *and* that the user cared enough to leave their contact (intent signal). A qualified lead is the intersection of those two things.

**Why not "credit purchases":**
Purchases are too lagging (sales cycle is weeks) and too small a number early on to optimize against. Qualified leads are a leading indicator with a short feedback loop.

---

## 3 Input Metrics That Drive the North Star

**1. Audit completion rate**
Percentage of users who start the form (add at least one tool) and click "Run Free Audit."
Target: >60%. If this drops, the form is too long, confusing, or the CTA isn't clear.

**2. Savings identification rate**
Percentage of completed audits that identify ≥$100/mo in savings.
Target: >40%. If this drops, either we're getting the wrong users (small/optimized stacks) or the audit engine is missing real savings. A low rate also reduces the psychological incentive to submit email.

**3. Email capture rate (conditioned on savings)**
Percentage of users who see ≥$100/mo in savings and submit their email.
Target: >20%. This is the direct driver of qualified leads. If this is low despite high savings shown, the value proposition of "get your report" isn't landing, or the email gate feels too high-friction.

---

## What to Instrument First

In order of priority:

1. `audit_submitted` event — fires when POST /api/audit is called (measures top of funnel)
2. `audit_completed` event with `{ totalMonthlySavings, recommendationCount, isHighValue }` — fires on results render (measures engine quality)
3. `email_submitted` event with `{ shareId, isHighValue, totalMonthlySavings }` — fires on lead capture (measures conversion)
4. `share_link_copied` event — fires when share button is clicked (measures viral coefficient)
5. `share_page_viewed` event on `/share/:id` — measures actual viral reach

Everything else (bounce rate, session duration, page views) is noise until these five are clean.

---

## What Number Triggers a Pivot Decision

**If, after 500 audits: email capture rate is <8% for audits showing ≥$100/mo savings.**

This would mean the tool is creating value users can see but not capturing it. The pivot: move email capture to *before* showing results, or add a login-with-Google option. (This violates the current "email after value" principle — but below 8% we'd have evidence the principle isn't working, not just a hypothesis that it is.)

The threshold of 500 audits (not 50) is deliberate — early-stage data is noisy. A bad week could be a bad Show HN post, not a product failure. 500 gives enough signal to make a real decision.
