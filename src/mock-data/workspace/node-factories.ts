import type {
  WorkspaceGraphNode,
  AmountNodeType,
  DestinationNodeType,
  RewardNodeType,
  SplitNodeType,
  StrategyNodeType,
  WalletNodeType,
} from "./types";
import { workspaceSupportedAssets } from "./catalog";

function createNodeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createWalletNode(
  position: { x: number; y: number },
  nodeId = createNodeId("wallet")
): WalletNodeType {
  return {
    id: nodeId,
    type: "wallet",
    position,
    data: {
      nodeKind: "wallet",
      title: "Primary wallet",
      summary: "Mocked wallet balances ready to seed a new strategy loop.",
      description: "Start with mocked wallet balances and branch into a new loop.",
      status: "ready",
      acceptedAssets: [],
      outputs: [
        {
          id: "sol",
          label: "SOL balance",
          asset: "SOL",
          kind: "primary",
          compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
          amountLabel: "126.40 SOL",
        },
        {
          id: "usdc",
          label: "USDC balance",
          asset: "USDC",
          kind: "primary",
          compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
          amountLabel: "42,000 USDC",
        },
      ],
      holdingsLabel: "$60,449 available",
      draftState: {
        hasChanges: false,
        changedFields: [],
      },
      assets: [
        {
          symbol: "SOL",
          amountLabel: "126.40 SOL",
          valueLabel: "$18,449",
          outputId: "sol",
          compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
        },
        {
          symbol: "USDC",
          amountLabel: "42,000 USDC",
          valueLabel: "$42,000",
          outputId: "usdc",
          compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
        },
      ],
    },
  };
}

function buildAmountNode(
  position: { x: number; y: number },
  sourceAsset?: string
): AmountNodeType {
  const assetLabel = sourceAsset ?? "Asset";

  return {
    id: createNodeId("amount"),
    type: "amount",
    position,
    data: {
      nodeKind: "amount",
      title: `${assetLabel} amount`,
      summary: sourceAsset
        ? `Choose how much ${sourceAsset} to route into the next node.`
        : "Choose a fixed amount or percentage before connecting this branch.",
      status: "draft",
      acceptedAssets: sourceAsset ? [sourceAsset] : [...workspaceSupportedAssets],
      outputs: [
        {
          id: "next",
          label: "Selected amount",
          asset: assetLabel,
          kind: "primary",
          compatibleNodeTypes: ["strategy", "split", "destination"],
          amountLabel: sourceAsset ? `Custom ${sourceAsset}` : "Custom amount",
        },
      ],
      holdingsLabel: sourceAsset ? `Awaiting ${sourceAsset} input` : "Awaiting source asset",
      draftState: {
        hasChanges: true,
        changedFields: ["amount"],
      },
      sourceAsset: assetLabel,
      amountLabel: sourceAsset ? `50% ${sourceAsset}` : "Set amount",
      amountMode: "percent",
      maxAmountLabel: sourceAsset ? `Max ${sourceAsset}` : "Awaiting source",
    },
  };
}

function buildSplitNode(
  position: { x: number; y: number },
  sourceAsset?: string
): SplitNodeType {
  const assetLabel = sourceAsset ?? "Asset";

  return {
    id: createNodeId("split"),
    type: "split",
    position,
    data: {
      nodeKind: "split",
      title: `${assetLabel} split`,
      summary: sourceAsset
        ? `Branch ${sourceAsset} across two downstream paths.`
        : "Branch one asset stream into two downstream paths.",
      status: "draft",
      acceptedAssets: sourceAsset ? [sourceAsset] : [...workspaceSupportedAssets],
      outputs: [
        {
          id: "a",
          label: "Path A",
          asset: assetLabel,
          kind: "primary",
          compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
          amountLabel: sourceAsset ? `50% ${sourceAsset}` : "Path A",
        },
        {
          id: "b",
          label: "Path B",
          asset: assetLabel,
          kind: "primary",
          compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
          amountLabel: sourceAsset ? `50% ${sourceAsset}` : "Path B",
        },
      ],
      holdingsLabel: sourceAsset ? `${sourceAsset} ready to route` : "Awaiting source asset",
      draftState: {
        hasChanges: false,
        changedFields: [],
      },
      splitA: 50,
      splitB: 50,
      asset: assetLabel,
    },
  };
}

function buildDestinationNode(
  position: { x: number; y: number },
  sourceAsset?: string
): DestinationNodeType {
  const assetLabel = sourceAsset ?? "Asset";

  return {
    id: createNodeId("destination"),
    type: "destination",
    position,
    data: {
      nodeKind: "destination",
      title: "Wallet destination",
      summary: sourceAsset
        ? `Send ${sourceAsset} back to wallet.`
        : "Route a branch back to wallet once it is connected.",
      status: "draft",
      acceptedAssets: sourceAsset ? [sourceAsset] : [...workspaceSupportedAssets],
      outputs: [],
      holdingsLabel: sourceAsset ? `Ready to receive ${sourceAsset}` : "Awaiting source asset",
      draftState: {
        hasChanges: false,
        changedFields: [],
      },
      destinationLabel: "Primary wallet",
      asset: assetLabel,
    },
  };
}

