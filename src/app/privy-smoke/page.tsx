"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useSignMessage,
  useWallets,
} from "@privy-io/react-auth/solana";
import { useChat } from "@ai-sdk/react";

import {
  executeGraph,
  type ExecutableEdge,
  type ExecutableNode,
  type GraphExecutionEvent,
} from "@/lib/workspace/graph-exec";
import { useAdapterNodeRunner } from "@/hooks/workspace/use-adapter-node-runner";
import { applyMutations } from "@/lib/workspace/mutations";
import type { ComposeStrategyOutput } from "@/lib/ai/tools/compose-strategy";

const JITO_CATALOG_ITEM_ID = "jito-sol-stake";
const STAKE_LAMPORTS = "10000000"; // 0.01 SOL

const KAMINO_CATALOG_ITEM_ID = "kamino-usdc-supply";
const SUPPLY_USDC_RAW = "1000000"; // 1 USDC (6 decimals)

const JUPITER_SWAP_CATALOG_ITEM_ID = "jupiter-swap-sol-usdc";
const SWAP_LAMPORTS = "10000000"; // 0.01 SOL

type AdapterRunState = {
  txSig: string | null;
  error: string | null;
  busy: boolean;
};

function initialRunState(): AdapterRunState {
  return { txSig: null, error: null, busy: false };
}

