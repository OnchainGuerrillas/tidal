import type {
  InvestmentInterestLabel,
  PreferenceOption,
  PromotionSource,
  RiskAppetiteLabel,
} from "@/mock-data/shell/types";

export const poolPanelTabs = [
  "My Pool",
  "Recommendations",
  "Discover",
  "Activity",
] as const;

export type PoolPanelTab = (typeof poolPanelTabs)[number];

export type PoolChatMessage = {
  id: string;
  role: "ai" | "user";
  content: string;
};

export type PoolThreadContext = {
  type: "pool" | "position" | "recommendation" | "discovery";
  entityId: string;
  title: string;
  description?: string;
};

export type PoolThread = {
  id: string;
  title: string;
  preview: string;
  lastViewedLabel: string;
  messages: PoolChatMessage[];
  context?: PoolThreadContext;
  summarySeed?: string;
  source?: PromotionSource;
};

export type PoolRiskOption = PreferenceOption<RiskAppetiteLabel>;

export type PoolInterestOption = PreferenceOption<InvestmentInterestLabel>;

export type PoolPosition = {
  id: string;
  protocol: string;
  network: string;
  title: string;
  valueUsd: number;
  returnPct: number;
  apy: string;
  assetSummary: string;
  thesis: string;
};

export type PoolRecommendation = {
  id: string;
  protocol: string;
  title: string;
  summary: string;
  projectedApy: string;
  riskLabel: "Low Risk" | "Medium Risk" | "High Risk";
  assetSummary: string;
  thesis: string;
};

export type PoolDiscoveryItem = {
  id: string;
  protocol: string;
  category: string;
  title: string;
  summary: string;
  projectedApy: string;
  assetSummary: string;
  thesis: string;
};

export type PoolActivityItem = {
  id: string;
  type: "rebalance" | "deposit" | "research" | "approval";
  title: string;
  description: string;
  timestampLabel: string;
  explorerLabel: string;
  explorerHref?: string;
};

export type PoolHealthState = {
  label: string;
  summary: string;
  filledBars: number;
  totalBars: number;
  trendLabel: string;
};

export type PendingPoolAction = {
  id: string;
  sourceType: "recommendation" | "discovery";
  sourceId: string;
  title: string;
  description: string;
  status: "pending";
};

export type PoolPerformanceRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

export type PoolPerformancePoint = {
  label: string;
  valueUsd: number;
};

export type PoolPerformanceMetric = {
  label: string;
  value: string;
  accent?: boolean;
};

export type PoolPerformance = {
  activeRange: PoolPerformanceRange;
  availableRanges: PoolPerformanceRange[];
  points: PoolPerformancePoint[];
  metrics: PoolPerformanceMetric[];
};

export type PoolWorkspace = {
  id: string;
  name: string;
  summary: string;
  overviewPrompt: string;
  currentValueUsd: number;
  currentReturnPct: number;
  availableAssetsUsd: number;
  panelTabs: readonly PoolPanelTab[];
  defaultPanelTab: PoolPanelTab;
  activeThreadId: string;
  threads: PoolThread[];
  riskOptions: PoolRiskOption[];
  interestOptions: PoolInterestOption[];
  positions: PoolPosition[];
  recommendations: PoolRecommendation[];
  discoveryItems: PoolDiscoveryItem[];
  activity: PoolActivityItem[];
  pendingActions: PendingPoolAction[];
  health: PoolHealthState;
  performance: PoolPerformance;
};
