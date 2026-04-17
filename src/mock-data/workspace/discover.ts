export type InvestmentRecommendation = {
  id: string;
  protocol: string;
  title: string;
  summary: string;
  projectedApy: string;
  riskLabel: "Low Risk" | "Medium Risk" | "High Risk";
  assetSummary: string;
  thesis: string;
};

export type InvestmentDiscoveryItem = {
  id: string;
  protocol: string;
  category: string;
  title: string;
  summary: string;
  projectedApy: string;
  assetSummary: string;
  thesis: string;
};

export type WorkspaceDiscover = {
  recommendations: InvestmentRecommendation[];
  discoveryItems: InvestmentDiscoveryItem[];
};

const defaultDiscover: WorkspaceDiscover = {
  recommendations: [
    {
      id: "jito-sol-restaking",
      protocol: "Jito",
      title: "Rotate idle SOL into Jito restaking",
      summary:
        "Move a portion of idle SOL into restaked jitoSOL to capture higher SOL-aligned yield without changing the workspace profile too aggressively.",
      projectedApy: "7.80%",
      riskLabel: "Medium Risk",
      assetSummary: "SOL staking exposure",
      thesis:
        "Improves the workspace's blended yield while staying close to established Solana-native infrastructure.",
    },
    {
      id: "kamino-rebalance",
      protocol: "Kamino",
      title: "Increase Kamino allocation on the lending leg",
      summary:
        "Kamino is currently offering stronger risk-adjusted lending returns than the workspace's current allocation.",
      projectedApy: "8.10%",
      riskLabel: "Medium Risk",
      assetSummary: "USDC lending",
      thesis:
        "A partial rebalance aligns the workspace with current Solana rates while preserving a diversified posture.",
    },
    {
      id: "marginfi-watchlist",
      protocol: "Marginfi",
      title: "Add Marginfi to the watchlist before deploying",
      summary:
        "Not an immediate add, but Marginfi deserves a research chat to compare yield durability and counterparty comfort.",
      projectedApy: "8.45%",
      riskLabel: "High Risk",
      assetSummary: "Stablecoin lending",
      thesis:
        "The yield is attractive, but the right next step is a focused chat rather than immediate allocation.",
    },
  ],
  discoveryItems: [
    {
      id: "drift-insurance-vault",
      protocol: "Drift",
      category: "Yield vault",
      title: "Drift Insurance Vault",
      summary:
        "A Solana-native yield surface that could complement the workspace with an opinionated source of returns.",
      projectedApy: "9.40%",
      assetSummary: "USDC vault exposure",
      thesis:
        "Research candidate — stronger income than base lending, with a different risk profile that needs discussion before allocation.",
    },
    {
      id: "marinade-stake-stack",
      protocol: "Marinade",
      category: "Liquid staking",
      title: "Marinade stake stack",
      summary:
        "A clean way to bring SOL yield into the workspace while keeping future loop strategies open.",
      projectedApy: "7.20%",
      assetSummary: "SOL / mSOL",
      thesis:
        "Strong fit when the workspace wants to stay understandable while capturing core Solana-native yield.",
    },
    {
      id: "raydium-stable-lp",
      protocol: "Raydium",
      category: "Stable LP",
      title: "Raydium stable liquidity pool",
      summary:
        "A lower-volatility LP that diversifies returns beyond pure lending while staying easier to reason about than concentrated LPs.",
      projectedApy: "6.85%",
      assetSummary: "USDC / USDT",
      thesis:
        "Worth exploring for more fee generation without moving far out on the risk spectrum.",
    },
  ],
};

export const workspaceDiscover: Record<string, WorkspaceDiscover> = {
  "workspace-sol-yield-loop": defaultDiscover,
  "workspace-new-strategy": defaultDiscover,
};

export function getDiscoverForWorkspace(workspaceId: string): WorkspaceDiscover {
  return workspaceDiscover[workspaceId] ?? defaultDiscover;
}
