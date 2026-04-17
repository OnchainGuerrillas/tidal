import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import type { PoolRecommendation } from "@/mock-data/pool/types";

type PoolRecommendationCardProps = {
  recommendation: PoolRecommendation;
  onResearch: () => void;
  onAddToPool: () => void;
};

export function PoolRecommendationCard({
  recommendation,
  onResearch,
  onAddToPool,
}: PoolRecommendationCardProps) {
  return (
    <SurfaceCard tone="muted" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tidal-text-eyebrow">{recommendation.protocol}</p>
          <p className="mt-2 tidal-text-body">{recommendation.title}</p>
        </div>
        <Badge variant="status">{recommendation.riskLabel}</Badge>
      </div>

      <p className="tidal-text-message">{recommendation.summary}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="tidal-text-caption">Projected APY</p>
          <p className="mt-1 tidal-text-body text-tidal-accent">
            {recommendation.projectedApy}
          </p>
        </div>
        <div>
          <p className="tidal-text-caption">Asset focus</p>
          <p className="mt-1 tidal-text-body">{recommendation.assetSummary}</p>
        </div>
      </div>

      <p className="tidal-text-message">{recommendation.thesis}</p>

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
          onClick={onAddToPool}
          className="tidal-action-button tidal-action-button-secondary"
        >
          Add to pool
        </button>
      </div>
    </SurfaceCard>
  );
}
