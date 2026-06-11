import "server-only";

import { tool } from "ai";
import { z } from "zod";

import {
  STRATEGY_INTENTS,
  buildComposeStrategy,
  type ComposeStrategyInput,
  type ComposeStrategyOutput,
} from "@/lib/workspace/compose-strategy-template";

export type { ComposeStrategyInput, ComposeStrategyOutput };

const inputSchema = z.object({
  intent: z
    .enum(STRATEGY_INTENTS)
    .describe(
      "Which canonical Tidal strategy to compose. liquid-stake-sol stakes SOL into JitoSOL via Jito stake pool. lend-usdc-kamino supplies USDC into the Kamino main market. swap-sol-then-supply-usdc routes SOL through Jupiter Ultra into USDC, then supplies it to Kamino. leverage-loop-sol-kamino composes a single Kamino+Jupiter leverage-loop node that recursively supplies SOL, borrows USDC, and swaps back to SOL — pick this when the user asks for a loop, leverage, 2x/3x SOL, or similar.",
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
      "Only used by leverage-loop-sol-kamino. Number of recursive supply-and-borrow iterations (1-3). When the user says 3x or three times, pass 3. Default 2.",
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

export const composeStrategyTool = tool({
  description:
    "Compose a Solana DeFi strategy as a Tidal canvas graph. Returns graph mutations that materialize nodes and edges on the user workspace, plus an executable plan the runner can submit on user approval. Use this whenever the user asks for a concrete strategy. Pick the closest intent.",
  inputSchema,
  execute: async (input: ComposeStrategyInput): Promise<ComposeStrategyOutput> =>
    buildComposeStrategy(input),
});
