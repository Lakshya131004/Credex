import { runAuditEngine } from "@/lib/audit-engine";
import type { AuditFormData } from "@/types";

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const BASE_FORM: AuditFormData = {
  tools: [],
  teamSize: 5,
  useCase: "coding",
};

// ─── Rule 1: Duplicate Coding Tools ──────────────────────────────────────────

describe("Rule 1 — Duplicate coding tools (Cursor + Copilot)", () => {
  it("flags GitHub Copilot as redundant when team uses Cursor Pro", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      tools: [
        { toolId: "cursor", planId: "cursor_pro", seats: 5, monthlySpend: 100 },
        {
          toolId: "github_copilot",
          planId: "copilot_business",
          seats: 5,
          monthlySpend: 95,
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) => r.toolId === "github_copilot" && r.action === "switch_tool"
    );
    expect(rec).toBeDefined();
    expect(rec!.monthlySavings).toBe(95);
    expect(rec!.priority).toBe("high");
  });

  it("does not flag when only Copilot is present without Cursor", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      tools: [
        {
          toolId: "github_copilot",
          planId: "copilot_business",
          seats: 5,
          monthlySpend: 95,
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) => r.toolId === "github_copilot" && r.action === "switch_tool"
    );
    expect(rec).toBeUndefined();
  });

  it("does not flag when Cursor is on the free Hobby plan", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      tools: [
        {
          toolId: "cursor",
          planId: "cursor_hobby",
          seats: 1,
          monthlySpend: 0,
        },
        {
          toolId: "github_copilot",
          planId: "copilot_business",
          seats: 5,
          monthlySpend: 95,
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) => r.toolId === "github_copilot" && r.action === "switch_tool"
    );
    expect(rec).toBeUndefined();
  });
});

// ─── Rule 2: Claude Team seat mismatch ────────────────────────────────────────

describe("Rule 2 — Claude Team seat mismatch", () => {
  it("recommends Claude Pro when team uses Claude Team with < 5 seats", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      tools: [
        {
          toolId: "claude",
          planId: "claude_team",
          seats: 2,
          monthlySpend: 150, // min billing for team plan
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) =>
        r.toolId === "claude" &&
        r.action === "downgrade_plan" &&
        r.recommendedPlanId === "claude_pro"
    );
    expect(rec).toBeDefined();
    // 2 × Pro ($20) = $40 vs $150 team billing
    expect(rec!.monthlySavings).toBe(150 - 40);
    expect(rec!.priority).toBe("high");
  });

  it("does not flag Claude Team when team has 5+ seats", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      tools: [
        {
          toolId: "claude",
          planId: "claude_team",
          seats: 5,
          monthlySpend: 150,
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) => r.toolId === "claude" && r.action === "downgrade_plan"
    );
    expect(rec).toBeUndefined();
  });
});

// ─── Rule 3: ChatGPT Team vs Plus ────────────────────────────────────────────

describe("Rule 3 — ChatGPT Team vs Plus for small teams", () => {
  it("recommends Plus when team is ≤3 seats and use case is not data", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      useCase: "writing",
      tools: [
        {
          toolId: "chatgpt",
          planId: "chatgpt_team",
          seats: 2,
          monthlySpend: 60, // 2 × $30
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) =>
        r.toolId === "chatgpt" &&
        r.action === "downgrade_plan" &&
        r.recommendedPlanId === "chatgpt_plus"
    );
    expect(rec).toBeDefined();
    // 2 × Plus ($20) = $40 vs $60 team
    expect(rec!.monthlySavings).toBe(20);
  });

  it("does NOT flag ChatGPT Team for data use case (privacy concern)", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      useCase: "data",
      tools: [
        {
          toolId: "chatgpt",
          planId: "chatgpt_team",
          seats: 2,
          monthlySpend: 60,
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) => r.toolId === "chatgpt" && r.action === "downgrade_plan"
    );
    expect(rec).toBeUndefined();
  });
});

// ─── Rule 4: Claude Max overkill ─────────────────────────────────────────────

describe("Rule 4 — Claude Max overkill for non-power users", () => {
  it("recommends Pro over Max 5× for writing use case", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      useCase: "writing",
      tools: [
        {
          toolId: "claude",
          planId: "claude_max_5x",
          seats: 2,
          monthlySpend: 200, // 2 × $100
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) =>
        r.toolId === "claude" &&
        r.action === "downgrade_plan" &&
        r.recommendedPlanId === "claude_pro"
    );
    expect(rec).toBeDefined();
    // 2 × Pro ($20) = $40 vs $200
    expect(rec!.monthlySavings).toBe(160);
    expect(rec!.priority).toBe("high");
  });

  it("does NOT flag Claude Max for coding use case (power-user justified)", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      useCase: "coding",
      tools: [
        {
          toolId: "claude",
          planId: "claude_max_5x",
          seats: 2,
          monthlySpend: 200,
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) =>
        r.toolId === "claude" &&
        r.action === "downgrade_plan" &&
        r.recommendedPlanId === "claude_pro"
    );
    expect(rec).toBeUndefined();
  });
});

