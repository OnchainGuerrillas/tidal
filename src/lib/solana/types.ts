import type { NodeCatalogItem } from "@/mock-data/workspace/types";

export const riskTiers = ["shallows", "mid-depth", "deep-water"] as const;
export type RiskTier = (typeof riskTiers)[number];

export type ProtocolMetadata = {
  id: string;
  name: string;
  auditCount: number;
  tvlUsd: number;
  ageMonths: number;
  riskTier: RiskTier;
  exploitHistory?: string[];
};

export type PositionSnapshot = {
  asset: string;
  rawAmount: bigint;
  displayAmount: string;
  valueUsd?: number;
  accruedYield?: {
    rawAmount: bigint;
    displayAmount: string;
    valueUsd?: number;
  };
  lastUpdatedAt: number;
};

export type APYQuote = {
  apy: number;
  apyBreakdown?: Record<string, number>;
  fetchedAt: number;
};

export const widgetKinds = [
  "number",
  "percentage",
  "asset-selector",
  "address",
  "threshold",
  "deadline",
] as const;
export type WidgetKind = (typeof widgetKinds)[number];

export type WidgetSchema = {
  key: string;
  kind: WidgetKind;
  label: string;
  default?: unknown;
  min?: number;
  max?: number;
  required?: boolean;
  /**
   * Allowed values for `asset-selector` (and other future enum-like)
   * widgets. The strategy node renders these as a dropdown. Ignored for
   * `number` and other free-form kinds.
   */
  options?: string[];
};

export type ReadPositionParams = {
  walletPublicKey: string;
};

export type BuildTransactionParams = {
  walletPublicKey: string;
  inputAmount: bigint;
  widgets: Record<string, unknown>;
};

export type BuildTransactionResult = {
  /**
   * One or more base64-encoded VersionedTransactions to sign and submit
   * in order. Single-tx adapters wrap their tx in a length-1 array;
   * multi-tx adapters (e.g., Kamino deposit-and-borrow which exceeds
   * the 1232-byte single-tx limit) split init from refresh+lending.
   * The runner waits for `confirmed` between txs so subsequent txs can
   * read accounts created earlier in the sequence.
   */
  transactionsBase64: string[];
  expectedOutputAmount: bigint;
  fees: {
    networkLamports: bigint;
    priorityLamports?: bigint;
  };
  warnings?: string[];
};

export type ProtocolAdapter = {
  catalogItemId: string;
  catalogItem: NodeCatalogItem;
  widgets: WidgetSchema[];
  protocol: ProtocolMetadata;
  readPosition(params: ReadPositionParams): Promise<PositionSnapshot | null>;
  readRate(): Promise<APYQuote | null>;
  buildTransaction(
    params: BuildTransactionParams,
  ): Promise<BuildTransactionResult>;
};
