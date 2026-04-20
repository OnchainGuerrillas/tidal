import type {
  Workspace,
  WorkspaceGraphEdge,
  WorkspaceGraphNode,
  WorkspaceNodeKind,
} from "@/mock-data/workspace/types";

export const TIDAL_WORKFLOW_VERSION = "tidal.workflow.v1" as const;
export type TidalWorkflowVersion = typeof TIDAL_WORKFLOW_VERSION;

export type SerializedNode = {
  id: string;
  type: WorkspaceNodeKind;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

export type SerializedEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: { asset?: string };
};

export type TidalWorkflowV1 = {
  version: TidalWorkflowVersion;
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  meta: {
    name: string;
    createdAt: string;
    updatedAt?: string;
    author?: string;
    description?: string;
  };
};

export function serializeWorkspace(workspace: Workspace): TidalWorkflowV1 {
  const now = new Date().toISOString();
  return {
    version: TIDAL_WORKFLOW_VERSION,
    nodes: workspace.nodes.map(serializeNode),
    edges: workspace.edges.map(serializeEdge),
    meta: {
      name: workspace.name,
      createdAt: now,
      updatedAt: now,
      description: workspace.summary,
    },
  };
}

function serializeNode(node: WorkspaceGraphNode): SerializedNode {
  return {
    id: node.id,
    type: (node.type as WorkspaceNodeKind | undefined) ?? node.data.nodeKind,
    position: { x: node.position.x, y: node.position.y },
    data: { ...node.data } as Record<string, unknown>,
  };
}

function serializeEdge(edge: WorkspaceGraphEdge): SerializedEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    data: edge.data ? { asset: edge.data.asset } : undefined,
  };
}

export type ParseWorkflowResult =
  | { ok: true; workflow: TidalWorkflowV1 }
  | { ok: false; error: string };

export function parseWorkflow(input: unknown): ParseWorkflowResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "workflow must be an object" };
  }
  const obj = input as Record<string, unknown>;
  if (obj.version !== TIDAL_WORKFLOW_VERSION) {
    return {
      ok: false,
      error: `unsupported workflow version: ${String(obj.version)} (expected ${TIDAL_WORKFLOW_VERSION})`,
    };
  }
  if (!Array.isArray(obj.nodes)) {
    return { ok: false, error: "workflow.nodes must be an array" };
  }
  if (!Array.isArray(obj.edges)) {
    return { ok: false, error: "workflow.edges must be an array" };
  }
  if (typeof obj.meta !== "object" || obj.meta === null) {
    return { ok: false, error: "workflow.meta must be an object" };
  }
  return { ok: true, workflow: obj as unknown as TidalWorkflowV1 };
}
