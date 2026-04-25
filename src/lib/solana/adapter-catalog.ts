// Client-safe (no `server-only`). The adapter implementations in jito.ts /
// kamino.ts / jupiter-swap.ts re-export their catalog item from here so
// that the workspace UI (picker, node factory) and the registry stay in
// sync without the UI having to import server-only adapter modules.

import type { NodeCatalogItem } from "@/mock-data/workspace/types";

export type AdapterCatalogEntry = {
  catalogItem: NodeCatalogItem;
  // Display hints used when synthesizing a strategy node from this entry.
  // Live APYs come from `adapter.readRate()` at render time; these are
  // static placeholders for the picker / freshly-dropped nodes.
  actionLabel: string;
  apyDisplay: string;
  apyType: "earn" | "cost";
  outputAsset: string;
  primaryHandleId: string;
  primaryHandleLabel: string;
};

const JITO_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "jito-sol-stake",
    title: "Stake with Jito",
    description:
      "Stake SOL and receive JitoSOL (liquid staking with MEV tips, ~5.9% APY).",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["SOL"],
    primaryOutputAsset: "JitoSOL",
    protocolLabel: "Jito",
    keywords: ["stake", "lst", "liquid staking", "mev", "jito"],
  },
  actionLabel: "Stake SOL",
  apyDisplay: "~5.9%",
  apyType: "earn",
  outputAsset: "JitoSOL",
  primaryHandleId: "next",
  primaryHandleLabel: "Staked position",
};

const KAMINO_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "kamino-usdc-supply",
    title: "Lend USDC on Kamino",
    description:
      "Supply USDC to the Kamino main market lending pool and earn variable supply APY.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["USDC"],
    primaryOutputAsset: "kUSDC",
    protocolLabel: "Kamino",
    keywords: ["lend", "supply", "stablecoin", "kamino", "yield"],
  },
  actionLabel: "Supply USDC",
  apyDisplay: "variable",
  apyType: "earn",
  outputAsset: "kUSDC",
  primaryHandleId: "next",
  primaryHandleLabel: "Supplied position",
};

const JUPITER_SWAP_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "jupiter-swap-sol-usdc",
    title: "Swap SOL → USDC (Jupiter)",
    description:
      "Swap SOL for USDC via Jupiter Ultra. Returns best-of-route price with MEV protection.",
    group: "route_math",
    nodeKind: "strategy",
    supportedInputAssets: ["SOL"],
    primaryOutputAsset: "USDC",
    protocolLabel: "Jupiter",
    keywords: ["swap", "jupiter", "ultra", "exchange", "convert"],
  },
  actionLabel: "Swap SOL → USDC",
  apyDisplay: "n/a",
  apyType: "earn",
  outputAsset: "USDC",
  primaryHandleId: "next",
  primaryHandleLabel: "Swapped USDC",
};

export const ADAPTER_CATALOG_ENTRIES: AdapterCatalogEntry[] = [
  JITO_ENTRY,
  KAMINO_ENTRY,
  JUPITER_SWAP_ENTRY,
];

export function getAdapterCatalogEntry(
  catalogItemId: string,
): AdapterCatalogEntry | undefined {
  return ADAPTER_CATALOG_ENTRIES.find(
    (entry) => entry.catalogItem.id === catalogItemId,
  );
}

export const ADAPTER_CATALOG_ITEMS: NodeCatalogItem[] =
  ADAPTER_CATALOG_ENTRIES.map((entry) => entry.catalogItem);
