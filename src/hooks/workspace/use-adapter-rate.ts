"use client";

import { useEffect, useState } from "react";

import { isDesignMode } from "@/lib/app-mode";
import { getDesignModeAdapterRate } from "@/mock-data/design-mode/rates";

type APYQuote = {
  apy: number;
  apyBreakdown?: Record<string, number>;
  fetchedAt: number;
};

type RateResponse = {
  catalogItemId: string;
  rate: APYQuote | null;
  error?: string;
  detail?: string;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; rate: APYQuote | null }
  | { kind: "error"; message: string };

const cache = new Map<string, { rate: APYQuote | null; fetchedAt: number }>();
const CACHE_TTL_MS = 60_000;

/**
 * Fetches the current APY for a registered adapter via /api/solana/rates.
 * Results are memoized in-module for `CACHE_TTL_MS` so multiple strategy
 * nodes referencing the same adapter share a single round-trip per
 * minute. Adapters whose readRate() returns null (e.g., Jupiter swap)
 * resolve to `{ kind: "ready", rate: null }` and the caller is expected
 * to fall back to the static catalog display string.
 */
function useDesignModeAdapterRate(catalogItemId: string | undefined): State {
  if (!catalogItemId) {
    return { kind: "idle" };
  }

  return { kind: "ready", rate: getDesignModeAdapterRate(catalogItemId) };
}

function useLiveAdapterRate(catalogItemId: string | undefined) {
  const [state, setState] = useState<State>({ kind: "idle" });

  useEffect(() => {
    if (!catalogItemId) {
      setState({ kind: "idle" });
      return;
    }

    const cached = cache.get(catalogItemId);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      setState({ kind: "ready", rate: cached.rate });
      return;
    }

    let cancelled = false;
    setState({ kind: "loading" });

    (async () => {
      try {
        const response = await fetch(
          `/api/solana/rates?catalogItemId=${encodeURIComponent(catalogItemId)}`,
        );
        const data = (await response.json()) as RateResponse;
        if (!response.ok) {
          throw new Error(data.detail ?? data.error ?? `HTTP ${response.status.toString()}`);
        }
        cache.set(catalogItemId, {
          rate: data.rate,
          fetchedAt: Date.now(),
        });
        if (!cancelled) {
          setState({ kind: "ready", rate: data.rate });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            kind: "error",
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [catalogItemId]);

  return state;
}

export const useAdapterRate = isDesignMode
  ? useDesignModeAdapterRate
  : useLiveAdapterRate;

export function formatApy(apy: number): string {
  // adapter.readRate() returns APY as a fraction (0.059 = 5.9%).
  return `${(apy * 100).toFixed(2)}%`;
}
