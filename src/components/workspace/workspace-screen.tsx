"use client";

import { useEffect, useState, type ComponentType } from "react";
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

import { AmountNode } from "@/components/workspace/amount-node";
import { CanvasRunPanel } from "@/components/workspace/canvas-run-panel";
import { WorkspaceBuilderContextProvider } from "@/components/workspace/workspace-builder-context";
import { WorkspaceWelcomeOverlay } from "@/components/workspace/workspace-welcome-overlay";
import { ChatPanel } from "@/components/workspace/panels/chat-panel";
import { NodesPanel } from "@/components/workspace/panels/nodes-panel";
import { InvestmentsView } from "@/components/workspace/investments-view";
import {
  WorkspaceHeaderOverlay,
  type WorkspaceCenterView,
} from "@/components/workspace/workspace-header-overlay";
import { WorkspaceFabBar } from "@/components/workspace/workspace-fab-bar";
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
    loading: () => <div className="h-full w-full bg-tidal-sidebar" />,
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
  const { getPanelState, togglePanel, closePanel } = useSidePanel();
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
  const panelState = getPanelState(renderedWorkspace.id);

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
      panelState={panelState}
      onTogglePanel={(panel) => togglePanel(renderedWorkspace.id, panel)}
      onClosePanel={(panel) => closePanel(renderedWorkspace.id, panel)}
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
  panelState,
  onTogglePanel,
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
  panelState: { nodes: boolean; chat: boolean };
  onTogglePanel: (panel: "nodes" | "chat") => void;
  onClosePanel: (panel: "nodes" | "chat") => void;
  onSelectThread: (threadId: string) => void;
}) {
  const [centerView, setCenterView] = useState<WorkspaceCenterView>("workspace");

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
  } = useCanvasState({
    workspace,
    updateWorkspaceGraph,
    updateWorkspaceMeta,
  });

  return (
    <div className="tidal-workspace-shell relative h-full min-h-0 w-full overflow-hidden bg-background">
      {centerView === "workspace" ? (
        <div className="absolute inset-0 bg-tidal-sidebar">
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
              fitViewOptions={{ padding: 0.45, maxZoom: 0.8 }}
              colorMode="dark"
            >
              <Controls className="tidal-flow-controls" position="center-left" />
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

          <CanvasRunPanel />
          <WorkspaceWelcomeOverlay />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-y-auto bg-tidal-sidebar">
          <InvestmentsView />
        </div>
      )}

      <WorkspaceHeaderOverlay
        centerView={centerView}
        onCenterViewChange={setCenterView}
      />

      <div className="pointer-events-none absolute inset-0 z-20">
        {panelState.nodes ? (
          <NodesPanel
            variant="floating"
            onSelect={(id) => addCatalogNodeAtCenter(id)}
            onClose={() => onClosePanel("nodes")}
          />
        ) : null}

        {panelState.chat ? (
          <ChatPanel
            variant="floating"
            activeThread={activeThread}
            threads={workspace.threads}
            onSelectThread={onSelectThread}
            onClose={() => onClosePanel("chat")}
          />
        ) : null}
      </div>

      {centerView === "workspace" ? (
        <WorkspaceFabBar panelState={panelState} onTogglePanel={onTogglePanel} />
      ) : null}
    </div>
  );
}
