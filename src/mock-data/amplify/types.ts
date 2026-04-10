import type { Edge, Node } from "@xyflow/react";
import type { PromotionSource } from "@/mock-data/shell/types";

export const collectIntervals = [
  "Daily",
  "Weekly",
  "Bi-weekly",
  "Monthly",
] as const;

export type CollectInterval = (typeof collectIntervals)[number];

export const amplifyNodeKinds = [
  "wallet",
  "amount",
  "strategy",
  "split",
  "reward",
  "destination",
] as const;

export type AmplifyNodeKind = (typeof amplifyNodeKinds)[number];

export const amplifyNodeStatuses = [
  "draft",
  "ready",
  "active",
  "impacted",
  "error",
] as const;

export type AmplifyNodeStatus = (typeof amplifyNodeStatuses)[number];

export const amplifyWorkspaceExecutionStates = [
  "draft",
  "active",
  "impacted",
  "error",
] as const;

export type AmplifyWorkspaceExecutionState =
  (typeof amplifyWorkspaceExecutionStates)[number];

export type AmplifyNodeOutput = {
  id: string;
  label: string;
  asset: string;
  kind: "primary" | "reward";
  compatibleNodeTypes: AmplifyNodeKind[];
  amountLabel?: string;
  cadenceLabel?: string;
};

export const amplifyNodePickerGroups = [
  "strategy",
  "route_math",
  "rewards",
  "wallet",
] as const;

export type AmplifyNodePickerGroup = (typeof amplifyNodePickerGroups)[number];

export type AmplifyNodeCatalogItem = {
  id: string;
  title: string;
  description: string;
  group: AmplifyNodePickerGroup;
  nodeKind: AmplifyNodeKind;
  supportedInputAssets: string[];
  primaryOutputAsset?: string;
  protocolLabel?: string;
  keywords?: string[];
};

export type AmplifyPlatformLink = {
  label: string;
  href: string;
};

export type AmplifyNodeActiveSnapshot = {
  status: AmplifyNodeStatus;
  amountLabel?: string;
  updatedAtLabel: string;
};

export type AmplifyNodeDraftState = {
  hasChanges: boolean;
  changedFields: string[];
};

export type AmplifyNodeBaseData = {
  nodeKind: AmplifyNodeKind;
  title: string;
  summary: string;
  status: AmplifyNodeStatus;
  acceptedAssets: string[];
  outputs: AmplifyNodeOutput[];
  holdingsLabel?: string;
  platformLink?: AmplifyPlatformLink;
  activeSnapshot?: AmplifyNodeActiveSnapshot;
  draftState?: AmplifyNodeDraftState;
};

export type WalletAssetBalance = {
  symbol: string;
  amountLabel: string;
  valueLabel: string;
  outputId: string;
  compatibleNodeTypes: AmplifyNodeKind[];
};

export type WalletNodeData = AmplifyNodeBaseData & {
  nodeKind: "wallet";
  description: string;
  assets: WalletAssetBalance[];
};

export type AmountNodeData = AmplifyNodeBaseData & {
  nodeKind: "amount";
  sourceAsset: string;
  amountLabel: string;
  amountMode: "fixed" | "percent";
  maxAmountLabel: string;
};

export type StrategyNodeData = AmplifyNodeBaseData & {
  nodeKind: "strategy";
  protocol: string;
  action: string;
  actionOptions?: string[];
  inputAsset: string;
  apy: string;
  apyType: "earn" | "cost";
  collectInterval?: CollectInterval;
};

export type SplitNodeData = AmplifyNodeBaseData & {
  nodeKind: "split";
  splitA: number;
  splitB: number;
  asset: string;
};

export type RewardNodeData = AmplifyNodeBaseData & {
  nodeKind: "reward";
  sourceProtocol: string;
  rewardAsset: string;
  defaultInterval: CollectInterval;
};

export type DestinationNodeData = AmplifyNodeBaseData & {
  nodeKind: "destination";
  destinationLabel: string;
  asset: string;
};

export type WalletNodeType = Node<WalletNodeData, "wallet">;
export type AmountNodeType = Node<AmountNodeData, "amount">;
export type StrategyNodeType = Node<StrategyNodeData, "strategy">;
export type SplitNodeType = Node<SplitNodeData, "split">;
export type RewardNodeType = Node<RewardNodeData, "reward">;
export type DestinationNodeType = Node<DestinationNodeData, "destination">;
export type AmplifyGraphNode =
  | WalletNodeType
  | AmountNodeType
  | StrategyNodeType
  | SplitNodeType
  | RewardNodeType
  | DestinationNodeType;
export type AmplifyGraphEdge = Edge<{ asset: string }>;

export const amplifyWorkspaceKinds = ["builder", "example"] as const;

export type AmplifyWorkspaceKind = (typeof amplifyWorkspaceKinds)[number];

export type AmplifyChatMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
};

export type AmplifyThread = {
  id: string;
  title: string;
  preview: string;
  lastViewedLabel: string;
  messages: AmplifyChatMessage[];
  summarySeed?: string;
  source?: PromotionSource;
};

export type AmplifyWorkspace = {
  id: string;
  name: string;
  summary: string;
  kind: AmplifyWorkspaceKind;
  isEditable: boolean;
  executionState: AmplifyWorkspaceExecutionState;
  activeSnapshot?: {
    updatedAtLabel: string;
    nodeIds: string[];
  };
  draftState?: {
    updatedAtLabel: string;
    changedNodeIds: string[];
    impactedNodeIds: string[];
  };
  activeThreadId: string;
  threads: AmplifyThread[];
  suggestions: string[];
  nodes: AmplifyGraphNode[];
  edges: AmplifyGraphEdge[];
};
