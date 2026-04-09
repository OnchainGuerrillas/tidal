import type { Edge, Node } from "@xyflow/react";

import type {
  AmplifyWorkspace,
  SplitNodeData,
  StrategyNodeData,
} from "../types";

export const amplifySuggestions = [
  "Optimise this strategy",
  "Add a new node",
  "Show risk breakdown",
];

export const amplifyInitialNodes: (
  | Node<StrategyNodeData>
  | Node<SplitNodeData>
)[] = [
  {
    id: "marinade",
    type: "strategy",
    position: { x: 0, y: 200 },
    data: {
      protocol: "Marinade",
      action: "Stake SOL",
      assetIn: "SOL",
      assetOut: "mSOL",
      apy: "7.5%",
      apyType: "earn",
      collectInterval: "Weekly",
    },
  },
  {
    id: "split",
    type: "split",
    position: { x: 320, y: 210 },
    data: { splitA: 50, splitB: 50, asset: "mSOL" },
  },
  {
    id: "kamino",
    type: "strategy",
    position: { x: 580, y: 30 },
    data: {
      protocol: "Kamino",
      action: "Supply & Borrow",
      assetIn: "mSOL",
      assetOut: "USDC",
      apy: "3.2%",
      apyType: "cost",
    },
  },
  {
    id: "split-usdc",
    type: "split",
    position: { x: 880, y: 40 },
    data: { splitA: 30, splitB: 70, asset: "USDC" },
  },
  {
    id: "raydium",
    type: "strategy",
    position: { x: 1140, y: -100 },
    data: {
      protocol: "Raydium",
      action: "Provide Liquidity",
      assetIn: "USDC",
      assetOut: "LP Fees",
      apy: "12.0%",
      apyType: "earn",
      collectInterval: "Weekly",
    },
  },
  {
    id: "marginfi",
    type: "strategy",
    position: { x: 1140, y: 180 },
    data: {
      protocol: "Marginfi",
      action: "Lend USDC",
      assetIn: "USDC",
      assetOut: "Interest",
      apy: "8.4%",
      apyType: "earn",
      collectInterval: "Monthly",
    },
  },
  {
    id: "drift",
    type: "strategy",
    position: { x: 580, y: 380 },
    data: {
      protocol: "Drift",
      action: "Lend mSOL",
      assetIn: "mSOL",
      assetOut: "Interest",
      apy: "5.2%",
      apyType: "earn",
      collectInterval: "Monthly",
    },
  },
  {
    id: "orca",
    type: "strategy",
    position: { x: 900, y: 380 },
    data: {
      protocol: "Orca",
      action: "Concentrated LP",
      assetIn: "mSOL",
      assetOut: "LP Fees",
      apy: "9.1%",
      apyType: "earn",
      collectInterval: "Bi-weekly",
    },
  },
];

const mainEdgeStyle = { stroke: "#61B3CF", strokeWidth: 2 };

export const amplifyInitialEdges: Edge<{ asset: string }>[] = [
  {
    id: "e-marinade-split",
    source: "marinade",
    sourceHandle: "next",
    target: "split",
    type: "asset",
    data: { asset: "mSOL" },
    style: mainEdgeStyle,
    animated: true,
  },
  {
    id: "e-split-kamino",
    source: "split",
    sourceHandle: "a",
    target: "kamino",
    type: "asset",
    data: { asset: "50% mSOL" },
    style: mainEdgeStyle,
    animated: true,
  },
  {
    id: "e-split-drift",
    source: "split",
    sourceHandle: "b",
    target: "drift",
    type: "asset",
    data: { asset: "50% mSOL" },
    style: { ...mainEdgeStyle, stroke: "#34d399" },
    animated: true,
  },
  {
    id: "e-kamino-split-usdc",
    source: "kamino",
    sourceHandle: "next",
    target: "split-usdc",
    type: "asset",
    data: { asset: "USDC" },
    style: mainEdgeStyle,
    animated: true,
  },
  {
    id: "e-split-usdc-raydium",
    source: "split-usdc",
    sourceHandle: "a",
    target: "raydium",
    type: "asset",
    data: { asset: "30% USDC" },
    style: mainEdgeStyle,
    animated: true,
  },
  {
    id: "e-split-usdc-marginfi",
    source: "split-usdc",
    sourceHandle: "b",
    target: "marginfi",
    type: "asset",
    data: { asset: "70% USDC" },
    style: mainEdgeStyle,
    animated: true,
  },
  {
    id: "e-drift-orca",
    source: "drift",
    sourceHandle: "next",
    target: "orca",
    type: "asset",
    data: { asset: "mSOL yield" },
    style: { ...mainEdgeStyle, stroke: "#34d399" },
    animated: true,
  },
];

export const amplifyWorkspace: AmplifyWorkspace = {
  id: "amplify-sol-yield-loop",
  name: "SOL Yield Loop",
  summary:
    "A composable SOL yield loop that moves across staking, borrowing, and LP positions.",
  activeThreadId: "amplify-thread-loop-optimisation",
  threads: [
    {
      id: "amplify-thread-loop-optimisation",
      title: "Loop optimisation",
      preview: "Refining the current loop and comparing alternatives to Raydium.",
      lastViewedLabel: "Last viewed today",
      messages: [
        {
          id: "amplify-thread-loop-optimisation-ai-1",
          role: "ai",
          content:
            "Welcome to Tidal Amplify. I can help you build and optimise yield strategies across Solana protocols.",
        },
        {
          id: "amplify-thread-loop-optimisation-user-1",
          role: "user",
          content:
            "Can you help me improve the yield on this loop? I'd like to explore alternatives to Raydium for the liquidity step.",
        },
        {
          id: "amplify-thread-loop-optimisation-ai-2",
          role: "ai",
          content:
            "This strategy stakes SOL through Marinade, borrows USDC on Kamino, and provides liquidity on Raydium for a net estimated yield of ~16.3%.",
        },
      ],
    },
    {
      id: "amplify-thread-risk-review",
      title: "Risk review",
      preview: "Pressure-testing where the current loop is most exposed.",
      lastViewedLabel: "Last viewed yesterday",
      messages: [
        {
          id: "amplify-thread-risk-review-ai-1",
          role: "ai",
          content:
            "The main risk concentrations are Kamino borrow cost sensitivity and the LP leg on Raydium.",
        },
        {
          id: "amplify-thread-risk-review-user-1",
          role: "user",
          content:
            "Break down which step in the loop contributes most of the risk and where the yield could compress fastest.",
        },
      ],
    },
  ],
  suggestions: amplifySuggestions,
  nodes: amplifyInitialNodes,
  edges: amplifyInitialEdges,
};
