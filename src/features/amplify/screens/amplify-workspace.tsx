"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowsOutSimple, List } from "@phosphor-icons/react";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  ReactFlow,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { useSidebar } from "@/components/ui/sidebar";
import { AmountNode } from "@/features/amplify/components/amount-node";
import { AmplifyBuilderContextProvider } from "@/features/amplify/components/amplify-builder-context";
import { AmplifyChat } from "@/features/amplify/components/amplify-chat";
import {
  AmplifyNodePicker,
  type AmplifyNodePickerGroupState,
  type AmplifyNodePickerItemState,
} from "@/features/amplify/components/amplify-node-picker";
import { DestinationNode } from "@/features/amplify/components/destination-node";
import { RewardNode } from "@/features/amplify/components/reward-node";
import { SplitNode } from "@/features/amplify/components/split-node";
import { StrategyNode } from "@/features/amplify/components/strategy-node";
import { WalletNode } from "@/features/amplify/components/wallet-node";
import { useAmplifyCanvasState } from "@/features/amplify/hooks/use-amplify-canvas-state";
import { getAmplifyWorkspaceHref } from "@/lib/amplify-routes";
import { useAmplifyWorkspace } from "@/features/amplify/providers/amplify-workspace-provider";
import { PoolWorkspaceHeader } from "@/features/pool/components/pool-workspace-header";
import type {
  AmplifyNodePickerGroup,
  AmplifyWorkspace as AmplifyWorkspaceType,
} from "@/mock-data/amplify/types";

function AssetEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<Edge<{ asset: string }>>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan tidal-overlay-label"
        >
          {data?.asset}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  wallet: WalletNode,
  amount: AmountNode,
  strategy: StrategyNode,
  split: SplitNode,
  reward: RewardNode,
  destination: DestinationNode,
};

const edgeTypes = { asset: AssetEdge };

type AmplifyCanvasStatusProps = {
  workspace: AmplifyWorkspaceType;
  onEnterDraftMode: () => void;
  onRunDraft: () => void;
};

