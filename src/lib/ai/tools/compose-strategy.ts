import "server-only";

import { tool } from "ai";
import { z } from "zod";

import { registerAllAdapters } from "@/lib/solana/adapters";
import { getAdapter } from "@/lib/solana/registry";
import { getAdapterCatalogEntry } from "@/lib/solana/adapter-catalog";
import type { GraphMutation } from "@/lib/workspace/mutations";
import type {
  ExecutableEdge,
  ExecutableNode,
} from "@/lib/workspace/graph-exec";
import type {
  StrategyNodeType,
  WorkspaceGraphEdge,
} from "@/mock-data/workspace/types";

const STRATEGY_INTENTS = [
  "liquid-stake-sol",
  "lend-usdc-kamino",
  "swap-sol-then-supply-usdc",
  "leverage-loop-sol-kamino",
] as const;

type StrategyIntent = (typeof STRATEGY_INTENTS)[number];

const inputSchema = z.object({
  intent: z
    .enum(STRATEGY_INTENTS)
    .describe(
      "Which canonical Tidal strategy to compose. liquid-stake-sol stakes SOL into JitoSOL via Jito stake pool. lend-usdc-kamino supplies USDC into the Kamino main market. swap-sol-then-supply-usdc routes SOL through Jupiter Ultra into USDC, then supplies it to Kamino. leverage-loop-sol-kamino composes a single Kamino+Jupiter leverage-loop node that recursively supplies SOL, borrows USDC, and swaps back to SOL — pick this when the user asks for a 'loop', 'leverage', '2x/3x SOL', or similar.",
    ),
  sourceAmount: z
    .string()
    .regex(/^\d+$/, "must be a positive integer string")
    .optional()
    .describe(
      "Optional override for the source amount in the smallest token unit (lamports for SOL, 6-decimal raw for USDC). If omitted, a small demo default is used.",
    ),
  loopCount: z
    .number()
    .int()
    .min(1)
    .max(3)
    .optional()
    .describe(
      "Only used by leverage-loop-sol-kamino. Number of recursive supply-and-borrow iterations (1-3). When the user says '3x' or 'three times', pass 3. Default 2.",
    ),
  targetLTV: z
    .number()
    .min(0.3)
    .max(0.7)
    .optional()
    .describe(
      "Only used by leverage-loop-sol-kamino. Target loan-to-value ratio per iteration (0.3-0.7). Higher = more aggressive leverage; lower = safer. Default 0.5.",
    ),
});

export type ComposeStrategyInput = z.infer<typeof inputSchema>;

export type ComposeStrategyOutput = {
  intent: StrategyIntent;
  summary: string;
  /**
   * Protocol pills surfaced on the compose card (e.g., ["Jupiter",
   * "Kamino"]). Order matches strategy flow direction.
   */
  protocols: string[];
  /**
   * One-line "why this works" rationale. Renders below the summary on
   * the compose card. Keep under ~120 chars — judges scan, they don't
   * read paragraphs.
   */
  rationale: string;
  /**
   * Risk tier label ("Shallows" | "Mid-Depth" | "Deep Water"). Surfaced
   * as a pill on the card so users grok the risk profile at a glance.
   */
  riskTier: string;
  mutations: GraphMutation[];
  executable: {
    nodes: SerializableExecutableNode[];
    edges: ExecutableEdge[];
  };
  warnings: string[];
};

// ExecutableNode contains a bigint, which doesn't serialize over JSON. We
// emit raw-string amounts and let the client convert when wiring into the
// runner.
type SerializableExecutableNode = {
  id: string;
  catalogItemId: string;
  widgets: Record<string, unknown>;
  sourceAmount?: string;
};

type TemplateBuildOptions = {
  sourceAmount: bigint;
  loopCount?: number;
  targetLTV?: number;
};

type StrategyTemplate = {
  intent: StrategyIntent;
  summary: (options: TemplateBuildOptions) => string;
  protocols: string[];
  rationale: string;
  riskTier: string;
  build: (options: TemplateBuildOptions) => {
    nodes: StrategyNodeType[];
    edges: WorkspaceGraphEdge[];
    executableNodes: ExecutableNode[];
    executableEdges: ExecutableEdge[];
    warnings: string[];
  };
  defaultSourceAmount: bigint;
};

