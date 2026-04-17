import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/tidal/surface-card";

import type { CreateWorkspaceActionCard } from "@/mock-data/shell/types";

type WorkspaceRecommendationCardProps = {
  actionCard: CreateWorkspaceActionCard;
  onPrimaryAction: (actionCardId: string) => void;
};

export function WorkspaceRecommendationCard({
  actionCard,
  onPrimaryAction,
}: WorkspaceRecommendationCardProps) {
  return (
    <SurfaceCard tone="muted" className="max-w-2xl space-y-3">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-tidal-accent">
          {actionCard.workspaceType === "pool" ? "Pool suggestion" : "workspace suggestion"}
        </p>
        <h3 className="text-sm font-medium text-foreground">
          {actionCard.title}
        </h3>
        <p className="text-sm leading-relaxed text-tidal-muted">
          {actionCard.description}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-tidal-muted">
          {actionCard.status === "completed"
            ? actionCard.completionLabel
            : `Target: ${actionCard.targetWorkspaceTitle}`}
        </p>
        <Button
          variant={actionCard.status === "completed" ? "secondary" : "outline"}
          size="sm"
          className="border-tidal-border bg-tidal-card/70 text-tidal-accent hover:bg-tidal-sidebar-active"
          onClick={() => onPrimaryAction(actionCard.id)}
          disabled={actionCard.status === "completed"}
        >
          {actionCard.status === "completed"
            ? "Linked"
            : actionCard.primaryLabel}
        </Button>
      </div>
    </SurfaceCard>
  );
}
