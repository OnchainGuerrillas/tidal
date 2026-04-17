import { ArrowSquareOut, ChartPieSlice, Lightning } from "@phosphor-icons/react";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { Button } from "@/components/ui/button";
import type { CreateWorkspaceActionCard } from "@/mock-data/shell/types";

type CreateWorkspaceActionCardProps = {
  actionCard: CreateWorkspaceActionCard;
  onPrimaryAction: () => void;
};

export function CreateWorkspaceRecommendationCard({
  actionCard,
  onPrimaryAction,
}: CreateWorkspaceActionCardProps) {
  const isCompleted = actionCard.status === "completed";
  const WorkspaceIcon =
    actionCard.workspaceType === "pool" ? ChartPieSlice : Lightning;

  return (
    <SurfaceCard
      tone="muted"
      className="max-w-2xl space-y-4 border-tidal-accent/30 bg-tidal-card/95"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{actionCard.workspaceType === "pool" ? "Pool" : "workspace"}</Badge>
        <Badge variant="token">
          {actionCard.actionType === "create" ? "Create" : "Open"}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-tidal-border bg-tidal-sidebar-active text-tidal-accent">
            <WorkspaceIcon weight="bold" className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              {actionCard.title}
            </h3>
            <p className="tidal-text-message">{actionCard.description}</p>
          </div>
        </div>

        <p className="text-xs text-tidal-muted">
          This only adds linked context to the current chat. It does not create a
          dedicated workspace thread yet.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={isCompleted ? "secondary" : "outline"}
          size="sm"
          disabled={isCompleted}
          onClick={onPrimaryAction}
        >
          <ArrowSquareOut weight="bold" />
          <span>
            {isCompleted ? actionCard.completionLabel : actionCard.primaryLabel}
          </span>
        </Button>
        <span className="text-xs text-tidal-muted">
          Target: {actionCard.targetWorkspaceTitle}
        </span>
      </div>
    </SurfaceCard>
  );
}
