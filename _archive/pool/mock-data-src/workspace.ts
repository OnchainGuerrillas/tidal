import type { PoolWorkspace } from "./types";
import { poolPanelTabs } from "./types";

export const poolWorkspace: PoolWorkspace = {
  id: "solana-stable-yield-pool",
  name: "Solana Stable Yield Pool",
  summary:
    "A stablecoin-focused Pool that balances lending, liquidity, and defensive yield opportunities across trusted Solana protocols.",
  overviewPrompt:
    "I want to take my stablecoin balance and invest it so that I can earn a good yearly yield with safe and secure bets on the Solana ecosystem. You will act as a professional investor with years of experience in the Solana ecosystem, and you are an expert in spotting the best investment opportunities.",
  currentValueUsd: 10210.34,
  currentReturnPct: 21.54,
  availableAssetsUsd: 3108.1,
  panelTabs: poolPanelTabs,
  defaultPanelTab: "My Pool",
  activeThreadId: "overview-aave-v3",
  threads: [
    {
      id: "overview-aave-v3",
      title: "Overview of Aave v3",
      preview: "Reviewing the current lending position and whether it still fits the Pool.",
      lastViewedLabel: "Last viewed yesterday",
      context: {
        type: "position",
        entityId: "aave-v3-lending",
        title: "Aave v3 Lending",
        description: "Review whether this base lending position still deserves its current allocation.",
      },
      messages: [
        {
          id: "aave-ai-1",
          role: "ai",
          content:
            "Aave v3 is currently acting as the defensive anchor of this Pool. It offers solid yield with low strategy complexity.",
        },
        {
          id: "aave-user-1",
          role: "user",
          content:
            "Can you check whether this position is still the best place for stablecoin exposure, or if Kamino now looks stronger?",
        },
      ],
    },
    {
      id: "integrating-solana",
      title: "Integrating Solana",
      preview: "Researching additional Solana-native yield opportunities that could fit the Pool.",
      lastViewedLabel: "Last viewed 2 days ago",
      context: {
        type: "discovery",
        entityId: "drift-insurance-vault",
        title: "Drift Insurance Vault",
        description: "A higher-yield discovery item that could diversify the Pool with a new income stream.",
      },
      messages: [
        {
          id: "solana-ai-1",
          role: "ai",
          content:
            "I found a handful of Solana-native opportunities that could sit alongside your lending positions without making the Pool feel overly aggressive.",
        },
        {
          id: "solana-user-1",
          role: "user",
          content:
            "Let's compare those, but keep the overall Pool aligned with a medium-risk profile.",
        },
      ],
    },
    {
      id: "new-discovery-chat",
      title: "New chat",
      preview: "A fresh thread for testing a new protocol, position, or recommendation inside this Pool.",
      lastViewedLabel: "Created just now",
      context: {
        type: "pool",
        entityId: "solana-stable-yield-pool",
        title: "Pool-wide strategy",
        description: "A blank thread for asking broader portfolio questions or testing a new idea.",
      },
      messages: [
        {
          id: "new-ai-1",
          role: "ai",
          content:
            "Ready when you are. I can compare protocols, stress-test the Pool, or help you evaluate a new position in a focused thread.",
        },
      ],
    },
  ],
  riskOptions: [
    { label: "Low Risk", checked: false },
    { label: "Medium Risk", checked: false },
    { label: "High Risk", checked: true },
    { label: "Show me options for all", checked: false },
  ],
  interestOptions: [
    { label: "Lending / Borrowing", checked: true },
    { label: "Yield Farming", checked: true },
    { label: "Liquidity Provision", checked: false },
    { label: "Memecoins", checked: false },
    { label: "RWAs", checked: true },
  ],
  positions: [
    {
      id: "aave-v3-lending",
      protocol: "Aave v3",
      network: "Base",
      title: "Aave v3 Lending",
      valueUsd: 3123.45,
      returnPct: 21.54,
      apy: "6.21%",
      assetSummary: "2.5 aETH",
      thesis:
        "Acts as the stable, lower-complexity base position and gives the Pool dependable lending exposure.",
    },
    {
      id: "uniswap-v2-lp",
      protocol: "Uniswap v2",
      network: "Unichain",
      title: "Uniswap v2 LP",
      valueUsd: 1123.45,
      returnPct: 21.54,
      apy: "6.21%",
      assetSummary: "USDC / ETH",
      thesis:
        "Provides balanced LP exposure and helps the Pool capture additional fees beyond pure lending.",
    },
    {
      id: "kamino-lending",
      protocol: "Kamino",
      network: "Solana",
      title: "Kamino",
      valueUsd: 3123.45,
      returnPct: 21.54,
      apy: "6.21%",
      assetSummary: "2.5 aETH",
      thesis:
        "Adds Solana-native yield exposure and keeps part of the Pool aligned with the strongest current ecosystem opportunities.",
    },
  ],
  recommendations: [
    {
      id: "jito-sol-restaking",
      protocol: "Jito",
      title: "Rotate part of idle balance into Jito restaking",
      summary:
        "Use a portion of available assets to capture higher SOL-aligned yield without changing the overall Pool profile too aggressively.",
      projectedApy: "7.80%",
      riskLabel: "Medium Risk",
      assetSummary: "SOL staking exposure",
      thesis:
        "This would improve the Pool's blended yield while still staying close to established Solana-native infrastructure.",
    },
    {
      id: "kamino-rebalance",
      protocol: "Kamino",
      title: "Increase Kamino allocation by reducing Base lending exposure",
      summary:
        "Kamino is currently offering stronger risk-adjusted lending returns than the Pool's Base position.",
      projectedApy: "8.10%",
      riskLabel: "Medium Risk",
      assetSummary: "USDC lending",
      thesis:
        "A partial rebalance would better align the Pool with current Solana rates while preserving a diversified posture.",
    },
    {
      id: "marginfi-watchlist",
      protocol: "Marginfi",
      title: "Add Marginfi to the watchlist before deploying",
      summary:
        "Marginfi is not an immediate add, but it deserves a research thread to compare yield durability and counterparty comfort.",
      projectedApy: "8.45%",
      riskLabel: "High Risk",
      assetSummary: "Stablecoin lending",
      thesis:
        "The yield is attractive, but the right next step is a focused research chat rather than immediate Pool allocation.",
    },
  ],
  discoveryItems: [
    {
      id: "drift-insurance-vault",
      protocol: "Drift",
      category: "Yield vault",
      title: "Drift Insurance Vault",
      summary:
        "A Solana-native yield surface that could complement the Pool if the user is willing to add a slightly more opinionated source of returns.",
      projectedApy: "9.40%",
      assetSummary: "USDC vault exposure",
      thesis:
        "Useful as a research candidate because it offers stronger income than the current base lending positions, but with a different risk profile.",
    },
    {
      id: "marinade-stake",
      protocol: "Marinade",
      category: "Liquid staking",
      title: "Marinade stake stack",
      summary:
        "A clean way to bring SOL yield into the Pool while keeping future strategy paths open for Amplify-style loops later on.",
      projectedApy: "7.20%",
      assetSummary: "SOL / mSOL",
      thesis:
        "Strong fit for a user who wants the Pool to stay understandable while still capturing core Solana-native yield.",
    },
    {
      id: "raydium-stable-lp",
      protocol: "Raydium",
      category: "Stable LP",
      title: "Raydium stable liquidity pool",
      summary:
        "A lower-volatility LP option that could diversify returns beyond pure lending while staying easier to explain than a concentrated LP.",
      projectedApy: "6.85%",
      assetSummary: "USDC / USDT",
      thesis:
        "Worth exploring if the user wants more fee generation inside the Pool without moving far out on the risk spectrum.",
    },
  ],
  activity: [
    {
      id: "activity-1",
      type: "rebalance",
      title: "Reviewed Base lending exposure",
      description:
        "Tidal compared Aave v3 against Kamino and suggested a partial rebalance toward Solana-native lending.",
      timestampLabel: "2 hours ago",
      explorerLabel: "View tx on Solscan",
      explorerHref: "#",
    },
    {
      id: "activity-2",
      type: "research",
      title: "Started a focused chat on Marginfi",
      description:
        "A new research thread was created to evaluate whether Marginfi deserves watchlist status or a future Pool allocation.",
      timestampLabel: "Yesterday",
      explorerLabel: "Research reference",
    },
    {
      id: "activity-3",
      type: "deposit",
      title: "Idle stablecoins marked as available assets",
      description:
        "The Pool currently has deployable assets that can be directed into a new recommendation or discovery-driven action.",
      timestampLabel: "2 days ago",
      explorerLabel: "View deposit record",
      explorerHref: "#",
    },
  ],
  pendingActions: [
    {
      id: "pending-kamino-rebalance",
      sourceType: "recommendation",
      sourceId: "kamino-rebalance",
      title: "Rebalance 20% of Base lending into Kamino",
      description:
        "A mocked pending Pool action created from the current recommendation set. This should appear in the workspace as something the user can discuss before any approval flow exists.",
      status: "pending",
    },
  ],
  health: {
    label: "Your Pool is looking healthy",
    summary:
      "The current spread across lending, LP exposure, and available assets keeps the Pool balanced while leaving room for one more position.",
    filledBars: 18,
    totalBars: 24,
    trendLabel: "Stable with room to grow",
  },
  performance: {
    activeRange: "6M",
    availableRanges: ["1M", "3M", "6M", "1Y", "ALL"],
    points: [
      { label: "Oct", valueUsd: 5600 },
      { label: "Nov", valueUsd: 7100 },
      { label: "Dec", valueUsd: 8200 },
      { label: "Jan", valueUsd: 9300 },
      { label: "Feb", valueUsd: 10500 },
      { label: "Mar", valueUsd: 11200 },
    ],
    metrics: [
      { label: "Starting value", value: "$8,400.00" },
      { label: "Current value", value: "$10,210.34", accent: true },
      { label: "6M return", value: "+21.54%", accent: true },
      { label: "Peak value", value: "$10,842.17" },
    ],
  },
};
