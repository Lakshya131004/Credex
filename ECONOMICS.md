# Economics

## What a converted lead is worth to Credex

Credex makes money on the spread between the price it pays for unused AI credits and the price it sells them for. Assume:

- Average credit purchase: $5,000/mo (a 20-person team spending $250/developer/mo)
- Credex margin: 15% (conservative — they buy at 30% discount, sell at 15% discount to customer)
- Average customer retention: 12 months
- LTV per customer: $5,000 × 15% margin × 12 months = **$9,000**

This is a conservative estimate. High-retention B2B customers with recurring purchases (AI credits are consumed monthly) tend to have higher LTVs, and Credex's margin likely improves as volume grows.

---

## CAC at each channel from GTM plan

| Channel | Estimated reach | Conversion to audit | Conversion to lead | Conversion to customer | Estimated CAC |
|---|---|---|---|---|---|
| Hacker News Show HN | 3,000 unique visitors | 20% (600 audits) | 10% (60 leads) | 3% (2 customers) | $0 cash / ~8 hrs time |
| Twitter/X thread | 5,000 impressions | 5% (250 audits) | 8% (20 leads) | 2% (0.4 customers) | $0 cash / ~3 hrs time |
| Subreddit posts | 2,000 impressions | 8% (160 audits) | 10% (16 leads) | 2% (0.3 customers) | $0 cash / ~2 hrs time |
| Credex warm outreach | 50 companies (existing pipeline) | 60% (30 audits) | 40% (12 leads) | 10% (1.2 customers) | $0 cash / minimal |
| LinkedIn posts | 1,000 impressions | 3% (30 audits) | 12% (3.6 leads) | 2% (0.07 customers) | $0 cash / ~2 hrs time |

**Key insight:** CAC is effectively $0 cash in all channels. The product is the distribution. A shareable results page means every satisfied user is a potential distribution node.

---

## Conversion funnel that makes this profitable

Working backwards from $9,000 LTV:

```
Audits completed:     1,000  (baseline)
Email captures:         100  (10% of audits)
Qualified leads:         15  (15% of emails, monthly savings >$500)
Consultations booked:     5  (33% of qualified leads)
Credit purchases:         2  (40% of consultations)

Revenue per 1,000 audits: 2 customers × $9,000 LTV = $18,000
Cost to generate 1,000 audits: ~$0 (organic) + ~20 hrs dev/maintenance
```

This math works at even modest audit volumes. The tool pays for itself if it drives 1 customer per 500 audits.

---

## What would have to be true for $1M ARR in 18 months

$1M ARR at 15% margin requires ~$6.7M in credit sales.
At $5,000/mo average purchase: **112 active customers**.

Path to 112 customers:

- Months 1–3: Launch on HN, build to 500 audits/month. Convert ~1 customer/month (2 customers)
- Months 4–9: Viral loop from share URLs kicks in. 2,000 audits/month, 4 customers/month (24 additional customers)
- Months 10–15: SEO starts working from saved audit URLs (long-tail searches like "cursor vs copilot audit"). 5,000 audits/month, 8 customers/month (48 additional customers)
- Months 16–18: Credex warm outreach to their existing credit buyer relationships using SpendLens as a diagnostic. Closes 2–3 high-value accounts/month (38 additional customers)

**What has to be true:**
1. The share URL goes semi-viral at least twice (1 HN front page, 1 viral tweet) — this seeds the SEO long-tail
2. Credex's existing relationships provide warm intros to 50+ qualified companies
3. The tool stays accurate — pricing updates as vendors change plans (quarterly maintenance)
4. Conversion rate from "consultation booked" to "credit purchase" stays above 30% — requires Credex's sales motion to be sharp

**The fragile assumption:** The 10% audit→email conversion rate. If users get value and leave without entering their email, the funnel breaks. Mitigation: email capture is shown *after* the audit (never before), and the copy is "save your report" not "sign up" — designed to maximize conversion at the moment of peak value delivery.

---

## Summary table

| Metric | Value |
|---|---|
| Target LTV | $9,000 |
| CAC (cash) | ~$0 |
| Audits needed per customer | ~500 |
| Break-even monthly audits | 50 (1 customer/quarter) |
| Path to $1M ARR | 112 customers over 18 months |
| Key risk | Low email capture rate undermines lead quality |
