"use client";

import { PoolConversationPane } from "@/components/pool/pool-conversation-pane";
import { PoolOverviewPane } from "@/components/pool/pool-overview-pane";
import { PoolPanelShell } from "@/components/pool/pool-panel-shell";
import { WorkspaceHeader } from "@/components/tidal/workspace-header";
import { usePoolWorkspace } from "@/providers/pool-workspace-provider";

export function PoolScreen() {
  const {
    workspace,
    isOverviewActive,
    activePanelTab,
    panelFeedback,
    activeThread,
    recentThreads,
    showOverview,
    setActivePanelTab,
    queuePendingAction,
    setActiveThreadId,
    createBlankThread,
    createFocusedThread,
  } = usePoolWorkspace();

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      <WorkspaceHeader
        workspaceName={workspace.name}
        threads={workspace.threads}
        isOverviewActive={isOverviewActive}
        activeThreadId={activeThread.id}
        onShowOverview={showOverview}
        onThreadSelect={setActiveThreadId}
        onNewChat={createBlankThread}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        {isOverviewActive ? (
          <PoolOverviewPane
            poolName={workspace.name}
            overviewPrompt={workspace.overviewPrompt}
            recentThreads={recentThreads}
            onThreadSelect={setActiveThreadId}
            onNewChat={createBlankThread}
          />
        ) : (
          <PoolConversationPane
            activeThread={activeThread}
          />
        )}
        <PoolPanelShell
          workspace={workspace}
          activeTab={activePanelTab}
          panelFeedback={panelFeedback}
          onTabChange={setActivePanelTab}
          onQueuePendingAction={queuePendingAction}
          onCreateFocusedThread={createFocusedThread}
        />
      </div>
    </div>
  );
}
