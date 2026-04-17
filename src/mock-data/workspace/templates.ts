export type TemplateCategory =
  | "All"
  | "Popular"
  | "Use cases"
  | "Getting started"
  | "Node basics";

export const templateCategories: TemplateCategory[] = [
  "All",
  "Popular",
  "Use cases",
  "Getting started",
  "Node basics",
];

export type WorkspaceTemplate = {
  id: string;
  title: string;
  subtitle: string;
  category: TemplateCategory;
  tags: string[];
  accent: string;
};

export const workspaceTemplates: WorkspaceTemplate[] = [
  {
    id: "sol-yield-loop",
    title: "Liquid-staking yield loop",
    subtitle:
      "Stake SOL into mSOL, supply it on Kamino, borrow USDC, and fan the result into a lending and LP branch.",
    category: "Popular",
    tags: ["SOL", "Kamino", "Yield loop"],
    accent: "linear-gradient(135deg, #203449 0%, #0B1520 100%)",
  },
  {
    id: "stable-lp-starter",
    title: "Stable LP starter",
    subtitle:
      "Route USDC into a stable LP on Raydium with guardrails for drift between the two stablecoins.",
    category: "Getting started",
    tags: ["USDC", "Raydium", "LP"],
    accent: "linear-gradient(135deg, #1F3A2E 0%, #0B1815 100%)",
  },
  {
    id: "msol-reward-harvester",
    title: "mSOL reward harvester",
    subtitle:
      "Collect mSOL staking rewards on a weekly cadence and route them back into the main loop automatically.",
    category: "Node basics",
    tags: ["mSOL", "Rewards"],
    accent: "linear-gradient(135deg, #2A2442 0%, #160D25 100%)",
  },
  {
    id: "drift-insurance-explorer",
    title: "Drift insurance explorer",
    subtitle:
      "Prototype the Drift insurance vault as a discovery node and model its effect on overall workspace risk.",
    category: "Use cases",
    tags: ["Drift", "Insurance", "Research"],
    accent: "linear-gradient(135deg, #3A2033 0%, #1A0B17 100%)",
  },
  {
    id: "split-rebalancer",
    title: "Split-based rebalancer",
    subtitle:
      "Use a split node to weight two strategies dynamically and rerun the draft to model different ratios.",
    category: "Node basics",
    tags: ["Split", "Strategy"],
    accent: "linear-gradient(135deg, #1F2A44 0%, #0A1020 100%)",
  },
  {
    id: "memecoin-circuit",
    title: "Memecoin circuit breaker",
    subtitle:
      "Run a memecoin leg behind a stop condition so the workspace can explore high-variance strategies safely.",
    category: "Use cases",
    tags: ["Memecoin", "Circuit breaker"],
    accent: "linear-gradient(135deg, #432322 0%, #200D0C 100%)",
  },
  {
    id: "idle-balance-parking",
    title: "Idle balance parking",
    subtitle:
      "Park idle stablecoins into lending with a cadence that sweeps accrued interest back into the main loop.",
    category: "Getting started",
    tags: ["USDC", "Lending"],
    accent: "linear-gradient(135deg, #1B3340 0%, #0B1A22 100%)",
  },
  {
    id: "solana-validator-stack",
    title: "Solana validator stack",
    subtitle:
      "Stack native staking, liquid staking, and LP fees into a single loop for comparing validator strategies.",
    category: "Popular",
    tags: ["Validator", "Staking"],
    accent: "linear-gradient(135deg, #263E2C 0%, #0D1912 100%)",
  },
];
