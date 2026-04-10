import { amplifyNodeCatalog, isCatalogItemCompatible } from "@/mock-data/amplify/mocks/workspace";
import type {
  AmplifyNodeCatalogItem,
  AmplifyNodeOutput,
  AmplifyNodePickerGroup,
} from "@/mock-data/amplify/types";

export const pickerGroupOrder: AmplifyNodePickerGroup[] = [
  "strategy",
  "route_math",
  "rewards",
  "wallet",
];

export const pickerGroupLabels: Record<AmplifyNodePickerGroup, string> = {
  strategy: "Strategy",
  route_math: "Route & Math",
  rewards: "Rewards",
  wallet: "Wallet",
};

export function getPickerItemDisabledState(
  item: AmplifyNodeCatalogItem,
  output?: AmplifyNodeOutput | null
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
  item: AmplifyNodeCatalogItem,
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
  sourceOutput: AmplifyNodeOutput | null
) {
  if (mode === "pane" || !sourceOutput) {
    return "strategy" as AmplifyNodePickerGroup;
  }

  const firstValidGroup = pickerGroupOrder.find((group) =>
    amplifyNodeCatalog.some(
      (item) =>
        item.group === group && !getPickerItemDisabledState(item, sourceOutput).disabled
    )
  );

  return firstValidGroup ?? "strategy";
}
