import { SurfaceCard } from "@/components/tidal/surface-card";
import type { InvestmentDiscoveryItem } from "@/mock-data/workspace/discover";

type DiscoveryCardProps = {
  item: InvestmentDiscoveryItem;
  onResearch?: () => void;
  onAddToWatchlist?: () => void;
};

export function DiscoveryCard({
  item,
  onResearch,
  onAddToWatchlist,
}: DiscoveryCardProps) {
  return (
    <SurfaceCard tone="muted" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tidal-text-eyebrow">{item.protocol}</p>
          <p className="mt-2 tidal-text-body">{item.title}</p>
        </div>
        <span className="tidal-meta-pill">{item.category}</span>
      </div>

      <p className="tidal-text-message">{item.summary}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="tidal-text-caption">Projected APY</p>
          <p className="mt-1 tidal-text-body text-tidal-accent">
            {item.projectedApy}
          </p>
        </div>
        <div>
          <p className="tidal-text-caption">Asset focus</p>
          <p className="mt-1 tidal-text-body">{item.assetSummary}</p>
        </div>
      </div>

      <p className="tidal-text-message">{item.thesis}</p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onResearch}
          className="tidal-action-button tidal-action-button-primary"
        >
          Research in chat
        </button>
        <button
          type="button"
          onClick={onAddToWatchlist}
          className="tidal-action-button tidal-action-button-secondary"
        >
          Add to watchlist
        </button>
      </div>
    </SurfaceCard>
  );
}
