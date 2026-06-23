import type { LivePositionEntry } from "@/hooks/workspace/use-all-positions";
import { ADAPTER_CATALOG_ITEMS } from "@/lib/solana/adapter-catalog";

function getCatalogItem(id: string) {
  const item = ADAPTER_CATALOG_ITEMS.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Missing design-mode catalog item: ${id}`);
  }
  return item;
}

const fetchedAt = Date.parse("2026-06-09T12:00:00.000Z");

export const designModePositions: LivePositionEntry[] = [
  {
    catalogItemId: "jito-sol-stake",
    catalogItem: getCatalogItem("jito-sol-stake"),
    protocol: {
      id: "jito",
      name: "Jito",
      riskTier: "shallows",
      auditCount: 3,
      tvlUsd: 2_900_000_000,
      ageMonths: 42,
    },
    position: {
      asset: "JitoSOL",
      rawAmount: "18500000000",
      displayAmount: "18.5000 JitoSOL",
      valueUsd: 3052.5,
      lastUpdatedAt: fetchedAt,
    },
    rate: {
      apy: 0.059,
      apyBreakdown: { staking: 0.045, mev: 0.014 },
      fetchedAt,
    },
    error: null,
  },
  {
    catalogItemId: "kamino-usdc-supply",
    catalogItem: getCatalogItem("kamino-usdc-supply"),
    protocol: {
      id: "kamino",
      name: "Kamino",
      riskTier: "shallows",
      auditCount: 4,
      tvlUsd: 3_000_000_000,
      ageMonths: 36,
    },
    position: {
      asset: "kUSDC",
      rawAmount: "12500000000",
      displayAmount: "12,500.00 USDC supplied",
      valueUsd: 12500,
      lastUpdatedAt: fetchedAt,
    },
    rate: {
      apy: 0.073,
      apyBreakdown: { supply: 0.061, rewards: 0.012 },
      fetchedAt,
    },
    error: null,
  },
  {
    catalogItemId: "kamino-supply-and-borrow",
    catalogItem: getCatalogItem("kamino-supply-and-borrow"),
    protocol: {
      id: "kamino",
      name: "Kamino",
      riskTier: "mid-depth",
      auditCount: 4,
      tvlUsd: 3_000_000_000,
      ageMonths: 36,
    },
    position: {
      asset: "SOL collateral",
      rawAmount: "3200000000",
      displayAmount: "3.2000 SOL supplied",
      valueUsd: 528,
      debt: {
        asset: "USDC",
        rawAmount: "180000000",
        displayAmount: "180.00 USDC borrowed",
        valueUsd: 180,
      },
      healthFactor: 1.84,
      lastUpdatedAt: fetchedAt,
    },
    rate: {
      apy: -0.041,
      apyBreakdown: { borrowCost: -0.041 },
      fetchedAt,
    },
    error: null,
  },
];
