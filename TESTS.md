# Tests

## How to run

```bash
npm test
```

All tests run with Jest + ts-jest. No external services required — the audit engine is pure in-process logic.

---

## Test file: `src/__tests__/audit-engine.test.ts`

**How to run:** `npm test` or `npx jest src/__tests__/audit-engine.test.ts`

### Test coverage

| Test | What it covers |
|---|---|
| **Rule 1 — flags Copilot when Cursor Pro is present** | `checkDuplicateCodingTools`: Cursor Pro + Copilot Business → recommends canceling Copilot, saves $95/mo |
| **Rule 1 — no flag when only Copilot** | Does not false-positive when Cursor isn't in the stack |
| **Rule 1 — no flag when Cursor is free tier** | Only flags when Cursor is a paid plan (Pro/Business), not Hobby |
| **Rule 2 — Claude Team with <5 seats** | `checkClaudeTeamSeatMismatch`: 2 seats on Team ($150) → Pro saves $110/mo |
| **Rule 2 — no flag at 5+ seats** | Correctly ignores properly-sized Team subscriptions |
| **Rule 3 — ChatGPT Team vs Plus for writing** | `checkChatGPTTeamVsPlus`: 2-seat Team ($60) → Plus saves $20/mo |
| **Rule 3 — no flag for data use case** | Data teams need Team's privacy controls; rule correctly skips |
| **Rule 4 — Claude Max overkill for writing** | `checkClaudeMaxOverkill`: Max 5× for writing → Pro saves $160/mo |
| **Rule 4 — no flag for coding use case** | Power users doing coding may legitimately need Max quota |
| **Rule 5 — Copilot Enterprise too small** | `checkCopilotEnterpriseTooSmall`: 5-person team on Enterprise → Business saves $100/mo |
| **Rule 5 — no flag at 10+ people** | Enterprise features (codebase indexing) are justified at scale |
| **Rule 7 — Cursor Business overkill** | `checkCursorBusinessOverkill`: 5-person team on Business → Pro saves $100/mo |
| **Rule 8 — Credex credits surfaces** | Credits recommendation appears when retail spend > $100 after optimizations |
| **isAlreadyOptimal = true for optimal stack** | Single Claude Pro user → no meaningful savings → flag set |
| **isHighValue = true for large savings** | 30-person team on Max plans for writing → savings > $500 |
| **totalAnnualSavings = monthly × 12** | Aggregate calculation is consistent |
| **savingsPercentage is correctly computed** | Percentage rounds to nearest integer, consistent with totals |

### Total: 17 test cases across 8 describe blocks
