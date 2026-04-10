import {
  amplifyExampleNodes,
  amplifyExampleWorkspace,
  amplifyInitialWorkspaces,
} from "@/mock-data/amplify/mocks/workspace";
import { poolWorkspace } from "@/mock-data/pool/mocks/workspace";
import type {
  SplitNodeData,
  StrategyNodeData,
} from "@/mock-data/amplify/types";
import { getAmplifyWorkspaceHref } from "@/lib/amplify-routes";
import { getGlobalChatHref } from "@/lib/global-chat-routes";

import type {
  GlobalChat,
  MentionTarget,
  PreferenceProfile,
  WorkspaceSummary,
  WorkspaceThread,
} from "../types";

export const poolWorkspaceSummaries: WorkspaceSummary[] = [
  {
    id: poolWorkspace.id,
    title: poolWorkspace.name,
    href: "/pool",
    summary: poolWorkspace.summary,
    workspaceType: "pool",
  },
];

export const amplifyWorkspaceSummaries: WorkspaceSummary[] = [
  ...amplifyInitialWorkspaces.map((workspace) => ({
    id: workspace.id,
    title: workspace.name,
    href: getAmplifyWorkspaceHref(workspace.id),
    summary: workspace.summary,
    workspaceType: "amplify" as const,
  })),
];

const primaryAmplifyWorkspace =
  amplifyWorkspaceSummaries.find(
    (workspace) => workspace.id === amplifyExampleWorkspace.id
  ) ?? amplifyWorkspaceSummaries[0];

export const globalPreferenceProfile: PreferenceProfile = {
  id: "alex-thompson-default-profile",
  title: "Alex Thompson default investment profile",
  riskOptions: poolWorkspace.riskOptions.map((option) => ({ ...option })),
  interestOptions: poolWorkspace.interestOptions.map((option) => ({ ...option })),
};

export const mentionTargets: MentionTarget[] = [
  ...poolWorkspaceSummaries.map((workspace) => ({
    id: workspace.id,
    kind: "pool" as const,
    title: workspace.title,
    subtitle: workspace.summary,
    workspaceType: workspace.workspaceType,
    workspaceId: workspace.id,
    href: workspace.href,
  })),
  ...amplifyWorkspaceSummaries.map((workspace) => ({
    id: workspace.id,
    kind: "amplify" as const,
    title: workspace.title,
    subtitle: workspace.summary,
    workspaceType: workspace.workspaceType,
    workspaceId: workspace.id,
    href: workspace.href,
  })),
  ...poolWorkspace.positions.map((position) => ({
    id: position.id,
    kind: "pool-position" as const,
    title: position.title,
    subtitle: `Position in ${poolWorkspace.name}`,
    workspaceType: "pool" as const,
    workspaceId: poolWorkspace.id,
    href: "/pool",
  })),
  ...poolWorkspace.recommendations.map((recommendation) => ({
    id: recommendation.id,
    kind: "pool-recommendation" as const,
    title: recommendation.title,
    subtitle: `Recommendation for ${poolWorkspace.name}`,
    workspaceType: "pool" as const,
    workspaceId: poolWorkspace.id,
    href: "/pool",
  })),
  ...poolWorkspace.discoveryItems.map((item) => ({
    id: item.id,
    kind: "pool-discovery" as const,
    title: item.title,
    subtitle: `Discovery item for ${poolWorkspace.name}`,
    workspaceType: "pool" as const,
    workspaceId: poolWorkspace.id,
    href: "/pool",
  })),
  ...amplifyExampleNodes.map((node) => {
    if (node.type === "strategy") {
      const strategyData = node.data as StrategyNodeData;

      return {
        id: node.id,
        kind: "amplify-strategy" as const,
        title: `${strategyData.protocol} · ${strategyData.action}`,
        subtitle: `Strategy node in ${primaryAmplifyWorkspace.title}`,
        workspaceType: "amplify" as const,
        workspaceId: primaryAmplifyWorkspace.id,
        href: getAmplifyWorkspaceHref(primaryAmplifyWorkspace.id),
      };
    }

    const splitData = node.data as SplitNodeData;

    return {
      id: node.id,
      kind: "amplify-split" as const,
      title: `Split ${splitData.asset}`,
      subtitle: `Routing node in ${primaryAmplifyWorkspace.title}`,
      workspaceType: "amplify" as const,
      workspaceId: primaryAmplifyWorkspace.id,
      href: getAmplifyWorkspaceHref(primaryAmplifyWorkspace.id),
    };
  }),
];