function buildRewardNode(
  position: { x: number; y: number },
  sourceAsset?: string
): RewardNodeType {
  const assetLabel = sourceAsset ?? "Reward asset";

  return {
    id: createNodeId("reward"),
    type: "reward",
    position,
    data: {
      nodeKind: "reward",
      title: "Reward collector",
      summary: sourceAsset
        ? `Collect and route ${sourceAsset} before sending it onward.`
        : "Collect rewards before routing them elsewhere.",
      status: "draft",
      acceptedAssets: sourceAsset
        ? [sourceAsset]
        : [
            "LP Fees",
            "Interest",
            "MNDE rewards",
            "MRGN rewards",
            "ORCA rewards",
            "RAY rewards",
            "mSOL yield",
          ],
      outputs: [
        {
          id: "next",
          label: "Collected rewards",
          asset: assetLabel,
          kind: "reward",
          compatibleNodeTypes: ["split", "destination", "strategy"],
          cadenceLabel: "Weekly",
        },
      ],
      holdingsLabel: sourceAsset ? `${sourceAsset} ready to collect` : "Awaiting reward source",
      draftState: {
        hasChanges: false,
        changedFields: [],
      },
      sourceProtocol: "Custom source",
      rewardAsset: assetLabel,
      defaultInterval: "Weekly",
    },
  };
}

