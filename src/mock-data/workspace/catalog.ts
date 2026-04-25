import { ADAPTER_CATALOG_ITEMS } from "@/lib/solana/adapter-catalog";

import type { NodeCatalogItem } from "./types";

export const workspaceSuggestions = [
  "Optimise this strategy",
  "Add a new node",
  "Show risk breakdown",
];

export const workspaceSupportedAssets = [
  "SOL",
  "USDC",
  "mSOL",
  "mSOL yield",
  "JitoSOL",
  "kUSDC",
  "LP Fees",
  "Interest",
  "MNDE rewards",
  "MRGN rewards",
  "ORCA rewards",
  "RAY rewards",
] as const;

const visualOnlyCatalog: NodeCatalogItem[] = [
  {
    id: "amount",
    title: "Set amount",
    description: "Choose a fixed amount or percentage before routing funds.",
    group: "route_math",
    nodeKind: "amount",
    supportedInputAssets: [...workspaceSupportedAssets],
    primaryOutputAsset: "Selected asset",
    keywords: ["amount", "percentage", "fixed", "math", "route"],
  },
  {
    id: "split",
    title: "Split funds",
    description: "Branch one asset stream into two downstream paths.",
    group: "route_math",
    nodeKind: "split",
    supportedInputAssets: [...workspaceSupportedAssets],
    primaryOutputAsset: "Split output",
    keywords: ["split", "branch", "route", "math"],
  },
  {
    id: "destination",
    title: "Send to wallet",
    description: "Route assets or rewards back into the wallet.",
    group: "wallet",
    nodeKind: "destination",
    supportedInputAssets: [...workspaceSupportedAssets],
    keywords: ["wallet", "destination", "return", "send"],
  },
  {
    id: "reward",
    title: "Collect rewards",
    description: "Model a reward collection step before routing it elsewhere.",
    group: "rewards",
    nodeKind: "reward",
    supportedInputAssets: [
      "LP Fees",
      "Interest",
      "MNDE rewards",
      "MRGN rewards",
      "ORCA rewards",
      "RAY rewards",
      "mSOL yield",
    ],
    primaryOutputAsset: "Collected rewards",
    keywords: ["rewards", "fees", "harvest", "collect", "interest"],
  },
  {
    id: "marinade-stake",
    title: "Stake with Marinade",
    description: "Convert SOL into a liquid staking position.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["SOL"],
    primaryOutputAsset: "mSOL",
    protocolLabel: "Marinade",
    keywords: ["stake", "staking", "marinade", "liquid staking"],
  },
  {
    id: "kamino-borrow",
    title: "Supply and borrow on Kamino",
    description: "Use mSOL as collateral and borrow USDC.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["mSOL"],
    primaryOutputAsset: "USDC",
    protocolLabel: "Kamino",
    keywords: ["kamino", "supply", "borrow", "collateral", "lending"],
  },
  {
    id: "marginfi-lend",
    title: "Lend on Marginfi",
    description: "Supply USDC into a lower-volatility lending branch.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["USDC"],
    primaryOutputAsset: "Interest",
    protocolLabel: "Marginfi",
    keywords: ["marginfi", "lend", "lending", "interest", "supply"],
  },
  {
    id: "drift-lend",
    title: "Lend on Drift",
    description: "Lend mSOL and route the resulting yield stream onward.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["mSOL"],
    primaryOutputAsset: "mSOL yield",
    protocolLabel: "Drift",
    keywords: ["drift", "lend", "yield", "interest"],
  },
  {
    id: "orca-lp",
    title: "Provide liquidity on Orca",
    description: "Use mSOL or yield output in a concentrated LP branch.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["mSOL", "mSOL yield"],
    primaryOutputAsset: "LP Fees",
    protocolLabel: "Orca",
    keywords: ["orca", "lp", "liquidity", "fees", "amm"],
  },
  {
    id: "raydium-lp",
    title: "Provide liquidity on Raydium",
    description: "Deploy USDC into a higher-yield LP route.",
    group: "strategy",
    nodeKind: "strategy",
    supportedInputAssets: ["USDC"],
    primaryOutputAsset: "LP Fees",
    protocolLabel: "Raydium",
    keywords: ["raydium", "lp", "liquidity", "fees", "amm"],
  },
];

// Adapter-backed entries (Jito / Kamino USDC / Jupiter swap) appear after
// the visual-only entries. These are the only items the graph runner can
// execute today; visual-only entries (Marinade, Marginfi, etc.) render
// fine but are not runnable until adapters land for them.
export const nodeCatalog: NodeCatalogItem[] = [
  ...visualOnlyCatalog,
  ...ADAPTER_CATALOG_ITEMS,
];

export function isCatalogItemCompatible(
  item: NodeCatalogItem,
  asset?: string | null
) {
  if (!asset) {
    return true;
  }

  return item.supportedInputAssets.includes(asset);
}
