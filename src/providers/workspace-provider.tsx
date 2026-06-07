"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

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
import {
  applyMutationsToWorkspace,
  type GraphMutation,
} from "@/lib/workspace/mutations";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceGraph } from "@/hooks/use-workspace-graph";
import type { MeWorkspace } from "@/hooks/use-me";
import { getWorkspaceHref } from "@/lib/routes/workspace";

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
  applyGraphMutations: (
    mutations: GraphMutation[],
    workspaceId?: string
  ) => { warnings: string[] };
  updateWorkspaceMeta: (
    workspaceId: string,
    updates: Partial<
      Pick<Workspace, "executionState" | "activeSnapshot" | "draftState">
    >
  ) => void;
  setActiveThreadId: (threadId: string, workspaceId?: string) => void;
  createBlankThread: (workspaceId?: string) => void;
  /**
   * Resolves the DB UUID for a workspace id (slug), or null if the active
   * mode is unauthed or the workspace isn't DB-backed. Used by callers
   * that need to address the workspace by its real DB key (e.g., recording
   * a run).
   */
  resolveDbWorkspaceId: (workspaceId: string) => string | null;
  /**
   * Latest known graph version for a workspace, or null if unknown / not
   * loaded yet. Used when recording runs so the version field on
   * run_history reflects the graph that was actually executed.
   */
  resolveGraphVersion: (workspaceId: string) => number | null;
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

function getWorkspaceIdFromPathname(pathname: string | null) {
  const segment = pathname?.split("/").filter(Boolean)[0];

  return segment ? decodeURIComponent(segment) : null;
}

function getWorkspaceKindLabel(kind: WorkspaceKind) {
  return kind === "example" ? "Example" : "Workspace";
}

/**
 * Synthesize a Workspace from a DB row. The DB only persists the durable
 * subset (id, slug, name, nodes, edges via workspace_graphs); everything
 * ephemeral (threads, executionState, draftState, kind, isEditable,
 * summary, suggestions) is defaulted here. The `id` on the returned
 * Workspace is the slug — that's the URL routing identifier; the real
 * DB UUID is tracked separately in the provider's slug→uuid map.
 */
