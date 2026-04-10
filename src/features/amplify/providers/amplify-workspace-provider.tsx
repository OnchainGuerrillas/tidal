"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  amplifyInitialWorkspaces,
  createAmplifyBuilderWorkspace,
} from "@/mock-data/amplify/mocks/workspace";
import type {
  AmplifyGraphEdge,
  AmplifyGraphNode,
  AmplifyThread,
  AmplifyWorkspace,
  AmplifyWorkspaceKind,
} from "@/mock-data/amplify/types";

type PromoteGlobalChatToAmplifyThreadInput = {
  sourceChatId: string;
  sourceChatTitle: string;
  sourceChatPreview: string;
  latestUserMessage?: string;
  promotedFromLinkIds: string[];
  promotedLinkLabels: string[];
  targetWorkspaceId?: string;
};

type CreateAmplifyWorkspaceInput = {
  name?: string;
  summary?: string;
};

type PromoteAmplifyThreadResult = {
  thread: AmplifyThread;
  workspaceId: string;
};

type AmplifyWorkspaceContextValue = {
  workspaces: AmplifyWorkspace[];
  workspace: AmplifyWorkspace;
  activeThread: AmplifyThread;
  recentThreads: AmplifyThread[];
  setActiveWorkspaceId: (workspaceId: string) => void;
  createWorkspace: (input?: CreateAmplifyWorkspaceInput) => AmplifyWorkspace;
  updateWorkspaceGraph: (
    workspaceId: string,
    nodes: AmplifyGraphNode[],
    edges: AmplifyGraphEdge[]
  ) => void;
  updateWorkspaceMeta: (
    workspaceId: string,
    updates: Partial<
      Pick<AmplifyWorkspace, "executionState" | "activeSnapshot" | "draftState">
    >
  ) => void;
  setActiveThreadId: (threadId: string, workspaceId?: string) => void;
  createBlankThread: (workspaceId?: string) => void;
  getPromotedThreadBySourceChatId: (chatId: string) => AmplifyThread | null;
  promoteGlobalChatToThread: (
    input: PromoteGlobalChatToAmplifyThreadInput
  ) => PromoteAmplifyThreadResult;
};

const AmplifyWorkspaceContext =
  createContext<AmplifyWorkspaceContextValue | null>(null);

function cloneNode<TNode extends AmplifyGraphNode>(node: TNode): TNode {
  return {
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  };
}

function cloneThread(thread: AmplifyThread): AmplifyThread {
  return {
    ...thread,
    messages: thread.messages.map((message) => ({ ...message })),
    source: thread.source ? { ...thread.source } : undefined,
  };
}

function cloneWorkspace(workspace: AmplifyWorkspace): AmplifyWorkspace {
  return {
    ...workspace,
    threads: workspace.threads.map(cloneThread),
    nodes: workspace.nodes.map((node) => cloneNode(node)),
    edges: workspace.edges.map((edge) => ({
      ...edge,
      style: edge.style ? { ...edge.style } : undefined,
      data: edge.data ? { ...edge.data } : undefined,
    })),
  };
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildPromotionSummary(input: PromoteGlobalChatToAmplifyThreadInput) {
  const linkedContext =
    input.promotedLinkLabels.length > 0
      ? input.promotedLinkLabels.join(", ")
      : "the current Amplify strategy context";
  const latestPrompt =
    input.latestUserMessage && input.latestUserMessage.trim().length > 0
      ? ` Latest user focus: "${input.latestUserMessage.trim()}".`
      : "";

  return `Promoted from the global chat "${input.sourceChatTitle}" so the conversation can continue as focused Amplify work around ${linkedContext}. ${input.sourceChatPreview}${latestPrompt}`;
}

function getWorkspaceById(
  workspaces: AmplifyWorkspace[],
  workspaceId?: string | null
) {
  if (!workspaceId) {
    return workspaces[0] ?? null;
  }

  return workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0] ?? null;
}

function getWorkspaceKindLabel(kind: AmplifyWorkspaceKind) {
  return kind === "example" ? "Example" : "Workspace";
}

