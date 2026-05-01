import "server-only";

import { getAdapterCatalogEntry, getSwapAsset } from "./adapter-catalog";
import type {
  APYQuote,
  BuildTransactionParams,
  BuildTransactionResult,
  PositionSnapshot,
  ProtocolAdapter,
  ProtocolMetadata,
  ReadPositionParams,
  WidgetSchema,
} from "./types";

const JUPITER_ULTRA_ORDER_URL = "https://api.jup.ag/ultra/v1/order";

const ENTRY = getAdapterCatalogEntry("jupiter-swap-sol-usdc")!;
const CATALOG_ITEM = ENTRY.catalogItem;
const WIDGETS: WidgetSchema[] = ENTRY.widgets;

const PROTOCOL: ProtocolMetadata = {
  id: "jupiter",
  name: "Jupiter",
  auditCount: 5,
  tvlUsd: 2_000_000_000,
  ageMonths: 42,
  riskTier: "shallows",
};

type JupiterOrderResponse = {
  requestId?: string;
  transaction?: string;
  inAmount?: string;
  outAmount?: string;
  otherAmountThreshold?: string;
  slippageBps?: number;
  swapUsdValue?: string;
  errorCode?: string;
  errorMessage?: string;
};

async function readPosition(
  params: ReadPositionParams,
): Promise<PositionSnapshot | null> {
  // Swaps are stateless - there is no long-term position to read.
  void params;
  return null;
}

async function readRate(): Promise<APYQuote | null> {
  // Swaps do not have an APY. Returning null signals "no yield semantics"
  // to the positions route and any future rate-aware UI.
  return null;
}

async function buildTransaction(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  const inputBase = params.inputAmount;
  if (inputBase <= 0n) {
    throw new Error(
      `Jupiter swap requires a positive input amount (got ${inputBase.toString()})`,
    );
  }

  const inputSymbolWidget = params.widgets.inputAsset;
  const outputSymbolWidget = params.widgets.outputAsset;
  // Default to SOL → USDC if widgets are absent; this preserves the
  // original adapter behavior for callers (e.g., the AI compose tool)
  // that don't yet pick a direction.
  const inputSymbol =
    typeof inputSymbolWidget === "string" && inputSymbolWidget.length > 0
      ? inputSymbolWidget
      : "SOL";
  const outputSymbol =
    typeof outputSymbolWidget === "string" && outputSymbolWidget.length > 0
      ? outputSymbolWidget
      : "USDC";
  if (inputSymbol === outputSymbol) {
    throw new Error(
      `Jupiter swap input and output assets must differ (got ${inputSymbol}).`,
    );
  }

  const inputAsset = getSwapAsset(inputSymbol);
  const outputAsset = getSwapAsset(outputSymbol);
  if (!inputAsset) {
    throw new Error(`Jupiter swap: unsupported input asset "${inputSymbol}".`);
  }
  if (!outputAsset) {
    throw new Error(`Jupiter swap: unsupported output asset "${outputSymbol}".`);
  }

  const slippageBpsWidget = params.widgets.slippageBps;
  const slippageBps =
    typeof slippageBpsWidget === "number" && slippageBpsWidget >= 0
      ? Math.floor(slippageBpsWidget)
      : 50;

  const url = new URL(JUPITER_ULTRA_ORDER_URL);
  url.searchParams.set("inputMint", inputAsset.mint);
  url.searchParams.set("outputMint", outputAsset.mint);
  url.searchParams.set("amount", inputBase.toString());
  url.searchParams.set("taker", params.walletPublicKey);
  url.searchParams.set("slippageBps", slippageBps.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `Jupiter Ultra /order returned ${response.status}: ${await response.text()}`,
    );
  }
  const order = (await response.json()) as JupiterOrderResponse;
  if (order.errorCode || !order.transaction) {
    throw new Error(
      `Jupiter Ultra /order error: ${order.errorMessage ?? order.errorCode ?? "no transaction returned"}`,
    );
  }

  const outAmount = order.outAmount ? BigInt(order.outAmount) : 0n;
  const warnings: string[] = [];
  if (slippageBps >= 100) {
    warnings.push(
      `slippage tolerance is ${slippageBps} bps (${(slippageBps / 100).toFixed(2)}%) - confirm this is intended`,
    );
  }

  return {
    transactionsBase64: [order.transaction],
    expectedOutputAmount: outAmount,
    fees: {
      networkLamports: 5000n,
    },
    warnings,
  };
}

export const jupiterSolUsdcSwapAdapter: ProtocolAdapter = {
  catalogItemId: CATALOG_ITEM.id,
  catalogItem: CATALOG_ITEM,
  widgets: WIDGETS,
  protocol: PROTOCOL,
  readPosition,
  readRate,
  buildTransaction,
};
