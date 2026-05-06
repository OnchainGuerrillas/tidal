/**
 * Graph execution engine.
 *
 * The runner is now multi-output aware: a node can emit different
 * amounts on different output handles, and edges carry a sourceHandle
 * so a downstream node knows which handle's output to consume. This is
 * what makes Split nodes work — one input, two outputs (handles "a"
 * and "b") routed to different children.
 *
 * Compute-only nodes (Split, future Amount) execute locally without
 * invoking runNode. Adapter nodes still call runNode to build/sign/
 * submit a transaction. Both cases produce a NodeRunResult with an
 * `outputs` map keyed by handle id; adapters always emit on a single
 * conventional handle ("next").
 */

export type AdapterExecutableNode = {
  id: string;
  kind: "adapter";
  catalogItemId: string;
  widgets: Record<string, unknown>;
  /**
   * Optional source amount for nodes with no upstream edge (e.g., a
   * wallet-sourced stake strategy). When present, the engine uses this
   * instead of the sum-of-parents when computing `inputAmount`.
   */
  sourceAmount?: bigint;
};

export type SplitExecutableNode = {
  id: string;
  kind: "split";
  /**
   * Percentage (0-100) of the input that flows out of handle "a".
   * Handle "b" gets the remainder so the two ratios always sum to 100
   * regardless of small rounding losses.
   */
  splitA: number;
  splitB: number;
};

export type AmountExecutableNode = {
  id: string;
  kind: "amount";
  /**
   * Percentage (0-100) of the upstream input to forward through the
   * single output handle "next". 100 = pass-through; 50 = halve;
   * 0 = nothing flows downstream (downstream node will see 0 input
   * and likely fail validation, which is the right user signal).
   *
   * Fixed-amount mode (replace input with an absolute value) is
   * deferred — it requires upstream-asset decimals, which the runner
   * doesn't track today. For now, hand-built graphs needing fixed
   * amounts can instead set the strategy node's amount widget
   * directly.
   */
  percentage: number;
};

export type ExecutableNode =
  | AdapterExecutableNode
  | SplitExecutableNode
  | AmountExecutableNode;

export type ExecutableEdge = {
  source: string;
  /**
   * Output-handle id on the source node. For adapter nodes this is
   * conventionally "next". For split nodes it's "a" or "b". Edges that
   * leave a node's source handle unset default to "next".
   */
  sourceHandle?: string;
  target: string;
};

export type NodeRunInput = {
  node: AdapterExecutableNode;
  inputAmount: bigint;
};

export type NodeRunResult = {
  /**
   * Outputs keyed by source-handle id. Adapter runs always produce a
   * single entry under "next". Split runs produce one entry per handle.
   */
  outputs: Map<string, bigint>;
  /**
   * Set when the run involved an on-chain submission. Compute-only
   * nodes (split, etc.) leave this undefined.
   */
  txSignature?: string;
};

/**
 * Adapter runner: invoked by `executeGraph` for nodes with kind
 * "adapter". Compute-only nodes are handled internally and never call
 * this function.
 */
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

const DEFAULT_HANDLE = "next";

/**
 * Kahn-style topological sort. Returns a linear order that respects
 * every edge's source-before-target constraint, or null if the graph
 * contains a cycle. Sorting is purely structural — sourceHandle plays
 * no role here.
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

type ParentEdge = { source: string; sourceHandle: string };

function getParentEdges(
  nodeId: string,
  edges: ExecutableEdge[],
): ParentEdge[] {
  return edges
    .filter((e) => e.target === nodeId)
    .map((e) => ({
      source: e.source,
      sourceHandle: e.sourceHandle ?? DEFAULT_HANDLE,
    }));
}

/**
 * Execute an Amount node locally. Scales the upstream input by the
 * configured percentage (0-100). Pure math, no chain interaction.
 * Single output on handle "next".
 */
function executeAmount(
  node: AmountExecutableNode,
  inputAmount: bigint,
): NodeRunResult {
  // Clamp pct to [0, 100] defensively. Negative or >100 values would
  // produce nonsensical amounts and downstream nodes would fail; the
  // clamp turns user error into "0 input downstream" instead of a
  // negative tx amount.
  const pct = Math.max(0, Math.min(100, Math.round(node.percentage)));
  const num = BigInt(pct);
  const out = (inputAmount * num) / 100n;
  return {
    outputs: new Map([["next", out]]),
  };
}

/**
 * Execute a Split node locally. Pure math: divide input by ratio.
 * Returns outputs on handles "a" and "b". Tiny rounding losses go to
 * handle "b" so the splits don't drift past 100% of input.
 */
function executeSplit(
  node: SplitExecutableNode,
  inputAmount: bigint,
): NodeRunResult {
  const totalRatio = node.splitA + node.splitB;
  // Defensive: avoid division by zero on a misconfigured split.
  if (totalRatio <= 0) {
    return {
      outputs: new Map([
        ["a", 0n],
        ["b", inputAmount],
      ]),
    };
  }
  // BigInt arithmetic avoids float precision loss on token amounts.
  // Multiply first, then divide, so we don't lose digits prematurely.
  const aRatio = BigInt(Math.round(node.splitA));
  const total = BigInt(Math.round(totalRatio));
  const aAmount = (inputAmount * aRatio) / total;
  const bAmount = inputAmount - aAmount;
  return {
    outputs: new Map([
      ["a", aAmount],
      ["b", bAmount],
    ]),
  };
}

/**
 * Execute a graph in topological order, invoking `runNode` for adapter
 * nodes and computing locally for split nodes. Streams state events as
 * it progresses. Upstream failures halt downstream nodes with a skipped
 * event. Cancellation via AbortSignal halts the loop at the next node
 * boundary.
 *
 * Pure at the module level — `runNode` is the only side-effectful
 * input. In tests it's a mock; in production it wraps the build/sign/
 * submit pipeline.
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

  // outputs.get(nodeId) returns the per-handle output map produced by
  // that node's run. Children index into it via the edge's sourceHandle.
  const outputs = new Map<string, Map<string, bigint>>();
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

    const parentEdges = getParentEdges(nodeId, params.edges);
    const failedParent = parentEdges.find((p) => failed.has(p.source));
    if (failedParent) {
      failed.add(nodeId);
      yield {
        kind: "node-skipped",
        nodeId,
        reason: `upstream "${failedParent.source}" failed`,
        timestamp: Date.now(),
      };
      continue;
    }

    let inputAmount = 0n;
    if (parentEdges.length === 0) {
      // Root node — adapters can carry sourceAmount as a starting
      // value (e.g., wallet-funded stake). Compute-only nodes (split,
      // amount) have no useful standalone semantics; default to 0
      // and let them emit zero-output handles, which downstream
      // adapters will reject during their own validation.
      if (node.kind === "adapter" && node.sourceAmount !== undefined) {
        inputAmount = node.sourceAmount;
      }
    } else {
      for (const edge of parentEdges) {
        const parentOutputs = outputs.get(edge.source);
        if (!parentOutputs) continue;
        const handleAmount = parentOutputs.get(edge.sourceHandle);
        if (handleAmount !== undefined) {
          inputAmount += handleAmount;
        }
      }
    }

    yield { kind: "node-started", nodeId, timestamp: Date.now() };

    try {
      let result: NodeRunResult;
      if (node.kind === "adapter") {
        result = await params.runNode({ node, inputAmount });
      } else if (node.kind === "split") {
        result = executeSplit(node, inputAmount);
      } else {
        // node.kind === "amount"
        result = executeAmount(node, inputAmount);
      }
      outputs.set(nodeId, result.outputs);
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
