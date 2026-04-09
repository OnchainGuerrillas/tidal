import { ArrowSquareOut, ChartPieSlice, Lightning } from "@phosphor-icons/react";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { Button } from "@/components/ui/button";
import type { WorkspaceEntityType } from "@/mock-data/shell/types";

type WorkspacePromotionCardProps = {
  workspaceType: WorkspaceEntityType;
  hasDedicatedThread: boolean;
  onOpen: () => void;
};

export function WorkspacePromotionCard({
  workspaceType,
  hasDedicatedThread,
  onOpen,
}: WorkspacePromotionCardProps) {
  const isPool = workspaceType === "pool";
  const WorkspaceIcon = isPool ? ChartPieSlice : Lightning;
  const workspaceLabel = isPool ? "Pool" : "Amplify";

  return (
    <SurfaceCard tone="muted" className="max-w-3xl space-y-3 border-tidal-accent/20">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{workspaceLabel}</Badge>
        <Badge variant="token">
          {hasDedicatedThread ? "Dedicated thread exists" : "Context-only"}
        </Badge>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-tidal-border bg-tidal-sidebar-active text-tidal-accent">
          <WorkspaceIcon weight="bold" className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="tidal-text-body">
            {isPool ? "Promote to Pool thread" : "Promote to Amplify thread"}
          </p>
          <p className="tidal-text-message">
            {isPool
              ? "This general chat is using Pool context without owning a dedicated Pool thread yet."
              : "This general chat is using Amplify context without owning a dedicated Amplify thread yet."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={onOpen}>
          <ArrowSquareOut weight="bold" />
          <span>
            {hasDedicatedThread
              ? `Open ${workspaceLabel} thread`
              : `Promote to ${workspaceLabel} thread`}
          </span>
        </Button>
        <span className="text-xs text-tidal-muted">
          {hasDedicatedThread
            ? `A focused ${workspaceLabel} thread already exists for this general chat.`
            : `Creates a summary-seeded ${workspaceLabel} thread without copying the full chat transcript.`}
        </span>
      </div>
    </SurfaceCard>
  );
}
