"use client";

import { useCallback, useEffect, useState } from "react";

import { getTidalAccessToken } from "@/hooks/get-tidal-access-token";
import { useTidalAuth } from "@/hooks/use-tidal-auth";
import { isDesignMode } from "@/lib/app-mode";

import type { MeWorkspace } from "@/hooks/use-me";

export type WorkspacesState =
  | { status: "unauthenticated" }
  | { status: "loading" }
  | { status: "ready"; workspaces: MeWorkspace[] }
  | { status: "error"; error: string };

type FetchedState =
  | { status: "ready"; workspaces: MeWorkspace[] }
  | { status: "error"; error: string }
  | null;

type CreateWorkspaceInput = {
  name: string;
  slug?: string;
};

// Design mode never talks to /api/workspaces. Reporting "unauthenticated"
// is what WorkspaceProvider already treats as "use local mock-seeded
// workspaces", so the provider's DB sync, auto-create, and redirect
// effects all stay dormant without any design-mode checks of their own.
const designModeWorkspacesState: WorkspacesState = {
  status: "unauthenticated",
};

function useDesignModeWorkspaces() {
  const refresh = useCallback(() => {}, []);

  const createWorkspace = useCallback(
    async (input: CreateWorkspaceInput): Promise<MeWorkspace> => {
      // Unreachable in practice: WorkspaceProvider only calls this when
      // workspaces state is "ready" (authed DB mode).
      throw new Error(
        `createWorkspace("${input.name}") is unavailable in design mode`,
      );
    },
    [],
  );

  return { state: designModeWorkspacesState, createWorkspace, refresh };
}

/**
 * Lists the authenticated user's workspaces and exposes a create helper.
 * Returns { status: "unauthenticated" } when there's no Privy session;
 * unauthed callers should fall back to mock-seeded workspace state.
 */
function useLiveWorkspaces() {
  const { ready, authenticated } = useTidalAuth();
  const [fetched, setFetched] = useState<FetchedState>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!ready || !authenticated) return;

    let cancelled = false;

    (async () => {
      try {
        const token = await getTidalAccessToken();
        if (!token) {
          if (!cancelled) {
            setFetched({ status: "error", error: "Missing access token" });
          }
          return;
        }
        const res = await fetch("/api/workspaces", {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) {
            setFetched({
              status: "error",
              error: `Failed to load workspaces (${res.status})`,
            });
          }
          return;
        }
        const data = (await res.json()) as { workspaces: MeWorkspace[] };
        if (!cancelled) setFetched({ status: "ready", workspaces: data.workspaces });
      } catch (err) {
        if (!cancelled) {
          setFetched({
            status: "error",
            error: err instanceof Error ? err.message : "Failed to load workspaces",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, refreshNonce]);

  const createWorkspace = useCallback(
    async (input: CreateWorkspaceInput): Promise<MeWorkspace> => {
      const token = await getTidalAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        throw new Error(`Failed to create workspace (${res.status})`);
      }
      const data = (await res.json()) as { workspace: MeWorkspace };
      refresh();
      return data.workspace;
    },
    [refresh],
  );

  const state: WorkspacesState = !ready
    ? { status: "loading" }
    : !authenticated
      ? { status: "unauthenticated" }
      : (fetched ?? { status: "loading" });

  return { state, createWorkspace, refresh };
}

export const useWorkspaces = isDesignMode
  ? useDesignModeWorkspaces
  : useLiveWorkspaces;
