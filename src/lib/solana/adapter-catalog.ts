// Client-safe (no `server-only`). The adapter implementations in jito.ts /
// kamino.ts / jupiter-swap.ts re-export their catalog item and widget
// schema from here so that the workspace UI (picker, node factory, node
// renderer) and the registry stay in sync without the UI having to import
// server-only adapter modules.

import type { NodeCatalogItem } from "@/mock-data/workspace/types";
import type { WidgetSchema } from "./types";

/**
 * Registry of swap-eligible assets. Used by the Jupiter Ultra adapter to
 * look up mint addresses + decimals from a user-selected asset symbol.
 * Adding a new asset here makes it available for both directions of the
 * swap node automatically — no code changes elsewhere.
 */
export type SwapAsset = {
  symbol: string;
  mint: string;
  decimals: number;
};

export const SWAP_ASSETS: SwapAsset[] = [
  {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
  },
  {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
  },
  {
    symbol: "USDT",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
  },
  {
    symbol: "JitoSOL",
    mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    decimals: 9,
  },
  {
    symbol: "mSOL",
    mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    decimals: 9,
  },
];

export const SWAP_ASSET_SYMBOLS: string[] = SWAP_ASSETS.map((a) => a.symbol);

export function getSwapAsset(symbol: string): SwapAsset | undefined {
  return SWAP_ASSETS.find((a) => a.symbol === symbol);
}

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

const JITO_UNSTAKE_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "jito-sol-unstake",
    title: "Unstake JitoSOL",
    description:
      "Burn JitoSOL and receive SOL via the Jito stake pool reserve (instant withdrawal, ~0.04% fee — no epoch delay).",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["JitoSOL"],
    primaryOutputAsset: "SOL",
    protocolLabel: "Jito",
    keywords: ["unstake", "redeem", "exit", "jito", "lst", "withdraw"],
  },
  actionLabel: "Unstake JitoSOL",
  apyDisplay: "n/a",
  apyType: "earn",
  outputAsset: "SOL",
  primaryHandleId: "next",
  primaryHandleLabel: "Withdrawn SOL",
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "Amount to unstake (JitoSOL)",
      min: 0,
      default: 0.005,
      required: true,
    },
  ],
  // JitoSOL has 9 decimals like SOL.
  inputDecimals: 9,
};

const KAMINO_WITHDRAW_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "kamino-usdc-withdraw",
    title: "Withdraw USDC from Kamino",
    description:
      "Withdraw your supplied USDC (plus accrued interest) from the Kamino main market. Closes part or all of a USDC supply position.",
    group: "strategy",
    nodeKind: "strategy",
    // Input is the kUSDC position (not a token in the wallet); typed
    // as kUSDC so an upstream Kamino-supply node's primary output can
    // wire into this withdraw node naturally.
    supportedInputAssets: ["kUSDC"],
    primaryOutputAsset: "USDC",
    protocolLabel: "Kamino",
    keywords: ["withdraw", "exit", "redeem", "kamino", "lending", "unwind"],
  },
  actionLabel: "Withdraw USDC",
  apyDisplay: "n/a",
  apyType: "earn",
  outputAsset: "USDC",
  primaryHandleId: "next",
  primaryHandleLabel: "Withdrawn USDC",
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "Amount to withdraw (USDC)",
      min: 0,
      default: 0.5,
      required: true,
    },
  ],
  // Withdraw amount is in USDC base units (6 decimals), regardless of
  // upstream input shape.
  inputDecimals: 6,
};

const KAMINO_REPAY_WITHDRAW_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "kamino-repay-and-withdraw",
    title: "Repay & Withdraw on Kamino",
    description:
      "Repay your USDC debt and withdraw your SOL collateral from the Kamino main market. Closes a supply-and-borrow obligation in two transactions.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["USDC"],
    primaryOutputAsset: "SOL",
    protocolLabel: "Kamino",
    keywords: ["repay", "close", "exit", "kamino", "borrow", "unwind", "withdraw"],
  },
  actionLabel: "Repay USDC & withdraw SOL",
  apyDisplay: "n/a",
  apyType: "earn",
  outputAsset: "SOL",
  primaryHandleId: "next",
  primaryHandleLabel: "Withdrawn SOL",
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "USDC to repay",
      min: 0,
      default: 1,
      required: true,
    },
    {
      key: "collateralAmount",
      kind: "number",
      label: "SOL collateral to withdraw",
      min: 0,
      default: 0.02,
      required: true,
    },
  ],
  // Repay amount is in USDC base units (6 decimals).
  inputDecimals: 6,
};

