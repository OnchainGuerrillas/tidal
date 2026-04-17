import { nodeCatalog, isCatalogItemCompatible } from "@/mock-data/workspace/workspace";
import type {
  NodeCatalogItem,
  WorkspaceNodeOutput,
  NodePickerGroup,
} from "@/mock-data/workspace/types";

export const pickerGroupOrder: NodePickerGroup[] = [
  "strategy",
  "route_math",
  "rewards",
  "wallet",
];

export const pickerGroupLabels: Record<NodePickerGroup, string> = {
  strategy: "Strategy",
  route_math: "Route & Math",
  rewards: "Rewards",
  wallet: "Wallet",
};

export function getPickerItemDisabledState(
  item: NodeCatalogItem,
  output?: WorkspaceNodeOutput | null
) {
  if (!output) {
    return {
      disabled: false,
      disabledReason: null as string | null,
    };
  }

  if (!output.compatibleNodeTypes.includes(item.nodeKind)) {
    return {
      disabled: true,
      disabledReason: `This output only supports ${output.compatibleNodeTypes.join(", ")} nodes.`,
    };
  }

  if (!isCatalogItemCompatible(item, output.asset)) {
    return {
      disabled: true,
      disabledReason: `Needs ${item.supportedInputAssets.join(" or ")} input.`,
    };
  }

  return {
    disabled: false,
    disabledReason: null as string | null,
  };
}

export function matchesPickerSearch(
  item: NodeCatalogItem,
  searchQuery: string
) {
  if (!searchQuery.trim()) {
    return true;
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchContent = [
    item.title,
    item.description,
    item.protocolLabel,
    item.primaryOutputAsset,
    ...(item.keywords ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchContent.includes(normalizedQuery);
}

export function getDefaultPickerGroup(
  mode: "pane" | "source",
  sourceOutput: WorkspaceNodeOutput | null
) {
  if (mode === "pane" || !sourceOutput) {
    return "strategy" as NodePickerGroup;
  }

  const firstValidGroup = pickerGroupOrder.find((group) =>
    nodeCatalog.some(
      (item) =>
        item.group === group && !getPickerItemDisabledState(item, sourceOutput).disabled
    )
  );

  return firstValidGroup ?? "strategy";
}
