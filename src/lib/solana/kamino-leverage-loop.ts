import "server-only";

import { address } from "@solana/kit";

import {
  decimalToBaseUnits,
  getAdapterCatalogEntry,
} from "./adapter-catalog";
import { getSolanaRpc } from "./connection";
import { buildJupiterSwapLazy } from "./jupiter-swap";
import { kaminoSupplyAndBorrowAdapter } from "./kamino-borrow";
import {
  SOL_MINT_ADDRESS,
  USDC_MINT_ADDRESS,
  loadKaminoMainMarket,
} from "./kamino-shared";
import type {
  APYQuote,
  BuildTransactionParams,
  BuildTransactionResult,
  PositionSnapshot,
  ProtocolAdapter,
  ReadPositionParams,
  WidgetSchema,
} from "./types";

const ENTRY = getAdapterCatalogEntry("kamino-leverage-loop")!;
const CATALOG_ITEM = ENTRY.catalogItem;
const WIDGETS: WidgetSchema[] = ENTRY.widgets;

const SOL_DECIMALS = 9;
const USDC_DECIMALS = 6;

// Fallback SOL price for borrow-amount estimation when the live price
// fetch fails. The on-chain Kamino LTV check is what actually
// constrains the borrow at execution time; this estimate just picks a
// target. Conservative LTV defaults (0.5) leave plenty of safety
// margin so a stale or unavailable price doesn't push the borrow over
// the LTV ceiling.
const SOL_PRICE_FALLBACK_USD = 150;

