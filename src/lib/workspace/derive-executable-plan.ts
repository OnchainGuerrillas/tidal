import {
  decimalToBaseUnits,
  getAdapterCatalogEntry,
} from "@/lib/solana/adapter-catalog";
import type {
  ExecutableEdge,
  ExecutableNode,
} from "@/lib/workspace/graph-exec";
import type {
  StrategyNodeData,
  Workspace,
  WorkspaceGraphNode,
} from "@/mock-data/workspace/types";

export type ExecutablePlan = {
  nodes: ExecutableNode[];
  edges: ExecutableEdge[];
  errors: string[];
};

function isAdapterStrategyNode(
  node: WorkspaceGraphNode,
): node is WorkspaceGraphNode & { data: StrategyNodeData } {
  if (node.type !== "strategy") return false;
  const data = node.data as StrategyNodeData;
  return Boolean(data.catalogItemId);
}

/**
 * Walk a Workspace and produce the inputs `executeGraph` needs to run a
 * user-built (or AI-composed) graph on mainnet:
 *   - One ExecutableNode per adapter-backed strategy node, with
 *     `widgets` populated from `data.widgetValues` and a `sourceAmount`
 *     derived from the entry node's `amount` widget (in base units).
 *   - One ExecutableEdge per workspace edge that connects two adapter-
 *     backed nodes. Edges through visual-only nodes (split / amount /
 *     destination / reward) are intentionally dropped — those node kinds
 *     have no on-chain effect and including them in the executable graph
 *     would block topo-sort.
 *
 * Validation errors are returned in `errors`, not thrown. The caller
 * (Run button) shows them to the user instead of trying to execute.
 *
 * Pure function — no React, no fetch, no side effects.
 */
export function deriveExecutablePlan(workspace: Workspace): ExecutablePlan {
  const errors: string[] = [];
  const adapterNodes = workspace.nodes.filter(isAdapterStrategyNode);
  const adapterIds = new Set(adapterNodes.map((n) => n.id));

  if (adapterNodes.length === 0) {
    errors.push(
      "No runnable strategy nodes on the canvas yet. Drop one from the picker (Jito / Kamino / Jupiter) or ask the AI to compose a strategy.",
    );
    return { nodes: [], edges: [], errors };
  }

  // Edges between two adapter nodes are kept; everything else is dropped.
  const executableEdges: ExecutableEdge[] = workspace.edges
    .filter((e) => adapterIds.has(e.source) && adapterIds.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  // Entry nodes are adapter nodes with no incoming edge from another
  // adapter node. They need a sourceAmount derived from their `amount`
  // widget; downstream nodes inherit their amount from the previous
  // node's output via the runner.
  const targetIds = new Set(executableEdges.map((e) => e.target));

  const executableNodes: ExecutableNode[] = adapterNodes.map((node) => {
    const data = node.data;
    const catalogItemId = data.catalogItemId!;
    const entry = getAdapterCatalogEntry(catalogItemId);
    const widgetValues = data.widgetValues ?? {};

    if (!entry) {
      errors.push(
        `Node "${node.id}" references unknown adapter "${catalogItemId}".`,
      );
      return {
        id: node.id,
        catalogItemId,
        widgets: widgetValues,
      };
    }

    // Verify required widgets are present.
    for (const widget of entry.widgets) {
      if (!widget.required) continue;
      const value = widgetValues[widget.key];
      if (value === undefined || value === null || value === "") {
        errors.push(
          `${entry.catalogItem.title}: missing required input "${widget.label}".`,
        );
      }
    }

    const isEntry = !targetIds.has(node.id);
    let sourceAmount: bigint | undefined;
    if (isEntry) {
      const amountValue = widgetValues.amount;
      if (typeof amountValue !== "number") {
        errors.push(
          `${entry.catalogItem.title}: entry node needs a numeric "amount".`,
        );
      } else {
        const baseUnits = decimalToBaseUnits(
          amountValue,
          entry.inputDecimals,
        );
        if (baseUnits === null || baseUnits <= 0n) {
          errors.push(
            `${entry.catalogItem.title}: amount must be greater than zero.`,
          );
        } else {
          sourceAmount = baseUnits;
        }
      }
    }

    return {
      id: node.id,
      catalogItemId,
      widgets: widgetValues,
      sourceAmount,
    };
  });

  return { nodes: executableNodes, edges: executableEdges, errors };
}
