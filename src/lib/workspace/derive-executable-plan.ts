import {
  decimalToBaseUnits,
  getAdapterCatalogEntry,
  getSwapAsset,
} from "@/lib/solana/adapter-catalog";
import type {
  ExecutableEdge,
  ExecutableNode,
} from "@/lib/workspace/graph-exec";
import type {
  AmountNodeData,
  SplitNodeData,
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

function isSplitNode(
  node: WorkspaceGraphNode,
): node is WorkspaceGraphNode & { data: SplitNodeData } {
  return node.type === "split";
}

function isAmountNode(
  node: WorkspaceGraphNode,
): node is WorkspaceGraphNode & { data: AmountNodeData } {
  return node.type === "amount";
}

/**
 * Walk a Workspace and produce the inputs `executeGraph` needs to run a
 * user-built (or AI-composed) graph on mainnet:
 *   - One ExecutableNode per adapter-backed strategy node, with
 *     `widgets` populated from `data.widgetValues` and a `sourceAmount`
 *     derived from the entry node's `amount` widget (in base units).
 *   - One ExecutableNode per Split node — these are compute-only,
 *     fanning input out to handles "a" and "b" by ratio.
 *   - One ExecutableEdge per workspace edge that connects two
 *     executable nodes (adapter or split). sourceHandle is propagated
 *     from the React Flow edge so split outputs route to the right
 *     downstream branch. Edges through other visual-only nodes
 *     (amount / destination / reward) are dropped — those have no
 *     execution semantics yet.
 *
 * Validation errors are returned in `errors`, not thrown. The caller
 * (Run button) shows them to the user instead of trying to execute.
 *
 * Pure function — no React, no fetch, no side effects.
 */
export function deriveExecutablePlan(workspace: Workspace): ExecutablePlan {
  const errors: string[] = [];
  const adapterNodes = workspace.nodes.filter(isAdapterStrategyNode);
  const splitNodes = workspace.nodes.filter(isSplitNode);
  const amountNodes = workspace.nodes.filter(isAmountNode);

  if (adapterNodes.length === 0) {
    errors.push(
      "No runnable strategy nodes on the canvas yet. Drop one from the picker (Jito / Kamino / Jupiter) or ask the AI to compose a strategy.",
    );
    return { nodes: [], edges: [], errors };
  }

  // The set of all node ids that participate in execution. Edges with
  // both endpoints in this set are kept; everything else is dropped.
  const executableIds = new Set<string>([
    ...adapterNodes.map((n) => n.id),
    ...splitNodes.map((n) => n.id),
    ...amountNodes.map((n) => n.id),
  ]);

  const executableEdges: ExecutableEdge[] = workspace.edges
    .filter((e) => executableIds.has(e.source) && executableIds.has(e.target))
    .map((e) => ({
      source: e.source,
      sourceHandle: e.sourceHandle ?? undefined,
      target: e.target,
    }));

  // Entry-node detection: any adapter with no incoming edge from
  // another executable node. Such a node needs a sourceAmount derived
  // from its `amount` widget; otherwise the runner has no input value
  // to feed it.
  const targetIds = new Set(executableEdges.map((e) => e.target));

  const splitExecutables: ExecutableNode[] = splitNodes.map((node) => ({
    id: node.id,
    kind: "split" as const,
    splitA: node.data.splitA,
    splitB: node.data.splitB,
  }));

  // Amount nodes execute in percent mode only for v1 — fixed mode is
  // deferred until the runner tracks per-edge asset metadata for
  // proper decimal conversion. Each Amount node emits an executable
  // with the percent value; if mode is "fixed", we surface a
  // user-facing error rather than silently passing through.
  const amountExecutables: ExecutableNode[] = amountNodes.map((node) => {
    if (node.data.amountMode === "fixed") {
      errors.push(
        `Amount node "${node.data.title || node.id}": fixed-amount mode isn't runnable yet (decimal handling for the upstream asset is in flight). Switch to percent mode, or set a strategy node's amount widget directly.`,
      );
    }
    const rawValue =
      typeof node.data.value === "number" ? node.data.value : 50;
    return {
      id: node.id,
      kind: "amount" as const,
      percentage: rawValue,
    };
  });

  const adapterExecutables: ExecutableNode[] = adapterNodes.map((node) => {
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
        kind: "adapter" as const,
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
        // For swap-style adapters that expose an inputAsset selector,
        // the input decimals depend on which asset the user picked. For
        // single-asset adapters (Jito stakes SOL, Kamino supplies USDC)
        // this falls back to the entry's static inputDecimals.
        const inputAssetWidget = widgetValues.inputAsset;
        const swapAsset =
          typeof inputAssetWidget === "string"
            ? getSwapAsset(inputAssetWidget)
            : undefined;
        const decimals = swapAsset?.decimals ?? entry.inputDecimals;
        const baseUnits = decimalToBaseUnits(amountValue, decimals);
        if (baseUnits === null || baseUnits <= 0n) {
          errors.push(
            `${entry.catalogItem.title}: amount must be greater than zero.`,
          );
        } else if (
          inputAssetWidget !== undefined &&
          inputAssetWidget !== null &&
          inputAssetWidget !== "" &&
          !swapAsset
        ) {
          errors.push(
            `${entry.catalogItem.title}: unsupported input asset "${String(inputAssetWidget)}".`,
          );
        } else {
          sourceAmount = baseUnits;
        }
      }

      // Cross-check: if both inputAsset and outputAsset widgets are
      // present (swap node), they must differ.
      const inputAssetWidget = widgetValues.inputAsset;
      const outputAssetWidget = widgetValues.outputAsset;
      if (
        typeof inputAssetWidget === "string" &&
        typeof outputAssetWidget === "string" &&
        inputAssetWidget === outputAssetWidget &&
        inputAssetWidget.length > 0
      ) {
        errors.push(
          `${entry.catalogItem.title}: input and output assets must differ (both are ${inputAssetWidget}).`,
        );
      }
    }

    return {
      id: node.id,
      kind: "adapter" as const,
      catalogItemId,
      widgets: widgetValues,
      sourceAmount,
    };
  });

  const executableNodes: ExecutableNode[] = [
    ...adapterExecutables,
    ...splitExecutables,
    ...amountExecutables,
  ];

  return { nodes: executableNodes, edges: executableEdges, errors };
}
