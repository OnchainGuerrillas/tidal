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
  initialWorkspaces,
  createBuilderWorkspace,
} from "@/mock-data/workspace/workspace";
import type {
  Workspace,
  WorkspaceGraphEdge,
  WorkspaceGraphNode,
  WorkspaceKind,
  WorkspaceThread,
} from "@/mock-data/workspace/types";

type CreateWorkspaceInput = {
  name?: string;
  summary?: string;
};

type WorkspaceContextValue = {
  workspaces: Workspace[];
  workspace: Workspace;
  activeThread: WorkspaceThread;
  recentThreads: WorkspaceThread[];
  setActiveWorkspaceId: (workspaceId: string) => void;
  createWorkspace: (input?: CreateWorkspaceInput) => Workspace;
  closeWorkspace: (workspaceId: string) => void;
  updateWorkspaceGraph: (
    workspaceId: string,
    nodes: WorkspaceGraphNode[],
    edges: WorkspaceGraphEdge[]
  ) => void;
  updateWorkspaceMeta: (
    workspaceId: string,
    updates: Partial<
      Pick<Workspace, "executionState" | "activeSnapshot" | "draftState">
    >
  ) => void;
  setActiveThreadId: (threadId: string, workspaceId?: string) => void;
  createBlankThread: (workspaceId?: string) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function cloneNode<TNode extends WorkspaceGraphNode>(node: TNode): TNode {
  return {
    ...node,
    position: { ...node.position },
    data: { ...node.data },
  };
}

function cloneThread(thread: WorkspaceThread): WorkspaceThread {
  return {
    ...thread,
    messages: thread.messages.map((message) => ({ ...message })),
  };
}

function cloneWorkspace(workspace: Workspace): Workspace {
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

function getWorkspaceById(
  workspaces: Workspace[],
  workspaceId?: string | null
) {
  if (!workspaceId) {
    return workspaces[0] ?? null;
  }

  return (
    workspaces.find((workspace) => workspace.id === workspaceId) ??
    workspaces[0] ??
    null
  );
}

function getWorkspaceKindLabel(kind: WorkspaceKind) {
  return kind === "example" ? "Example" : "Workspace";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() =>
    initialWorkspaces.map(cloneWorkspace)
  );
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(
    initialWorkspaces[0]?.id
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

  const createWorkspace = useCallback((input?: CreateWorkspaceInput) => {
    const nextWorkspace = createBuilderWorkspace(input);

    setWorkspaces((currentWorkspaces) => [nextWorkspace, ...currentWorkspaces]);
    setActiveWorkspaceIdState(nextWorkspace.id);

    return nextWorkspace;
  }, []);

  const closeWorkspace = useCallback((workspaceId: string) => {
    setWorkspaces((currentWorkspaces) => {
      const remaining = currentWorkspaces.filter(
        (workspace) => workspace.id !== workspaceId
      );

      if (remaining.length === 0) {
        const replacement = createBuilderWorkspace();
        setActiveWorkspaceIdState(replacement.id);
        return [replacement];
      }

      setActiveWorkspaceIdState((current) =>
        current === workspaceId ? remaining[0].id : current
      );

      return remaining;
    });
  }, []);

  const updateWorkspaceGraph = useCallback(
    (
      workspaceId: string,
      nodes: WorkspaceGraphNode[],
      edges: WorkspaceGraphEdge[]
    ) => {
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
        Pick<Workspace, "executionState" | "activeSnapshot" | "draftState">
      >
    ) => {
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === workspaceId ? { ...workspace, ...updates } : workspace
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
          const nextThread: WorkspaceThread = {
            id: createId("workspace-chat"),
            title: `New chat ${nextIndex}`,
            preview: `A fresh chat for refining the ${getWorkspaceKindLabel(
              workspace.kind
            ).toLowerCase()} strategy graph.`,
            lastViewedLabel: "Created just now",
            messages: [
              {
                id: createId("workspace-chat-ai"),
                role: "ai",
                content:
                  "New chat ready. We can adjust the loop, compare protocol paths, or model the impact of a new node here.",
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

  const workspace =
    getWorkspaceById(workspaces, activeWorkspaceId) ?? createBuilderWorkspace();
  const activeThread =
    workspace.threads.find(
      (thread) => thread.id === workspace.activeThreadId
    ) ?? workspace.threads[0];
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
      closeWorkspace,
      updateWorkspaceGraph,
      updateWorkspaceMeta,
      setActiveThreadId,
      createBlankThread,
    }),
    [
      workspaces,
      workspace,
      activeThread,
      recentThreads,
      setActiveWorkspaceId,
      createWorkspace,
      closeWorkspace,
      updateWorkspaceGraph,
      updateWorkspaceMeta,
      setActiveThreadId,
      createBlankThread,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider.");
  }

  return context;
}
