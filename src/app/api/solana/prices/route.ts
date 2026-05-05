import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/solana/prices?symbols=SOL,USDC,JitoSOL
 *
 * Returns a map of symbol -> { usdPrice, source, fetchedAt }. Powers
 * USD-value projections in the wallet node, the leverage-loop adapter's
 * borrow-amount estimate, and the compounded yield display when SOL
 * positions need a USD denomination.
 *
 * Source: Jupiter price API v3 (price.jup.ag/v3/price). Free, no key,
 * stable, surfaces SOL + most SPL tokens. We hit it with mint addresses
 * for accuracy — symbols are lookup-only on our side via SWAP_ASSETS.
 *
 * Failure mode: any upstream issue returns 200 with an empty / partial
 * map plus an `errors` field. Callers gracefully fall back to estimates
 * (the leverage-loop adapter's hardcoded $150) when prices are missing.
 * Better to ship a slightly-stale demo than to fail loudly.
 */

import { SWAP_ASSETS } from "@/lib/solana/adapter-catalog";

type PriceEntry = {
  usdPrice: number;
  source: string;
  fetchedAt: number;
};

type PriceResponse = {
  prices: Record<string, PriceEntry>;
  errors: string[];
};

const JUPITER_PRICE_URL = "https://lite-api.jup.ag/price/v3";

type JupiterPriceItem = {
  usdPrice?: number;
  blockId?: number;
  decimals?: number;
  priceChange24h?: number;
};

type JupiterPriceResponse = Record<string, JupiterPriceItem>;

export async function GET(request: Request): Promise<NextResponse<PriceResponse>> {
  const url = new URL(request.url);
  const symbolsParam = url.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json(
      { prices: {}, errors: ["missing ?symbols=<comma,separated>"] },
      { status: 400 },
    );
  }

  const requestedSymbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Map symbols -> mint addresses (Jupiter price API keys by mint).
  // Unknown symbols flow through as errors; known-but-not-priced
  // symbols (e.g., USDC may not have a USD price returned since it's
  // already $1) get filled with a 1.0 fallback below.
  const symbolToMint = new Map<string, string>();
  const unknownSymbols: string[] = [];
  for (const symbol of requestedSymbols) {
    const asset = SWAP_ASSETS.find(
      (a) => a.symbol.toLowerCase() === symbol.toLowerCase(),
    );
    if (asset) {
      symbolToMint.set(asset.symbol, asset.mint);
    } else {
      unknownSymbols.push(symbol);
    }
  }

  const errors: string[] = unknownSymbols.map(
    (s) => `unknown symbol "${s}" (no entry in SWAP_ASSETS)`,
  );

  if (symbolToMint.size === 0) {
    return NextResponse.json({ prices: {}, errors });
  }

  const prices: Record<string, PriceEntry> = {};

  try {
    const ids = Array.from(symbolToMint.values()).join(",");
    const response = await fetch(`${JUPITER_PRICE_URL}?ids=${ids}`, {
      method: "GET",
      // Jupiter's lite endpoint is fast; no need for long timeouts.
      // Caching at the edge is a future optimization.
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      errors.push(`Jupiter price API HTTP ${response.status.toString()}`);
    } else {
      const body = (await response.json()) as JupiterPriceResponse;
      const fetchedAt = Date.now();
      for (const [symbol, mint] of symbolToMint) {
        const entry = body[mint];
        if (entry?.usdPrice !== undefined && Number.isFinite(entry.usdPrice)) {
          prices[symbol] = {
            usdPrice: entry.usdPrice,
            source: "jupiter",
            fetchedAt,
          };
        }
      }
    }
  } catch (err) {
    errors.push(
      `Jupiter price fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Stablecoin fallback: if USDC/USDT weren't returned by the upstream,
  // they're peg-priced at $1 anyway. Saves a special case in callers.
  for (const symbol of symbolToMint.keys()) {
    if (prices[symbol]) continue;
    if (symbol === "USDC" || symbol === "USDT") {
      prices[symbol] = {
        usdPrice: 1,
        source: "peg-fallback",
        fetchedAt: Date.now(),
      };
    }
  }

  return NextResponse.json({ prices, errors });
}