export const globalChats: GlobalChat[] = [
  {
    id: "global-chat-new",
    title: "New chat",
    preview:
      "Start with a broad Solana question or describe the investment strategy you want to explore.",
    href: getGlobalChatHref("global-chat-new"),
    lastViewedLabel: "Ready to start",
    messages: [],
    links: [],
  },
  {
    id: "global-chat-solana-yield-radar",
    title: "Solana Yield Radar",
    preview: "Broad market chat about where yield is moving across Solana this week.",
    href: getGlobalChatHref("global-chat-solana-yield-radar"),
    lastViewedLabel: "Last viewed today",
    messages: [
      {
        id: "global-chat-solana-yield-radar-user-1",
        role: "user",
        content:
          "Give me the high-level picture first. I want to understand what's happening before I commit to a specific strategy.",
      },
      {
        id: "global-chat-solana-yield-radar-ai-1",
        role: "ai",
        content:
          "We can keep this broad for now and look at where stablecoin rates, SOL staking yield, and LP opportunities are shifting across Solana.",
      },
    ],
    links: [],
  },
  {
    id: "global-chat-stablecoin-rotation",
    title: "Stablecoin Rotation",
    preview:
      "General chat comparing whether the current Pool still matches today's best stablecoin opportunities.",
    href: getGlobalChatHref("global-chat-stablecoin-rotation"),
    lastViewedLabel: "Last viewed 3 hours ago",
    messages: [
      {
        id: "global-chat-stablecoin-rotation-user-1",
        role: "user",
        content:
          "Use my existing Pool as context, but keep this chat broad for now while we compare what has changed.",
      },
      {
        id: "global-chat-stablecoin-rotation-ai-1",
        role: "ai",
        content:
          "Your current Pool is still a useful anchor, but we should compare its lending and discovery items against newer Solana opportunities.",
      },
    ],
    links: [
      {
        id: "link-stablecoin-rotation-pool",
        targetId: poolWorkspace.id,
        targetKind: "pool",
        label: poolWorkspace.name,
        workspaceType: "pool",
        workspaceId: poolWorkspace.id,
        mode: "reference-only",
      },
      {
        id: "link-stablecoin-rotation-recommendation",
        targetId: poolWorkspace.recommendations[1]?.id ?? "kamino-rebalance",
        targetKind: "pool-recommendation",
        label: poolWorkspace.recommendations[1]?.title ?? "Kamino rebalance",
        workspaceType: "pool",
        workspaceId: poolWorkspace.id,
        mode: "reference-only",
      },
    ],
  },
  {
    id: "global-chat-sol-loop-ideas",
    title: "SOL Loop Ideas",
    preview:
      "Cross-surface exploration that references both the main Pool and an Amplify strategy without creating dedicated threads yet.",
    href: getGlobalChatHref("global-chat-sol-loop-ideas"),
    lastViewedLabel: "Last viewed yesterday",
    messages: [
      {
        id: "global-chat-sol-loop-ideas-user-1",
        role: "user",
        content:
          "Reference my Pool and the SOL Yield Loop, but don't split this into dedicated threads yet. I want to compare both paths first.",
      },
      {
        id: "global-chat-sol-loop-ideas-ai-1",
        role: "ai",
        content:
          "This conversation is touching both portfolio allocation and loop design, so we can keep it general until you want a focused Pool or Amplify thread.",
      },
    ],
    links: [
      {
        id: "link-sol-loop-pool",
        targetId: poolWorkspace.id,
        targetKind: "pool",
        label: poolWorkspace.name,
        workspaceType: "pool",
        workspaceId: poolWorkspace.id,
        mode: "reference-only",
      },
      {
        id: "link-sol-loop-amplify",
        targetId: primaryAmplifyWorkspace.id,
        targetKind: "amplify",
        label: primaryAmplifyWorkspace.title,
        workspaceType: "amplify",
        workspaceId: primaryAmplifyWorkspace.id,
        mode: "reference-only",
      },
      {
        id: "link-sol-loop-amplify-node",
        targetId: "kamino",
        targetKind: "amplify-strategy",
        label: "Kamino · Supply & Borrow",
        workspaceType: "amplify",
        workspaceId: primaryAmplifyWorkspace.id,
        mode: "reference-only",
      },
    ],
  },
];

export const promotedWorkspaceThreads: WorkspaceThread[] = [
  {
    id: "workspace-thread-pool-kamino-review",
    workspaceType: "pool",
    workspaceId: poolWorkspace.id,
    title: "Research Kamino Allocation",
    summarySeed:
      "Promoted from a general market chat after the user asked for a deeper review of whether the Kamino rebalance recommendation deserves a real Pool action.",
    lastViewedLabel: "Created just now",
    messages: [
      {
        id: "workspace-thread-pool-kamino-review-ai-1",
        role: "ai",
        content:
          "I've turned the relevant part of the general chat into a focused Pool thread so we can review the Kamino recommendation in the context of this Pool only.",
      },
    ],
    source: {
      sourceChatId: "global-chat-stablecoin-rotation",
      summary:
        "General chat compared the existing Pool with newer stablecoin opportunities, then narrowed into whether Kamino deserved deeper Pool-specific review.",
      promotedFromLinkIds: [
        "link-stablecoin-rotation-pool",
        "link-stablecoin-rotation-recommendation",
      ],
    },
  },
  {
    id: "workspace-thread-amplify-sol-loop-refine",
    workspaceType: "amplify",
    workspaceId: primaryAmplifyWorkspace.id,
    title: "Refine SOL Yield Loop",
    summarySeed:
      "Promoted from a general chat once the user decided to move from broad comparison into focused loop optimization.",
    lastViewedLabel: "Created just now",
    messages: [
      {
        id: "workspace-thread-amplify-sol-loop-refine-ai-1",
        role: "ai",
        content:
          "This focused Amplify thread is seeded from the broader chat so we can iterate on the loop without carrying the full general transcript into the workspace.",
      },
    ],
    source: {
      sourceChatId: "global-chat-sol-loop-ideas",
      summary:
        "General chat explored both Pool allocation and Amplify loop design before the user chose to deepen the loop side into a dedicated workspace thread.",
      promotedFromLinkIds: [
        "link-sol-loop-amplify",
        "link-sol-loop-amplify-node",
      ],
    },
  },
];

export const hybridChatSeed = {
  poolWorkspaceSummaries,
  amplifyWorkspaceSummaries,
  globalPreferenceProfile,
  globalChats,
  mentionTargets,
  promotedWorkspaceThreads,
};
