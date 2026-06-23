"use client";

import { useCallback } from "react";

import { getTidalAccessToken } from "@/hooks/get-tidal-access-token";
import { useTidalAuth } from "@/hooks/use-tidal-auth";

export type RunStatus = "success" | "partial" | "failed";

export type RecordRunInput = {
  workspaceId: string;
  graphVersion: number;
  walletAddress: string;
  status: RunStatus;
  txSignatures?: string[];
  events?: unknown[];
  failureNodeId?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
};

/**
 * Imperative hook for persisting a graph-execution run to the DB. Returns
 * a stable recordRun(input) function that no-ops gracefully when the user
 * isn't authenticated — call sites can fire it unconditionally from a
 * graph-execution finally block.
 */
export function useRecordRun() {
  const { authenticated } = useTidalAuth();

  const recordRun = useCallback(
    async (input: RecordRunInput): Promise<void> => {
      if (!authenticated) return;

      try {
        const token = await getTidalAccessToken();
        if (!token) return;
        const res = await fetch("/api/runs", {
          method: "POST",
          headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            workspaceId: input.workspaceId,
            graphVersion: input.graphVersion,
            walletAddress: input.walletAddress,
            status: input.status,
            txSignatures: input.txSignatures ?? [],
            events: input.events ?? [],
            failureNodeId: input.failureNodeId ?? null,
            startedAt: input.startedAt.toISOString(),
            completedAt: input.completedAt ? input.completedAt.toISOString() : null,
          }),
        });
        if (!res.ok) {
          console.error(`[useRecordRun] /api/runs returned ${res.status}`);
        }
      } catch (err) {
        console.error("[useRecordRun] failed:", err);
      }
    },
    [authenticated],
  );

  return { recordRun };
}
