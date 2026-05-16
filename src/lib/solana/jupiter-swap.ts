import "server-only";

import { getAdapterCatalogEntry, getSwapAsset, type SwapAsset } from "./adapter-catalog";
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

// Ultra path: bundles Beam relayer and priority fees, but pre-validates that
// the taker holds the input asset at build time. Used for standalone Swap
// nodes where the wallet is expected to already hold the input asset.
const JUPITER_ULTRA_ORDER_URL = "https://api.jup.ag/ultra/v1/order";

// Lazy path: classic Swap API on the lite tier (keyless). Does NOT pre-
// validate taker balance — used inside composed adapters like the
// leverage loop where the swap is assembled before the upstream borrow
// has executed and the wallet doesn't yet hold the input asset. The
// returned tx is unsigned and we submit it through our standard route.
// Trade-off vs Ultra: no Beam relayer, so priority fees must be set by
// Jupiter (we pass `prioritizationFeeLamports: "auto"`).
const JUPITER_LITE_QUOTE_URL = "https://lite-api.jup.ag/swap/v1/quote";
const JUPITER_LITE_SWAP_URL = "https://lite-api.jup.ag/swap/v1/swap";

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

type JupiterQuoteResponse = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct?: string;
  routePlan: unknown[];
  contextSlot?: number;
};

type JupiterSwapResponse = {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
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

type ResolvedSwap = {
  inputAsset: SwapAsset;
  outputAsset: SwapAsset;
  slippageBps: number;
};

function resolveSwapParams(params: BuildTransactionParams): ResolvedSwap {
  const inputBase = params.inputAmount;
  if (inputBase <= 0n) {
    throw new Error(
      `Jupiter swap requires a positive input amount (got ${inputBase.toString()})`,
    );
  }

  const inputSymbolWidget = params.widgets.inputAsset;
  const outputSymbolWidget = params.widgets.outputAsset;
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

  return { inputAsset, outputAsset, slippageBps };
}

function slippageWarnings(slippageBps: number): string[] {
  if (slippageBps < 100) return [];
  return [
    `slippage tolerance is ${slippageBps.toString()} bps (${(slippageBps / 100).toFixed(2)}%) - confirm this is intended`,
  ];
}

async function buildViaUltra(
  params: BuildTransactionParams,
  resolved: ResolvedSwap,
): Promise<BuildTransactionResult> {
  const url = new URL(JUPITER_ULTRA_ORDER_URL);
  url.searchParams.set("inputMint", resolved.inputAsset.mint);
  url.searchParams.set("outputMint", resolved.outputAsset.mint);
  url.searchParams.set("amount", params.inputAmount.toString());
  url.searchParams.set("taker", params.walletPublicKey);
  url.searchParams.set("slippageBps", resolved.slippageBps.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `Jupiter Ultra /order returned ${response.status.toString()}: ${await response.text()}`,
    );
  }
  const order = (await response.json()) as JupiterOrderResponse;
  if (order.errorCode || !order.transaction) {
    throw new Error(
      `Jupiter Ultra /order error: ${order.errorMessage ?? order.errorCode ?? "no transaction returned"}`,
    );
  }

  const outAmount = order.outAmount ? BigInt(order.outAmount) : 0n;
  return {
    transactionsBase64: [order.transaction],
    expectedOutputAmount: outAmount,
    fees: {
      networkLamports: 5000n,
    },
    warnings: slippageWarnings(resolved.slippageBps),
  };
}

async function buildViaQuoteSwap(
  params: BuildTransactionParams,
  resolved: ResolvedSwap,
): Promise<BuildTransactionResult> {
  const quoteUrl = new URL(JUPITER_LITE_QUOTE_URL);
  quoteUrl.searchParams.set("inputMint", resolved.inputAsset.mint);
  quoteUrl.searchParams.set("outputMint", resolved.outputAsset.mint);
  quoteUrl.searchParams.set("amount", params.inputAmount.toString());
  quoteUrl.searchParams.set("slippageBps", resolved.slippageBps.toString());
  quoteUrl.searchParams.set("swapMode", "ExactIn");

  const quoteRes = await fetch(quoteUrl.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!quoteRes.ok) {
    throw new Error(
      `Jupiter /quote returned ${quoteRes.status.toString()}: ${await quoteRes.text()}`,
    );
  }
  const quote = (await quoteRes.json()) as JupiterQuoteResponse;

  const swapRes = await fetch(JUPITER_LITE_SWAP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: params.walletPublicKey,
      // Wrap/unwrap SOL automatically so the user doesn't have to think about
      // wSOL accounts when SOL is one of the legs. Matches Ultra's behavior.
      wrapAndUnwrapSol: true,
      // Let Jupiter size the CU limit based on simulation. Avoids hardcoded
      // limits failing on heavier multi-hop routes.
      dynamicComputeUnitLimit: true,
      // Auto priority fee tuned to current congestion. We accept the cost on
      // behalf of the user since the leverage-loop context cares more about
      // landing than minimizing fee.
      prioritizationFeeLamports: "auto",
    }),
  });
  if (!swapRes.ok) {
    throw new Error(
      `Jupiter /swap returned ${swapRes.status.toString()}: ${await swapRes.text()}`,
    );
  }
  const swap = (await swapRes.json()) as JupiterSwapResponse;
  if (!swap.swapTransaction) {
    throw new Error("Jupiter /swap returned no swapTransaction");
  }

  return {
    transactionsBase64: [swap.swapTransaction],
    expectedOutputAmount: BigInt(quote.outAmount),
    fees: {
      networkLamports: 5000n,
      priorityLamports:
        typeof swap.prioritizationFeeLamports === "number"
          ? BigInt(swap.prioritizationFeeLamports)
          : undefined,
    },
    warnings: slippageWarnings(resolved.slippageBps),
  };
}

async function buildTransaction(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  const resolved = resolveSwapParams(params);
  return buildViaUltra(params, resolved);
}

/**
 * Lazy/composition entry point used by adapters that assemble swaps
 * before the upstream tx has executed (e.g. `kamino-leverage-loop`
 * building iteration N's USDC->SOL swap before iteration N's borrow tx
 * has landed and credited the wallet with USDC). Ultra `/order`
 * pre-validates that the taker holds the input asset, which trips
 * speculative builds; `/quote` + `/swap` does not.
 *
 * Public Swap nodes keep using Ultra via `buildTransaction` to preserve
 * the Beam relayer UX. This entry point is internal to in-process
 * adapter composition; it is not exposed via the adapter registry or
 * the build-transaction API route.
 */
export async function buildJupiterSwapLazy(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  const resolved = resolveSwapParams(params);
  return buildViaQuoteSwap(params, resolved);
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
