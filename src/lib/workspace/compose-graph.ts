// Real strategy composition (Workstream #7).
//
// Where compose-strategy-template.ts maps one of four fixed intents to a
// hardcoded graph, this module lets the agent *synthesize* an arbitrary
// multi-node strategy: it emits a GraphSpec (nodes referencing adapter
// catalogItemIds + edges between them), and buildComposeGraph validates
// asset compatibility, orders + lays out the DAG, and materializes the
// same canvas-graph + executable-plan shape the runner already consumes.
//
// Pure TypeScript, no AI and no server-only deps — unit-testable in
// isolation. The AI tool (src/lib/ai/tools/compose-graph.ts) is a thin
// wrapper that validates the spec with Zod and calls buildComposeGraph.

import {
  ADAPTER_CATALOG_ENTRIES,
  getAdapterCatalogEntry,
  getSwapAsset,
  decimalToBaseUnits,
  type AdapterCatalogEntry,
} from "@/lib/solana/adapter-catalog";
import {
  EDGE_STYLE_MAIN,
  serializeExecutableNode,
  strategyNodeFromAdapter,
  type SerializableExecutableNode,
} from "@/lib/workspace/compose-strategy-template";
import type {
  ExecutableEdge,
  ExecutableNode,
} from "@/lib/workspace/graph-exec";
import type { GraphMutation } from "@/lib/workspace/mutations";
import type {
  StrategyNodeType,
  WorkspaceGraphEdge,
} from "@/mock-data/workspace/types";

// Widget keys that the Jupiter swap entry uses to declare a dynamic
// input/output asset. For every other adapter the input/output assets are
// fixed on the catalog entry.
const SWAP_INPUT_KEY = "inputAsset";
const SWAP_OUTPUT_KEY = "outputAsset";
const AMOUNT_KEY = "amount";

// ---------------------------------------------------------------------------
// Agent-facing manifest
// ---------------------------------------------------------------------------

export type AdapterManifestWidget = {
  key: string;
  label: string;
  required: boolean;
  options?: string[];
  default?: unknown;
};

export type AdapterManifestEntry = {
  catalogItemId: string;
  title: string;
  protocol: string;
  inputAssets: string[];
  outputAsset: string;
  description: string;
  widgets: AdapterManifestWidget[];
};

function manifestOutputAsset(entry: AdapterCatalogEntry): string {
  // Jupiter swap's output is whatever the outputAsset widget selects.
  return entry.outputAsset === "selected"
    ? "(set via outputAsset widget)"
    : entry.outputAsset;
}

/**
 * The adapter vocabulary the agent reasons over when composing. Derived
 * from ADAPTER_CATALOG_ENTRIES so it can never drift from what the runner
 * can actually execute.
 */
export function getAdapterManifest(): AdapterManifestEntry[] {
  return ADAPTER_CATALOG_ENTRIES.map((entry) => ({
    catalogItemId: entry.catalogItem.id,
    title: entry.catalogItem.title,
    protocol: entry.catalogItem.protocolLabel ?? entry.catalogItem.title,
    inputAssets: [...entry.catalogItem.supportedInputAssets],
    outputAsset: manifestOutputAsset(entry),
    description: entry.catalogItem.description,
    widgets: entry.widgets.map((w) => ({
      key: w.key,
      label: w.label,
      required: w.required ?? false,
      ...(w.options ? { options: [...w.options] } : {}),
      ...(w.default !== undefined ? { default: w.default } : {}),
    })),
  }));
}

/**
 * Compact text rendering of the manifest for injection into the system
 * prompt. One line per adapter plus its widget keys, so the agent knows
 * exactly which catalogItemIds and assets it can wire together.
 */