const KAMINO_LEVERAGE_LOOP_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "kamino-leverage-loop",
    title: "Leverage Loop on Kamino",
    description:
      "Recursive supply-and-borrow loop: deposit SOL collateral, borrow USDC, swap USDC → SOL via Jupiter, re-supply, repeat. Compounds your effective SOL exposure (up to ~3.3× at 70% LTV). Each loop adds less than the last (geometric series).",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["SOL"],
    primaryOutputAsset: "SOL",
    protocolLabel: "Kamino",
    keywords: [
      "leverage",
      "loop",
      "compound",
      "kamino",
      "borrow",
      "yield",
      "recursive",
    ],
  },
  // Cost-side: net interest paid on the leveraged USDC debt. Borrow APY
  // is "variable" for now; the position tracker shows it precisely.
  actionLabel: "Leverage SOL via Kamino + Jupiter",
  apyDisplay: "variable",
  apyType: "cost",
  outputAsset: "SOL",
  primaryHandleId: "next",
  primaryHandleLabel: "Leveraged SOL position",
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "Initial SOL collateral",
      min: 0.02,
      default: 0.1,
      required: true,
    },
    {
      key: "loopCount",
      kind: "number",
      label: "Loop count (1-3)",
      min: 1,
      max: 3,
      default: 2,
      required: true,
    },
    {
      key: "targetLTV",
      kind: "number",
      label: "Target LTV (0.3-0.7)",
      min: 0.3,
      max: 0.7,
      default: 0.5,
      required: true,
    },
  ],
  // SOL — initial collateral input is in lamports (9 decimals).
  inputDecimals: 9,
};

const KAMINO_BORROW_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    id: "kamino-supply-and-borrow",
    title: "Supply & Borrow on Kamino",
    description:
      "Deposit SOL collateral into the Kamino main market and borrow USDC against it in a single transaction. Foundation for leverage loops.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["SOL"],
    primaryOutputAsset: "USDC",
    protocolLabel: "Kamino",
    keywords: ["borrow", "leverage", "loan", "collateral", "kamino"],
  },
  actionLabel: "Supply SOL & borrow USDC",
  // Borrow APY varies; we surface it as a cost rather than a yield.
  apyDisplay: "variable",
  apyType: "cost",
  outputAsset: "USDC",
  primaryHandleId: "next",
  primaryHandleLabel: "Borrowed USDC",
  widgets: [
    {
      key: "amount",
      kind: "number",
      label: "SOL collateral",
      min: 0,
      default: 0.05,
      required: true,
    },
    {
      key: "borrowAmount",
      kind: "number",
      label: "USDC to borrow",
      min: 0,
      default: 5,
      required: true,
    },
  ],
  inputDecimals: 9,
};

const JUPITER_SWAP_ENTRY: AdapterCatalogEntry = {
  catalogItem: {
    // Id kept as "jupiter-swap-sol-usdc" for backwards compat with the
    // registry and the AI compose-strategy tool. The node now supports
    // any direction across the swap-asset registry; the id is just an
    // opaque key.
    id: "jupiter-swap-sol-usdc",
    title: "Swap (Jupiter)",
    description:
      "Swap any supported token pair via Jupiter Ultra. Best-of-route pricing with MEV protection.",
    group: "route_math",
    nodeKind: "strategy",
    supportedInputAssets: SWAP_ASSET_SYMBOLS,
    primaryOutputAsset: "selected output",
    protocolLabel: "Jupiter",
    keywords: ["swap", "jupiter", "ultra", "exchange", "convert"],
  },
  actionLabel: "Swap",
  apyDisplay: "n/a",
  apyType: "earn",
  outputAsset: "selected",
  primaryHandleId: "next",
  primaryHandleLabel: "Swapped output",
  widgets: [
    {
      key: "inputAsset",
      kind: "asset-selector",
      label: "From",
      options: SWAP_ASSET_SYMBOLS,
      default: "SOL",
      required: true,
    },
    {
      key: "outputAsset",
      kind: "asset-selector",
      label: "To",
      options: SWAP_ASSET_SYMBOLS,
      default: "USDC",
      required: true,
    },
    {
      key: "amount",
      kind: "number",
      label: "Amount",
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
  // For bidirectional swaps, inputDecimals is dynamic — derived from the
  // selected `inputAsset` widget at execution time. We keep the field
  // here pointing at SOL as a sane fallback, but `derive-executable-plan`
  // overrides it for adapter entries whose widgets include an asset-
  // selector keyed `inputAsset`.
  inputDecimals: 9,
};

export const ADAPTER_CATALOG_ENTRIES: AdapterCatalogEntry[] = [
  JITO_ENTRY,
  JITO_UNSTAKE_ENTRY,
  KAMINO_ENTRY,
  KAMINO_WITHDRAW_ENTRY,
  KAMINO_BORROW_ENTRY,
  KAMINO_REPAY_WITHDRAW_ENTRY,
  KAMINO_LEVERAGE_LOOP_ENTRY,
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
