"use client";

import { PoolConversationPane } from "@/features/pool/components/pool-conversation-pane";
import { PoolOverviewPane } from "@/features/pool/components/pool-overview-pane";
import { PoolPanelShell } from "@/features/pool/components/pool-panel-shell";
import { PoolWorkspaceHeader } from "@/features/pool/components/pool-workspace-header";
import { usePoolWorkspace } from "@/features/pool/providers/pool-workspace-provider";

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
      <PoolWorkspaceHeader
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
