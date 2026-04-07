import type { Edge, Node } from "@xyflow/react";

export const collectIntervals = [
  "Daily",
  "Weekly",
  "Bi-weekly",
  "Monthly",
] as const;

export type CollectInterval = (typeof collectIntervals)[number];

export type StrategyNodeData = {
  protocol: string;
  action: string;
  assetIn: string;
  assetOut: string;
  apy: string;
  apyType: "earn" | "cost";
  collectInterval?: CollectInterval;
};

export type SplitNodeData = {
  splitA: number;
  splitB: number;
  asset: string;
};

export type CollectorNodeData = {
  defaultInterval: CollectInterval;
};

export type StrategyNodeType = Node<StrategyNodeData, "strategy">;
export type SplitNodeType = Node<SplitNodeData, "split">;
export type CollectorNodeType = Node<CollectorNodeData, "collector">;

export type AmplifyChatMessage = {
  role: "ai" | "user";
  content: string;
};

export type AmplifyWorkspace = {
  messages: AmplifyChatMessage[];
  suggestions: string[];
  nodes: (Node<StrategyNodeData> | Node<SplitNodeData>)[];
  edges: Edge<{ asset: string }>[];
};
