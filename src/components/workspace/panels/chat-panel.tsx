"use client";

import { useEffect, useRef, useState } from "react";
import { ChatCircle, Plus } from "@phosphor-icons/react";
import { useChat } from "@ai-sdk/react";

import { ChatMessage } from "@/components/tidal/chat-message";
import { useTidalAuth } from "@/hooks/use-tidal-auth";
import { useTidalWallets } from "@/hooks/use-tidal-wallets";
import { PromptComposer } from "@/components/tidal/prompt-composer";
import { PanelShell } from "@/components/workspace/panels/panel-shell";
import { StrategyComposeMessage } from "@/components/workspace/strategy-compose-message";
import { isDesignMode } from "@/lib/app-mode";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";
import { placeMutationsRelativeTo } from "@/lib/workspace/mutations";
import type { WorkspaceThread } from "@/mock-data/workspace/types";
import { composeDesignModeChatPrompt } from "@/mock-data/design-mode/chat-compose";
import type { ComposeStrategyOutput } from "@/lib/workspace/compose-strategy-template";

type ChatPanelProps = {
  activeThread: WorkspaceThread;
  threads: WorkspaceThread[];
  onSelectThread: (threadId: string) => void;
  onClose: () => void;
};

type ToolPart = {
  type: string;
  state?: string;
  output?: unknown;
  errorText?: string;
  toolCallId?: string;
};

type ChatDisplayMessage = {
  id: string;
  role: "user" | "assistant";
  parts: Array<ToolPart | { type: "text"; text: string }>;
};

