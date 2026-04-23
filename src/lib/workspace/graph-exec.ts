export type ExecutableNode = {
  id: string;
  catalogItemId: string;
  widgets: Record<string, unknown>;
  /**
   * Optional source amount for nodes with no upstream edge (e.g., a
   * wallet-sourced stake strategy). When present, the engine uses this
   * instead of the sum-of-parents when computing `inputAmount`.
   */
  sourceAmount?: bigint;
};

export type ExecutableEdge = {
  source: string;
  target: string;
};

export type NodeRunInput = {
  node: ExecutableNode;
  inputAmount: bigint;
};

export type NodeRunResult = {
  txSignature: string;
  outputAmount: bigint;
};

export type NodeRunner = (input: NodeRunInput) => Promise<NodeRunResult>;

export type GraphExecutionEvent =
  | { kind: "graph-started"; timestamp: number }
  | { kind: "node-started"; nodeId: string; timestamp: number }
  | {
      kind: "node-succeeded";
      nodeId: string;
      result: NodeRunResult;
      timestamp: number;
    }
  | {
      kind: "node-failed";
      nodeId: string;
      error: string;
      timestamp: number;
    }
  | {
      kind: "node-skipped";
      nodeId: string;
      reason: string;
      timestamp: number;
    }
  | { kind: "graph-completed"; timestamp: number }
  | { kind: "graph-failed"; reason: string; timestamp: number }
  | { kind: "graph-cancelled"; timestamp: number };

/**
 * Kahn-style topological sort. Returns a linear order that respects
 * every edge's source-before-target constraint, or null if the graph
 * contains a cycle.
 */
export function topoSort(
  nodes: ExecutableNode[],
  edges: ExecutableEdge[],
): string[] | null {
  const inDegree = new Map<string, number>();
  for (const node of nodes) inDegree.set(node.id, 0);
  for (const edge of edges) {
    if (!inDegree.has(edge.target)) continue;
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const edge of edges) {
      if (edge.source !== current) continue;
      const newDeg = (inDegree.get(edge.target) ?? 0) - 1;
      inDegree.set(edge.target, newDeg);
      if (newDeg === 0) queue.push(edge.target);
    }
  }

  return sorted.length === nodes.length ? sorted : null;
}

function getParentIds(nodeId: string, edges: ExecutableEdge[]): string[] {
  return edges.filter((e) => e.target === nodeId).map((e) => e.source);
}

/**
 * Execute a graph in topological order, invoking `runNode` for each node
 * and streaming state events as it progresses. Upstream failures halt
 * downstream nodes with a skipped event. Cancellation via AbortSignal
 * halts the loop at the next node boundary.
 *
 * Pure at the module level - `runNode` is the only side-effectful input.
 * In tests it's a mock; in production it wraps the build/sign/submit
 * pipeline.
 */
export async function* executeGraph(params: {
  nodes: ExecutableNode[];
  edges: ExecutableEdge[];
  runNode: NodeRunner;
  signal?: AbortSignal;
}): AsyncGenerator<GraphExecutionEvent> {
  yield { kind: "graph-started", timestamp: Date.now() };

  const sorted = topoSort(params.nodes, params.edges);
  if (!sorted) {
    yield {
      kind: "graph-failed",
      reason: "graph contains a cycle",
      timestamp: Date.now(),
    };
    return;
  }

  const nodeById = new Map<string, ExecutableNode>();
  for (const node of params.nodes) nodeById.set(node.id, node);

  const outputs = new Map<string, bigint>();
  const failed = new Set<string>();

  for (const nodeId of sorted) {
    if (params.signal?.aborted) {
      yield { kind: "graph-cancelled", timestamp: Date.now() };
      return;
    }

    const node = nodeById.get(nodeId);
    if (!node) {
      failed.add(nodeId);
      yield {
        kind: "node-failed",
        nodeId,
        error: `node "${nodeId}" missing from node map`,
        timestamp: Date.now(),
      };
      continue;
    }

    const parents = getParentIds(nodeId, params.edges);
    const failedParent = parents.find((p) => failed.has(p));
    if (failedParent) {
      failed.add(nodeId);
      yield {
        kind: "node-skipped",
        nodeId,
        reason: `upstream "${failedParent}" failed`,
        timestamp: Date.now(),
      };
      continue;
    }

    let inputAmount = 0n;
    if (parents.length === 0 && node.sourceAmount !== undefined) {
      inputAmount = node.sourceAmount;
    } else {
      for (const parentId of parents) {
        const parentOutput = outputs.get(parentId);
        if (parentOutput !== undefined) {
          inputAmount += parentOutput;
        }
      }
    }

    yield { kind: "node-started", nodeId, timestamp: Date.now() };

    try {
      const result = await params.runNode({ node, inputAmount });
      outputs.set(nodeId, result.outputAmount);
      yield {
        kind: "node-succeeded",
        nodeId,
        result,
        timestamp: Date.now(),
      };
    } catch (err) {
      failed.add(nodeId);
      yield {
        kind: "node-failed",
        nodeId,
        error: err instanceof Error ? err.message : String(err),
        timestamp: Date.now(),
      };
    }
  }

  if (failed.size > 0) {
    yield {
      kind: "graph-failed",
      reason: `${failed.size.toString()} node(s) failed`,
      timestamp: Date.now(),
    };
    return;
  }

  yield { kind: "graph-completed", timestamp: Date.now() };
}
