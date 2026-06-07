"use client";

import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

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

/**
 * Lists the authenticated user's workspaces and exposes a create helper.
 * Returns { status: "unauthenticated" } when there's no Privy session;
 * unauthed callers should fall back to mock-seeded workspace state.
 */
export function useWorkspaces() {
  const { ready, authenticated } = usePrivy();
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
        const token = await getAccessToken();
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
      const token = await getAccessToken();
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
