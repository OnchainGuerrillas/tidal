"use client";

import { useEffect, useMemo, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getBezierPath,
  type ReactFlowProps,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Badge } from "@/components/tidal/badge";
import { SurfaceCard } from "@/components/tidal/surface-card";
import { AmountNode } from "@/components/workspace/amount-node";
import { WorkspaceBuilderContextProvider } from "@/components/workspace/workspace-builder-context";
import { ChatPanel } from "@/components/workspace/panels/chat-panel";
import { NodesPanel } from "@/components/workspace/panels/nodes-panel";
import { InvestmentsPanel } from "@/components/workspace/panels/investments-panel";
import { DiscoverPanel } from "@/components/workspace/panels/discover-panel";
import { TemplatesPanel } from "@/components/workspace/panels/templates-panel";
import {
  NodePicker,
  type NodePickerGroupState,
  type NodePickerItemState,
} from "@/components/workspace/node-picker";
import { DestinationNode } from "@/components/workspace/destination-node";
import { RewardNode } from "@/components/workspace/reward-node";
import { SplitNode } from "@/components/workspace/split-node";
import { StrategyNode } from "@/components/workspace/strategy-node";
import { WalletNode } from "@/components/workspace/wallet-node";
import { useCanvasState } from "@/hooks/workspace/use-canvas-state";
import { getWorkspaceHref } from "@/lib/routes/workspace";
import { useWorkspace } from "@/providers/workspace-provider";
import { useSidePanel } from "@/providers/side-panel-provider";
import type {
  NodePickerGroup,
  Workspace,
  WorkspaceGraphEdge,
  WorkspaceGraphNode,
} from "@/mock-data/workspace/types";

const ReactFlowClient = dynamic(
  () =>
    import("@xyflow/react").then(
      (module) =>
        module.ReactFlow as ComponentType<
          ReactFlowProps<WorkspaceGraphNode, WorkspaceGraphEdge>
        >
    ),
  {
    ssr: false,
    loading: () => <div className="h-full w-full bg-tidal-card" />,
  }
);

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

type CanvasStatusProps = {
  workspace: Workspace;
  onEnterDraftMode: () => void;
  onRunDraft: () => void;
};

function CanvasStatus({
  workspace,
  onEnterDraftMode,
  onRunDraft,
}: CanvasStatusProps) {
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
                  workspace.executionState === "active"
                    ? onEnterDraftMode
                    : onRunDraft
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
                {changedNodeCount} edited node
                {changedNodeCount === 1 ? "" : "s"} changed the assumptions for{" "}
                {impactedNodeCount} downstream node
                {impactedNodeCount === 1 ? "" : "s"}. Rerun the draft to update
                the active strategy state.
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
                One or more nodes are missing upstream input or are blocked by
                an invalid connection. Fix the highlighted nodes and rerun.
              </p>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
    </>
  );
}

type PickerOverlayProps = {
  pickerState: {
    mode: "pane" | "source";
    source?: {
      asset: string;
      displayLabel?: string;
    };
  };
  groups: NodePickerGroupState[];
  items: NodePickerItemState[];
  selectedGroup: NodePickerGroup;
  searchQuery: string;
  onClose: () => void;
  onSearchQueryChange: (value: string) => void;
  onSelectedGroupChange: (group: NodePickerGroup) => void;
  onSelectItem: (item: NodePickerItemState["item"]) => void;
};

