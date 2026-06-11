import {
  buildComposeStrategy,
  type ComposeStrategyInput,
  type ComposeStrategyOutput,
} from "@/lib/workspace/compose-strategy-template";

type DesignModeChatComposition = {
  leadIn: string;
  output: ComposeStrategyOutput;
};

function resolvePrompt(prompt: string): ComposeStrategyInput {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("loop") || normalized.includes("leverage")) {
    return {
      intent: "leverage-loop-sol-kamino",
      sourceAmount: "50000000",
      loopCount: normalized.includes("3") ? 3 : 2,
      targetLTV: normalized.includes("aggressive") ? 0.65 : 0.5,
    };
  }

  if (normalized.includes("swap")) {
    return {
      intent: "swap-sol-then-supply-usdc",
      sourceAmount: "50000000",
    };
  }

  if (normalized.includes("lend") || normalized.includes("kamino") || normalized.includes("usdc")) {
    return {
      intent: "lend-usdc-kamino",
      sourceAmount: "5000000",
    };
  }

  return {
    intent: "liquid-stake-sol",
    sourceAmount: "50000000",
  };
}

function leadInFor(output: ComposeStrategyOutput): string {
  if (output.intent === "swap-sol-then-supply-usdc") {
    return "Composing a 2-node graph: Jupiter swaps SOL into USDC, then Kamino supplies it for variable APY.";
  }

  if (output.intent === "lend-usdc-kamino") {
    return "Composing a Kamino lending graph for USDC supply yield.";
  }

  if (output.intent === "leverage-loop-sol-kamino") {
    return "Composing a Deep Water leverage-loop graph with Kamino and Jupiter.";
  }

  return "Composing a Jito liquid-staking graph for SOL.";
}

export function composeDesignModeChatPrompt(
  prompt: string,
): DesignModeChatComposition {
  const output = buildComposeStrategy(resolvePrompt(prompt));

  return {
    leadIn: leadInFor(output),
    output,
  };
}