export function AmplifyWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [workspaces, setWorkspaces] = useState<AmplifyWorkspace[]>(() =>
    amplifyInitialWorkspaces.map(cloneWorkspace)
  );
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(
    amplifyInitialWorkspaces[0]?.id
  );

  const setActiveWorkspaceId = useCallback((workspaceId: string) => {
    setActiveWorkspaceIdState(workspaceId);
  }, []);

  const setActiveThreadId = useCallback(
    (threadId: string, workspaceId?: string) => {
      const targetWorkspaceId = workspaceId ?? activeWorkspaceId;

      if (!targetWorkspaceId) {
        return;
      }

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) => {
          if (workspace.id !== targetWorkspaceId) {
            return workspace;
          }

          if (!workspace.threads.some((thread) => thread.id === threadId)) {
            return workspace;
          }

          return {
            ...workspace,
            activeThreadId: threadId,
          };
        })
      );
      setActiveWorkspaceIdState(targetWorkspaceId);
    },
    [activeWorkspaceId]
  );

  const createWorkspace = useCallback((input?: CreateAmplifyWorkspaceInput) => {
    const nextWorkspace = createAmplifyBuilderWorkspace(input);

    setWorkspaces((currentWorkspaces) => [nextWorkspace, ...currentWorkspaces]);
    setActiveWorkspaceIdState(nextWorkspace.id);

    return nextWorkspace;
  }, []);

  const updateWorkspaceGraph = useCallback(
    (workspaceId: string, nodes: AmplifyGraphNode[], edges: AmplifyGraphEdge[]) => {
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === workspaceId
            ? {
                ...workspace,
                nodes: nodes.map((node) => cloneNode(node)),
                edges: edges.map((edge) => ({
                  ...edge,
                  style: edge.style ? { ...edge.style } : undefined,
                  data: edge.data ? { ...edge.data } : undefined,
                })),
              }
            : workspace
        )
      );
    },
    []
  );

  const updateWorkspaceMeta = useCallback(
    (
      workspaceId: string,
      updates: Partial<
        Pick<AmplifyWorkspace, "executionState" | "activeSnapshot" | "draftState">
      >
    ) => {
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === workspaceId
            ? {
                ...workspace,
                ...updates,
              }
            : workspace
        )
      );
    },
    []
  );

  const createBlankThread = useCallback(
    (workspaceId?: string) => {
      const targetWorkspaceId = workspaceId ?? activeWorkspaceId;

      if (!targetWorkspaceId) {
        return;
      }

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) => {
          if (workspace.id !== targetWorkspaceId) {
            return workspace;
          }

          const nextIndex = workspace.threads.length + 1;
          const nextThread: AmplifyThread = {
            id: createId("amplify-thread"),
            title: `New thread ${nextIndex}`,
            preview: `A fresh Amplify thread for refining the ${getWorkspaceKindLabel(
              workspace.kind
            ).toLowerCase()} strategy graph.`,
            lastViewedLabel: "Created just now",
            messages: [
              {
                id: createId("amplify-thread-ai"),
                role: "ai",
                content:
                  "New Amplify thread ready. We can adjust the loop, compare protocol paths, or model the impact of a new node here.",
              },
            ],
          };

          return {
            ...workspace,
            activeThreadId: nextThread.id,
            threads: [...workspace.threads, nextThread],
          };
        })
      );

      setActiveWorkspaceIdState(targetWorkspaceId);
    },
    [activeWorkspaceId]
  );

  const getPromotedThreadBySourceChatId = useCallback(
    (chatId: string) =>
      workspaces
        .flatMap((workspace) => workspace.threads)
        .find((thread) => thread.source?.sourceChatId === chatId) ?? null,
    [workspaces]
  );

  const promoteGlobalChatToThread = useCallback(
    (input: PromoteGlobalChatToAmplifyThreadInput) => {
      const existingMatch = workspaces.find((workspace) =>
        workspace.threads.some(
          (thread) => thread.source?.sourceChatId === input.sourceChatId
        )
      );

      if (existingMatch) {
        const existingThread =
          existingMatch.threads.find(
            (thread) => thread.source?.sourceChatId === input.sourceChatId
          ) ?? existingMatch.threads[0];

        setActiveWorkspaceIdState(existingMatch.id);
        setWorkspaces((currentWorkspaces) =>
          currentWorkspaces.map((workspace) =>
            workspace.id === existingMatch.id
              ? { ...workspace, activeThreadId: existingThread.id }
              : workspace
          )
        );

        return {
          thread: existingThread,
          workspaceId: existingMatch.id,
        };
      }

      const fallbackWorkspace =
        getWorkspaceById(workspaces, input.targetWorkspaceId ?? activeWorkspaceId) ??
        workspaces[0];
      const targetWorkspaceId = fallbackWorkspace.id;
      const summarySeed = buildPromotionSummary(input);
      const nextThread: AmplifyThread = {
        id: createId("amplify-thread-promoted"),
        title: input.sourceChatTitle,
        preview: "Promoted from global chat for focused Amplify strategy work.",
        lastViewedLabel: "Created just now",
        summarySeed,
        source: {
          sourceChatId: input.sourceChatId,
          summary: summarySeed,
          promotedFromLinkIds: input.promotedFromLinkIds,
        },
        messages: [
          {
            id: createId("amplify-thread-promoted-ai"),
            role: "ai",
            content:
              "I’ve turned the relevant part of the general chat into a focused Amplify thread. We can refine this strategy here without carrying over the whole broad transcript.",
          },
        ],
      };

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === targetWorkspaceId
            ? {
                ...workspace,
                activeThreadId: nextThread.id,
                threads: [...workspace.threads, nextThread],
              }
            : workspace
        )
      );
      setActiveWorkspaceIdState(targetWorkspaceId);

      return {
        thread: nextThread,
        workspaceId: targetWorkspaceId,
      };
    },
    [activeWorkspaceId, workspaces]
  );

  const workspace =
    getWorkspaceById(workspaces, activeWorkspaceId) ??
    createAmplifyBuilderWorkspace();
  const activeThread =
    workspace.threads.find((thread) => thread.id === workspace.activeThreadId) ??
    workspace.threads[0];
  const recentThreads = workspace.threads.filter(
    (thread) => thread.id !== activeThread.id
  );

  const value = useMemo(
    () => ({
      workspaces,
      workspace,
      activeThread,
      recentThreads,
      setActiveWorkspaceId,
      createWorkspace,
      updateWorkspaceGraph,
      updateWorkspaceMeta,
      setActiveThreadId,
      createBlankThread,
      getPromotedThreadBySourceChatId,
      promoteGlobalChatToThread,
    }),
    [
      workspaces,
      workspace,
      activeThread,
      recentThreads,
      setActiveWorkspaceId,
      createWorkspace,
      updateWorkspaceGraph,
      updateWorkspaceMeta,
      setActiveThreadId,
      createBlankThread,
      getPromotedThreadBySourceChatId,
      promoteGlobalChatToThread,
    ]
  );

  return (
    <AmplifyWorkspaceContext.Provider value={value}>
      {children}
    </AmplifyWorkspaceContext.Provider>
  );
}

export function useAmplifyWorkspace() {
  const context = useContext(AmplifyWorkspaceContext);

  if (!context) {
    throw new Error(
      "useAmplifyWorkspace must be used within AmplifyWorkspaceProvider."
    );
  }

  return context;
}