function PickerOverlay({
  pickerState,
  groups,
  items,
  selectedGroup,
  searchQuery,
  onClose,
  onSearchQueryChange,
  onSelectedGroupChange,
  onSelectItem,
}: PickerOverlayProps) {
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
          <NodePicker
            title={
              pickerState.mode === "source"
                ? `Add node from ${
                    pickerState.source?.displayLabel ??
                    pickerState.source?.asset ??
                    "output"
                  }`
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

export function WorkspaceScreen({ workspaceId }: { workspaceId?: string }) {
  const {
    workspaces,
    workspace,
    activeThread,
    setActiveThreadId,
    updateWorkspaceGraph,
    updateWorkspaceMeta,
    setActiveWorkspaceId,
  } = useWorkspace();
  const router = useRouter();
  const { getActivePanel, setActivePanel } = useSidePanel();
  const routedWorkspace = workspaceId
    ? workspaces.find((candidateWorkspace) => candidateWorkspace.id === workspaceId)
    : null;
  const renderedWorkspace = routedWorkspace ?? workspace;
  const renderedActiveThread =
    renderedWorkspace.threads.find(
      (thread) => thread.id === renderedWorkspace.activeThreadId
    ) ??
    activeThread ??
    renderedWorkspace.threads[0];
  const activePanel = getActivePanel(renderedWorkspace.id);

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
        router.replace(getWorkspaceHref(fallbackWorkspace.id));
      }

      return;
    }

    if (workspace.id !== matchedWorkspace.id) {
      setActiveWorkspaceId(matchedWorkspace.id);
    }
  }, [router, setActiveWorkspaceId, workspace.id, workspaceId, workspaces]);

  return (
    <WorkspaceCanvasHost
      key={renderedWorkspace.id}
      workspace={renderedWorkspace}
      activeThread={renderedActiveThread}
      updateWorkspaceGraph={updateWorkspaceGraph}
      updateWorkspaceMeta={updateWorkspaceMeta}
      activePanel={activePanel}
      onClosePanel={() => setActivePanel(renderedWorkspace.id, null)}
      onSelectThread={(threadId) =>
        setActiveThreadId(threadId, renderedWorkspace.id)
      }
    />
  );
}

function WorkspaceCanvasHost({
  workspace,
  activeThread,
  updateWorkspaceGraph,
  updateWorkspaceMeta,
  activePanel,
  onClosePanel,
  onSelectThread,
}: {
  workspace: Workspace;
  activeThread: Workspace["threads"][number];
  updateWorkspaceGraph: (
    workspaceId: string,
    nodes: import("@/mock-data/workspace/types").WorkspaceGraphNode[],
    edges: import("@/mock-data/workspace/types").WorkspaceGraphEdge[]
  ) => void;
  updateWorkspaceMeta: (
    workspaceId: string,
    updates: Partial<
      Pick<Workspace, "executionState" | "activeSnapshot" | "draftState">
    >
  ) => void;
  activePanel: import("@/providers/side-panel-provider").SidePanelSelection;
  onClosePanel: () => void;
  onSelectThread: (threadId: string) => void;
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
    addCatalogNodeAtCenter,
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
  } = useCanvasState({
    workspace,
    updateWorkspaceGraph,
    updateWorkspaceMeta,
  });

  const panelContent = useMemo(() => {
    if (!activePanel) return null;

    switch (activePanel) {
      case "nodes":
        return (
          <NodesPanel
            onSelect={(id) => addCatalogNodeAtCenter(id)}
            onClose={onClosePanel}
          />
        );
      case "investments":
        return (
          <InvestmentsPanel workspaceId={workspace.id} onClose={onClosePanel} />
        );
      case "discover":
        return (
          <DiscoverPanel workspaceId={workspace.id} onClose={onClosePanel} />
        );
      case "chat":
        return (
          <ChatPanel
            activeThread={activeThread}
            threads={workspace.threads}
            onSelectThread={onSelectThread}
            onClose={onClosePanel}
          />
        );
      case "templates":
        return <TemplatesPanel onClose={onClosePanel} />;
      default:
        return null;
    }
  }, [
    activePanel,
    activeThread,
    addCatalogNodeAtCenter,
    onClosePanel,
    onSelectThread,
    workspace.id,
    workspace.threads,
  ]);

  const isPanelOpen = Boolean(panelContent);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      <div className={isPanelOpen ? "tidal-workspace" : "flex min-h-0 flex-1"}>
        {isPanelOpen ? (
          <div className="tidal-workspace-panel pt-0 pb-0">{panelContent}</div>
        ) : null}

        <div className="tidal-workspace-canvas relative">
          <CanvasStatus
            workspace={workspace}
            onEnterDraftMode={enterDraftMode}
            onRunDraft={runWorkspaceDraft}
          />

          <WorkspaceBuilderContextProvider
            value={{
              isEditable: canEditWorkspace,
              updateNodeData,
            }}
          >
            <ReactFlowClient
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
            </ReactFlowClient>
          </WorkspaceBuilderContextProvider>

          {pickerState ? (
            <PickerOverlay
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
      </div>
    </div>
  );
}
