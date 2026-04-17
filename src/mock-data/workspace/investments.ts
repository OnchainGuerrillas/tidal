export type InvestmentPosition = {
  id: string;
  protocol: string;
  network: string;
  title: string;
  valueUsd: number;
  returnPct: number;
  apy: string;
  assetSummary: string;
  thesis: string;
};

export type InvestmentPerformancePoint = {
  label: string;
  valueUsd: number;
};

export type InvestmentPerformanceMetric = {
  label: string;
  value: string;
  accent?: boolean;
};

export type InvestmentPerformance = {
  activeRange: string;
  availableRanges: string[];
  points: InvestmentPerformancePoint[];
  metrics: InvestmentPerformanceMetric[];
};

export type WorkspaceInvestments = {
  currentValueUsd: number;
  currentReturnPct: number;
  availableAssetsUsd: number;
  positions: InvestmentPosition[];
  performance: InvestmentPerformance;
};

const baselineInvestments: WorkspaceInvestments = {
  currentValueUsd: 10210.34,
  currentReturnPct: 21.54,
  availableAssetsUsd: 3108.1,
  positions: [
    {
      id: "marinade-stake",
      protocol: "Marinade",
      network: "Solana",
      title: "Marinade liquid staking",
      valueUsd: 3123.45,
      returnPct: 7.2,
      apy: "7.20%",
      assetSummary: "SOL → mSOL",
      thesis:
        "Baseline SOL yield that feeds the rest of the workspace with mSOL to keep downstream strategies supplied.",
    },
    {
      id: "kamino-supply-borrow",
      protocol: "Kamino",
      network: "Solana",
      title: "Kamino supply + borrow",
      valueUsd: 2840.0,
      returnPct: 5.9,
      apy: "5.90% net",
      assetSummary: "mSOL collateral · USDC borrowed",
      thesis:
        "Core looping leg — supplies mSOL as collateral and releases USDC to route into lending and LP branches.",
    },
    {
      id: "raydium-lp",
      protocol: "Raydium",
      network: "Solana",
      title: "Raydium stable LP",
      valueUsd: 1246.89,
      returnPct: 6.85,
      apy: "6.85%",
      assetSummary: "USDC / USDT LP",
      thesis:
        "Captures trading fees on stable pair volume — lower volatility than concentrated LPs while diversifying workspace income.",
    },
  ],
  performance: {
    activeRange: "6M",
    availableRanges: ["1M", "3M", "6M", "1Y", "ALL"],
    points: [
      { label: "Oct", valueUsd: 5600 },
      { label: "Nov", valueUsd: 7100 },
      { label: "Dec", valueUsd: 8200 },
      { label: "Jan", valueUsd: 9300 },
      { label: "Feb", valueUsd: 10500 },
      { label: "Mar", valueUsd: 11200 },
    ],
    metrics: [
      { label: "Starting value", value: "$8,400.00" },
      { label: "Current value", value: "$10,210.34", accent: true },
      { label: "6M return", value: "+21.54%", accent: true },
      { label: "Peak value", value: "$10,842.17" },
    ],
  },
};

const emptyInvestments: WorkspaceInvestments = {
  currentValueUsd: 0,
  currentReturnPct: 0,
  availableAssetsUsd: 0,
  positions: [],
  performance: {
    activeRange: "6M",
    availableRanges: ["1M", "3M", "6M", "1Y", "ALL"],
    points: [
      { label: "Oct", valueUsd: 0 },
      { label: "Nov", valueUsd: 0 },
      { label: "Dec", valueUsd: 0 },
      { label: "Jan", valueUsd: 0 },
      { label: "Feb", valueUsd: 0 },
      { label: "Mar", valueUsd: 0 },
    ],
    metrics: [
      { label: "Starting value", value: "$0.00" },
      { label: "Current value", value: "$0.00", accent: true },
      { label: "6M return", value: "+0.00%", accent: true },
      { label: "Peak value", value: "$0.00" },
    ],
  },
};

export const workspaceInvestments: Record<string, WorkspaceInvestments> = {
  "workspace-sol-yield-loop": baselineInvestments,
  "workspace-new-strategy": emptyInvestments,
};

export function getInvestmentsForWorkspace(
  workspaceId: string
): WorkspaceInvestments {
  return workspaceInvestments[workspaceId] ?? emptyInvestments;
}
