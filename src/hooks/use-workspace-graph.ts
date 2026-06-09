"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getTidalAccessToken } from "@/hooks/get-tidal-access-token";
import { useTidalAuth } from "@/hooks/use-tidal-auth";

const DEBOUNCE_MS = 500;

export type WorkspaceGraphSnapshot = {
  id: string;
  workspaceId: string;
  version: number;
  nodesJson: unknown[];
  edgesJson: unknown[];
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
};

export type WorkspaceGraphState =
  | { status: "unauthenticated" }
  | { status: "no-workspace" }
  | { status: "loading" }
  | { status: "ready"; graph: WorkspaceGraphSnapshot | null; saving: boolean }
  | { status: "error"; error: string };

type FetchedState =
  | { status: "ready"; graph: WorkspaceGraphSnapshot | null }
  | { status: "error"; error: string }
  | null;

type PendingPayload = {
  nodes: unknown[];
  edges: unknown[];
  metadata?: Record<string, unknown>;
};

/**
 * Loads the latest graph version for a workspace and exposes a debounced
 * saveGraph(nodes, edges) that POSTs a new version. Saves are debounced
 * by 500ms; rapid successive calls coalesce. If a save is in flight when
 * new edits arrive, the latest payload is queued and fires when the
 * current save completes.
 */
export function useWorkspaceGraph(workspaceId: string | null) {
  const { ready, authenticated } = useTidalAuth();
  const [fetched, setFetched] = useState<FetchedState>(null);
  const [saving, setSaving] = useState(false);
  const [loadNonce, setLoadNonce] = useState(0);

  const pendingPayloadRef = useRef<PendingPayload | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const activeWorkspaceIdRef = useRef<string | null>(workspaceId);
  activeWorkspaceIdRef.current = workspaceId;

  const refresh = useCallback(() => {
    setLoadNonce((n) => n + 1);
  }, []);

  // Load latest graph on workspace switch or explicit refresh.
  useEffect(() => {
    if (!ready || !authenticated || !workspaceId) return;

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
        const res = await fetch(
          `/api/workspaces/${encodeURIComponent(workspaceId)}`,
          { headers: { authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          if (!cancelled) {
            setFetched({
              status: "error",
              error: `Failed to load graph (${res.status})`,
            });
          }
          return;
        }
        const data = (await res.json()) as {
          workspace: unknown;
          graph: WorkspaceGraphSnapshot | null;
        };
        if (!cancelled) setFetched({ status: "ready", graph: data.graph });
      } catch (err) {
        if (!cancelled) {
          setFetched({
            status: "error",
            error: err instanceof Error ? err.message : "Failed to load graph",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, workspaceId, loadNonce]);

  // Tear down any pending debounce timer when the workspace changes.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [workspaceId]);

  const flushSave = useCallback(async () => {
    const targetWorkspaceId = activeWorkspaceIdRef.current;
    const payload = pendingPayloadRef.current;
    if (!targetWorkspaceId || !payload) {
      inFlightRef.current = false;
      setSaving(false);
      return;
    }

    pendingPayloadRef.current = null;
    inFlightRef.current = true;
    setSaving(true);

    try {
      const token = await getTidalAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(
        `/api/workspaces/${encodeURIComponent(targetWorkspaceId)}`,
        {
          method: "PUT",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        throw new Error(`Save failed (${res.status})`);
      }
      const data = (await res.json()) as { graph: WorkspaceGraphSnapshot };
      // Only adopt the saved graph as state if the workspace hasn't switched
      // out from under us mid-save. Otherwise the response belongs to a
      // workspace we're no longer showing.
      if (activeWorkspaceIdRef.current === targetWorkspaceId) {
        setFetched({ status: "ready", graph: data.graph });
      }
    } catch (err) {
      console.error("[useWorkspaceGraph] save failed:", err);
    } finally {
      inFlightRef.current = false;
      setSaving(false);

      // If another payload accumulated during the save, fire again.
      if (pendingPayloadRef.current) {
        void flushSave();
      }
    }
  }, []);

  const saveGraph = useCallback(
    (nodes: unknown[], edges: unknown[], metadata?: Record<string, unknown>) => {
      if (!workspaceId || !authenticated) return;

      pendingPayloadRef.current = { nodes, edges, metadata };

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        if (inFlightRef.current) return; // current save will pick up the latest
        void flushSave();
      }, DEBOUNCE_MS);
    },
    [workspaceId, authenticated, flushSave],
  );

  const state: WorkspaceGraphState = !ready
    ? { status: "loading" }
    : !authenticated
      ? { status: "unauthenticated" }
      : !workspaceId
        ? { status: "no-workspace" }
        : fetched === null
          ? { status: "loading" }
          : fetched.status === "ready"
            ? { status: "ready", graph: fetched.graph, saving }
            : { status: "error", error: fetched.error };

  return { state, saveGraph, refresh };
}
