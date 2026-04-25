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
] as const;

type StrategyIntent = (typeof STRATEGY_INTENTS)[number];

const inputSchema = z.object({
  intent: z
    .enum(STRATEGY_INTENTS)
    .describe(
      "Which canonical Tidal strategy to compose. liquid-stake-sol stakes SOL into JitoSOL via Jito stake pool. lend-usdc-kamino supplies USDC into the Kamino main market. swap-sol-then-supply-usdc routes SOL through Jupiter Ultra into USDC, then supplies it to Kamino.",
    ),
  sourceAmount: z
    .string()
    .regex(/^\d+$/, "must be a positive integer string")
    .optional()
    .describe(
      "Optional override for the source amount in the smallest token unit (lamports for SOL, 6-decimal raw for USDC). If omitted, a small demo default is used.",
    ),
});

export type ComposeStrategyInput = z.infer<typeof inputSchema>;

export type ComposeStrategyOutput = {
  intent: StrategyIntent;
  summary: string;
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

type StrategyTemplate = {
  intent: StrategyIntent;
  summary: (sourceAmount: bigint) => string;
  build: (sourceAmount: bigint) => {
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

const EDGE_STYLE_MAIN = { stroke: "#61B3CF", strokeWidth: 2 } as const;

function newId(prefix: string): string {
  return `ai-${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function strategyNodeFromAdapter(params: {
  catalogItemId: string;
  position: { x: number; y: number };
  sourceAmountLabel?: string;
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
    summary: (amount) =>
      `Stake ${lamportsToSolLabel(amount)} into JitoSOL via the Jito stake pool. Liquid staking position with MEV tips. Shallows risk tier.`,
    build: (sourceAmount) => {
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
    summary: (amount) =>
      `Supply ${rawUsdcToUsdcLabel(amount)} into the Kamino main market USDC reserve. Variable supply APY. Shallows risk tier.`,
    build: (sourceAmount) => {
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
    summary: (amount) =>
      `Swap ${lamportsToSolLabel(amount)} into USDC via Jupiter Ultra, then supply the resulting USDC into the Kamino main market. Two-hop strategy: best-of-route swap, then variable supply APY. Shallows risk tier overall.`,
    build: (sourceAmount) => {
      const swap = strategyNodeFromAdapter({
        catalogItemId: JUPITER_ID,
        position: { x: 200, y: 240 },
        sourceAmountLabel: lamportsToSolLabel(sourceAmount),
      });
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
            catalogItemId: JUPITER_ID,
            widgets: {},
            sourceAmount,
          },
          {
            id: supply.id,
            catalogItemId: KAMINO_ID,
            widgets: {},
          },
        ],
        executableEdges: [{ source: swap.id, target: supply.id }],
        warnings: [],
      };
    },
  },
};

function serializeExecutableNode(
  node: ExecutableNode,
): SerializableExecutableNode {
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
  }: ComposeStrategyInput): Promise<ComposeStrategyOutput> => {
    registerAllAdapters();

    const template = TEMPLATES[intent];
    const amount =
      sourceAmount !== undefined
        ? BigInt(sourceAmount)
        : template.defaultSourceAmount;

    const built = template.build(amount);

    const mutations: GraphMutation[] = [
      ...built.nodes.map((node) => ({ kind: "add-node" as const, node })),
      ...built.edges.map((edge) => ({ kind: "add-edge" as const, edge })),
    ];

    return {
      intent,
      summary: template.summary(amount),
      mutations,
      executable: {
        nodes: built.executableNodes.map(serializeExecutableNode),
        edges: built.executableEdges,
      },
      warnings: built.warnings,
    };
  },
});
