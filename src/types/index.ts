// ─── Tool & Plan Types ───────────────────────────────────────────────────────

export type ToolId =
  | "cursor"
  | "github_copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "windsurf";

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type PlanId = string; // e.g. "cursor_pro", "claude_team"

export interface PlanInfo {
  id: PlanId;
  name: string;
  pricePerUserPerMonth: number; // 0 for free, -1 for usage-based, -2 for custom/enterprise
  minSeats?: number;
  maxSeats?: number;
  bestFor: UseCase[];
  features: string[];
  isApiPlan?: boolean;
}

export interface ToolInfo {
  id: ToolId;
  name: string;
  logoInitials: string;
  color: string; // tailwind bg color class
  plans: PlanInfo[];
}

// ─── Form Input Types ─────────────────────────────────────────────────────────

export interface ToolEntry {
  toolId: ToolId;
  planId: PlanId;
  monthlySpend: number; // actual amount user pays per month (total, not per seat)
  seats: number;
}

export interface AuditFormData {
  tools: ToolEntry[];
  teamSize: number;
  useCase: UseCase;
}

// ─── Audit Engine Types ───────────────────────────────────────────────────────

export type RecommendationType =
  | "downgrade_plan"
  | "upgrade_plan"
  | "switch_tool"
  | "reduce_seats"
  | "use_credits"
  | "already_optimal";

export interface Recommendation {
  toolId: ToolId;
  toolName: string;
  currentPlanName: string;
  currentMonthlySpend: number;
  action: RecommendationType;
  actionLabel: string; // human-readable label
  recommendedPlanId?: PlanId;
  recommendedToolId?: ToolId;
  recommendedPlanName?: string;
  recommendedMonthlySpend?: number;
  monthlySavings: number;
  annualSavings: number;
  reason: string; // one-sentence defensible reason
  priority: "high" | "medium" | "low";
}

export interface AuditResult {
  id?: string; // set after DB insert
  shareId?: string;
  formData: AuditFormData;
  recommendations: Recommendation[];
  totalCurrentMonthlySpend: number;
  totalRecommendedMonthlySpend: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  savingsPercentage: number;
  isHighValue: boolean; // > $500/mo savings
  isAlreadyOptimal: boolean; // < $100/mo savings
  aiSummary?: string;
  createdAt?: string;
}

// ─── API Types ────────────────────────────────────────────────────────────────

export interface CreateAuditRequest {
  formData: AuditFormData;
}

export interface CreateAuditResponse {
  auditResult: AuditResult;
  shareId: string;
}

export interface LeadCaptureRequest {
  shareId: string;
  email: string;
  companyName?: string;
  role?: string;
  teamSize?: number;
}

export interface LeadCaptureResponse {
  success: boolean;
  message: string;
}

export interface GenerateSummaryRequest {
  auditResult: AuditResult;
}

export interface GenerateSummaryResponse {
  summary: string;
  isAiGenerated: boolean;
}

// ─── Database Types ───────────────────────────────────────────────────────────

export interface DbAudit {
  id: string;
  share_id: string;
  tools: ToolEntry[];
  team_size: number;
  use_case: UseCase;
  total_monthly_spend: number;
  total_monthly_savings: number;
  total_annual_savings: number;
  savings_percentage: number;
  recommendations: Recommendation[];
  ai_summary: string | null;
  is_high_value: boolean;
  created_at: string;
}

export interface DbLead {
  id: string;
  audit_id: string;
  email: string;
  company_name: string | null;
  role: string | null;
  team_size: number | null;
  monthly_savings: number;
  is_high_value: boolean;
  created_at: string;
}
