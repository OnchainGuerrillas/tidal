import "server-only";

import { getAdapterCatalogEntry } from "./adapter-catalog";
import { USDC_MINT_ADDRESS } from "./kamino";
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

const SOL_MINT_ADDRESS = "So11111111111111111111111111111111111111112";
const JUPITER_ULTRA_ORDER_URL = "https://api.jup.ag/ultra/v1/order";

const CATALOG_ITEM = getAdapterCatalogEntry("jupiter-swap-sol-usdc")!.catalogItem;

const WIDGETS: WidgetSchema[] = [
  {
    key: "amount",
    kind: "number",
    label: "Amount to swap (SOL)",
    min: 0,
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
];

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
  const lamports = params.inputAmount;
  if (lamports <= 0n) {
    throw new Error(
      `Jupiter swap requires a positive lamport amount (got ${lamports.toString()})`,
    );
  }

  const slippageBpsWidget = params.widgets.slippageBps;
  const slippageBps =
    typeof slippageBpsWidget === "number" && slippageBpsWidget >= 0
      ? Math.floor(slippageBpsWidget)
      : 50;

  const url = new URL(JUPITER_ULTRA_ORDER_URL);
  url.searchParams.set("inputMint", SOL_MINT_ADDRESS);
  url.searchParams.set("outputMint", USDC_MINT_ADDRESS);
  url.searchParams.set("amount", lamports.toString());
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
    transactionBase64: order.transaction,
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