function buildStrategyNode(
  itemId: string,
  position: { x: number; y: number }
): StrategyNodeType {
  switch (itemId) {
    case "marinade-stake":
      return {
        id: createNodeId("strategy"),
        type: "strategy",
        position,
        data: {
          nodeKind: "strategy",
          title: "Marinade stake",
          summary: "Convert SOL into a liquid staking position.",
          protocol: "Marinade",
          action: "Stake SOL",
          actionOptions: ["Stake SOL", "Auto-stake SOL"],
          inputAsset: "SOL",
          acceptedAssets: ["SOL"],
          outputs: [
            {
              id: "next",
              label: "Staked position",
              asset: "mSOL",
              kind: "primary",
              compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
            },
            {
              id: "rewards",
              label: "Reward stream",
              asset: "MNDE rewards",
              kind: "reward",
              compatibleNodeTypes: ["reward", "split", "destination"],
              cadenceLabel: "Weekly",
            },
          ],
          status: "draft",
          holdingsLabel: "Awaiting SOL input",
          platformLink: {
            label: "View on Marinade",
            href: "https://marinade.finance",
          },
          draftState: {
            hasChanges: false,
            changedFields: [],
          },
          apy: "7.5%",
          apyType: "earn",
          collectInterval: "Weekly",
        },
      };
    case "kamino-borrow":
      return {
        id: createNodeId("strategy"),
        type: "strategy",
        position,
        data: {
          nodeKind: "strategy",
          title: "Kamino supply and borrow",
          summary: "Use mSOL as collateral and borrow USDC.",
          protocol: "Kamino",
          action: "Supply & Borrow",
          actionOptions: ["Supply & Borrow", "Loop Collateral Once"],
          inputAsset: "mSOL",
          acceptedAssets: ["mSOL"],
          outputs: [
            {
              id: "next",
              label: "Borrowed USDC",
              asset: "USDC",
              kind: "primary",
              compatibleNodeTypes: ["amount", "strategy", "split", "destination"],
            },
          ],
          status: "draft",
          holdingsLabel: "Awaiting mSOL input",
          platformLink: {
            label: "View on Kamino",
            href: "https://app.kamino.finance",
          },
          draftState: {
            hasChanges: false,
            changedFields: [],
          },
          apy: "3.2%",
          apyType: "cost",
        },
      };
    case "marginfi-lend":
      return {
        id: createNodeId("strategy"),
        type: "strategy",
        position,
        data: {
          nodeKind: "strategy",
          title: "Marginfi lend leg",
          summary: "Supply USDC into a lower-volatility lending branch.",
          protocol: "Marginfi",
          action: "Lend USDC",
          actionOptions: ["Lend USDC", "Auto-compound USDC"],
          inputAsset: "USDC",
          acceptedAssets: ["USDC"],
          outputs: [
            {
              id: "next",
              label: "Interest stream",
              asset: "Interest",
              kind: "primary",
              compatibleNodeTypes: ["reward", "split", "destination"],
            },
            {
              id: "rewards",
              label: "Lending rewards",
              asset: "MRGN rewards",
              kind: "reward",
              compatibleNodeTypes: ["reward", "split", "destination"],
              cadenceLabel: "Monthly",
            },
          ],
          status: "draft",
          holdingsLabel: "Awaiting USDC input",
          platformLink: {
            label: "View on Marginfi",
            href: "https://marginfi.com",
          },
          draftState: {
            hasChanges: false,
            changedFields: [],
          },
          apy: "8.4%",
          apyType: "earn",
          collectInterval: "Monthly",
        },
      };
    case "drift-lend":
      return {
        id: createNodeId("strategy"),
        type: "strategy",
        position,
        data: {
          nodeKind: "strategy",
          title: "Drift lend leg",
          summary: "Lend mSOL and route the resulting yield stream onward.",
          protocol: "Drift",
          action: "Lend mSOL",
          actionOptions: ["Lend mSOL", "Recycle Yield Stream"],
          inputAsset: "mSOL",
          acceptedAssets: ["mSOL"],
          outputs: [
            {
              id: "next",
              label: "Yield stream",
              asset: "mSOL yield",
              kind: "primary",
              compatibleNodeTypes: ["reward", "split", "destination", "strategy"],
            },
            {
              id: "rewards",
              label: "Interest route",
              asset: "Interest",
              kind: "reward",
              compatibleNodeTypes: ["reward", "split", "destination"],
              cadenceLabel: "Monthly",
            },
          ],
          status: "draft",
          holdingsLabel: "Awaiting mSOL input",
          platformLink: {
            label: "View on Drift",
            href: "https://www.drift.trade",
          },
          draftState: {
            hasChanges: false,
            changedFields: [],
          },
          apy: "5.2%",
          apyType: "earn",
          collectInterval: "Monthly",
        },
      };
    case "orca-lp":
      return {
        id: createNodeId("strategy"),
        type: "strategy",
        position,
        data: {
          nodeKind: "strategy",
          title: "Orca concentrated LP",
          summary: "Use mSOL or yield output in a concentrated LP branch.",
          protocol: "Orca",
          action: "Concentrated LP",
          actionOptions: ["Concentrated LP", "LP + Reinvest Fees"],
          inputAsset: "mSOL",
          acceptedAssets: ["mSOL", "mSOL yield"],
          outputs: [
            {
              id: "next",
              label: "LP fee stream",
              asset: "LP Fees",
              kind: "primary",
              compatibleNodeTypes: ["reward", "split", "destination"],
            },
            {
              id: "rewards",
              label: "LP rewards",
              asset: "ORCA rewards",
              kind: "reward",
              compatibleNodeTypes: ["reward", "split", "destination"],
              cadenceLabel: "Bi-weekly",
            },
          ],
          status: "draft",
          holdingsLabel: "Awaiting mSOL input",
          platformLink: {
            label: "View on Orca",
            href: "https://www.orca.so",
          },
          draftState: {
            hasChanges: false,
            changedFields: [],
          },
          apy: "9.1%",
          apyType: "earn",
          collectInterval: "Bi-weekly",
        },
      };
    case "raydium-lp":
    default:
      return {
        id: createNodeId("strategy"),
        type: "strategy",
        position,
        data: {
          nodeKind: "strategy",
          title: "Raydium liquidity leg",
          summary: "Deploy USDC into a higher-yield LP route.",
          protocol: "Raydium",
          action: "Provide Liquidity",
          actionOptions: ["Provide Liquidity", "Harvest to Wallet"],
          inputAsset: "USDC",
          acceptedAssets: ["USDC"],
          outputs: [
            {
              id: "next",
              label: "LP fee stream",
              asset: "LP Fees",
              kind: "primary",
              compatibleNodeTypes: ["reward", "split", "destination"],
            },
            {
              id: "rewards",
              label: "Harvest output",
              asset: "RAY rewards",
              kind: "reward",
              compatibleNodeTypes: ["reward", "split", "destination"],
              cadenceLabel: "Weekly",
            },
          ],
          status: "draft",
          holdingsLabel: "Awaiting USDC input",
          platformLink: {
            label: "View on Raydium",
            href: "https://raydium.io",
          },
          draftState: {
            hasChanges: false,
            changedFields: [],
          },
          apy: "12.0%",
          apyType: "earn",
          collectInterval: "Weekly",
        },
      };
  }
}

export function createNodeFromCatalog(
  itemId: string,
  position: { x: number; y: number },
  sourceAsset?: string
): WorkspaceGraphNode | null {
  switch (itemId) {
    case "amount":
      return buildAmountNode(position, sourceAsset);
    case "split":
      return buildSplitNode(position, sourceAsset);
    case "destination":
      return buildDestinationNode(position, sourceAsset);
    case "reward":
      return buildRewardNode(position, sourceAsset);
    case "marinade-stake":
    case "kamino-borrow":
    case "marginfi-lend":
    case "drift-lend":
    case "orca-lp":
    case "raydium-lp":
      return buildStrategyNode(itemId, position);
    default:
      return null;
  }
}
