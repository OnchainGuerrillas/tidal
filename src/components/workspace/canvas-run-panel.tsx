"use client";

import { useCallback, useState } from "react";
import { useTidalWallets } from "@/hooks/use-tidal-wallets";
import { Play, X } from "@phosphor-icons/react";

import { useAdapterNodeRunner } from "@/hooks/workspace/use-adapter-node-runner";
import { useRecordRun, type RunStatus } from "@/hooks/use-record-run";
import { deriveExecutablePlan } from "@/lib/workspace/derive-executable-plan";
import {
  executeGraph,
  type GraphExecutionEvent,
} from "@/lib/workspace/graph-exec";
import { cn } from "@/lib/utils";
import { useChainStateSignal } from "@/providers/chain-state-signal-provider";
import { useRunStatus } from "@/providers/run-status-provider";
import { useWorkspace } from "@/providers/workspace-provider";

type RunState =
  | { kind: "idle" }
  | { kind: "errors"; errors: string[] }
  | { kind: "running"; events: GraphExecutionEvent[] }
  | { kind: "done"; events: GraphExecutionEvent[]; failed: boolean };

/**
 * Floating canvas-side Run controls. Distinct from the AI compose-then-
 * run path in `StrategyComposeMessage`: this one derives the executable
 * plan from the *current canvas state* (workspace.nodes/edges + each
 * adapter strategy node's widgetValues), so users running their own
 * hand-built graphs hit this button.
 */
export function CanvasRunPanel() {
  const { workspace, resolveDbWorkspaceId, resolveGraphVersion } = useWorkspace();
  const { wallets } = useTidalWallets();
  const runNode = useAdapterNodeRunner();
  const { bumpSignal } = useChainStateSignal();
  const { applyEvent } = useRunStatus();
  const { recordRun } = useRecordRun();
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const hasWallet = wallets.length > 0;

  // Surface a "queued tx count" on the Run button so users know how
  // many real transactions to expect before they click. Splits and
  // other compute-only nodes don't count — only adapter nodes produce
  // chain submissions. The plan derivation is cheap and idempotent so
  // we can recompute on every render without memoization.
  const planPreview = deriveExecutablePlan(workspace);
  const adapterTxCount = planPreview.nodes.filter(
    (n) => n.kind === "adapter",
  ).length;

  const onRun = useCallback(async () => {
    const plan = deriveExecutablePlan(workspace);
    if (plan.errors.length > 0) {
      setState({ kind: "errors", errors: plan.errors });
      return;
    }
    setState({ kind: "running", events: [] });
    const events: GraphExecutionEvent[] = [];
    let failed = false;
    const startedAt = new Date();
    try {
      for await (const event of executeGraph({
        nodes: plan.nodes,
        edges: plan.edges,
        runNode,
      })) {
        events.push(event);
        // Mirror to the per-node status provider so canvas nodes can
        // paint their borders by lifecycle state.
        applyEvent(event);
        if (
          event.kind === "node-failed" ||
          event.kind === "graph-failed" ||
          event.kind === "graph-cancelled"
        ) {
          failed = true;
        }
        setState({ kind: "running", events: [...events] });
      }
    } finally {
      setState({ kind: "done", events: [...events], failed });
      // Even when failed=true, some node-succeeded events may have
      // landed before failure (e.g., deposit succeeded, borrow failed).
      // Bumping the signal triggers wallet/positions refetch so the
      // UI catches up to whatever DID settle.
      bumpSignal();

      // Persist run history if this workspace is DB-backed (authed mode).
      // No-op silently otherwise — anonymous demo runs don't get recorded.
      const dbWorkspaceId = resolveDbWorkspaceId(workspace.id);
      const walletAddress = wallets[0]?.address;
      if (dbWorkspaceId && walletAddress) {
        const summary = summarizeRun(events, failed);
        void recordRun({
          workspaceId: dbWorkspaceId,
          graphVersion: resolveGraphVersion(workspace.id) ?? 0,
          walletAddress,
          status: summary.status,
          txSignatures: summary.txSignatures,
          events,
          failureNodeId: summary.failureNodeId,
          startedAt,
          completedAt: new Date(),
        });
      }
    }
  }, [
    workspace,
    runNode,
    bumpSignal,
    applyEvent,
    recordRun,
    resolveDbWorkspaceId,
    resolveGraphVersion,
    wallets,
  ]);

  const isRunning = state.kind === "running";

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onRun}
        disabled={isRunning || !hasWallet}
        title={!hasWallet ? "Connect a wallet to run" : "Run graph on mainnet"}
        className={cn(
          "flex items-center gap-2 rounded-md border border-tidal-border bg-tidal-card px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm transition-colors",
          "hover:bg-tidal-sidebar-active",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <Play weight="fill" className="h-3 w-3 text-tidal-accent" />
        {isRunning
          ? "Running…"
          : adapterTxCount > 0
            ? `Run graph (${adapterTxCount.toString()} tx${adapterTxCount === 1 ? "" : "s"})`
            : "Run graph"}
      </button>

      {state.kind !== "idle" && (
        <RunPanel state={state} onDismiss={() => setState({ kind: "idle" })} />
      )}
    </div>
  );
}

