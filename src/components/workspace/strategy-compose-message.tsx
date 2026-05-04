"use client";

import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth/solana";

import type { ComposeStrategyOutput } from "@/lib/ai/tools/compose-strategy";
import {
  executeGraph,
  type ExecutableEdge,
  type ExecutableNode,
  type GraphExecutionEvent,
} from "@/lib/workspace/graph-exec";
import { useAdapterNodeRunner } from "@/hooks/workspace/use-adapter-node-runner";
import { cn } from "@/lib/utils";
import { useChainStateSignal } from "@/providers/chain-state-signal-provider";

type StrategyComposeMessageProps = {
  output: ComposeStrategyOutput;
};

type RunState =
  | { kind: "idle" }
  | { kind: "running"; events: GraphExecutionEvent[] }
  | { kind: "done"; events: GraphExecutionEvent[] };

export function StrategyComposeMessage({
  output,
}: StrategyComposeMessageProps) {
  const { wallets } = useWallets();
  const runNode = useAdapterNodeRunner();
  const { bumpSignal } = useChainStateSignal();
  const [runState, setRunState] = useState<RunState>({ kind: "idle" });

  const hasWallet = wallets.length > 0;

  const onRun = useCallback(async () => {
    // AI-composed strategies are adapter-only today (no Splits in the
    // canonical templates). Wrap each into the discriminated-union
    // ExecutableNode shape so the runner can dispatch by `kind`.
    const executableNodes: ExecutableNode[] = output.executable.nodes.map(
      (n) => ({
        id: n.id,
        kind: "adapter" as const,
        catalogItemId: n.catalogItemId,
        widgets: n.widgets,
        sourceAmount:
          n.sourceAmount !== undefined ? BigInt(n.sourceAmount) : undefined,
      }),
    );
    const executableEdges: ExecutableEdge[] = output.executable.edges;

    setRunState({ kind: "running", events: [] });
    const events: GraphExecutionEvent[] = [];
    try {
      for await (const event of executeGraph({
        nodes: executableNodes,
        edges: executableEdges,
        runNode,
      })) {
        events.push(event);
        setRunState({ kind: "running", events: [...events] });
      }
    } finally {
      setRunState({ kind: "done", events: [...events] });
      // Trigger wallet balance + positions refetch in any subscribed
      // panels (Investments, wallet node) so the UI reflects whatever
      // landed on chain. Fires even on partial-success runs.
      bumpSignal();
    }
  }, [output, runNode, bumpSignal]);

  const isRunning = runState.kind === "running";
  const events =
    runState.kind === "idle" ? [] : runState.events;

  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-tidal-accent/40 bg-tidal-accent/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="tidal-text-eyebrow text-tidal-accent">
          Composed strategy
        </span>
        <span className="text-[11px] text-tidal-muted">{output.intent}</span>
      </div>
      <p className="tidal-text-message">{output.summary}</p>
      {output.warnings.length > 0 && (
        <ul className="list-inside list-disc text-[11px] text-amber-400">
          {output.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || !hasWallet}
          className={cn(
            "rounded-md border border-tidal-border bg-tidal-card px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-tidal-sidebar-active disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {isRunning
            ? "Running…"
            : runState.kind === "done"
              ? "Run again"
              : "Run graph"}
        </button>
        {!hasWallet && (
          <span className="text-[11px] text-tidal-muted">
            Connect a wallet to run
          </span>
        )}
        <span className="text-[11px] text-tidal-muted">
          {output.executable.nodes.length} node
          {output.executable.nodes.length === 1 ? "" : "s"}
        </span>
      </div>
      {events.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-tidal-border pt-2 text-[11px]">
          {events.map((event, i) => (
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
      return `→ ${event.nodeId}: starting`;
    case "node-succeeded":
      return `✓ ${event.nodeId}: ${event.result.txSignature ? shortSig(event.result.txSignature) : "computed"}`;
    case "node-failed":
      return `✗ ${event.nodeId}: ${event.error}`;
    case "node-skipped":
      return `○ ${event.nodeId}: skipped (${event.reason})`;
    case "graph-completed":
      return "✓ graph completed";
    case "graph-failed":
      return `✗ graph failed: ${event.reason}`;
    case "graph-cancelled":
      return "○ graph cancelled";
  }
}

function shortSig(sig: string): string {
  if (sig.length <= 16) return sig;
  return `${sig.slice(0, 8)}…${sig.slice(-6)}`;
}
