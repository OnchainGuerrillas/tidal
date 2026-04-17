import { SurfaceCard } from "@/components/tidal/surface-card";
import type { InvestmentPosition } from "@/mock-data/workspace/investments";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

type InvestmentCardProps = {
  position: InvestmentPosition;
  onOpenInChat?: () => void;
};

export function InvestmentCard({ position, onOpenInChat }: InvestmentCardProps) {
  return (
    <SurfaceCard tone="muted" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tidal-text-eyebrow">{position.network}</p>
          <p className="mt-2 tidal-text-body">{position.title}</p>
        </div>
        <div className="text-right">
          <p className="tidal-text-caption">APY: {position.apy}</p>
          <p className="mt-1 tidal-text-caption">Asset: {position.assetSummary}</p>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <span className="tidal-stat-value">{formatCurrency(position.valueUsd)}</span>
        <span className="tidal-stat-change pb-1">
          +{position.returnPct.toFixed(2)}%
        </span>
      </div>

      <p className="tidal-text-message">{position.thesis}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="tidal-action-button tidal-action-button-secondary"
        >
          View position
        </button>
        <button
          type="button"
          onClick={onOpenInChat}
          className="tidal-action-button tidal-action-button-secondary"
        >
          Discuss in chat
        </button>
        <button
          type="button"
          className="tidal-action-button tidal-action-button-danger"
        >
          Exit position
        </button>
      </div>
    </SurfaceCard>
  );
}