export function ChatPanel({
  activeThread,
  threads,
  onSelectThread,
  onClose,
}: ChatPanelProps) {
  const { createBlankThread, applyGraphMutations, workspace } = useWorkspace();
  const { ready, authenticated, login, logout } = useTidalAuth();
  const { wallets } = useTidalWallets();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [composerValue, setComposerValue] = useState("");
  const [designMessages, setDesignMessages] = useState<ChatDisplayMessage[]>([]);
  const { messages, sendMessage, status } = useChat();
  const appliedToolCallIds = useRef<Set<string>>(new Set());
  // Latest-ref pattern: keep a fresh handle on workspace.nodes inside the
  // mutation-apply effect without adding it to that effect's deps array.
  // We want positioning to use the latest graph state at the moment of
  // applying, but we don't want to re-run mutation application on every
  // drag/edit. A separate sync effect keeps the ref current.
  const workspaceNodesRef = useRef(workspace.nodes);
  useEffect(() => {
    workspaceNodesRef.current = workspace.nodes;
  }, [workspace.nodes]);

  const wallet = wallets[0];
  const walletShort = wallet
    ? `${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)}`
    : null;

  const displayMessages = isDesignMode
    ? designMessages
    : (messages as ChatDisplayMessage[]);

  const submitPrompt = (value: string) => {
    if (!authenticated) return;

    if (!isDesignMode) {
      sendMessage({ text: value });
      return;
    }

    const composed = composeDesignModeChatPrompt(value);
    const id = `design-chat-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    setDesignMessages((current) => [
      ...current,
      {
        id: `${id}-user`,
        role: "user",
        parts: [{ type: "text", text: value }],
      },
      {
        id: `${id}-assistant`,
        role: "assistant",
        parts: [
          { type: "text", text: composed.leadIn },
          {
            type: "tool-composeStrategy",
            state: "output-available",
            output: composed.output,
            toolCallId: `${id}-tool`,
          },
        ],
      },
    ]);
  };

  // Apply composed-strategy mutations to the active workspace exactly once
  // per tool call. Dedupe key falls back to messageId:partIndex when the
  // tool part doesn't expose a toolCallId — keeps the effect idempotent
  // across re-renders even if the AI SDK's part shape evolves.
  useEffect(() => {
    for (const message of displayMessages) {
      const parts = message.parts as ToolPart[];
      parts.forEach((part, partIndex) => {
        if (part.type !== "tool-composeStrategy") return;
        if (part.state !== "output-available") return;
        const dedupeKey = part.toolCallId ?? `${message.id}:${partIndex}`;
        if (appliedToolCallIds.current.has(dedupeKey)) return;
        const output = part.output as ComposeStrategyOutput | undefined;
        if (!output) return;
        const placedMutations = placeMutationsRelativeTo(
          workspaceNodesRef.current,
          output.mutations,
        );
        applyGraphMutations(placedMutations);
        appliedToolCallIds.current.add(dedupeKey);
      });
    }
  }, [displayMessages, applyGraphMutations]);

  const isBusy = !isDesignMode && (status === "submitted" || status === "streaming");

  const orderedMessages = [...displayMessages].reverse();

  const showEmptyState = displayMessages.length === 0;

  return (
    <PanelShell
      eyebrow="Chat"
      title={activeThread.title}
      description={activeThread.preview}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            aria-label={isHistoryOpen ? "Hide chat history" : "Show chat history"}
            onClick={() => setIsHistoryOpen((current) => !current)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent",
              isHistoryOpen && "bg-tidal-sidebar-active text-tidal-accent"
            )}
          >
            <ChatCircle weight="bold" className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="New chat"
            onClick={() => {
              createBlankThread();
              setIsHistoryOpen(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
          >
            <Plus weight="bold" className="h-4 w-4" />
          </button>
        </>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        {isHistoryOpen ? (
          <div className="mb-4 space-y-1 rounded-lg border border-tidal-border bg-background/20 p-2">
            {threads.map((thread) => {
              const isActive = thread.id === activeThread.id;
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    onSelectThread(thread.id);
                    setIsHistoryOpen(false);
                  }}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors",
                    isActive
                      ? "bg-tidal-sidebar-active text-tidal-accent"
                      : "text-foreground hover:bg-tidal-sidebar-active/60"
                  )}
                >
                  <span className="text-sm font-medium">{thread.title}</span>
                  <span className="text-[11px] text-tidal-muted">
                    {thread.lastViewedLabel}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col-reverse gap-4 overflow-y-auto pr-1">
          {showEmptyState ? (
            <ChatEmptyState
              disabled={!authenticated || isBusy}
              onPick={(prompt) => {
                if (!authenticated) return;
                submitPrompt(prompt);
              }}
            />
          ) : null}
          {orderedMessages.map((message) => (
            <div key={message.id} className="flex flex-col gap-2">
              {message.parts.map((part, partIndex) => {
                if (part.type === "text") {
                  return (
                    <ChatMessage
                      key={partIndex}
                      role={message.role === "user" ? "user" : "ai"}
                    >
                      {part.text}
                    </ChatMessage>
                  );
                }
                if (part.type === "tool-composeStrategy") {
                  const toolPart = part as ToolPart;
                  if (toolPart.state === "output-available" && toolPart.output) {
                    return (
                      <StrategyComposeMessage
                        key={partIndex}
                        output={toolPart.output as ComposeStrategyOutput}
                      />
                    );
                  }
                  if (toolPart.state === "output-error") {
                    return (
                      <ChatMessage key={partIndex} role="ai">
                        Strategy compose failed:{" "}
                        {toolPart.errorText ?? "unknown error"}
                      </ChatMessage>
                    );
                  }
                  return (
                    <ChatMessage key={partIndex} role="ai">
                      Composing strategy…
                    </ChatMessage>
                  );
                }
                return null;
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 flex shrink-0 flex-col gap-2">
          <p className="px-1 text-[11px] font-medium text-tidal-accent">
            Tell me what you want to do — I&rsquo;ll build the graph.
          </p>
          {ready && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-tidal-border bg-tidal-card px-3 py-1.5 text-[11px]">
              {authenticated && wallet ? (
                <>
                  <span className="text-tidal-muted">
                    Wallet:{" "}
                    <span className="font-mono text-foreground">
                      {walletShort}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-tidal-muted hover:text-tidal-accent"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <span className="text-tidal-muted">
                    Login to compose strategies and run on mainnet.
                  </span>
                  <button
                    type="button"
                    onClick={() => login()}
                    className="rounded bg-tidal-accent px-2 py-0.5 text-[11px] font-medium text-tidal-card hover:opacity-90"
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          )}
          <PromptComposer
            className="w-full"
            value={composerValue}
            onValueChange={setComposerValue}
            placeholder={
              !authenticated
                ? "Login to use the AI tidekeeper…"
                : isBusy
                  ? "Tidal is thinking…"
                  : "Ask Tidal to compose a strategy"
            }
            onSubmit={({ value }) => {
              if (!authenticated) return;
              submitPrompt(value);
              setComposerValue("");
            }}
          />
        </div>
      </div>
    </PanelShell>
  );
}

const STARTER_PROMPTS = [
  "Stake 0.05 SOL on Jito",
  "Lend 5 USDC on Kamino",
  "Swap 0.05 SOL to USDC and supply on Kamino",
] as const;

function ChatEmptyState({
  disabled,
  onPick,
}: {
  disabled: boolean;
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-tidal-border bg-tidal-card/40 p-4">
      <div className="flex flex-col gap-1">
        <span className="tidal-text-eyebrow text-tidal-accent">
          Tidekeeper
        </span>
        <p className="tidal-text-message text-foreground">
          I compose Solana DeFi strategies as runnable graphs on the canvas.
          Tell me what you want to do — staking, lending, swapping, or chained
          strategies — and I&rsquo;ll build the nodes for you to review and run.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-wide text-tidal-muted">
          Try one
        </span>
        <div className="flex flex-col gap-1.5">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              onClick={() => onPick(prompt)}
              className="rounded-md border border-tidal-border bg-background/40 px-3 py-2 text-left text-[12px] text-foreground transition-colors hover:border-tidal-accent/40 hover:bg-tidal-sidebar-active disabled:cursor-not-allowed disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-tidal-border/60 bg-background/30 px-3 py-2 text-[11px] leading-relaxed text-tidal-muted">
        <span className="text-foreground">Available adapters: </span>
        Jito (stake), Kamino (USDC supply), Jupiter Ultra (SOL ↔ USDC swap).
        I&rsquo;ll never sign or submit anything — you click Run.
      </div>
    </div>
  );
}