const JITO_ID = "jito-sol-stake";
const KAMINO_ID = "kamino-usdc-supply";
const JUPITER_ID = "jupiter-swap-sol-usdc";
const LEVERAGE_LOOP_ID = "kamino-leverage-loop";

const EDGE_STYLE_MAIN = { stroke: "#61B3CF", strokeWidth: 2 } as const;

function newId(prefix: string): string {
  return `ai-${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function strategyNodeFromAdapter(params: {
  catalogItemId: string;
  position: { x: number; y: number };
  sourceAmountLabel?: string;
  /**
   * Pre-populated values for the node's adapter widgets, keyed by
   * `WidgetSchema.key`. These appear in the node's editable widget
   * inputs on the canvas the moment the node materialises — not just
   * in the executable plan. Without this, the user sees blank widgets
   * even though the AI passed concrete loop counts / LTVs.
   */
  widgetValues?: Record<string, unknown>;
}): StrategyNodeType {
  const adapter = getAdapter(params.catalogItemId);
  if (!adapter) {
    throw new Error(
      `composeStrategy: adapter "${params.catalogItemId}" is not registered`,
    );
  }
  const entry = getAdapterCatalogEntry(params.catalogItemId);
  if (!entry) {
    throw new Error(
      `composeStrategy: no AdapterCatalogEntry for "${params.catalogItemId}"`,
    );
  }
  const item = entry.catalogItem;
  const inputAsset = item.supportedInputAssets[0];

  return {
    id: newId(params.catalogItemId),
    type: "strategy",
    position: params.position,
    data: {
      nodeKind: "strategy",
      title: item.title,
      summary: item.description,
      protocol: item.protocolLabel ?? adapter.protocol.name,
      action: entry.actionLabel,
      inputAsset,
      acceptedAssets: [...item.supportedInputAssets],
      outputs: [
        {
          id: entry.primaryHandleId,
          label: entry.primaryHandleLabel,
          asset: entry.outputAsset,
          kind: "primary",
          compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
          amountLabel: params.sourceAmountLabel,
        },
      ],
      status: "draft",
      holdingsLabel: params.sourceAmountLabel
        ? `${params.sourceAmountLabel} queued`
        : `Awaiting ${inputAsset} input`,
      draftState: { hasChanges: true, changedFields: ["composed-by-ai"] },
      apy: entry.apyDisplay,
      apyType: entry.apyType,
      catalogItemId: item.id,
      widgetValues: params.widgetValues,
    },
  };
}

function lamportsToSolLabel(lamports: bigint): string {
  const sol = Number(lamports) / 1_000_000_000;
  return `${sol.toFixed(sol < 0.001 ? 4 : 3)} SOL`;
}

function rawUsdcToUsdcLabel(raw: bigint): string {
  const usdc = Number(raw) / 1_000_000;
  return `${usdc.toFixed(2)} USDC`;
}

const TEMPLATES: Record<StrategyIntent, StrategyTemplate> = {
  "liquid-stake-sol": {
    intent: "liquid-stake-sol",
    defaultSourceAmount: 10_000_000n, // 0.01 SOL
    protocols: ["Jito"],
    riskTier: "Shallows",
    rationale:
      "Jito is the highest-volume Solana stake pool — JitoSOL keeps your stake liquid and captures MEV tips on top of base staking yield.",
    summary: ({ sourceAmount }) =>
      `Stake ${lamportsToSolLabel(sourceAmount)} into JitoSOL via the Jito stake pool. Liquid staking position with MEV tips.`,
    build: ({ sourceAmount }) => {
      const node = strategyNodeFromAdapter({
        catalogItemId: JITO_ID,
        position: { x: 320, y: 240 },
        sourceAmountLabel: lamportsToSolLabel(sourceAmount),
      });
      return {
        nodes: [node],
        edges: [],
        executableNodes: [
          {
            id: node.id,
            kind: "adapter",
            catalogItemId: JITO_ID,
            widgets: {},
            sourceAmount,
          },
        ],
        executableEdges: [],
        warnings:
          sourceAmount < 10_000_000n
            ? [
                "staking less than 0.01 SOL — fee economics may not be worthwhile",
              ]
            : [],
      };
    },
  },

  "lend-usdc-kamino": {
    intent: "lend-usdc-kamino",
    defaultSourceAmount: 1_000_000n, // 1 USDC (6 decimals)
    protocols: ["Kamino"],
    riskTier: "Shallows",
    rationale:
      "Kamino main market has the deepest USDC supply liquidity on Solana — predictable variable APY, withdrawable on demand.",
    summary: ({ sourceAmount }) =>
      `Supply ${rawUsdcToUsdcLabel(sourceAmount)} into the Kamino main market USDC reserve. Variable supply APY.`,
    build: ({ sourceAmount }) => {
      const node = strategyNodeFromAdapter({
        catalogItemId: KAMINO_ID,
        position: { x: 320, y: 240 },
        sourceAmountLabel: rawUsdcToUsdcLabel(sourceAmount),
      });
      return {
        nodes: [node],
        edges: [],
        executableNodes: [
          {
            id: node.id,
            kind: "adapter",
            catalogItemId: KAMINO_ID,
            widgets: {},
            sourceAmount,
          },
        ],
        executableEdges: [],
        warnings: [],
      };
    },
  },

  "swap-sol-then-supply-usdc": {
    intent: "swap-sol-then-supply-usdc",
    defaultSourceAmount: 10_000_000n, // 0.01 SOL
    protocols: ["Jupiter", "Kamino"],
    riskTier: "Shallows",
    rationale:
      "Jupiter routes the swap across every Solana DEX for best price; Kamino then earns supply APY on the USDC. The graph runs as two sequential transactions.",
    summary: ({ sourceAmount }) =>
      `Swap ${lamportsToSolLabel(sourceAmount)} into USDC via Jupiter Ultra, then supply the resulting USDC into the Kamino main market.`,
    build: ({ sourceAmount }) => {
      const sourceSolDecimal = Number(sourceAmount) / 1_000_000_000;
      // Pre-populate the swap node's widgets so the canvas card shows
      // the AI's choices (asset direction, amount, slippage) and the
      // runner has everything it needs at execution time. Without
      // these, the swap node renders blank inputs and the executor
      // refuses to run with "missing required input" on the asset
      // selectors and amount.
      const swapWidgets = {
        inputAsset: "SOL",
        outputAsset: "USDC",
        amount: sourceSolDecimal,
        slippageBps: 50,
      };
      const swap = strategyNodeFromAdapter({
        catalogItemId: JUPITER_ID,
        position: { x: 200, y: 240 },
        sourceAmountLabel: lamportsToSolLabel(sourceAmount),
        widgetValues: swapWidgets,
      });
      // Kamino supply downstream has no concrete amount yet — the
      // runner overrides it with the swap's expectedOutputAmount when
      // the graph runs. We leave widgetValues undefined so the
      // canvas-side "from upstream" hint kicks in via the strategy-
      // node's hasUpstream check.
      const supply = strategyNodeFromAdapter({
        catalogItemId: KAMINO_ID,
        position: { x: 700, y: 240 },
      });
      const edge: WorkspaceGraphEdge = {
        id: `e-${swap.id}-${supply.id}`,
        source: swap.id,
        sourceHandle: "next",
        target: supply.id,
        type: "asset",
        data: { asset: "USDC" },
        style: EDGE_STYLE_MAIN,
        animated: true,
      };
      return {
        nodes: [swap, supply],
        edges: [edge],
        executableNodes: [
          {
            id: swap.id,
            kind: "adapter",
            catalogItemId: JUPITER_ID,
            widgets: swapWidgets,
            sourceAmount,
          },
          {
            id: supply.id,
            kind: "adapter",
            catalogItemId: KAMINO_ID,
            widgets: {},
          },
        ],
        executableEdges: [{ source: swap.id, target: supply.id }],
        warnings: [],
      };
    },
  },

  "leverage-loop-sol-kamino": {
    intent: "leverage-loop-sol-kamino",
    // 0.05 SOL — large enough that the borrowed USDC clears Kamino's
    // dust floor across all loop iterations even at lower LTVs.
    defaultSourceAmount: 50_000_000n,
    protocols: ["Kamino", "Jupiter"],
    riskTier: "Deep Water",
    rationale:
      "Kamino supplies SOL collateral and lets you borrow USDC against it; Jupiter swaps that USDC back to SOL each round, compounding effective exposure. The runner submits the loop as a sequence of supply→borrow→swap transactions.",
    summary: ({ sourceAmount, loopCount, targetLTV }) => {
      const loops = loopCount ?? 2;
      const ltv = targetLTV ?? 0.5;
      return `Leverage-loop ${lamportsToSolLabel(sourceAmount)} on Kamino: ${loops.toString()} iteration${loops === 1 ? "" : "s"} of supply-and-borrow at ${(ltv * 100).toFixed(0)}% LTV with Jupiter routing the borrowed USDC back to SOL each round.`;
    },
    build: ({ sourceAmount, loopCount, targetLTV }) => {
      const loops = loopCount ?? 2;
      const ltv = targetLTV ?? 0.5;
      const sourceSolDecimal = Number(sourceAmount) / 1_000_000_000;
      // Same shape goes onto both the visible canvas node (so the user
      // sees the values pre-populated in the widget inputs) and the
      // executable plan (so the runner builds with these values when
      // Run is clicked).
      const widgets = {
        amount: sourceSolDecimal,
        loopCount: loops,
        targetLTV: ltv,
      };
      const node = strategyNodeFromAdapter({
        catalogItemId: LEVERAGE_LOOP_ID,
        position: { x: 320, y: 240 },
        sourceAmountLabel: lamportsToSolLabel(sourceAmount),
        widgetValues: widgets,
      });
      return {
        nodes: [node],
        edges: [],
        executableNodes: [
          {
            id: node.id,
            kind: "adapter",
            catalogItemId: LEVERAGE_LOOP_ID,
            widgets,
            sourceAmount,
          },
        ],
        executableEdges: [],
        warnings:
          loops >= 3
            ? [
                "3-loop leverage compounds risk — a 30% SOL drawdown can liquidate the position depending on borrow LTV. Demo with small amounts only.",
              ]
            : [],
      };
    },
  },
};

function serializeExecutableNode(
  node: ExecutableNode,
): SerializableExecutableNode {
  // AI compose templates only emit adapter nodes today (no Splits in
  // canonical strategy intents). Narrow defensively in case a future
  // template adds compute-only nodes.
  if (node.kind !== "adapter") {
    throw new Error(
      `compose-strategy: unexpected non-adapter executable node "${node.id}" of kind "${node.kind}"`,
    );
  }
  return {
    id: node.id,
    catalogItemId: node.catalogItemId,
    widgets: node.widgets,
    sourceAmount:
      node.sourceAmount !== undefined ? node.sourceAmount.toString() : undefined,
  };
}

export const composeStrategyTool = tool({
  description:
    "Compose a Solana DeFi strategy as a Tidal canvas graph. Returns graph mutations that materialize nodes and edges on the user's workspace, plus an executable plan the runner can submit on user approval. Use this whenever the user asks for a concrete strategy (e.g., 'stake SOL', 'lend USDC', 'put my SOL into a stable yield position'). Pick the closest intent.",
  inputSchema,
  execute: async ({
    intent,
    sourceAmount,
    loopCount,
    targetLTV,
  }: ComposeStrategyInput): Promise<ComposeStrategyOutput> => {
    registerAllAdapters();

    const template = TEMPLATES[intent];
    const amount =
      sourceAmount !== undefined
        ? BigInt(sourceAmount)
        : template.defaultSourceAmount;

    const buildOptions: TemplateBuildOptions = {
      sourceAmount: amount,
      loopCount,
      targetLTV,
    };
    const built = template.build(buildOptions);

    const mutations: GraphMutation[] = [
      ...built.nodes.map((node) => ({ kind: "add-node" as const, node })),
      ...built.edges.map((edge) => ({ kind: "add-edge" as const, edge })),
    ];

    return {
      intent,
      summary: template.summary(buildOptions),
      protocols: template.protocols,
      rationale: template.rationale,
      riskTier: template.riskTier,
      mutations,
      executable: {
        nodes: built.executableNodes.map(serializeExecutableNode),
        edges: built.executableEdges,
      },
      warnings: built.warnings,
    };
  },
});