function AmplifyCanvasStatus({
  workspace,
  onEnterDraftMode,
  onRunDraft,
}: AmplifyCanvasStatusProps) {
  const impactedNodeCount = workspace.draftState?.impactedNodeIds.length ?? 0;
  const changedNodeCount = workspace.draftState?.changedNodeIds.length ?? 0;

  return (
    <>
      <div className="pointer-events-none absolute top-4 right-4 z-10">
        <SurfaceCard className="pointer-events-auto min-w-[260px] bg-[#15202E]/95 shadow-lg shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="status">
                  {workspace.executionState === "active"
                    ? "Active"
                    : workspace.executionState === "impacted"
                      ? "Impacted"
                      : workspace.executionState === "error"
                        ? "Error"
                        : "Draft"}
                </Badge>
                {workspace.activeSnapshot?.updatedAtLabel ? (
                  <span className="tidal-text-caption text-tidal-muted">
                    {workspace.activeSnapshot.updatedAtLabel}
                  </span>
                ) : null}
              </div>
              <p className="max-w-[220px] tidal-text-caption text-tidal-muted">
                {workspace.executionState === "active"
                  ? "Nodes are locked while the strategy is marked active. Enter draft mode to make changes over the last successful run."
                  : workspace.executionState === "impacted"
                    ? "Upstream draft edits are affecting downstream positions. Review impacted nodes, then rerun to replace the active snapshot."
                    : workspace.executionState === "error"
                      ? "The last run found invalid or blocked nodes. Fix the highlighted path and rerun the draft."
                      : "Inline controls are live in draft mode. Run the draft when you want to lock the strategy and review the current setup."}
              </p>
            </div>

            {workspace.isEditable ? (
              <button
                type="button"
                onClick={
                  workspace.executionState === "active" ? onEnterDraftMode : onRunDraft
                }
                className="rounded-md border border-tidal-border bg-background/40 px-3 py-2 text-xs font-medium text-tidal-accent transition-colors hover:border-tidal-accent/40 hover:bg-tidal-sidebar-active"
              >
                {workspace.executionState === "active" ? "Edit draft" : "Run draft"}
              </button>
            ) : null}
          </div>
        </SurfaceCard>
      </div>

      {workspace.executionState === "impacted" && impactedNodeCount > 0 ? (
        <div className="pointer-events-none absolute top-28 right-4 z-10">
          <SurfaceCard className="pointer-events-auto max-w-[320px] border-amber-400/30 bg-[#1C2330]/95 shadow-lg shadow-black/30">
            <div className="space-y-1">
              <div className="text-sm font-medium text-amber-300">
                Downstream nodes impacted
              </div>
              <p className="tidal-text-caption text-tidal-muted">
                {changedNodeCount} edited node{changedNodeCount === 1 ? "" : "s"} changed
                the assumptions for {impactedNodeCount} downstream node
                {impactedNodeCount === 1 ? "" : "s"}. Rerun the draft to update the active
                strategy state.
              </p>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {workspace.executionState === "error" ? (
        <div className="pointer-events-none absolute top-28 right-4 z-10">
          <SurfaceCard className="pointer-events-auto max-w-[320px] border-rose-400/30 bg-[#241A22]/95 shadow-lg shadow-black/30">
            <div className="space-y-1">
              <div className="text-sm font-medium text-rose-300">
                Run blocked by invalid nodes
              </div>
              <p className="tidal-text-caption text-tidal-muted">
                One or more nodes are missing upstream input or are blocked by an invalid
                connection. Fix the highlighted nodes and rerun.
              </p>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
    </>
  );
}

type AmplifyPickerOverlayProps = {
  pickerState: {
    mode: "pane" | "source";
    source?: {
      asset: string;
    };
  };
  groups: AmplifyNodePickerGroupState[];
  items: AmplifyNodePickerItemState[];
  selectedGroup: AmplifyNodePickerGroup;
  searchQuery: string;
  onClose: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelectedGroupChange: (group: AmplifyNodePickerGroup) => void;
  onSelectItem: (item: AmplifyNodePickerItemState["item"]) => void;
};

function AmplifyPickerOverlay({
  pickerState,
  groups,
  items,
  selectedGroup,
  searchQuery,
  onClose,
  onSearchQueryChange,
  onSelectedGroupChange,
  onSelectItem,
}: AmplifyPickerOverlayProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close node picker"
        className="fixed inset-0 z-10 cursor-default"
        onClick={onClose}
      />
      <div className="absolute inset-0 z-20 flex items-center justify-center p-3 pointer-events-none">
        <div
          className="pointer-events-auto w-[min(42rem,calc(100vw-1.5rem))]"
          onClick={(event) => event.stopPropagation()}
        >
          <AmplifyNodePicker
            title={
              pickerState.mode === "source"
                ? `Add node from ${pickerState.source?.asset ?? "output"}`
                : "Create node"
            }
            description={
              pickerState.mode === "source"
                ? "Browse categories on the left. Compatible items stay enabled and incompatible ones stay visible."
                : "Browse categories or search to place a disconnected node on the canvas."
            }
            groups={groups}
            selectedGroup={selectedGroup}
            searchQuery={searchQuery}
            items={items}
            onSearchQueryChange={onSearchQueryChange}
            onSelectedGroupChange={onSelectedGroupChange}
            onSelectItem={onSelectItem}
          />
        </div>
      </div>
    </>
  );
}

export function AmplifyWorkspace({
  workspaceId,
}: {
  workspaceId?: string;
}) {
  const {
    workspaces,
    workspace,
    activeThread,
    setActiveThreadId,
    createBlankThread,
    updateWorkspaceGraph,
    updateWorkspaceMeta,
    setActiveWorkspaceId,
  } = useAmplifyWorkspace();
  const router = useRouter();
  const { setOpen } = useSidebar();
  const hasMounted = useRef(false);
  const [isCanvasFullscreen, setIsCanvasFullscreen] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    const matchedWorkspace = workspaces.find(
      (candidateWorkspace) => candidateWorkspace.id === workspaceId
    );

    if (!matchedWorkspace) {
      const fallbackWorkspace = workspaces[0];

      if (fallbackWorkspace) {
        router.replace(getAmplifyWorkspaceHref(fallbackWorkspace.id));
      }

      return;
    }

    if (workspace.id !== matchedWorkspace.id) {
      setActiveWorkspaceId(matchedWorkspace.id);
    }
  }, [router, setActiveWorkspaceId, workspace.id, workspaceId, workspaces]);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      setOpen(false);
    }
  }, [setOpen]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      {!isCanvasFullscreen ? (
        <PoolWorkspaceHeader
          workspaceName={workspace.name}
          threads={workspace.threads}
          activeThreadId={activeThread.id}
          showOverviewTab={false}
          onThreadSelect={setActiveThreadId}
          onNewChat={createBlankThread}
          newChatLabel="New thread"
        />
      ) : null}

      <div className={isCanvasFullscreen ? "flex min-h-0 flex-1" : "tidal-workspace"}>
        {!isCanvasFullscreen ? (
          <div className="tidal-workspace-panel pt-0 pb-5">
            <AmplifyChat activeThread={activeThread} />
          </div>
        ) : null}

        <AmplifyWorkspaceCanvas
          key={workspace.id}
          workspace={workspace}
          updateWorkspaceGraph={updateWorkspaceGraph}
          updateWorkspaceMeta={updateWorkspaceMeta}
          isCanvasFullscreen={isCanvasFullscreen}
          onToggleCanvasFullscreen={() =>
            setIsCanvasFullscreen((current) => !current)
          }
        />
      </div>
    </div>
  );
}

