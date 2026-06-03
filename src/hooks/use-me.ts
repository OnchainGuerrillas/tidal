"use client";

import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

import { useChainStateSignal } from "@/providers/chain-state-signal-provider";

export type LinkedAccount =
  | {
      kind: "wallet";
      address: string;
      chainType: string | null;
      walletClientType: string | null;
    }
  | { kind: "email"; email: string }
  | { kind: "oauth"; provider: string; email: string | null };

export type MeWorkspace = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
};

export type MeRun = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  status: "success" | "partial" | "failed";
  txSignatures: string[];
  startedAt: string;
  completedAt: string | null;
};

export type MeProfile = {
  user: {
    id: string;
    privyUserId: string;
    displayName: string | null;
    primaryWalletAddress: string | null;
    email: string | null;
    createdAt: string;
  };
  linkedAccounts: LinkedAccount[];
  workspaces: MeWorkspace[];
  recentRuns: MeRun[];
};

export type MeState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "ready"; profile: MeProfile }
  | { status: "error"; error: string };

type FetchedState =
  | { status: "ready"; profile: MeProfile }
  | { status: "error"; error: string }
  | null;

export function useMe() {
  const { ready, authenticated } = usePrivy();
  const { signal } = useChainStateSignal();
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
        const res = await fetch("/api/me", {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) {
            setFetched({
              status: "error",
              error: `Failed to load profile (${res.status})`,
            });
          }
          return;
        }
        const profile = (await res.json()) as MeProfile;
        if (!cancelled) setFetched({ status: "ready", profile });
      } catch (err) {
        if (!cancelled) {
          setFetched({
            status: "error",
            error: err instanceof Error ? err.message : "Failed to load profile",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, signal, refreshNonce]);

  const state: MeState = !ready
    ? { status: "loading" }
    : !authenticated
      ? { status: "unauthenticated" }
      : (fetched ?? { status: "loading" });

  const updateDisplayName = useCallback(
    async (displayName: string | null) => {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update display name (${res.status})`);
      }
      refresh();
    },
    [refresh],
  );

  return { state, refresh, updateDisplayName };
}