// Live SOL price via Jupiter price API (proxied through our route so
// browser CORS isn't an issue and we can swap providers without
// touching adapters). Returns null on any failure — callers fall back
// to the constant above.
async function fetchLiveSolPriceUsd(): Promise<number | null> {
  try {
    // Server-to-server fetch: relative URL won't work because there's
    // no implicit base. Direct upstream call is fine here since this
    // only runs during buildTransaction on the server.
    const response = await fetch(
      "https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112",
      { method: "GET", headers: { "Content-Type": "application/json" } },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as Record<string, { usdPrice?: number }>;
    const sol = body["So11111111111111111111111111111111111111112"];
    const price = sol?.usdPrice;
    if (typeof price === "number" && Number.isFinite(price) && price > 0) {
      return price;
    }
    return null;
  } catch {
    return null;
  }
}

async function readPosition(
  params: ReadPositionParams,
): Promise<PositionSnapshot | null> {
  // Composite adapter — the underlying obligation it operates on is
  // surfaced by kamino-borrow.ts's readPosition. Returning null here
  // avoids double-counting in the Investments panel.
  void params;
  return null;
}

async function readRate(): Promise<APYQuote | null> {
  // Effective net yield is a function of the user's loopCount and
  // targetLTV widgets, so we can't compute it server-side. Instead we
  // surface the underlying SOL-supply / USDC-borrow rates via
  // apyBreakdown, and let the strategy-node card compute the live
  // effective yield via effectiveLeveragedYield() the moment widgets
  // change. Headline `apy` is the SOL supply rate as a sensible
  // single-number fallback — the projection string is the canonical
  // display.
  const rpc = getSolanaRpc();
  const market = await loadKaminoMainMarket();
  const solReserve = market.getReserveByMint(
    address(SOL_MINT_ADDRESS) as unknown as Parameters<
      typeof market.getReserveByMint
    >[0],
  );
  const usdcReserve = market.getReserveByMint(
    address(USDC_MINT_ADDRESS) as unknown as Parameters<
      typeof market.getReserveByMint
    >[0],
  );
  if (!solReserve || !usdcReserve) {
    throw new Error(
      "Kamino main market missing SOL or USDC reserve — cannot read leverage rates.",
    );
  }
  const slot = await rpc.getSlot().send();
  const solSupplyApy = Number(
    solReserve.totalSupplyAPY(
      slot as unknown as Parameters<typeof solReserve.totalSupplyAPY>[0],
    ),
  );
  const usdcBorrowApy = Number(
    usdcReserve.totalBorrowAPY(
      slot as unknown as Parameters<typeof usdcReserve.totalBorrowAPY>[0],
    ),
  );
  return {
    apy: solSupplyApy,
    apyBreakdown: {
      solSupply: solSupplyApy,
      usdcBorrow: usdcBorrowApy,
    },
    fetchedAt: Date.now(),
  };
}

async function buildTransaction(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  // Initial collateral comes in as SOL lamports — derive-executable-
  // plan converts the user's `amount` widget via decimalToBaseUnits.
  const initialSol = params.inputAmount;
  if (initialSol <= 0n) {
    throw new Error(
      `Leverage loop requires a positive initial SOL collateral (got ${initialSol.toString()})`,
    );
  }

  const loopCountWidget = params.widgets.loopCount;
  if (
    typeof loopCountWidget !== "number" ||
    !Number.isInteger(loopCountWidget) ||
    loopCountWidget < 1 ||
    loopCountWidget > 3
  ) {
    throw new Error(
      `Leverage loop: loopCount must be an integer between 1 and 3 (got ${typeof loopCountWidget === "number" ? loopCountWidget.toString() : "undefined"}).`,
    );
  }

  const ltvWidget = params.widgets.targetLTV;
  if (
    typeof ltvWidget !== "number" ||
    ltvWidget < 0.3 ||
    ltvWidget > 0.7
  ) {
    throw new Error(
      `Leverage loop: targetLTV must be between 0.3 and 0.7 (got ${typeof ltvWidget === "number" ? ltvWidget.toString() : "undefined"}).`,
    );
  }

  const loopCount = loopCountWidget;
  const targetLTV = ltvWidget;

  // Fetch live SOL price up front so we don't pay the round-trip per
  // iteration. Falls back to the constant on any failure — the
  // hardcoded estimate is conservative enough that a missing live
  // price won't blow up Kamino's LTV check.
  const liveSolPrice = await fetchLiveSolPriceUsd();
  const solPriceUsd = liveSolPrice ?? SOL_PRICE_FALLBACK_USD;
  const priceSource = liveSolPrice !== null ? "live" : "fallback";

  // Orchestration: we call the supply-and-borrow adapter and the
  // Jupiter swap adapter in alternation, accumulating their txs into
  // one big array. Each call's expectedOutputAmount feeds the next
  // iteration. The runner already handles arbitrarily-long
  // transactionsBase64 arrays via the multi-tx contract — we just
  // need to assemble them.
  const allTxs: string[] = [];
  let currentSolLamports = initialSol;
  const allWarnings: string[] = [];

  for (let i = 0; i < loopCount; i++) {
    // Estimate how much USDC to borrow at targetLTV.
    //   collateral_value_usd = sol_lamports / 1e9 * SOL_PRICE
    //   borrow_usdc          = collateral_value_usd * targetLTV
    const solDecimal = Number(currentSolLamports) / 10 ** SOL_DECIMALS;
    const borrowUsdcDecimal = solDecimal * solPriceUsd * targetLTV;
    if (borrowUsdcDecimal < 0.5) {
      // Below a sensible Kamino borrow floor — bail out so the user
      // doesn't trip a tx failure on a tiny dust borrow. We've already
      // built the prior iterations' txs; just stop expanding.
      allWarnings.push(
        `Leverage loop iteration ${(i + 1).toString()}: borrow amount (${borrowUsdcDecimal.toFixed(4)} USDC) below practical floor; stopping early.`,
      );
      break;
    }

    // Step 1: supply collateral + borrow USDC.
    const supplyAndBorrow = await kaminoSupplyAndBorrowAdapter.buildTransaction({
      walletPublicKey: params.walletPublicKey,
      inputAmount: currentSolLamports,
      widgets: {
        amount: solDecimal,
        borrowAmount: borrowUsdcDecimal,
      },
    });
    allTxs.push(...supplyAndBorrow.transactionsBase64);
    if (supplyAndBorrow.warnings) {
      allWarnings.push(
        ...supplyAndBorrow.warnings.map(
          (w) => `iter ${(i + 1).toString()} (supply+borrow): ${w}`,
        ),
      );
    }

    // Step 2: swap borrowed USDC → SOL, unless this is the final
    // iteration (we leave the borrowed USDC in the wallet so the user
    // ends with: leveraged SOL collateral + USDC debt + a small chunk
    // of liquid USDC from the last borrow).
    const isLastIteration = i === loopCount - 1;
    if (isLastIteration) break;

    const borrowedUsdcRaw = decimalToBaseUnits(borrowUsdcDecimal, USDC_DECIMALS);
    if (borrowedUsdcRaw === null) {
      throw new Error(
        `Leverage loop iteration ${(i + 1).toString()}: failed to convert borrow amount to USDC base units.`,
      );
    }

    // Lazy build (Jupiter /quote + /swap, not Ultra /order). Ultra's
    // pre-validation would reject this call because we're assembling
    // the swap before the upstream borrow tx has landed and credited
    // the wallet with USDC. /quote + /swap does not pre-validate.
    const swap = await buildJupiterSwapLazy({
      walletPublicKey: params.walletPublicKey,
      inputAmount: borrowedUsdcRaw,
      widgets: {
        inputAsset: "USDC",
        outputAsset: "SOL",
        amount: borrowUsdcDecimal,
        slippageBps: 100,
      },
    });
    allTxs.push(...swap.transactionsBase64);
    if (swap.warnings) {
      allWarnings.push(
        ...swap.warnings.map(
          (w) => `iter ${(i + 1).toString()} (swap): ${w}`,
        ),
      );
    }

    // Update running SOL for the next iteration. Jupiter's
    // expectedOutputAmount is the swap's quoted output (SOL lamports),
    // which is a reasonable estimate of what the user will receive
    // after slippage.
    currentSolLamports = swap.expectedOutputAmount;
    if (currentSolLamports <= 0n) {
      allWarnings.push(
        `Leverage loop iteration ${(i + 1).toString()}: swap quoted zero output; stopping early.`,
      );
      break;
    }
  }

  // Estimated total fees: each tx pays ~5000 lamports network fee.
  // Some txs (Jupiter swap) include priority fees; we don't have
  // visibility into those here, so this is a lower bound.
  const networkLamports = BigInt(allTxs.length * 5000);

  return {
    transactionsBase64: allTxs,
    // Output represents the SOL collateral position after the final
    // iteration's supply (i.e., the largest the loop ever was). This
    // is what a downstream consumer of the leverage-loop node's
    // output handle would treat as the "result." Approximate.
    expectedOutputAmount: currentSolLamports,
    fees: { networkLamports },
    warnings: [
      `Leverage loop expands into ${allTxs.length.toString()} on-chain transactions (${loopCount.toString()} iteration${loopCount === 1 ? "" : "s"}, target LTV ${(targetLTV * 100).toFixed(0)}%).`,
      `Borrow amounts estimated at SOL=$${solPriceUsd.toFixed(2)} (${priceSource}). Actual borrow capacity is enforced by Kamino's on-chain oracle.`,
      "Each iteration adds less than the last (geometric series). At 50% LTV: 2 loops ≈ 1.5x exposure; 3 loops ≈ 1.75x; 5 loops ≈ 1.94x; cap is 2x.",
      ...allWarnings,
    ],
  };
}

export const kaminoLeverageLoopAdapter: ProtocolAdapter = {
  catalogItemId: CATALOG_ITEM.id,
  catalogItem: CATALOG_ITEM,
  widgets: WIDGETS,
  protocol: {
    id: "kamino-leverage-loop",
    name: "Kamino + Jupiter (Leverage Loop)",
    auditCount: 3,
    tvlUsd: 3_000_000_000,
    ageMonths: 30,
    riskTier: "mid-depth",
  },
  readPosition,
  readRate,
  buildTransaction,
};
