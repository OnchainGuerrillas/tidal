import type { Edge } from "@xyflow/react";

import type { AmplifyGraphNode, AmplifyWorkspace } from "../types";
import { createAmplifyWalletNode } from "./node-factories";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type CreateAmplifyBuilderWorkspaceInput = {
  id?: string;
  name?: string;
  summary?: string;
};

export const amplifyBuilderNodes: AmplifyGraphNode[] = [
  createAmplifyWalletNode({ x: 0, y: 180 }, "wallet-primary"),
];

export const amplifyBuilderEdges: Edge<{ asset: string }>[] = [];

export const amplifyBuilderWorkspace: AmplifyWorkspace = {
  id: "amplify-new-strategy",
  name: "New Amplify Strategy",
  summary:
    "A blank builder workspace seeded with a wallet node so the user can design a new loop from scratch.",
  kind: "builder",
  isEditable: true,
  executionState: "draft",
  draftState: {
    updatedAtLabel: "Not run yet",
    changedNodeIds: [],
    impactedNodeIds: [],
  },
  activeThreadId: "amplify-thread-builder",
  threads: [
    {
      id: "amplify-thread-builder",
      title: "Builder thread",
      preview: "A fresh Amplify workspace for sketching a new reinvestment loop.",
      lastViewedLabel: "Ready to build",
      messages: [
        {
          id: "amplify-thread-builder-ai-1",
          role: "ai",
          content:
            "This blank Amplify workspace starts from your mocked wallet balances so you can build a strategy from scratch.",
        },
      ],
    },
  ],
  suggestions: [
    "Start from SOL",
    "Split wallet balance",
    "Map a reinvestment loop",
  ],
  nodes: amplifyBuilderNodes,
  edges: amplifyBuilderEdges,
};

export function createAmplifyBuilderWorkspace(
  input?: CreateAmplifyBuilderWorkspaceInput
): AmplifyWorkspace {
  const workspaceId = input?.id ?? createId("amplify-workspace");
  const threadId = createId("amplify-thread-builder");
  const walletNodeId = createId("wallet");

  return {
    id: workspaceId,
    name: input?.name?.trim() || "New Amplify Strategy",
    summary:
      input?.summary?.trim() ||
      "A blank builder workspace seeded with mocked wallet balances.",
    kind: "builder",
    isEditable: true,
    executionState: "draft",
    draftState: {
      updatedAtLabel: "Not run yet",
      changedNodeIds: [],
      impactedNodeIds: [],
    },
    activeThreadId: threadId,
    threads: [
      {
        id: threadId,
        title: "Builder thread",
        preview: "A fresh Amplify workspace for sketching a new reinvestment loop.",
        lastViewedLabel: "Created just now",
        messages: [
          {
            id: createId("amplify-thread-builder-ai"),
            role: "ai",
            content:
              "New Amplify workspace ready. Start from the wallet node and build out the loop you want to prototype.",
          },
        ],
      },
    ],
    suggestions: [
      "Start from SOL",
      "Split wallet balance",
      "Map a reinvestment loop",
    ],
    nodes: [createAmplifyWalletNode({ x: 0, y: 180 }, walletNodeId)],
    edges: [],
  };
}
