import { SurfaceCard } from "@/components/tidal/surface-card";
import type { PoolActivityItem } from "@/mock-data/pool/types";

type PoolActivityListProps = {
  activity: PoolActivityItem[];
};

export function PoolActivityList({ activity }: PoolActivityListProps) {
  return (
    <div className="space-y-3">
      {activity.map((item) => (
        <SurfaceCard key={item.id} tone="muted" className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="tidal-text-body">{item.title}</p>
              <p className="mt-2 tidal-text-message">{item.description}</p>
            </div>
            <span className="tidal-meta-pill">{item.timestampLabel}</span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-tidal-border pt-3">
            <span className="tidal-text-caption uppercase tracking-[0.12em]">
              {item.type}
            </span>
            <span className="tidal-static-chip">
              {item.explorerLabel}
            </span>
          </div>
        </SurfaceCard>
      ))}
    </div>
  );
}
