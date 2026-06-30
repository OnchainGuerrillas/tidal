"use client";

import { ArrowsClockwise } from "@phosphor-icons/react";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import {
  useAllPositions,
  type LivePositionEntry,
} from "@/hooks/workspace/use-all-positions";

export function InvestmentsContent() {
  const { state, refetch } = useAllPositions();

  return (
    <>
      {state.kind !== "no-wallet" ? (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            aria-label="Refresh positions"
            title="Refresh positions"
            onClick={() => void refetch()}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-tidal-border bg-tidal-card text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
          >
            <ArrowsClockwise
              weight="bold"
              className={`h-4 w-4 ${state.kind === "loading" ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      ) : null}
      <InvestmentsBody state={state} />
    </>
  );
}

export function InvestmentsView() {
  return (
    <div className="tidal-investments-view">
      <div className="tidal-investments-view-header">
        <div>
          <h1 className="text-2xl font-medium text-tidal-accent">
            Your investments
          </h1>
          <p className="mt-1 max-w-xl text-[13px] text-tidal-muted">
            Active positions across registered protocol adapters for the connected
            wallet.
          </p>
        </div>
      </div>

      <InvestmentsContent />
    </div>
  );
}

function InvestmentsBody({
  state,
}: {
  state: ReturnType<typeof useAllPositions>["state"];
}) {
  if (state.kind === "no-wallet") {
    return (
      <SurfaceCard tone="muted">
        <p className="tidal-text-message">
          Login with Privy to see live positions across Jito, Kamino, and any
          other protocols you have on-chain state with.
        </p>
      </SurfaceCard>
    );
  }

  if (state.kind === "loading") {
    return (
      <SurfaceCard tone="muted">
        <p className="tidal-text-message">Loading positions…</p>
      </SurfaceCard>
    );
  }

  if (state.kind === "error") {
    return (
      <SurfaceCard tone="muted">
        <p className="tidal-text-message text-red-400">
          Couldn&apos;t load positions: {state.message}
        </p>
      </SurfaceCard>
    );
  }

  if (state.positions.length === 0) {
    return (
      <SurfaceCard tone="muted">
        <p className="tidal-text-message">
          No active positions yet. Build a strategy on the canvas or ask the AI
          to compose one in chat to see it listed here.
        </p>
      </SurfaceCard>
    );
  }

  return (
    <div className="tidal-investments-grid">
      {state.positions.map((entry) => (
        <PositionCard key={entry.catalogItemId} entry={entry} />
      ))}
    </div>
  );
}

function PositionCard({ entry }: { entry: LivePositionEntry }) {
  const { catalogItem, protocol, position, rate, error } = entry;

  if (error) {
    return (
      <SurfaceCard className="border-amber-500/40 bg-amber-500/5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="tidal-text-eyebrow">{catalogItem.title}</span>
          <Badge variant="status">{protocol.riskTier}</Badge>
        </div>
        <p className="tidal-text-caption text-amber-300">
          Position read failed: {error}
        </p>
      </SurfaceCard>
    );
  }

  if (!position) return null;

  const apyDisplay =
    rate?.apy !== undefined ? `${(rate.apy * 100).toFixed(2)}%` : null;

  const projectedAnnualUsd =
    position.valueUsd !== undefined && rate?.apy !== undefined
      ? position.valueUsd * rate.apy
      : null;

  return (
    <SurfaceCard>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="tidal-text-eyebrow">{catalogItem.title}</span>
          <span className="tidal-text-caption text-tidal-muted">
            {protocol.name}
          </span>
        </div>
        <Badge variant="status">{protocol.riskTier}</Badge>
      </div>

      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="tidal-text-body text-foreground">
          {position.displayAmount}
        </span>
        {position.valueUsd !== undefined ? (
          <span className="tidal-text-caption text-tidal-muted">
            ≈ ${position.valueUsd.toFixed(2)}
          </span>
        ) : null}
      </div>

      {position.debt ? (
        <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="tidal-text-caption text-amber-300">
              Debt: {position.debt.displayAmount}
            </span>
            {position.debt.valueUsd !== undefined ? (
              <span className="tidal-text-caption text-tidal-muted">
                ≈ ${position.debt.valueUsd.toFixed(2)}
              </span>
            ) : null}
          </div>
          {position.healthFactor !== undefined ? (
            <div className="tidal-text-caption text-tidal-muted">
              Health factor: {position.healthFactor.toFixed(2)}
              {position.healthFactor < 1.2 ? (
                <span className="ml-1 text-red-400">⚠ near liquidation</span>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {apyDisplay ? (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-tidal-border/60 pt-2">
          <span className="tidal-text-caption text-emerald-400">
            {apyDisplay} APY · live
          </span>
          {projectedAnnualUsd !== null ? (
            <span className="tidal-text-caption text-tidal-muted">
              ≈ ${projectedAnnualUsd.toFixed(2)}/yr
            </span>
          ) : null}
        </div>
      ) : null}
    </SurfaceCard>
  );
}
