"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type EdgeChange,
  type NodeChange,
  type OnConnect,
  type OnConnectEnd,
  type OnConnectStart,
  type ReactFlowInstance,
} from "@xyflow/react";

import {
  NodePickerGroupState,
  NodePickerItemState,
} from "@/components/workspace/node-picker";
import {
  applySourceAssetToNode,
  buildActiveHoldingsLabel,
  buildAssetEdge,
  buildWorkspaceTimestampLabel,
  canConnectOutputToNode,
  cloneGraphEdge,
  cloneGraphNode,
  getClientPosition,
  getDescendantNodeIds,
  getOutputDisplayLabel,
  getOutputById,
  toNodeMap,
} from "@/lib/workspace/graph-utils";
import {
  getDefaultPickerGroup,
  getPickerItemDisabledState,
  matchesPickerSearch,
  pickerGroupLabels,
  pickerGroupOrder,
} from "@/lib/workspace/picker-utils";
import {
  nodeCatalog,
  createNodeFromCatalog,
} from "@/mock-data/workspace/workspace";
import type {
  WorkspaceGraphEdge,
  WorkspaceGraphNode,
  NodeCatalogItem,
  NodePickerGroup,
  Workspace,
} from "@/mock-data/workspace/types";

type PickerState = {
  mode: "pane" | "source";
  clientPosition: { x: number; y: number };
  flowPosition: { x: number; y: number };
  source?: {
    nodeId: string;
    outputId: string;
    asset: string;
    displayLabel: string;
  };
};

type PendingSourceConnection = {
  nodeId: string;
  outputId: string;
};

type UpdateWorkspaceGraph = (
  workspaceId: string,
  nodes: WorkspaceGraphNode[],
  edges: WorkspaceGraphEdge[]
) => void;

type UpdateWorkspaceMeta = (
  workspaceId: string,
  updates: Partial<
    Pick<Workspace, "executionState" | "activeSnapshot" | "draftState">
  >
) => void;

type UseCanvasStateInput = {
  workspace: Workspace;
  updateWorkspaceGraph: UpdateWorkspaceGraph;
  updateWorkspaceMeta: UpdateWorkspaceMeta;
};

const STORAGE_KEY = "workspace-node-positions";

function getWorkspaceStorageKey(workspace: Workspace) {
  return `${STORAGE_KEY}-${workspace.id}${
    workspace.kind === "example" ? "-layout-v2" : ""
  }`;
}