// ─── Rule 5: Copilot Enterprise too small ─────────────────────────────────────

describe("Rule 5 — Copilot Enterprise too small", () => {
  it("recommends Business over Enterprise for < 10 person teams", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      teamSize: 5,
      tools: [
        {
          toolId: "github_copilot",
          planId: "copilot_enterprise",
          seats: 5,
          monthlySpend: 195, // 5 × $39
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) =>
        r.toolId === "github_copilot" &&
        r.recommendedPlanId === "copilot_business"
    );
    expect(rec).toBeDefined();
    // 5 × Business ($19) = $95 vs $195
    expect(rec!.monthlySavings).toBe(100);
  });

  it("does NOT flag Copilot Enterprise for 10+ person teams", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      teamSize: 15,
      tools: [
        {
          toolId: "github_copilot",
          planId: "copilot_enterprise",
          seats: 15,
          monthlySpend: 585, // 15 × $39
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) =>
        r.toolId === "github_copilot" &&
        r.recommendedPlanId === "copilot_business"
    );
    expect(rec).toBeUndefined();
  });
});

// ─── Rule 7: Cursor Business overkill ────────────────────────────────────────

describe("Rule 7 — Cursor Business overkill for small teams", () => {
  it("recommends Pro over Business for < 10 person teams", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      teamSize: 5,
      tools: [
        {
          toolId: "cursor",
          planId: "cursor_business",
          seats: 5,
          monthlySpend: 200, // 5 × $40
        },
      ],
    };
    const result = runAuditEngine(form);
    const rec = result.recommendations.find(
      (r) =>
        r.toolId === "cursor" && r.recommendedPlanId === "cursor_pro"
    );
    expect(rec).toBeDefined();
    // 5 × Pro ($20) = $100 vs $200
    expect(rec!.monthlySavings).toBe(100);
  });
});

// ─── Rule 8: Credex credits opportunity ──────────────────────────────────────

describe("Rule 8 — Credex credits opportunity", () => {
  it("surfaces Credex credits when remaining retail spend > $100", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      useCase: "coding",
      tools: [
        {
          toolId: "cursor",
          planId: "cursor_pro",
          seats: 10,
          monthlySpend: 200,
        },
      ],
    };
    const result = runAuditEngine(form);
    const creditsRec = result.recommendations.find(
      (r) => r.action === "use_credits"
    );
    expect(creditsRec).toBeDefined();
    expect(creditsRec!.monthlySavings).toBeGreaterThan(0);
  });
});

// ─── isAlreadyOptimal flag ────────────────────────────────────────────────────

describe("isAlreadyOptimal flag", () => {
  it("sets isAlreadyOptimal true when no significant savings found", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      tools: [
        // Single Claude Pro user — no better option at same capabilities
        {
          toolId: "claude",
          planId: "claude_pro",
          seats: 1,
          monthlySpend: 20,
        },
      ],
    };
    const result = runAuditEngine(form);
    // With only $20 spend, credits < $30 threshold, so isAlreadyOptimal should be true
    expect(result.isAlreadyOptimal).toBe(true);
  });

  it("sets isHighValue true when savings exceed $500/mo", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      teamSize: 30,
      useCase: "writing",
      tools: [
        {
          toolId: "claude",
          planId: "claude_max_20x",
          seats: 30,
          monthlySpend: 6000, // 30 × $200
        },
        {
          toolId: "chatgpt",
          planId: "chatgpt_team",
          seats: 30,
          monthlySpend: 900, // 30 × $30
        },
      ],
    };
    const result = runAuditEngine(form);
    expect(result.isHighValue).toBe(true);
    expect(result.totalMonthlySavings).toBeGreaterThan(500);
  });
});

// ─── Savings totals consistency ───────────────────────────────────────────────

describe("Savings totals", () => {
  it("totalAnnualSavings = totalMonthlySavings × 12", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      useCase: "writing",
      tools: [
        {
          toolId: "claude",
          planId: "claude_max_5x",
          seats: 3,
          monthlySpend: 300,
        },
      ],
    };
    const result = runAuditEngine(form);
    expect(result.totalAnnualSavings).toBe(result.totalMonthlySavings * 12);
  });

  it("savingsPercentage is correctly computed", () => {
    const form: AuditFormData = {
      ...BASE_FORM,
      useCase: "writing",
      tools: [
        {
          toolId: "claude",
          planId: "claude_max_5x",
          seats: 1,
          monthlySpend: 100,
        },
      ],
    };
    const result = runAuditEngine(form);
    const expected = Math.round(
      (result.totalMonthlySavings / result.totalCurrentMonthlySpend) * 100
    );
    expect(result.savingsPercentage).toBe(expected);
  });
});