function RunPanel({
  state,
  onDismiss,
}: {
  state: Exclude<RunState, { kind: "idle" }>;
  onDismiss: () => void;
}) {
  return (
    <div className="w-[320px] rounded-lg border border-tidal-border bg-tidal-card p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="tidal-text-eyebrow">
          {state.kind === "errors"
            ? "Cannot run"
            : state.kind === "running"
              ? "Running on mainnet"
              : state.failed
                ? "Run finished with errors"
                : "Run completed"}
        </span>
        {state.kind !== "running" && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-tidal-muted hover:text-foreground"
          >
            <X weight="bold" className="h-3 w-3" />
          </button>
        )}
      </div>

      {state.kind === "errors" ? (
        <ul className="flex flex-col gap-1 text-[11px] text-amber-300">
          {state.errors.map((err, i) => (
            <li key={i}>• {err}</li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1 text-[11px]">
          {state.events.map((event, i) => (
            <li key={i} className={eventColor(event)}>
              {renderEvent(event)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function eventColor(event: GraphExecutionEvent): string {
  switch (event.kind) {
    case "node-succeeded":
    case "graph-completed":
      return "text-emerald-400";
    case "node-failed":
    case "graph-failed":
    case "graph-cancelled":
      return "text-red-400";
    case "node-skipped":
      return "text-amber-400";
    default:
      return "text-tidal-muted";
  }
}

function renderEvent(event: GraphExecutionEvent): string {
  switch (event.kind) {
    case "graph-started":
      return "→ graph started";
    case "node-started":
      return `→ ${shortNodeId(event.nodeId)}: starting`;
    case "node-succeeded":
      return `✓ ${shortNodeId(event.nodeId)}: ${event.result.txSignature ? shortSig(event.result.txSignature) : "computed"}`;
    case "node-failed":
      return `✗ ${shortNodeId(event.nodeId)}: ${event.error}`;
    case "node-skipped":
      return `○ ${shortNodeId(event.nodeId)}: skipped (${event.reason})`;
    case "graph-completed":
      return "✓ graph completed";
    case "graph-failed":
      return `✗ graph failed: ${event.reason}`;
    case "graph-cancelled":
      return "○ graph cancelled";
  }
}

function shortNodeId(id: string): string {
  if (id.length <= 24) return id;
  return `${id.slice(0, 16)}…${id.slice(-4)}`;
}

function shortSig(sig: string): string {
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}…${sig.slice(-6)}`;
}

/**
 * Reduce a stream of GraphExecutionEvents to a run_history-shaped summary:
 * collected tx signatures, the failing node id (if any), and the run status.
 * - "success": graph-completed terminal, no node-failed events.
 * - "partial": graph-failed / graph-cancelled terminal but at least one
 *    node-succeeded landed (e.g., deposit succeeded, borrow failed).
 * - "failed": graph-failed / graph-cancelled with no successful nodes,
 *    or graph-completed with node-failed events (defensive).
 */
function summarizeRun(
  events: GraphExecutionEvent[],
  failed: boolean,
): { status: RunStatus; txSignatures: string[]; failureNodeId: string | null } {
  const txSignatures: string[] = [];
  let failureNodeId: string | null = null;
  let succeededCount = 0;

  for (const event of events) {
    if (event.kind === "node-succeeded") {
      succeededCount += 1;
      if (event.result.txSignature) txSignatures.push(event.result.txSignature);
    } else if (event.kind === "node-failed" && !failureNodeId) {
      failureNodeId = event.nodeId;
    }
  }

  let status: RunStatus;
  if (!failed) {
    status = "success";
  } else if (succeededCount > 0) {
    status = "partial";
  } else {
    status = "failed";
  }

  return { status, txSignatures, failureNodeId };
}
