import type { Edge } from "@xyflow/react";

import type { WorkspaceGraphNode, Workspace } from "./types";
import { createWalletNode } from "./node-factories";

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type CreateBuilderWorkspaceInput = {
  id?: string;
  name?: string;
  summary?: string;
};

export const builderNodes: WorkspaceGraphNode[] = [
  createWalletNode({ x: 0, y: 180 }, "wallet-primary"),
];

export const builderEdges: Edge<{ asset: string }>[] = [];

export const builderWorkspace: Workspace = {
  id: "workspace-new-strategy",
  name: "New workspace Strategy",
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
  activeThreadId: "workspace-thread-builder",
  threads: [
    {
      id: "workspace-thread-builder",
      title: "Builder thread",
      preview: "A fresh workspace for sketching a new reinvestment loop.",
      lastViewedLabel: "Ready to build",
      messages: [
        {
          id: "workspace-thread-builder-ai-1",
          role: "ai",
          content:
            "This blank workspace starts from your mocked wallet balances so you can build a strategy from scratch.",
        },
      ],
    },
  ],
  suggestions: [
    "Start from SOL",
    "Split wallet balance",
    "Map a reinvestment loop",
  ],
  nodes: builderNodes,
  edges: builderEdges,
};

export function createBuilderWorkspace(
  input?: CreateBuilderWorkspaceInput
): Workspace {
  const workspaceId = input?.id ?? createId("workspace-workspace");
  const threadId = createId("workspace-thread-builder");
  const walletNodeId = createId("wallet");

  return {
    id: workspaceId,
    name: input?.name?.trim() || "New workspace Strategy",
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
        preview: "A fresh workspace for sketching a new reinvestment loop.",
        lastViewedLabel: "Created just now",
        messages: [
          {
            id: createId("workspace-thread-builder-ai"),
            role: "ai",
            content:
              "New workspace ready. Start from the wallet node and build out the loop you want to prototype.",
          },
        ],
      },
    ],
    suggestions: [
      "Start from SOL",
      "Split wallet balance",
      "Map a reinvestment loop",
    ],
    nodes: [createWalletNode({ x: 0, y: 180 }, walletNodeId)],
    edges: [],
  };
}
