import type {
  Workspace,
  WorkspaceGraphEdge,
  WorkspaceGraphNode,
} from "@/mock-data/workspace/types";

export type GraphMutation =
  | { kind: "add-node"; node: WorkspaceGraphNode }
  | { kind: "remove-node"; nodeId: string }
  | { kind: "move-node"; nodeId: string; position: { x: number; y: number } }
  | { kind: "update-node-data"; nodeId: string; data: Record<string, unknown> }
  | { kind: "add-edge"; edge: WorkspaceGraphEdge }
  | { kind: "remove-edge"; edgeId: string };

export type GraphState = {
  nodes: WorkspaceGraphNode[];
  edges: WorkspaceGraphEdge[];
};

export type ApplyMutationsResult = {
  state: GraphState;
  warnings: string[];
};

function cloneNode<T extends WorkspaceGraphNode>(node: T): T {
  return {
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  };
}

function cloneEdge(edge: WorkspaceGraphEdge): WorkspaceGraphEdge {
  return {
    ...edge,
    data: edge.data ? { ...edge.data } : undefined,
    style: edge.style ? { ...edge.style } : undefined,
  };
}

export function applyMutations(
  state: GraphState,
  mutations: GraphMutation[],
): ApplyMutationsResult {
  let nodes = state.nodes.map(cloneNode);
  let edges = state.edges.map(cloneEdge);
  const warnings: string[] = [];

  for (const mutation of mutations) {
    switch (mutation.kind) {
      case "add-node":
        if (nodes.some((n) => n.id === mutation.node.id)) {
          warnings.push(`add-node: node "${mutation.node.id}" already exists`);
          break;
        }
        nodes = [...nodes, cloneNode(mutation.node)];
        break;

      case "remove-node": {
        const before = nodes.length;
        nodes = nodes.filter((n) => n.id !== mutation.nodeId);
        if (nodes.length === before) {
          warnings.push(`remove-node: node "${mutation.nodeId}" not found`);
        }
        edges = edges.filter(
          (e) =>
            e.source !== mutation.nodeId && e.target !== mutation.nodeId,
        );
        break;
      }

      case "move-node": {
        const idx = nodes.findIndex((n) => n.id === mutation.nodeId);
        if (idx === -1) {
          warnings.push(`move-node: node "${mutation.nodeId}" not found`);
          break;
        }
        nodes[idx] = {
          ...nodes[idx],
          position: { ...mutation.position },
        };
        break;
      }

      case "update-node-data": {
        const idx = nodes.findIndex((n) => n.id === mutation.nodeId);
        if (idx === -1) {
          warnings.push(
            `update-node-data: node "${mutation.nodeId}" not found`,
          );
          break;
        }
        nodes[idx] = {
          ...nodes[idx],
          data: {
            ...(nodes[idx].data as Record<string, unknown>),
            ...mutation.data,
          },
        } as WorkspaceGraphNode;
        break;
      }

      case "add-edge":
        if (edges.some((e) => e.id === mutation.edge.id)) {
          warnings.push(`add-edge: edge "${mutation.edge.id}" already exists`);
          break;
        }
        if (!nodes.some((n) => n.id === mutation.edge.source)) {
          warnings.push(
            `add-edge: source node "${mutation.edge.source}" not found`,
          );
          break;
        }
        if (!nodes.some((n) => n.id === mutation.edge.target)) {
          warnings.push(
            `add-edge: target node "${mutation.edge.target}" not found`,
          );
          break;
        }
        edges = [...edges, cloneEdge(mutation.edge)];
        break;

      case "remove-edge": {
        const before = edges.length;
        edges = edges.filter((e) => e.id !== mutation.edgeId);
        if (edges.length === before) {
          warnings.push(`remove-edge: edge "${mutation.edgeId}" not found`);
        }
        break;
      }
    }
  }

  return { state: { nodes, edges }, warnings };
}

export function applyMutationsToWorkspace(
  workspace: Workspace,
  mutations: GraphMutation[],
): { workspace: Workspace; warnings: string[] } {
  const result = applyMutations(
    { nodes: workspace.nodes, edges: workspace.edges },
    mutations,
  );
  return {
    workspace: {
      ...workspace,
      nodes: result.state.nodes,
      edges: result.state.edges,
    },
    warnings: result.warnings,
  };
}
