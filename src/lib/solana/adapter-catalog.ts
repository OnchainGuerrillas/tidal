// Client-safe (no `server-only`). The adapter implementations in jito.ts /
// kamino.ts / jupiter-swap.ts re-export their catalog item and widget
// schema from here so that the workspace UI (picker, node factory, node
// renderer) and the registry stay in sync without the UI having to import
// server-only adapter modules.

import type { NodeCatalogItem } from "@/mock-data/workspace/types";
import type { WidgetSchema } from "./types";

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
  // Widget metadata for the input form rendered on adapter-backed
  // strategy nodes. Mirrors the runtime ProtocolAdapter.widgets so the
  // canvas can author the same inputs the runner consumes.
  widgets: WidgetSchema[];
  // Decimal precision of the *input* asset (entry node's source amount).
  // Used to translate user-entered decimal amounts into base units when
  // building the ExecutableNode's sourceAmount. SOL = 9, USDC = 6, etc.
  inputDecimals: number;
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
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "Amount to stake (SOL)",
      min: 0,
      default: 0.01,
      required: true,
    },
  ],
  inputDecimals: 9,
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
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "Amount to supply (USDC)",
      min: 0,
      default: 1,
      required: true,
    },
  ],
  inputDecimals: 6,
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
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "Amount to swap (SOL)",
      min: 0,
      default: 0.01,
      required: true,
    },
    {
      key: "slippageBps",
      kind: "number",
      label: "Max slippage (basis points)",
      min: 0,
      max: 10000,
      default: 50,
      required: false,
    },
  ],
  inputDecimals: 9,
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

/**
 * Convert a decimal user-entered amount (e.g., 0.01 SOL) into a base-unit
 * BigInt (e.g., 10_000_000n lamports) using the entry's inputDecimals.
 * Returns null if the value isn't a positive finite number.
 */
export function decimalToBaseUnits(
  decimalAmount: number,
  decimals: number,
): bigint | null {
  if (!Number.isFinite(decimalAmount) || decimalAmount < 0) return null;
  // Multiply with rounding to avoid float drift (0.1 + 0.2 -> 0.300...4).
  // Math.round(decimal * 10^decimals) gives an integer in base units.
  const scaled = Math.round(decimalAmount * Math.pow(10, decimals));
  if (!Number.isFinite(scaled) || scaled < 0) return null;
  return BigInt(scaled);
}