export function useCanvasState({
  workspace,
  updateWorkspaceGraph,
  updateWorkspaceMeta,
}: UseCanvasStateInput) {
  const workspaceStorageKey = getWorkspaceStorageKey(workspace);
  const canEditWorkspace = workspace.isEditable && workspace.executionState !== "active";
  const [pickerState, setPickerState] = useState<PickerState | null>(null);
  const [selectedPickerGroup, setSelectedPickerGroup] =
    useState<NodePickerGroup>("strategy");
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const pendingSourceConnectionRef = useRef<PendingSourceConnection | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<WorkspaceGraphNode, WorkspaceGraphEdge> | null>(null);
  const [nodes, setNodes] = useState<WorkspaceGraphNode[]>(() => {
    const initialNodes = workspace.nodes.map((node) => cloneGraphNode(node));

    try {
      const saved = localStorage.getItem(workspaceStorageKey);
      if (!saved) {
        return initialNodes;
      }

      const positions: Record<string, { x: number; y: number }> = JSON.parse(saved);
      return initialNodes.map((node) =>
        positions[node.id] ? { ...node, position: positions[node.id] } : node
      );
    } catch {
      return initialNodes;
    }
  });
  const [edges, setEdges] = useState<WorkspaceGraphEdge[]>(() =>
    workspace.edges.map((edge) => cloneGraphEdge(edge))
  );

  const persistGraph = useCallback(
    (nextNodes: WorkspaceGraphNode[], nextEdges: WorkspaceGraphEdge[]) => {
      updateWorkspaceGraph(
        workspace.id,
        nextNodes.map((node) => cloneGraphNode(node)),
        nextEdges.map((edge) => cloneGraphEdge(edge))
      );
    },
    [updateWorkspaceGraph, workspace.id]
  );

  const persistSemanticGraph = useCallback(
    (
      nextNodes: WorkspaceGraphNode[],
      nextEdges: WorkspaceGraphEdge[],
      changedNodeIds: string[] = []
    ) => {
      const updatedAtLabel = buildWorkspaceTimestampLabel();

      if (!workspace.activeSnapshot) {
        setNodes(nextNodes);
        setEdges(nextEdges);
        persistGraph(nextNodes, nextEdges);
        if (workspace.executionState === "error") {
          updateWorkspaceMeta(workspace.id, {
            executionState: "draft",
            draftState: {
              updatedAtLabel,
              changedNodeIds,
              impactedNodeIds: [],
            },
          });
        }
        return;
      }

      const existingChangedNodeIds = workspace.draftState?.changedNodeIds ?? [];
      const mergedChangedNodeIds = Array.from(
        new Set([...existingChangedNodeIds, ...changedNodeIds])
      );
      const impactedNodeIds = getDescendantNodeIds(mergedChangedNodeIds, nextEdges);

      const nextNodesWithImpact = nextNodes.map((node) => {
        if (mergedChangedNodeIds.includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              status: "ready",
              draftState: {
                hasChanges: true,
                changedFields: Array.from(
                  new Set([...(node.data.draftState?.changedFields ?? []), "draft"])
                ),
              },
            },
          } as WorkspaceGraphNode;
        }

        if (impactedNodeIds.includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              status: "impacted",
              draftState: {
                hasChanges: true,
                changedFields: node.data.draftState?.changedFields ?? [],
              },
            },
          } as WorkspaceGraphNode;
        }

        return {
          ...node,
          data: {
            ...node.data,
            status: node.data.activeSnapshot?.status ?? node.data.status,
          },
        } as WorkspaceGraphNode;
      });

      setNodes(nextNodesWithImpact);
      setEdges(nextEdges);
      persistGraph(nextNodesWithImpact, nextEdges);
      updateWorkspaceMeta(workspace.id, {
        executionState:
          impactedNodeIds.length > 0 || mergedChangedNodeIds.length > 0
            ? "impacted"
            : "draft",
        draftState: {
          updatedAtLabel,
          changedNodeIds: mergedChangedNodeIds,
          impactedNodeIds,
        },
      });
    },
    [
      persistGraph,
      updateWorkspaceMeta,
      workspace.activeSnapshot,
      workspace.draftState?.changedNodeIds,
      workspace.executionState,
      workspace.id,
    ]
  );

  const onNodeDragStop = useCallback(
    (_event: unknown, node: WorkspaceGraphNode) => {
      const nextNodes = nodes.map((currentNode) =>
        currentNode.id === node.id ? { ...currentNode, position: node.position } : currentNode
      );

      const positions: Record<string, { x: number; y: number }> = {};
      for (const currentNode of nextNodes) {
        positions[currentNode.id] = currentNode.position;
      }

      localStorage.setItem(workspaceStorageKey, JSON.stringify(positions));
      setNodes(nextNodes);
      persistGraph(nextNodes, edges);
    },
    [edges, nodes, persistGraph, workspaceStorageKey]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkspaceGraphNode>[]) => {
      const nextNodes = applyNodeChanges(changes, nodes);
      setNodes(nextNodes);
      persistGraph(nextNodes, edges);
    },
    [edges, nodes, persistGraph]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<WorkspaceGraphEdge>[]) => {
      const nextEdges = applyEdgeChanges(changes, edges);
      const changedNodeIds = changes.flatMap((change) => {
        if (change.type !== "remove") {
          return [];
        }

        const removedEdge = edges.find((edge) => edge.id === change.id);
        return removedEdge ? [removedEdge.source, removedEdge.target] : [];
      });

      if (changedNodeIds.length > 0) {
        persistSemanticGraph(nodes, nextEdges, changedNodeIds);
        return;
      }

      setEdges(nextEdges);
      persistGraph(nodes, nextEdges);
    },
    [edges, nodes, persistGraph, persistSemanticGraph]
  );

  const updateNodeData = useCallback(
    (
      nodeId: string,
      updater: (data: WorkspaceGraphNode["data"]) => WorkspaceGraphNode["data"]
    ) => {
      if (!canEditWorkspace) {
        return;
      }

      const nextNodes = nodes.map((node) =>
        node.id === nodeId
          ? ({
              ...node,
              data: updater(node.data),
            } as WorkspaceGraphNode)
          : node
      );

      persistSemanticGraph(nextNodes, edges, [nodeId]);
    },
    [canEditWorkspace, edges, nodes, persistSemanticGraph]
  );

  const onConnectStart: OnConnectStart = useCallback(
    (_event, params) => {
      if (
        !canEditWorkspace ||
        params.handleType !== "source" ||
        !params.nodeId ||
        !params.handleId
      ) {
        pendingSourceConnectionRef.current = null;
        return;
      }

      pendingSourceConnectionRef.current = {
        nodeId: params.nodeId,
        outputId: params.handleId,
      };
    },
    [canEditWorkspace]
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);
      const output = getOutputById(sourceNode, params.sourceHandle);

      if (!sourceNode || !targetNode || !output) {
        return;
      }

      if (!canConnectOutputToNode(output, targetNode)) {
        return;
      }

      const hydratedTarget = applySourceAssetToNode(targetNode, output.asset);
      const nextNodes = nodes.map((node) =>
        node.id === hydratedTarget.id ? hydratedTarget : node
      );
      const nextEdges = addEdge(
        buildAssetEdge(
          sourceNode.id,
          params.sourceHandle,
          targetNode.id,
          getOutputDisplayLabel(output)
        ),
        edges
      );

      persistSemanticGraph(nextNodes, nextEdges, [targetNode.id]);
    },
    [edges, nodes, persistSemanticGraph]
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!canEditWorkspace || !reactFlowInstance) {
        pendingSourceConnectionRef.current = null;
        return;
      }

      const pendingConnection = pendingSourceConnectionRef.current;
      pendingSourceConnectionRef.current = null;

      if (!pendingConnection || connectionState.toNode) {
        return;
      }

      const sourceNode = nodes.find((node) => node.id === pendingConnection.nodeId);
      const output = getOutputById(sourceNode, pendingConnection.outputId);

      if (!sourceNode || !output) {
        return;
      }

      setPickerSearchQuery("");
      setSelectedPickerGroup(getDefaultPickerGroup("source", output));
      const clientPosition = getClientPosition(event);
      setPickerState({
        mode: "source",
        clientPosition,
        flowPosition: reactFlowInstance.screenToFlowPosition(clientPosition),
        source: {
          nodeId: pendingConnection.nodeId,
          outputId: pendingConnection.outputId,
          asset: output.asset,
          displayLabel: getOutputDisplayLabel(output),
        },
      });
    },
    [canEditWorkspace, nodes, reactFlowInstance]
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | ReactMouseEvent) => {
      event.preventDefault();

      if (!canEditWorkspace) {
        return;
      }

      const flowPosition = reactFlowInstance
        ? reactFlowInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          })
        : { x: event.clientX, y: event.clientY };

      setPickerSearchQuery("");
      setSelectedPickerGroup("strategy");
      setPickerState({
        mode: "pane",
        clientPosition: { x: event.clientX, y: event.clientY },
        flowPosition,
      });
    },
    [canEditWorkspace, reactFlowInstance]
  );

  const pickerSourceNode = useMemo(
    () =>
      pickerState?.source
        ? nodes.find((node) => node.id === pickerState.source?.nodeId) ?? null
        : null,
    [nodes, pickerState]
  );
  const pickerSourceOutput = useMemo(
    () =>
      pickerState?.source
        ? getOutputById(pickerSourceNode ?? undefined, pickerState.source.outputId)
        : null,
    [pickerSourceNode, pickerState]
  );

  const closePicker = useCallback(() => {
    setPickerSearchQuery("");
    setSelectedPickerGroup("strategy");
    setPickerState(null);
  }, []);

  const handleCatalogSelect = useCallback(
    (item: NodeCatalogItem) => {
      if (!pickerState) {
        return;
      }

      const sourceAsset = pickerState.source?.asset;
      const { disabled } = getPickerItemDisabledState(item, pickerSourceOutput);

      if (pickerState.mode === "source" && disabled) {
        return;
      }

      const basePosition =
        pickerState.mode === "source"
          ? {
              x: pickerState.flowPosition.x + 220,
              y: pickerState.flowPosition.y - 30,
            }
          : pickerState.flowPosition;
      const createdNode = createNodeFromCatalog(item.id, basePosition, sourceAsset);

      if (!createdNode) {
        return;
      }

      const nextNodes = [...nodes, createdNode];
      let nextEdges = edges;

      if (pickerState.source) {
        nextEdges = [
          ...edges,
          buildAssetEdge(
            pickerState.source.nodeId,
            pickerState.source.outputId,
            createdNode.id,
            pickerState.source.displayLabel
          ),
        ];
      }

      persistSemanticGraph(nextNodes, nextEdges, [createdNode.id]);
      closePicker();
    },
    [closePicker, edges, nodes, persistSemanticGraph, pickerSourceOutput, pickerState]
  );

  const runWorkspaceDraft = useCallback(() => {
    if (!workspace.isEditable || workspace.executionState === "active") {
      return;
    }

    const updatedAtLabel = buildWorkspaceTimestampLabel();
    const nodeMap = toNodeMap(nodes);
    const activeNodeIds = new Set<string>();
    const errorNodeIds = new Set<string>();
    const incomingEdgeMap = new Map<string, WorkspaceGraphEdge[]>();

    for (const edge of edges) {
      const currentIncoming = incomingEdgeMap.get(edge.target) ?? [];
      currentIncoming.push(edge);
      incomingEdgeMap.set(edge.target, currentIncoming);
    }

    for (const node of nodes) {
      if (node.type === "wallet") {
        activeNodeIds.add(node.id);
        continue;
      }

      const incomingEdges = incomingEdgeMap.get(node.id) ?? [];
      if (incomingEdges.length === 0) {
        errorNodeIds.add(node.id);
      }
    }

    let progressed = true;
    while (progressed) {
      progressed = false;

      for (const node of nodes) {
        if (node.type === "wallet" || activeNodeIds.has(node.id) || errorNodeIds.has(node.id)) {
          continue;
        }

        const incomingEdges = incomingEdgeMap.get(node.id) ?? [];
        const validIncomingEdge = incomingEdges.find((edge) => {
          const sourceNode = nodeMap.get(edge.source);
          const output = getOutputById(sourceNode, edge.sourceHandle);

          if (!sourceNode || !output || !activeNodeIds.has(sourceNode.id)) {
            return false;
          }

          return canConnectOutputToNode(output, node);
        });

        if (validIncomingEdge) {
          activeNodeIds.add(node.id);
          progressed = true;
          continue;
        }

        if (
          incomingEdges.some((edge) => {
            const sourceNode = nodeMap.get(edge.source);
            const output = getOutputById(sourceNode, edge.sourceHandle);
            return sourceNode && output && !canConnectOutputToNode(output, node);
          })
        ) {
          errorNodeIds.add(node.id);
          progressed = true;
        }
      }
    }

    for (const node of nodes) {
      if (node.type === "wallet" || activeNodeIds.has(node.id) || errorNodeIds.has(node.id)) {
        continue;
      }

      errorNodeIds.add(node.id);
    }

    const nextNodes = nodes.map((node) => {
      const incomingEdges = incomingEdgeMap.get(node.id) ?? [];
      const incomingEdge = incomingEdges[0];
      const sourceNode = incomingEdge ? nodeMap.get(incomingEdge.source) : undefined;
      const incomingOutput = incomingEdge
        ? getOutputById(sourceNode, incomingEdge.sourceHandle)
        : null;
      const nextStatus = errorNodeIds.has(node.id)
        ? "error"
        : activeNodeIds.has(node.id)
          ? "active"
          : "ready";
      const nextHoldingsLabel =
        nextStatus === "active"
          ? buildActiveHoldingsLabel(node, incomingOutput, incomingEdge)
          : nextStatus === "error"
            ? node.type === "wallet"
              ? node.data.holdingsLabel
              : "Blocked: fix upstream input before running again"
            : node.data.holdingsLabel;

      return {
        ...node,
        data: {
          ...node.data,
          status: nextStatus,
          holdingsLabel: nextHoldingsLabel,
          activeSnapshot:
            nextStatus === "active"
              ? {
                  status: nextStatus,
                  amountLabel: nextHoldingsLabel,
                  updatedAtLabel,
                }
              : node.data.activeSnapshot,
          draftState: {
            hasChanges: false,
            changedFields: [],
          },
        },
      } as WorkspaceGraphNode;
    });

    setNodes(nextNodes);
    persistGraph(nextNodes, edges);

    if (errorNodeIds.size > 0) {
      updateWorkspaceMeta(workspace.id, {
        executionState: "error",
        draftState: {
          updatedAtLabel,
          changedNodeIds: [],
          impactedNodeIds: [],
        },
      });
      return;
    }

    updateWorkspaceMeta(workspace.id, {
      executionState: "active",
      activeSnapshot: {
        updatedAtLabel,
        nodeIds: nextNodes
          .filter((node) => node.data.status === "active")
          .map((node) => node.id),
      },
      draftState: {
        updatedAtLabel,
        changedNodeIds: [],
        impactedNodeIds: [],
      },
    });
  }, [edges, nodes, persistGraph, updateWorkspaceMeta, workspace.executionState, workspace.id, workspace.isEditable]);

  const enterDraftMode = useCallback(() => {
    if (!workspace.isEditable || workspace.executionState === "draft") {
      return;
    }

    const updatedAtLabel = buildWorkspaceTimestampLabel();
    updateWorkspaceMeta(workspace.id, {
      executionState: "draft",
      draftState: {
        updatedAtLabel,
        changedNodeIds: [],
        impactedNodeIds: [],
      },
    });
  }, [updateWorkspaceMeta, workspace.executionState, workspace.id, workspace.isEditable]);

  const pickerGroups = useMemo<NodePickerGroupState[]>(() => {
    return pickerGroupOrder.map((group) => {
      const groupItems = nodeCatalog.filter((item) => item.group === group);
      const validGroupItemCount = groupItems.filter(
        (item) =>
          pickerState?.mode !== "source" ||
          !getPickerItemDisabledState(item, pickerSourceOutput).disabled
      ).length;

      return {
        group,
        label: pickerGroupLabels[group],
        count: groupItems.filter((item) => matchesPickerSearch(item, pickerSearchQuery)).length,
        disabled: pickerState?.mode === "source" ? validGroupItemCount === 0 : false,
        emptyMessage:
          pickerState?.mode === "source"
            ? `No compatible ${pickerGroupLabels[group].toLowerCase()} nodes are available for ${pickerState.source?.asset ?? "this output"}.`
            : "No nodes in this section match your search yet.",
      };
    });
  }, [pickerSearchQuery, pickerSourceOutput, pickerState]);

  const pickerItems = useMemo<NodePickerItemState[]>(() => {
    return nodeCatalog
      .filter(
        (item) =>
          item.group === selectedPickerGroup &&
          matchesPickerSearch(item, pickerSearchQuery)
      )
      .map((item) => {
        const { disabled, disabledReason } =
          pickerState?.mode === "source"
            ? getPickerItemDisabledState(item, pickerSourceOutput)
            : { disabled: false, disabledReason: null };

        return {
          item,
          disabled: Boolean(disabled),
          disabledReason,
        };
      });
  }, [pickerSearchQuery, pickerSourceOutput, pickerState, selectedPickerGroup]);

  const addCatalogNodeAtCenter = useCallback(
    (catalogItemId: string) => {
      if (!canEditWorkspace) {
        return;
      }

      const catalogItem = nodeCatalog.find((item) => item.id === catalogItemId);
      if (!catalogItem) {
        return;
      }

      let targetPosition = { x: 240, y: 200 };
      if (reactFlowInstance && typeof window !== "undefined") {
        const viewport = reactFlowInstance.getViewport();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        targetPosition = {
          x: (centerX - viewport.x) / viewport.zoom - 120,
          y: (centerY - viewport.y) / viewport.zoom - 40,
        };
      }

      const createdNode = createNodeFromCatalog(
        catalogItem.id,
        targetPosition
      );

      if (!createdNode) {
        return;
      }

      const nextNodes = [...nodes, createdNode];
      persistSemanticGraph(nextNodes, edges, [createdNode.id]);
    },
    [
      canEditWorkspace,
      edges,
      nodes,
      persistSemanticGraph,
      reactFlowInstance,
    ]
  );

  return {
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
  };
}
