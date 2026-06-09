"use client";

import { useCallback, useEffect, useState } from "react";
import { useTidalWallets } from "@/hooks/use-tidal-wallets";
import { isDesignMode } from "@/lib/app-mode";
import { designModePositions } from "@/mock-data/design-mode/positions";
import { designModeWalletAddress } from "@/mock-data/design-mode/wallet";
import { useChainStateSignal } from "@/providers/chain-state-signal-provider";
import type { NodeCatalogItem } from "@/mock-data/workspace/types";

export type LivePositionDebt = {
  asset: string;
  rawAmount: string;
  displayAmount: string;
  valueUsd?: number;
};

export type LivePosition = {
  asset: string;
  rawAmount: string;
  displayAmount: string;
  valueUsd?: number;
  debt?: LivePositionDebt;
  healthFactor?: number;
  lastUpdatedAt: number;
};

export type LiveProtocolMetadata = {
  id: string;
  name: string;
  riskTier: "shallows" | "mid-depth" | "deep-water";
  auditCount: number;
  tvlUsd: number;
  ageMonths: number;
};

export type LiveAPYQuote = {
  apy: number;
  apyBreakdown?: Record<string, number>;
  fetchedAt: number;
};

export type LivePositionEntry = {
  catalogItemId: string;
  catalogItem: NodeCatalogItem;
  protocol: LiveProtocolMetadata;
  position: LivePosition | null;
  rate: LiveAPYQuote | null;
  error: string | null;
};

type AllPositionsResponse = {
  wallet: string;
  fetchedAt: number;
  positions: LivePositionEntry[];
  error?: string;
  detail?: string;
};

type State =
  | { kind: "no-wallet" }
  | { kind: "loading"; address: string }
  | {
      kind: "ready";
      address: string;
      positions: LivePositionEntry[];
      fetchedAt: number;
    }
  | { kind: "error"; address: string; message: string };

/**
 * Fetches the user's positions across every registered ProtocolAdapter
 * via the /api/solana/positions/all aggregation route. Single
 * round-trip; the route fans out per-adapter on the server. Exposes a
 * `refetch` callback so callers can refresh after a successful run on
 * the canvas (Tier 1 #4 Phase D wires that up).
 */
function useDesignModeAllPositions() {
  const refetch = useCallback(async () => {}, []);

  return {
    state: {
      kind: "ready",
      address: designModeWalletAddress,
      positions: designModePositions,
      fetchedAt: Date.parse("2026-06-09T12:00:00.000Z"),
    } as State,
    refetch,
  };
}

function useLiveAllPositions() {
  const { wallets } = useTidalWallets();
  const wallet = wallets[0];
  const address = wallet?.address;
  const { signal } = useChainStateSignal();
  const [state, setState] = useState<State>({ kind: "no-wallet" });

  const refetch = useCallback(async () => {
    if (!address) {
      setState({ kind: "no-wallet" });
      return;
    }
    setState({ kind: "loading", address });
    try {
      const response = await fetch(
        `/api/solana/positions/all?wallet=${encodeURIComponent(address)}`,
      );
      const data = (await response.json()) as AllPositionsResponse;
      if (!response.ok) {
        throw new Error(
          data.detail ?? data.error ?? `HTTP ${response.status.toString()}`,
        );
      }
      setState({
        kind: "ready",
        address,
        positions: data.positions,
        fetchedAt: data.fetchedAt,
      });
    } catch (err) {
      setState({
        kind: "error",
        address,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [address]);

  // Refetch on mount, whenever the wallet address changes, AND
  // whenever the chain-state signal bumps (after a successful canvas
  // run, AI compose run, etc. — bumpSignal in the run handlers).
  useEffect(() => {
    void refetch();
  }, [refetch, signal]);

  return { state, refetch };
}

export const useAllPositions = isDesignMode
  ? useDesignModeAllPositions
  : useLiveAllPositions;