export default function PrivySmokePage() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();
  const runNode = useAdapterNodeRunner();

  const [signature, setSignature] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const [stakeState, setStakeState] = useState<AdapterRunState>(
    initialRunState,
  );
  const [supplyState, setSupplyState] = useState<AdapterRunState>(
    initialRunState,
  );
  const [swapState, setSwapState] = useState<AdapterRunState>(
    initialRunState,
  );
  const [graphLog, setGraphLog] = useState<GraphExecutionEvent[]>([]);
  const [graphBusy, setGraphBusy] = useState(false);

  const handleSign = async () => {
    setSignError(null);
    setSignature(null);
    const wallet = wallets[0];
    if (!wallet) {
      setSignError("No Solana wallet connected.");
      return;
    }
    try {
      const result = await signMessage({
        message: new TextEncoder().encode("tidal-smoke-test"),
        wallet,
      });
      const hex = Array.from(result.signature)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setSignature(hex);
    } catch (err) {
      setSignError(err instanceof Error ? err.message : String(err));
    }
  };

  const runPipeline = async () => {
    setGraphBusy(true);
    setGraphLog([]);
    const nodes: ExecutableNode[] = [
      {
        id: "swap",
        kind: "adapter",
        catalogItemId: JUPITER_SWAP_CATALOG_ITEM_ID,
        widgets: {},
        sourceAmount: BigInt(SWAP_LAMPORTS),
      },
      {
        id: "supply",
        kind: "adapter",
        catalogItemId: KAMINO_CATALOG_ITEM_ID,
        widgets: {},
      },
    ];
    const edges: ExecutableEdge[] = [{ source: "swap", target: "supply" }];
    try {
      for await (const event of executeGraph({
        nodes,
        edges,
        runNode,
      })) {
        setGraphLog((prev) => [...prev, event]);
      }
    } finally {
      setGraphBusy(false);
    }
  };

  const run = async (
    setState: typeof setStakeState,
    catalogItemId: string,
    inputAmount: string,
  ) => {
    setState({ txSig: null, error: null, busy: true });
    try {
      const result = await runNode({
        node: {
          id: `smoke-${catalogItemId}`,
          kind: "adapter",
          catalogItemId,
          widgets: {},
        },
        inputAmount: BigInt(inputAmount),
      });
      setState({ txSig: result.txSignature ?? null, error: null, busy: false });
    } catch (err) {
      setState({
        txSig: null,
        error: err instanceof Error ? err.message : String(err),
        busy: false,
      });
    }
  };

  if (!ready) {
    return <div className="p-8 font-mono text-sm">Loading Privy…</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-8 font-mono text-sm">
      <header className="flex items-baseline gap-4">
        <h1 className="text-xl">Privy Solana smoke test</h1>
        <span className="text-muted-foreground">
          (debug page — not linked from app nav)
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <div>
          <span className="opacity-60">authenticated:</span>{" "}
          <strong>{String(authenticated)}</strong>
        </div>
        {user && (
          <div>
            <span className="opacity-60">user id:</span> {user.id}
          </div>
        )}
        <div className="flex gap-2">
          {!authenticated ? (
            <button
              className="rounded border border-white/30 px-3 py-1 hover:bg-white/5"
              onClick={() => login()}
            >
              Login
            </button>
          ) : (
            <button
              className="rounded border border-white/30 px-3 py-1 hover:bg-white/5"
              onClick={() => logout()}
            >
              Logout
            </button>
          )}
        </div>
      </section>

      {authenticated && (
        <section className="flex flex-col gap-2">
          <h2 className="opacity-60">Solana wallets</h2>
          {wallets.length === 0 ? (
            <div className="opacity-60">No Solana wallets linked.</div>
          ) : (
            <ul className="flex flex-col gap-1">
              {wallets.map((w) => (
                <li key={w.address} className="flex gap-2">
                  <span className="opacity-60">
                    {w.standardWallet?.name ?? "wallet"}:
                  </span>
                  <span>{w.address}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {authenticated && wallets.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="opacity-60">Sign message test</h2>
          <button
            className="w-fit rounded border border-white/30 px-3 py-1 hover:bg-white/5"
            onClick={handleSign}
          >
            Sign &quot;tidal-smoke-test&quot; with first Solana wallet
          </button>
          {signature && (
            <div className="break-all text-emerald-400">
              signature (hex): {signature}
            </div>
          )}
          {signError && <div className="text-red-400">error: {signError}</div>}
        </section>
      )}

      {authenticated && wallets.length > 0 && (
        <AdapterRunSection
          title="Stake 0.01 SOL → JitoSOL via Jito stake pool (MAINNET)"
          buttonLabel="Stake 0.01 SOL with Jito"
          busyLabel="Staking…"
          state={stakeState}
          onRun={() => run(setStakeState, JITO_CATALOG_ITEM_ID, STAKE_LAMPORTS)}
        />
      )}

      {authenticated && wallets.length > 0 && (
        <AdapterRunSection
          title="Supply 1 USDC → Kamino main market (MAINNET)"
          buttonLabel="Supply 1 USDC to Kamino"
          busyLabel="Supplying…"
          state={supplyState}
          onRun={() =>
            run(setSupplyState, KAMINO_CATALOG_ITEM_ID, SUPPLY_USDC_RAW)
          }
        />
      )}

      {authenticated && wallets.length > 0 && (
        <AdapterRunSection
          title="Swap 0.01 SOL → USDC via Jupiter Ultra (MAINNET)"
          buttonLabel="Swap 0.01 SOL to USDC"
          busyLabel="Swapping…"
          state={swapState}
          onRun={() =>
            run(setSwapState, JUPITER_SWAP_CATALOG_ITEM_ID, SWAP_LAMPORTS)
          }
        />
      )}

      <ChatSection />

      {authenticated && wallets.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="opacity-60">
            Multi-node pipeline: Swap 0.01 SOL → USDC → Supply Kamino (MAINNET)
          </h2>
          <p className="opacity-60">
            Exercises the graph execution engine end-to-end. Topologically
            runs both nodes, chaining the swap&apos;s USDC output into the
            Kamino supply input. Confirms each tx before advancing.
          </p>
          <button
            disabled={graphBusy}
            className="w-fit rounded border border-white/30 px-3 py-1 hover:bg-white/5 disabled:opacity-50"
            onClick={runPipeline}
          >
            {graphBusy ? "Running pipeline…" : "Run 2-node pipeline"}
          </button>
          {graphLog.length > 0 && (
            <ul className="flex flex-col gap-1">
              {graphLog.map((event, i) => (
                <li key={i} className={eventColor(event)}>
                  {renderEvent(event)}
                </li>
              ))}
            </ul>
          )}
        </section>
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
      return "opacity-80";
  }
}

function renderEvent(event: GraphExecutionEvent): string {
  switch (event.kind) {
    case "graph-started":
      return "→ graph started";
    case "node-started":
      return `→ ${event.nodeId}: starting`;
    case "node-succeeded": {
      const sig = event.result.txSignature ?? "computed";
      const outputs = Array.from(event.result.outputs.entries())
        .map(([handle, amount]) => `${handle}=${amount.toString()}`)
        .join(", ");
      return `✓ ${event.nodeId}: ${sig} (${outputs})`;
    }
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

function ChatSection() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const busy = status === "submitted" || status === "streaming";

  return (
    <section className="flex flex-col gap-2">
      <h2 className="opacity-60">
        Chat with Tidal (AI SDK v6 + Claude Sonnet 4.6 + composeStrategy tool)
      </h2>
      <p className="opacity-60">
        Try: &quot;stake 0.01 SOL with Jito&quot;, &quot;lend 1 USDC on
        Kamino&quot;, or &quot;swap 0.01 SOL to USDC and lend it on
        Kamino&quot; to exercise the composeStrategy tool. The tool returns
        graph mutations + an executable plan; the canvas integration follows
        in the workspace chat panel.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <input
          className="flex-1 rounded border border-white/30 bg-transparent px-3 py-1 focus:outline-none focus:border-white/60"
          placeholder="Ask about Solana yield options…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || input.trim().length === 0}
          className="rounded border border-white/30 px-3 py-1 hover:bg-white/5 disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
      {messages.length > 0 && (
        <ul className="flex flex-col gap-2">
          {messages.map((m) => (
            <li key={m.id} className="flex flex-col gap-1">
              <span className="opacity-60">
                {m.role === "user" ? "you" : "tidal"}:
              </span>
              {m.parts.map((p, i) => {
                if (p.type === "text") {
                  return (
                    <div key={i} className="whitespace-pre-wrap">
                      {p.text}
                    </div>
                  );
                }
                if (p.type === "tool-composeStrategy") {
                  return (
                    <ComposeStrategyResult
                      key={i}
                      part={p as unknown as ComposeStrategyPart}
                    />
                  );
                }
                return null;
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type ComposeStrategyPart = {
  type: "tool-composeStrategy";
  state?: string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

function ComposeStrategyResult({ part }: { part: ComposeStrategyPart }) {
  const state = part.state ?? "input-streaming";

  if (state === "input-streaming" || state === "input-available") {
    return (
      <div className="rounded border border-white/20 bg-white/5 p-2 text-xs opacity-70">
        ⚙ composeStrategy: {state}
        {part.input ? (
          <pre className="mt-1 whitespace-pre-wrap break-all">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        ) : null}
      </div>
    );
  }

  if (state === "output-error") {
    return (
      <div className="rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
        composeStrategy error: {part.errorText ?? "unknown error"}
      </div>
    );
  }

  if (state !== "output-available") {
    return null;
  }

  const output = part.output as ComposeStrategyOutput;
  const applied = applyMutations(
    { nodes: [], edges: [] },
    output.mutations,
  );

  return (
    <div className="flex flex-col gap-2 rounded border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs">
      <div className="font-semibold text-cyan-300">
        ✓ composed strategy: {output.intent}
      </div>
      <div className="opacity-80">{output.summary}</div>
      {output.warnings.length > 0 && (
        <ul className="list-inside list-disc text-amber-300">
          {output.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      <details className="opacity-80">
        <summary className="cursor-pointer">
          {applied.state.nodes.length} node(s),{" "}
          {applied.state.edges.length} edge(s) — applied to empty graph
        </summary>
        <pre className="mt-2 whitespace-pre-wrap break-all opacity-80">
          {JSON.stringify(
            {
              nodes: applied.state.nodes.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.data.title,
              })),
              edges: applied.state.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
              })),
              warnings: applied.warnings,
            },
            null,
            2,
          )}
        </pre>
      </details>
      <details className="opacity-80">
        <summary className="cursor-pointer">
          executable plan ({output.executable.nodes.length} node(s),{" "}
          {output.executable.edges.length} edge(s))
        </summary>
        <pre className="mt-2 whitespace-pre-wrap break-all opacity-80">
          {JSON.stringify(output.executable, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function AdapterRunSection({
  title,
  buttonLabel,
  busyLabel,
  state,
  onRun,
}: {
  title: string;
  buttonLabel: string;
  busyLabel: string;
  state: AdapterRunState;
  onRun: () => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="opacity-60">{title}</h2>
      <button
        disabled={state.busy}
        className="w-fit rounded border border-white/30 px-3 py-1 hover:bg-white/5 disabled:opacity-50"
        onClick={onRun}
      >
        {state.busy ? busyLabel : buttonLabel}
      </button>
      {state.txSig && (
        <div className="flex flex-col gap-1 text-emerald-400">
          <div className="break-all">tx signature: {state.txSig}</div>
          <a
            className="underline hover:text-emerald-300"
            href={`https://solscan.io/tx/${state.txSig}`}
            target="_blank"
            rel="noreferrer"
          >
            view on solscan ↗
          </a>
        </div>
      )}
      {state.error && <div className="text-red-400">error: {state.error}</div>}
    </section>
  );
}
