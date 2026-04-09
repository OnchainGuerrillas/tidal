import { cn } from "@/lib/utils";
import { Plus } from "@phosphor-icons/react";

type WorkspaceHeaderThread = {
  id: string;
  title: string;
};

type PoolWorkspaceHeaderProps = {
  className?: string;
  workspaceName: string;
  threads: WorkspaceHeaderThread[];
  isOverviewActive?: boolean;
  activeThreadId: string;
  showOverviewTab?: boolean;
  overviewLabel?: string;
  onShowOverview?: () => void;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  newChatLabel?: string;
};

export function PoolWorkspaceHeader({
  className,
  workspaceName,
  threads,
  isOverviewActive = false,
  activeThreadId,
  showOverviewTab = true,
  overviewLabel = "Overview",
  onShowOverview,
  onThreadSelect,
  onNewChat,
  newChatLabel = "New chat",
}: PoolWorkspaceHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-tidal-border bg-tidal-sidebar px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:gap-5">
        <div className="flex min-w-0 flex-col">
          <h1 className="tidal-text-workspace-title">{workspaceName}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {showOverviewTab ? (
            <button
              type="button"
              onClick={onShowOverview}
              className={cn(
                "h-7 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.6875rem] font-medium transition-colors",
                isOverviewActive
                  ? "border-tidal-accent bg-tidal-sidebar-active text-tidal-accent"
                  : "border-tidal-border bg-tidal-card/70 text-tidal-accent hover:bg-tidal-sidebar-active"
              )}
            >
              {overviewLabel}
            </button>
          ) : null}
          {threads.map((thread) => {
            const isActive =
              (showOverviewTab ? !isOverviewActive : true) &&
              thread.id === activeThreadId;

            return (
              <button
                key={thread.id}
                type="button"
                onClick={() => onThreadSelect(thread.id)}
                className={cn(
                  "h-7 rounded-[min(var(--radius-md),12px)] border px-2.5 text-[0.6875rem] font-medium transition-colors",
                  isActive
                    ? "border-tidal-accent bg-tidal-sidebar-active text-tidal-accent"
                    : "border-tidal-border bg-tidal-card/70 text-tidal-accent hover:bg-tidal-sidebar-active"
                )}
              >
                {thread.title}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onNewChat}
            aria-label={newChatLabel}
            className="flex h-7 w-7 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-tidal-border bg-tidal-card/70 text-tidal-accent transition-colors hover:bg-tidal-sidebar-active"
          >
            <Plus weight="bold" className="h-3 w-3" />
          </button>
        </div>
      </div>
    </header>
  );
}
