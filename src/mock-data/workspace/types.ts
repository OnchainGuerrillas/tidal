import type { Edge, Node } from "@xyflow/react";

export const collectIntervals = [
  "Daily",
  "Weekly",
  "Bi-weekly",
  "Monthly",
] as const;

export type CollectInterval = (typeof collectIntervals)[number];

export const workspaceNodeKinds = [
  "wallet",
  "amount",
  "strategy",
  "split",
  "reward",
  "destination",
] as const;

export type WorkspaceNodeKind = (typeof workspaceNodeKinds)[number];

export const workspaceNodeStatuses = [
  "draft",
  "ready",
  "active",
  "impacted",
  "error",
] as const;

export type WorkspaceNodeStatus = (typeof workspaceNodeStatuses)[number];

export const workspaceExecutionStates = [
  "draft",
  "active",
  "impacted",
  "error",
] as const;

export type WorkspaceExecutionState =
  (typeof workspaceExecutionStates)[number];

export type WorkspaceNodeOutput = {
  id: string;
  label: string;
  asset: string;
  kind: "primary" | "reward";
  compatibleNodeTypes: WorkspaceNodeKind[];
  amountLabel?: string;
  cadenceLabel?: string;
};

export const nodePickerGroups = [
  "strategy",
  "route_math",
  "rewards",
  "wallet",
] as const;

export type NodePickerGroup = (typeof nodePickerGroups)[number];

export type NodeCatalogItem = {
  id: string;
  title: string;
  description: string;
  group: NodePickerGroup;
  nodeKind: WorkspaceNodeKind;
  supportedInputAssets: string[];
  primaryOutputAsset?: string;
  protocolLabel?: string;
  keywords?: string[];
};

export type NodePlatformLink = {
  label: string;
  href: string;
};

export type WorkspaceNodeActiveSnapshot = {
  status: WorkspaceNodeStatus;
  amountLabel?: string;
  updatedAtLabel: string;
};

export type WorkspaceNodeDraftState = {
  hasChanges: boolean;
  changedFields: string[];
};

export type WorkspaceNodeBaseData = {
  nodeKind: WorkspaceNodeKind;
  title: string;
  summary: string;
  status: WorkspaceNodeStatus;
  acceptedAssets: string[];
  outputs: WorkspaceNodeOutput[];
  holdingsLabel?: string;
  platformLink?: NodePlatformLink;
  activeSnapshot?: WorkspaceNodeActiveSnapshot;
  draftState?: WorkspaceNodeDraftState;
};

export type WalletAssetBalance = {
  symbol: string;
  amountLabel: string;
  valueLabel: string;
  outputId: string;
  compatibleNodeTypes: WorkspaceNodeKind[];
};

export type WalletNodeData = WorkspaceNodeBaseData & {
  nodeKind: "wallet";
  description: string;
  assets: WalletAssetBalance[];
};

export type AmountNodeData = WorkspaceNodeBaseData & {
  nodeKind: "amount";
  sourceAsset: string;
  amountLabel: string;
  amountMode: "fixed" | "percent";
  maxAmountLabel: string;
};

export type StrategyNodeData = WorkspaceNodeBaseData & {
  nodeKind: "strategy";
  protocol: string;
  action: string;
  actionOptions?: string[];
  inputAsset: string;
  apy: string;
  apyType: "earn" | "cost";
  collectInterval?: CollectInterval;
};

export type SplitNodeData = WorkspaceNodeBaseData & {
  nodeKind: "split";
  splitA: number;
  splitB: number;
  asset: string;
};

export type RewardNodeData = WorkspaceNodeBaseData & {
  nodeKind: "reward";
  sourceProtocol: string;
  rewardAsset: string;
  defaultInterval: CollectInterval;
};

export type DestinationNodeData = WorkspaceNodeBaseData & {
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
export type WorkspaceGraphNode =
  | WalletNodeType
  | AmountNodeType
  | StrategyNodeType
  | SplitNodeType
  | RewardNodeType
  | DestinationNodeType;
export type WorkspaceGraphEdge = Edge<{ asset: string }>;

export const workspaceKinds = ["builder", "example"] as const;

export type WorkspaceKind = (typeof workspaceKinds)[number];

export type WorkspaceChatMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
};

export type WorkspaceThread = {
  id: string;
  title: string;
  preview: string;
  lastViewedLabel: string;
  messages: WorkspaceChatMessage[];
  summarySeed?: string;
};

export type Workspace = {
  id: string;
  name: string;
  summary: string;
  kind: WorkspaceKind;
  isEditable: boolean;
  executionState: WorkspaceExecutionState;
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
  threads: WorkspaceThread[];
  suggestions: string[];
  nodes: WorkspaceGraphNode[];
  edges: WorkspaceGraphEdge[];
};