function workspaceFromDbRow(
  dbRow: MeWorkspace,
  graphNodes: WorkspaceGraphNode[] = [],
  graphEdges: WorkspaceGraphEdge[] = [],
): Workspace {
  const initialThread: WorkspaceThread = {
    id: createId("workspace-chat"),
    title: "New chat",
    preview: "A fresh chat for refining this workspace.",
    lastViewedLabel: "Created just now",
    messages: [
      {
        id: createId("workspace-chat-ai"),
        role: "ai",
        content:
          "Tell me what you want to do — I'll compose the strategy as a graph for you to review and run.",
      },
    ],
  };

  return {
    id: dbRow.slug,
    name: dbRow.name,
    summary: "",
    kind: "builder",
    isEditable: true,
    executionState: "draft",
    activeThreadId: initialThread.id,
    threads: [initialThread],
    suggestions: [],
    nodes: graphNodes,
    edges: graphEdges,
  };
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const routeWorkspaceId = getWorkspaceIdFromPathname(pathname);

  // Unauthed / fallback state: the in-memory mock workspaces (current
  // behavior). Also serves as the home for ephemeral fields (threads,
  // run state, etc.) in authed mode, keyed by the workspace's id/slug.
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() =>
    initialWorkspaces.map(cloneWorkspace),
  );
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => {
    const routeWorkspace = initialWorkspaces.find(
      (workspace) => workspace.id === routeWorkspaceId,
    );

    return routeWorkspace?.id ?? initialWorkspaces[0]?.id;
  });

  // DB-mode hooks. These return idle/unauthenticated state when there's
  // no Privy session, so they're safe to mount unconditionally.
  const { state: dbWorkspacesState, createWorkspace: createDbWorkspace } =
    useWorkspaces();
  const isAuthedMode = dbWorkspacesState.status === "ready";

  // Map slug → DB UUID so API calls can address rows by their real key.
  const slugToDbUuidRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    if (dbWorkspacesState.status !== "ready") return;
    const next = new Map<string, string>();
    for (const row of dbWorkspacesState.workspaces) {
      next.set(row.slug, row.id);
    }
    slugToDbUuidRef.current = next;
  }, [dbWorkspacesState]);

  // The active workspace in authed mode is the one whose slug matches the
  // URL segment. In unauthed mode it's tracked by activeWorkspaceId state.
  const activeDbWorkspace =
    isAuthedMode && routeWorkspaceId
      ? dbWorkspacesState.workspaces.find((w) => w.slug === routeWorkspaceId) ??
        null
      : null;
  const activeDbUuid = activeDbWorkspace?.id ?? null;

  const { state: graphState, saveGraph } = useWorkspaceGraph(activeDbUuid);

  // Versions per workspace id (slug). Used by /api/runs callers.
  const graphVersionsRef = useRef<Map<string, number>>(new Map());
  useEffect(() => {
    if (graphState.status === "ready" && graphState.graph && activeDbWorkspace) {
      graphVersionsRef.current.set(
        activeDbWorkspace.slug,
        graphState.graph.version,
      );
    }
  }, [graphState, activeDbWorkspace]);

  // When the active DB workspace's graph loads, materialize it into the
  // local workspaces state (for the unified consumer view). We only do
  // this on graph-load — subsequent local mutations stay in local state
  // and get pushed to the DB via saveGraph.
  useEffect(() => {
    if (graphState.status !== "ready" || !activeDbWorkspace) return;
    const slug = activeDbWorkspace.slug;
    const dbNodes = (graphState.graph?.nodesJson as WorkspaceGraphNode[]) ?? [];
    const dbEdges = (graphState.graph?.edgesJson as WorkspaceGraphEdge[]) ?? [];

    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external source (useWorkspaceGraph). Workspaces array must reflect freshly-loaded DB graph; this is the canonical effect-for-external-sync pattern.
    setWorkspaces((current) => {
      const existing = current.find((w) => w.id === slug);
      if (existing) {
        // Only replace nodes/edges; preserve ephemeral fields (threads, etc.)
        return current.map((w) =>
          w.id === slug ? { ...w, nodes: dbNodes, edges: dbEdges } : w,
        );
      }
      // First time we've seen this workspace — synthesize a full Workspace.
      const synthesized = workspaceFromDbRow(activeDbWorkspace, dbNodes, dbEdges);
      return [synthesized, ...current];
    });
  }, [graphState, activeDbWorkspace]);

  // Synthesize stub entries for DB workspaces we know about but haven't
  // loaded the graph for yet, so the tab bar can render them.
  useEffect(() => {
    if (dbWorkspacesState.status !== "ready") return;
    const rows = dbWorkspacesState.workspaces;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external source (useWorkspaces). Tab bar must render every DB workspace even before its graph is loaded; synthesize stubs from the DB list.
    setWorkspaces((current) => {
      const existingIds = new Set(current.map((w) => w.id));
      const additions = rows
        .filter((row) => !existingIds.has(row.slug))
        .map((row) => workspaceFromDbRow(row));
      if (additions.length === 0) return current;
      return [...additions, ...current];
    });
  }, [dbWorkspacesState]);

  // First-login auto-create: if user has zero workspaces, make one.
  const autoCreateFiredRef = useRef(false);
  useEffect(() => {
    if (
      dbWorkspacesState.status !== "ready" ||
      dbWorkspacesState.workspaces.length !== 0 ||
      autoCreateFiredRef.current
    ) {
      return;
    }
    autoCreateFiredRef.current = true;
    void (async () => {
      try {
        const created = await createDbWorkspace({ name: "My first workspace" });
        router.replace(getWorkspaceHref(created.slug));
      } catch (err) {
        console.error("[WorkspaceProvider] auto-create failed:", err);
      }
    })();
  }, [dbWorkspacesState, createDbWorkspace, router]);

  // Legacy / unowned URL redirect for authed users.
  useEffect(() => {
    if (
      !isAuthedMode ||
      dbWorkspacesState.status !== "ready" ||
      dbWorkspacesState.workspaces.length === 0 ||
      !routeWorkspaceId
    ) {
      return;
    }
    const matched = dbWorkspacesState.workspaces.find(
      (w) => w.slug === routeWorkspaceId,
    );
    if (!matched) {
      const fallback = dbWorkspacesState.workspaces[0];
      router.replace(getWorkspaceHref(fallback.slug));
    }
  }, [isAuthedMode, dbWorkspacesState, routeWorkspaceId, router]);

  // Keep activeWorkspaceId state in sync with the URL for unauthed mode
  // (preserves the existing behavior). Authed mode treats the URL as the
  // source of truth via activeDbWorkspace above.
  useEffect(() => {
    if (isAuthedMode) return;
    if (!routeWorkspaceId) return;
    const matched = workspaces.find((w) => w.id === routeWorkspaceId);
    if (matched && matched.id !== activeWorkspaceId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from external source (URL pathname). Keeps unauthed-mode active workspace in lockstep with router state.
      setActiveWorkspaceIdState(matched.id);
    }
  }, [isAuthedMode, routeWorkspaceId, workspaces, activeWorkspaceId]);

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
        }),
      );
      setActiveWorkspaceIdState(targetWorkspaceId);
    },
    [activeWorkspaceId],
  );

  const createWorkspace = useCallback(
    (input?: CreateWorkspaceInput) => {
      if (isAuthedMode) {
        // Optimistic: build a placeholder Workspace from the input. The DB
        // hook will refresh and the real DB row will populate via the
        // dbWorkspaces sync effect. Return the placeholder so callers can
        // route to it.
        const placeholderSlug = `pending-${Date.now()}`;
        const placeholder: Workspace = {
          id: placeholderSlug,
          name: input?.name ?? "New workspace",
          summary: input?.summary ?? "",
          kind: "builder",
          isEditable: true,
          executionState: "draft",
          activeThreadId: createId("workspace-chat"),
          threads: [],
          suggestions: [],
          nodes: [],
          edges: [],
        };
        void (async () => {
          try {
            const created = await createDbWorkspace({
              name: input?.name ?? "New workspace",
            });
            router.replace(getWorkspaceHref(created.slug));
          } catch (err) {
            console.error("[WorkspaceProvider] createWorkspace failed:", err);
          }
        })();
        return placeholder;
      }

      const nextWorkspace = createBuilderWorkspace(input);
      setWorkspaces((currentWorkspaces) => [nextWorkspace, ...currentWorkspaces]);
      setActiveWorkspaceIdState(nextWorkspace.id);
      return nextWorkspace;
    },
    [isAuthedMode, createDbWorkspace, router],
  );

  const closeWorkspace = useCallback(
    (workspaceId: string) => {
      if (isAuthedMode) {
        // In authed mode, "close" is a client-side hide only. The DB row
        // is preserved; delete will land via a future DELETE endpoint.
        setWorkspaces((currentWorkspaces) =>
          currentWorkspaces.filter((w) => w.id !== workspaceId),
        );
        return;
      }

      setWorkspaces((currentWorkspaces) => {
        const remaining = currentWorkspaces.filter(
          (workspace) => workspace.id !== workspaceId,
        );

        if (remaining.length === 0) {
          const replacement = createBuilderWorkspace();
          setActiveWorkspaceIdState(replacement.id);
          return [replacement];
        }

        setActiveWorkspaceIdState((current) =>
          current === workspaceId ? remaining[0].id : current,
        );

        return remaining;
      });
    },
    [isAuthedMode],
  );

  const updateWorkspaceGraph = useCallback(
    (
      workspaceId: string,
      nodes: WorkspaceGraphNode[],
      edges: WorkspaceGraphEdge[],
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
            : workspace,
        ),
      );

      // Persist to DB if this is the active authed workspace.
      if (isAuthedMode && activeDbWorkspace && workspaceId === activeDbWorkspace.slug) {
        saveGraph(nodes, edges);
      }
    },
    [isAuthedMode, activeDbWorkspace, saveGraph],
  );

  const applyGraphMutations = useCallback(
    (
      mutations: GraphMutation[],
      workspaceId?: string,
    ): { warnings: string[] } => {
      const targetWorkspaceId = workspaceId ?? activeWorkspaceId;
      if (!targetWorkspaceId) {
        return { warnings: ["no active workspace"] };
      }

      const collectedWarnings: string[] = [];
      let updatedNodes: WorkspaceGraphNode[] | null = null;
      let updatedEdges: WorkspaceGraphEdge[] | null = null;

      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) => {
          if (workspace.id !== targetWorkspaceId) {
            return workspace;
          }
          const result = applyMutationsToWorkspace(workspace, mutations);
          collectedWarnings.push(...result.warnings);
          updatedNodes = result.workspace.nodes;
          updatedEdges = result.workspace.edges;
          return result.workspace;
        }),
      );

      if (
        isAuthedMode &&
        activeDbWorkspace &&
        targetWorkspaceId === activeDbWorkspace.slug &&
        updatedNodes &&
        updatedEdges
      ) {
        saveGraph(updatedNodes, updatedEdges);
      }

      return { warnings: collectedWarnings };
    },
    [activeWorkspaceId, isAuthedMode, activeDbWorkspace, saveGraph],
  );

  const updateWorkspaceMeta = useCallback(
    (
      workspaceId: string,
      updates: Partial<
        Pick<Workspace, "executionState" | "activeSnapshot" | "draftState">
      >,
    ) => {
      // Meta updates (run state) are ephemeral; never persisted.
      setWorkspaces((currentWorkspaces) =>
        currentWorkspaces.map((workspace) =>
          workspace.id === workspaceId ? { ...workspace, ...updates } : workspace,
        ),
      );
    },
    [],
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
              workspace.kind,
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
        }),
      );

      setActiveWorkspaceIdState(targetWorkspaceId);
    },
    [activeWorkspaceId],
  );

  const resolveDbWorkspaceId = useCallback((workspaceId: string): string | null => {
    return slugToDbUuidRef.current.get(workspaceId) ?? null;
  }, []);

  const resolveGraphVersion = useCallback((workspaceId: string): number | null => {
    return graphVersionsRef.current.get(workspaceId) ?? null;
  }, []);

  const workspace =
    getWorkspaceById(workspaces, activeWorkspaceId) ?? createBuilderWorkspace();
  const activeThread =
    workspace.threads.find(
      (thread) => thread.id === workspace.activeThreadId,
    ) ?? workspace.threads[0];
  const recentThreads = workspace.threads.filter(
    (thread) => thread.id !== activeThread.id,
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
      applyGraphMutations,
      updateWorkspaceMeta,
      setActiveThreadId,
      createBlankThread,
      resolveDbWorkspaceId,
      resolveGraphVersion,
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
      applyGraphMutations,
      updateWorkspaceMeta,
      setActiveThreadId,
      createBlankThread,
      resolveDbWorkspaceId,
      resolveGraphVersion,
    ],
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
