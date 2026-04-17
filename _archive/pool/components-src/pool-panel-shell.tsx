import { PoolActivityList } from "@/components/pool/pool-activity-list";
import { PoolDiscoveryCard } from "@/components/pool/pool-discovery-card";
import { PoolPerformanceChart } from "@/components/pool/pool-performance-chart";
import { PoolPositionCard } from "@/components/pool/pool-position-card";
import { PoolRecommendationCard } from "@/components/pool/pool-recommendation-card";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { cn } from "@/lib/utils";
import type {
  PoolDiscoveryItem,
  PoolPanelTab,
  PoolPosition,
  PoolRecommendation,
  PendingPoolAction,
  PoolWorkspace,
} from "@/mock-data/pool/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number) {
  return `+${value.toFixed(2)}%`;
}

type PoolPanelShellProps = {
  className?: string;
  workspace: PoolWorkspace;
  activeTab: PoolPanelTab;
  panelFeedback: string | null;
  onTabChange: (tab: PoolPanelTab) => void;
  onQueuePendingAction: (action: PendingPoolAction) => void;
  onCreateFocusedThread: (source: {
    title: string;
    preview: string;
    context: {
      type: "position" | "recommendation" | "discovery";
      entityId: string;
      title: string;
      description?: string;
    };
    initialUserMessage: string;
  }) => void;
};

type ContextShortcut =
  | { kind: "position"; item: PoolPosition }
  | { kind: "recommendation"; item: PoolRecommendation }
  | { kind: "discovery"; item: PoolDiscoveryItem };

function buildFocusedThreadSource(shortcut: ContextShortcut) {
  if (shortcut.kind === "position") {
    return {
      title: `Review ${shortcut.item.protocol}`,
      preview: `Focused review of the ${shortcut.item.title} position within the Pool.`,
      context: {
        type: "position" as const,
        entityId: shortcut.item.id,
        title: shortcut.item.title,
        description: shortcut.item.thesis,
      },
      initialUserMessage: `Use ${shortcut.item.title} as context and help me review whether it still deserves its current Pool allocation.`,
    };
  }

  if (shortcut.kind === "recommendation") {
    return {
      title: `Research ${shortcut.item.protocol}`,
      preview: `Focused research thread for the recommendation: ${shortcut.item.title}.`,
      context: {
        type: "recommendation" as const,
        entityId: shortcut.item.id,
        title: shortcut.item.title,
        description: shortcut.item.summary,
      },
      initialUserMessage: `Use the recommendation "${shortcut.item.title}" as context and tell me whether it is a good fit for this Pool.`,
    };
  }

  return {
    title: `Explore ${shortcut.item.protocol}`,
    preview: `Focused discovery thread for ${shortcut.item.title}.`,
    context: {
      type: "discovery" as const,
      entityId: shortcut.item.id,
      title: shortcut.item.title,
      description: shortcut.item.summary,
    },
    initialUserMessage: `Use ${shortcut.item.title} as context and help me understand whether this discovery item belongs in the Pool.`,
  };
}