export function formatManifestForPrompt(): string {
  return getAdapterManifest()
    .map((m) => {
      const widgetList = m.widgets
        .map((w) => {
          const opts = w.options ? `=${w.options.join("|")}` : "";
          return `${w.key}${opts}${w.required ? "*" : ""}`;
        })
        .join(", ");
      return `- ${m.catalogItemId} | ${m.protocol} | in: ${m.inputAssets.join("/")} -> out: ${m.outputAsset} | widgets: ${widgetList}\n    ${m.description}`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Graph spec (what the agent emits)
// ---------------------------------------------------------------------------

export type GraphSpecNode = {
  /** Agent-chosen handle for cross-referencing in edges, e.g. "n1". */
  ref: string;
  catalogItemId: string;
  /** Widget values keyed by WidgetSchema.key. Numbers are decimal units. */
  widgets?: Record<string, unknown>;
};

export type GraphSpecEdge = {
  from: string;
  to: string;
};

export type GraphSpec = {
  nodes: GraphSpecNode[];
  edges?: GraphSpecEdge[];
  summary: string;
  rationale: string;
  riskTier: string;
  /** Optional; protocols are derived from the nodes for accuracy. */
  protocols?: string[];
};

export type ComposeGraphOutput = {
  valid: boolean;
  summary: string;
  protocols: string[];
  rationale: string;
  riskTier: string;
  mutations: GraphMutation[];
  executable: {
    nodes: SerializableExecutableNode[];
    edges: ExecutableEdge[];
  };
  /** Advisory issues (e.g. asset mismatch) — graph still materializes. */
  warnings: string[];
  /** Fatal issues — when non-empty, valid is false and nothing materializes. */
  errors: string[];
};

// ---------------------------------------------------------------------------
// Asset / amount resolution
// ---------------------------------------------------------------------------

function hasWidget(entry: AdapterCatalogEntry, key: string): boolean {
  return entry.widgets.some((w) => w.key === key);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** The asset a node emits on its primary output handle. */
function resolveOutputAsset(
  entry: AdapterCatalogEntry,
  widgets: Record<string, unknown>,
): string {
  if (hasWidget(entry, SWAP_OUTPUT_KEY)) {
    const picked = asString(widgets[SWAP_OUTPUT_KEY]);
    if (picked) return picked;
  }
  return entry.outputAsset;
}

/** The asset(s) a node will accept on its input. */
function resolveAcceptedInputs(
  entry: AdapterCatalogEntry,
  widgets: Record<string, unknown>,
): string[] {
  if (hasWidget(entry, SWAP_INPUT_KEY)) {
    const picked = asString(widgets[SWAP_INPUT_KEY]);
    if (picked) return [picked];
  }
  return [...entry.catalogItem.supportedInputAssets];
}

/** Decimals of a node's input asset, used to base-unit the source amount. */
function resolveInputDecimals(
  entry: AdapterCatalogEntry,
  widgets: Record<string, unknown>,
): number {
  if (hasWidget(entry, SWAP_INPUT_KEY)) {
    const picked = asString(widgets[SWAP_INPUT_KEY]);
    if (picked) {
      const asset = getSwapAsset(picked);
      if (asset) return asset.decimals;
    }
  }
  return entry.inputDecimals;
}

function resolveInputSymbol(
  entry: AdapterCatalogEntry,
  widgets: Record<string, unknown>,
): string {
  if (hasWidget(entry, SWAP_INPUT_KEY)) {
    const picked = asString(widgets[SWAP_INPUT_KEY]);
    if (picked) return picked;
  }
  return entry.catalogItem.supportedInputAssets[0] ?? "tokens";
}

function formatAmount(value: number): string {
  // Trim float noise and trailing zeros: 0.0100 -> "0.01", 1.0 -> "1".
  return Number.parseFloat(value.toFixed(6)).toString();
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildComposeGraph(spec: GraphSpec): ComposeGraphOutput {
  const errors: string[] = [];
  const warnings: string[] = [];
  const edges = spec.edges ?? [];

  const fail = (): ComposeGraphOutput => ({
    valid: false,
    summary: spec.summary ?? "",
    protocols: spec.protocols ?? [],
    rationale: spec.rationale ?? "",
    riskTier: spec.riskTier ?? "",
    mutations: [],
    executable: { nodes: [], edges: [] },
    warnings,
    errors,
  });

  if (!spec.nodes || spec.nodes.length === 0) {
    errors.push("graph has no nodes");
    return fail();
  }

  // 1. Unique refs.
  const refSeen = new Set<string>();
  for (const n of spec.nodes) {
    if (refSeen.has(n.ref)) errors.push(`duplicate node ref "${n.ref}"`);
    refSeen.add(n.ref);
  }

  // 2. Resolve catalog entries.
  const entryByRef = new Map<string, AdapterCatalogEntry>();
  for (const n of spec.nodes) {
    const entry = getAdapterCatalogEntry(n.catalogItemId);
    if (!entry) {
      errors.push(
        `unknown catalogItemId "${n.catalogItemId}" on node "${n.ref}"`,
      );
      continue;
    }
    entryByRef.set(n.ref, entry);
  }

  // 3. Edges must reference known refs.
  for (const e of edges) {
    if (!refSeen.has(e.from)) {
      errors.push(`edge references unknown source ref "${e.from}"`);
    }
    if (!refSeen.has(e.to)) {
      errors.push(`edge references unknown target ref "${e.to}"`);
    }
  }

  if (errors.length > 0) return fail();

  // 4. Topological order + depth via Kahn's algorithm (also cycle check).
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const depth = new Map<string, number>();
  for (const n of spec.nodes) {
    indegree.set(n.ref, 0);
    adjacency.set(n.ref, []);
    depth.set(n.ref, 0);
  }
  for (const e of edges) {
    adjacency.get(e.from)?.push(e.to);
    indegree.set(e.to, (indegree.get(e.to) ?? 0) + 1);
  }
  const queue = spec.nodes
    .filter((n) => (indegree.get(n.ref) ?? 0) === 0)
    .map((n) => n.ref);
  const topo: string[] = [];
  while (queue.length > 0) {
    const ref = queue.shift() as string;
    topo.push(ref);
    for (const next of adjacency.get(ref) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, (depth.get(ref) ?? 0) + 1));
      indegree.set(next, (indegree.get(next) ?? 0) - 1);
      if ((indegree.get(next) ?? 0) === 0) queue.push(next);
    }
  }
  if (topo.length !== spec.nodes.length) {
    errors.push(
      "graph contains a cycle — strategies must be a DAG (the runner executes nodes in dependency order)",
    );
    return fail();
  }

  const widgetsOf = (ref: string): Record<string, unknown> =>
    spec.nodes.find((n) => n.ref === ref)?.widgets ?? {};

  // 5. Asset compatibility per edge (advisory — the canvas + runner are the
  //    final gate, and some "outputs" are position tokens like kUSDC).
  for (const e of edges) {
    const srcEntry = entryByRef.get(e.from) as AdapterCatalogEntry;
    const tgtEntry = entryByRef.get(e.to) as AdapterCatalogEntry;
    const out = resolveOutputAsset(srcEntry, widgetsOf(e.from));
    const accepted = resolveAcceptedInputs(tgtEntry, widgetsOf(e.to));
    if (!accepted.includes(out)) {
      warnings.push(
        `edge ${e.from}->${e.to}: ${srcEntry.catalogItem.title} outputs ${out} but ${tgtEntry.catalogItem.title} accepts ${accepted.join("/")} — insert a swap or fix the wiring`,
      );
    }
  }

  // 6. Synthesize canvas + executable nodes. Layout: x by topological depth,
  //    y stacking siblings at the same depth.
  const byDepth = new Map<number, string[]>();
  for (const n of spec.nodes) {
    const d = depth.get(n.ref) ?? 0;
    const bucket = byDepth.get(d);
    if (bucket) bucket.push(n.ref);
    else byDepth.set(d, [n.ref]);
  }
  const positionByRef = new Map<string, { x: number; y: number }>();
  const X0 = 200;
  const X_GAP = 360;
  const Y0 = 200;
  const Y_GAP = 170;
  for (const [d, refs] of byDepth) {
    refs.forEach((ref, i) => {
      positionByRef.set(ref, { x: X0 + d * X_GAP, y: Y0 + i * Y_GAP });
    });
  }

  const hasIncoming = new Set(edges.map((e) => e.to));
  const idByRef = new Map<string, string>();
  const canvasNodes: StrategyNodeType[] = [];
  const executableNodes: ExecutableNode[] = [];

  for (const n of spec.nodes) {
    const entry = entryByRef.get(n.ref) as AdapterCatalogEntry;
    const widgets = n.widgets ?? {};
    const isEntry = !hasIncoming.has(n.ref);

    let sourceAmount: bigint | undefined;
    let sourceAmountLabel: string | undefined;
    if (isEntry) {
      const amount = widgets[AMOUNT_KEY];
      if (typeof amount !== "number") {
        warnings.push(
          `entry node ${n.ref} (${entry.catalogItem.title}) has no numeric amount — the user must fill it before running`,
        );
      } else {
        const base = decimalToBaseUnits(
          amount,
          resolveInputDecimals(entry, widgets),
        );
        if (base === null) {
          warnings.push(
            `entry node ${n.ref}: invalid amount ${String(amount)}`,
          );
        } else {
          sourceAmount = base;
          sourceAmountLabel = `${formatAmount(amount)} ${resolveInputSymbol(entry, widgets)}`;
        }
      }
    }

    const node = strategyNodeFromAdapter({
      catalogItemId: n.catalogItemId,
      position: positionByRef.get(n.ref) ?? { x: X0, y: Y0 },
      sourceAmountLabel,
      widgetValues: widgets,
    });
    idByRef.set(n.ref, node.id);
    canvasNodes.push(node);
    executableNodes.push({
      id: node.id,
      kind: "adapter",
      catalogItemId: n.catalogItemId,
      widgets,
      ...(sourceAmount !== undefined ? { sourceAmount } : {}),
    });
  }

  // 7. Synthesize edges (canvas + executable) now that ids exist.
  const canvasEdges: WorkspaceGraphEdge[] = [];
  const executableEdges: ExecutableEdge[] = [];
  for (const e of edges) {
    const sourceId = idByRef.get(e.from) as string;
    const targetId = idByRef.get(e.to) as string;
    const srcEntry = entryByRef.get(e.from) as AdapterCatalogEntry;
    const asset = resolveOutputAsset(srcEntry, widgetsOf(e.from));
    canvasEdges.push({
      id: `e-${sourceId}-${targetId}`,
      source: sourceId,
      sourceHandle: "next",
      target: targetId,
      type: "asset",
      data: { asset },
      style: EDGE_STYLE_MAIN,
      animated: true,
    });
    executableEdges.push({ source: sourceId, target: targetId });
  }

  const protocols = uniqueInOrder(
    topo.map((ref) => {
      const item = (entryByRef.get(ref) as AdapterCatalogEntry).catalogItem;
      return item.protocolLabel ?? item.title;
    }),
  );

  const mutations: GraphMutation[] = [
    ...canvasNodes.map((node) => ({ kind: "add-node" as const, node })),
    ...canvasEdges.map((edge) => ({ kind: "add-edge" as const, edge })),
  ];

  return {
    valid: true,
    summary: spec.summary,
    protocols,
    rationale: spec.rationale,
    riskTier: spec.riskTier,
    mutations,
    executable: {
      nodes: executableNodes.map(serializeExecutableNode),
      edges: executableEdges,
    },
    warnings,
    errors,
  };
}
