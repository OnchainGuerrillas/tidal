import "server-only";

import { tool } from "ai";
import { z } from "zod";

import {
  buildComposeGraph,
  type ComposeGraphOutput,
  type GraphSpec,
} from "@/lib/workspace/compose-graph";

// Widget values the agent sets on a node. Adapter widgets are numbers
// (amount, loopCount, targetLTV, slippageBps), asset symbols (inputAsset,
// outputAsset), or the occasional boolean — never nested objects.
const widgetValue = z.union([z.number(), z.string(), z.boolean()]);

const inputSchema = z.object({
  nodes: z
    .array(
      z.object({
        ref: z
          .string()
          .describe(
            "Short handle for this node, unique within the graph (e.g. 'n1'). Referenced by edges.",
          ),
        catalogItemId: z
          .string()
          .describe(
            "Adapter catalogItemId from the manifest (e.g. 'jupiter-swap-sol-usdc'). Must match exactly.",
          ),
        widgets: z
          .record(z.string(), widgetValue)
          .optional()
          .describe(
            "Widget values keyed by the adapter's widget keys. Numbers are decimal units (0.05 SOL, 5 USDC). Set inputAsset/outputAsset for swap nodes. Only the entry node (no incoming edge) needs an 'amount'; downstream nodes inherit their amount from the upstream output at run time.",
          ),
      }),
    )
    .min(1)
    .describe("The strategy's nodes, one per protocol action."),
  edges: z
    .array(z.object({ from: z.string(), to: z.string() }))
    .optional()
    .describe(
      "Directed edges connecting node refs. The output asset of `from` must be accepted as input by `to`. Omit for single-node strategies.",
    ),
  summary: z
    .string()
    .describe("One-sentence plain-English description of the whole strategy."),
  rationale: z
    .string()
    .describe(
      "Why this composition works — which protocols, what risk, what the user gains. Under ~140 chars.",
    ),
  riskTier: z
    .string()
    .describe("One of: Shallows | Mid-Depth | Deep Water."),
  protocols: z
    .array(z.string())
    .optional()
    .describe("Optional; protocols are derived from the nodes for accuracy."),
});

export const composeGraphTool = tool({
  description:
    "Synthesize a multi-node Solana DeFi strategy as a Tidal canvas graph by wiring together adapters from the manifest. Use this for any strategy that isn't one of the four canonical composeStrategy intents — chained, multi-protocol, branching, or otherwise novel compositions. Returns graph mutations that materialize the nodes/edges on the workspace plus an executable plan the runner submits on user approval. The output reports `errors` (fatal — fix and recompose) and `warnings` (advisory, e.g. asset mismatch).",
  inputSchema,
  execute: async (input): Promise<ComposeGraphOutput> =>
    buildComposeGraph(input as GraphSpec),
});