export function PoolPanelShell({
  className,
  workspace,
  activeTab,
  panelFeedback,
  onTabChange,
  onQueuePendingAction,
  onCreateFocusedThread,
}: PoolPanelShellProps) {
  return (
    <aside
      className={cn(
        "flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-t border-tidal-border px-4 py-5 md:h-full md:w-[38%] md:min-w-[22rem] md:max-w-[40rem] md:border-t-0 md:border-l md:px-6",
        className
      )}
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <SurfaceCard tone="muted" className="space-y-2">
          <p className="tidal-text-label">Current Tidalpool value</p>
          <div className="flex items-end gap-2">
            <span className="tidal-stat-value">
              {formatCurrency(workspace.currentValueUsd)}
            </span>
            <span className="tidal-stat-change pb-1">
              {formatPercent(workspace.currentReturnPct)}
            </span>
          </div>
        </SurfaceCard>

        <SurfaceCard className="space-y-2">
          <p className="tidal-text-label">Current available assets</p>
          <span className="tidal-stat-value">
            {formatCurrency(workspace.availableAssetsUsd)}
          </span>
        </SurfaceCard>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {workspace.panelTabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                "tidal-tab-button",
                isActive
                  ? "tidal-tab-button-active"
                  : "tidal-tab-button-inactive"
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {panelFeedback ? (
        <SurfaceCard tone="muted" className="mb-4">
          <p className="tidal-text-label text-tidal-accent">{panelFeedback}</p>
        </SurfaceCard>
      ) : null}

      <div className="mb-6 min-h-0 flex-1 overflow-y-auto pr-1">
        {activeTab === "My Pool" ? (
          <div className="space-y-4">
            <PoolPerformanceChart performance={workspace.performance} />
            <div className="space-y-3">
              {workspace.positions.map((position) => (
                <PoolPositionCard
                  key={position.id}
                  position={position}
                  onUseAsContext={() =>
                    onCreateFocusedThread(
                      buildFocusedThreadSource({ kind: "position", item: position })
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "Recommendations" ? (
          <div className="space-y-4">
            {workspace.pendingActions.length > 0 ? (
              <SurfaceCard tone="muted" className="space-y-2">
                <p className="tidal-text-body">Pending Pool actions</p>
                {workspace.pendingActions.map((action) => (
                  <div key={action.id} className="tidal-subtle-panel">
                    <p className="tidal-text-body">{action.title}</p>
                    <p className="mt-2 tidal-text-message">{action.description}</p>
                  </div>
                ))}
              </SurfaceCard>
            ) : null}

            {workspace.recommendations.map((recommendation) => (
              <PoolRecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onResearch={() =>
                  onCreateFocusedThread(
                    buildFocusedThreadSource({
                      kind: "recommendation",
                      item: recommendation,
                    })
                  )
                }
                onAddToPool={() =>
                  onQueuePendingAction({
                    id: `pending-${recommendation.id}`,
                    sourceType: "recommendation",
                    sourceId: recommendation.id,
                    title: recommendation.title,
                    description: `Pending Pool action created from recommendation: ${recommendation.summary}`,
                    status: "pending",
                  })
                }
              />
            ))}
          </div>
        ) : null}

        {activeTab === "Discover" ? (
          <div className="space-y-4">
            {workspace.discoveryItems.map((item) => (
              <PoolDiscoveryCard
                key={item.id}
                item={item}
                onResearch={() =>
                  onCreateFocusedThread(
                    buildFocusedThreadSource({ kind: "discovery", item })
                  )
                }
                onAddToWatchlist={() =>
                  onQueuePendingAction({
                    id: `pending-${item.id}`,
                    sourceType: "discovery",
                    sourceId: item.id,
                    title: `Watchlist ${item.title}`,
                    description: `Pending research action created from discovery: ${item.summary}`,
                    status: "pending",
                  })
                }
              />
            ))}
          </div>
        ) : null}

        {activeTab === "Activity" ? (
          <PoolActivityList activity={workspace.activity} />
        ) : null}
      </div>

      <div className="mt-auto space-y-3 border-t border-tidal-border pt-5">
        <div>
          <p className="tidal-text-body">{workspace.health.label}</p>
          <p className="mt-1 tidal-text-message">{workspace.health.summary}</p>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: workspace.health.totalBars }, (_, index) => {
            const isFilled = index < workspace.health.filledBars;

            return (
              <span
                key={`health-${index}`}
                className={cn(
                  "h-8 w-3 rounded-full border",
                  isFilled
                    ? "border-tidal-accent bg-tidal-accent"
                    : "border-tidal-muted/60 bg-transparent"
                )}
              />
            );
          })}
        </div>

        <p className="tidal-text-label">{workspace.health.trendLabel}</p>
      </div>
    </aside>
  );
}