function AmplifyWorkspaceCanvas({
  workspace,
  updateWorkspaceGraph,
  updateWorkspaceMeta,
  isCanvasFullscreen,
  onToggleCanvasFullscreen,
}: {
  workspace: AmplifyWorkspaceType;
  updateWorkspaceGraph: (
    workspaceId: string,
    nodes: import("@/mock-data/amplify/types").AmplifyGraphNode[],
    edges: import("@/mock-data/amplify/types").AmplifyGraphEdge[]
  ) => void;
  updateWorkspaceMeta: (
    workspaceId: string,
    updates: Partial<
      Pick<AmplifyWorkspaceType, "executionState" | "activeSnapshot" | "draftState">
    >
  ) => void;
  isCanvasFullscreen: boolean;
  onToggleCanvasFullscreen: () => void;
}) {
  const {
    canEditWorkspace,
    nodes,
    edges,
    pickerState,
    selectedPickerGroup,
    pickerSearchQuery,
    pickerGroups,
    pickerItems,
    setReactFlowInstance,
    setSelectedPickerGroup,
    setPickerSearchQuery,
    closePicker,
    handleCatalogSelect,
    onNodeDragStop,
    onNodesChange,
    onEdgesChange,
    onConnectStart,
    onConnect,
    onConnectEnd,
    onPaneContextMenu,
    updateNodeData,
    runWorkspaceDraft,
    enterDraftMode,
  } = useAmplifyCanvasState({
    workspace,
    updateWorkspaceGraph,
    updateWorkspaceMeta,
  });

  return (
    <div className="tidal-workspace-canvas relative">
      <div className="pointer-events-none absolute top-4 left-4 z-10">
        <button
          type="button"
          onClick={onToggleCanvasFullscreen}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-lg border border-tidal-border bg-[#15202E]/95 text-tidal-accent shadow-lg shadow-black/30 transition-colors hover:border-tidal-accent/40 hover:bg-tidal-sidebar-active"
          aria-label={
            isCanvasFullscreen
              ? "Show Amplify chat and header"
              : "Focus on node canvas"
          }
        >
          {isCanvasFullscreen ? (
            <List weight="bold" className="h-4 w-4" />
          ) : (
            <ArrowsOutSimple weight="bold" className="h-4 w-4" />
          )}
        </button>
      </div>

      <AmplifyCanvasStatus
        workspace={workspace}
        onEnterDraftMode={enterDraftMode}
        onRunDraft={runWorkspaceDraft}
      />

      <AmplifyBuilderContextProvider
        value={{
          isEditable: canEditWorkspace,
          updateNodeData,
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          onNodeDragStop={onNodeDragStop}
          onPaneContextMenu={onPaneContextMenu}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={canEditWorkspace}
          nodesConnectable={canEditWorkspace}
          elementsSelectable={canEditWorkspace}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          colorMode="dark"
        >
          <Controls className="tidal-flow-controls" />
          <Background
            variant={BackgroundVariant.Lines}
            gap={28}
            lineWidth={0.75}
            color="#1C2533"
          />
        </ReactFlow>
      </AmplifyBuilderContextProvider>

      {pickerState ? (
        <AmplifyPickerOverlay
          pickerState={pickerState}
          groups={pickerGroups}
          items={pickerItems}
          selectedGroup={selectedPickerGroup}
          searchQuery={pickerSearchQuery}
          onClose={closePicker}
          onSearchQueryChange={setPickerSearchQuery}
          onSelectedGroupChange={setSelectedPickerGroup}
          onSelectItem={handleCatalogSelect}
        />
      ) : null}
    </div>
  );
}
