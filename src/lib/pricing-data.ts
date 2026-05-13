/**
 * Pricing Data — verified May 2026
 * Every number traces back to an official vendor pricing page.
 * See PRICING_DATA.md for full citation list.
 */

import type { ToolInfo, ToolId } from "@/types";

export const TOOLS: Record<ToolId, ToolInfo> = {
  cursor: {
    id: "cursor",
    name: "Cursor",
    logoInitials: "CU",
    color: "bg-violet-600",
    plans: [
      {
        id: "cursor_hobby",
        name: "Hobby",
        pricePerUserPerMonth: 0,
        bestFor: ["coding"],
        features: ["2000 completions/mo", "50 slow premium requests"],
      },
      {
        id: "cursor_pro",
        name: "Pro",
        pricePerUserPerMonth: 20,
        bestFor: ["coding"],
        features: [
          "Unlimited completions",
          "500 fast premium requests/mo",
          "Unlimited slow premium requests",
        ],
      },
      {
        id: "cursor_business",
        name: "Business",
        pricePerUserPerMonth: 40,
        minSeats: 1,
        bestFor: ["coding"],
        features: [
          "All Pro features",
          "SSO",
          "Centralized team billing",
          "Admin dashboard",
          "Zero data retention policy",
        ],
      },
      {
        id: "cursor_enterprise",
        name: "Enterprise",
        pricePerUserPerMonth: -2,
        bestFor: ["coding"],
        features: ["Custom contracts", "SLA", "On-premise option"],
      },
    ],
  },

  github_copilot: {
    id: "github_copilot",
    name: "GitHub Copilot",
    logoInitials: "GH",
    color: "bg-gray-800",
    plans: [
      {
        id: "copilot_individual",
        name: "Individual",
        pricePerUserPerMonth: 10, // $100/yr = $8.33/mo; monthly billing = $10/mo
        bestFor: ["coding"],
        features: [
          "Code completions in IDE",
          "Chat in IDE + GitHub.com",
          "CLI assistance",
        ],
      },
      {
        id: "copilot_business",
        name: "Business",
        pricePerUserPerMonth: 19,
        bestFor: ["coding"],
        features: [
          "All Individual features",
          "Organization-wide policy management",
          "Audit logs",
          "IP indemnity",
        ],
      },
      {
        id: "copilot_enterprise",
        name: "Enterprise",
        pricePerUserPerMonth: 39,
        minSeats: 1,
        bestFor: ["coding"],
        features: [
          "All Business features",
          "Personalized chat on GitHub.com",
          "Fine-tuned models on your codebase",
          "Knowledge bases",
        ],
      },
    ],
  },

  claude: {
    id: "claude",
    name: "Claude",
    logoInitials: "CL",
    color: "bg-orange-500",
    plans: [
      {
        id: "claude_free",
        name: "Free",
        pricePerUserPerMonth: 0,
        bestFor: ["writing", "research", "mixed"],
        features: ["Limited usage of Claude Sonnet", "No priority access"],
      },
      {
        id: "claude_pro",
        name: "Pro",
        pricePerUserPerMonth: 20,
        bestFor: ["writing", "research", "coding", "mixed"],
        features: [
          "5× more usage than Free",
          "Access to Claude Opus + Sonnet",
          "Priority access during peak times",
          "Projects feature",
        ],
      },
      {
        id: "claude_max_5x",
        name: "Max (5×)",
        pricePerUserPerMonth: 100,
        bestFor: ["coding", "research", "data"],
        features: [
          "5× more usage than Pro",
          "Extended thinking",
          "Priority support",
        ],
      },
      {
        id: "claude_max_20x",
        name: "Max (20×)",
        pricePerUserPerMonth: 200,
        bestFor: ["coding", "research", "data"],
        features: [
          "20× more usage than Pro",
          "Extended thinking",
          "Highest priority",
        ],
      },
      {
        id: "claude_team",
        name: "Team",
        pricePerUserPerMonth: 30,
        minSeats: 5,
        bestFor: ["writing", "research", "mixed", "coding"],
        features: [
          "All Pro features",
          "Higher usage limits than Pro",
          "Team collaboration & sharing",
          "Central billing",
          "Admin console",
        ],
      },
      {
        id: "claude_enterprise",
        name: "Enterprise",
        pricePerUserPerMonth: -2,
        bestFor: ["coding", "writing", "data", "research", "mixed"],
        features: [
          "Custom usage limits",
          "SSO/SAML",
          "Audit logs",
          "Zero retention option",
        ],
      },
    ],
  },

  chatgpt: {
    id: "chatgpt",
    name: "ChatGPT",
    logoInitials: "GP",
    color: "bg-emerald-600",
    plans: [
      {
        id: "chatgpt_free",
        name: "Free",
        pricePerUserPerMonth: 0,
        bestFor: ["writing", "research", "mixed"],
        features: ["GPT-4o mini access", "Limited GPT-4o"],
      },
      {
        id: "chatgpt_plus",
        name: "Plus",
        pricePerUserPerMonth: 20,
        bestFor: ["writing", "research", "mixed", "coding"],
        features: [
          "GPT-4o, GPT-4o mini",
          "DALL·E image generation",
          "Advanced data analysis",
          "Browse, plugins",
        ],
      },
      {
        id: "chatgpt_team",
        name: "Team",
        pricePerUserPerMonth: 30,
        minSeats: 2,
        bestFor: ["writing", "research", "mixed", "coding"],
        features: [
          "All Plus features",
          "Higher message caps",
          "Team workspace",
          "Admin console",
          "Data excluded from training",
        ],
      },
      {
        id: "chatgpt_enterprise",
        name: "Enterprise",
        pricePerUserPerMonth: -2,
        bestFor: ["coding", "writing", "data", "research", "mixed"],
        features: [
          "Unlimited GPT-4o access",
          "SSO",
          "Advanced security",
          "Custom data retention",
        ],
      },
    ],
  },

  anthropic_api: {
    id: "anthropic_api",
    name: "Anthropic API",
    logoInitials: "AN",
    color: "bg-orange-400",
    plans: [
      {
        id: "anthropic_api_direct",
        name: "API Direct",
        pricePerUserPerMonth: -1, // usage-based
        isApiPlan: true,
        bestFor: ["coding", "data", "research"],
        features: [
          "Claude 3.5 Sonnet: $3/MTok input, $15/MTok output",
          "Claude 3.5 Haiku: $0.80/MTok input, $4/MTok output",
          "Claude 3 Opus: $15/MTok input, $75/MTok output",
          "Batches API: 50% discount",
        ],
      },
    ],
  },

  openai_api: {
    id: "openai_api",
    name: "OpenAI API",
    logoInitials: "OA",
    color: "bg-teal-600",
    plans: [
      {
        id: "openai_api_direct",
        name: "API Direct",
        pricePerUserPerMonth: -1, // usage-based
        isApiPlan: true,
        bestFor: ["coding", "data", "research"],
        features: [
          "GPT-4o: $2.50/MTok input, $10/MTok output",
          "GPT-4o mini: $0.15/MTok input, $0.60/MTok output",
          "o3: $10/MTok input, $40/MTok output",
          "Batch API: 50% discount",
        ],
      },
    ],
  },

  gemini: {
    id: "gemini",
    name: "Gemini",
    logoInitials: "GE",
    color: "bg-blue-600",
    plans: [
      {
        id: "gemini_free",
        name: "Free (Gemini.google.com)",
        pricePerUserPerMonth: 0,
        bestFor: ["writing", "research", "mixed"],
        features: ["Gemini 1.5 Flash", "Limited Gemini 1.5 Pro"],
      },
      {
        id: "gemini_advanced",
        name: "Gemini Advanced (AI Premium)",
        pricePerUserPerMonth: 19.99,
        bestFor: ["writing", "research", "mixed", "coding"],
        features: [
          "Gemini Ultra 1.0",
          "2TB Google One storage",
          "Deep Research",
          "Gemini in Gmail, Docs, Sheets",
        ],
      },
      {
        id: "gemini_workspace",
        name: "Gemini for Workspace Business",
        pricePerUserPerMonth: 30,
        minSeats: 1,
        bestFor: ["writing", "data", "research", "mixed"],
        features: [
          "Gemini in all Workspace apps",
          "NotebookLM Plus",
          "Enterprise-grade security",
          "Admin controls",
        ],
      },
      {
        id: "gemini_api",
        name: "Gemini API",
        pricePerUserPerMonth: -1,
        isApiPlan: true,
        bestFor: ["coding", "data"],
        features: [
          "Gemini 1.5 Pro: $3.50/MTok input, $10.50/MTok output",
          "Gemini 1.5 Flash: $0.075/MTok input, $0.30/MTok output",
          "Free tier: 15 requests/min",
        ],
      },
    ],
  },

  windsurf: {
    id: "windsurf",
    name: "Windsurf",
    logoInitials: "WS",
    color: "bg-cyan-600",
    plans: [
      {
        id: "windsurf_free",
        name: "Free",
        pricePerUserPerMonth: 0,
        bestFor: ["coding"],
        features: ["5 Flow actions/day", "Limited chat"],
      },
      {
        id: "windsurf_pro",
        name: "Pro",
        pricePerUserPerMonth: 15,
        bestFor: ["coding"],
        features: [
          "Unlimited completions",
          "Unlimited Cascade Base uses",
          "500 Flow actions/mo premium",
          "Priority access",
        ],
      },
      {
        id: "windsurf_teams",
        name: "Teams",
        pricePerUserPerMonth: 35,
        minSeats: 1,
        bestFor: ["coding"],
        features: [
          "All Pro features",
          "Team management",
          "Admin console",
          "Centralized billing",
          "SSO",
        ],
      },
    ],
  },
};

export function getPlan(toolId: ToolId, planId: string) {
  return TOOLS[toolId]?.plans.find((p) => p.id === planId) ?? null;
}

export function getAllTools(): ToolInfo[] {
  return Object.values(TOOLS);
}

export const CREDEX_DISCOUNT_RATE = 0.3; // 30% average discount via Credex credits
