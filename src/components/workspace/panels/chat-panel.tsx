"use client";

import { useState } from "react";
import { ChatCircle, Plus } from "@phosphor-icons/react";

import { ChatMessage } from "@/components/tidal/chat-message";
import { PromptComposer } from "@/components/tidal/prompt-composer";
import { PanelShell } from "@/components/workspace/panels/panel-shell";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";
import type { WorkspaceThread } from "@/mock-data/workspace/types";

type ChatPanelProps = {
  activeThread: WorkspaceThread;
  threads: WorkspaceThread[];
  onSelectThread: (threadId: string) => void;
  onClose: () => void;
};

export function ChatPanel({
  activeThread,
  threads,
  onSelectThread,
  onClose,
}: ChatPanelProps) {
  const { createBlankThread } = useWorkspace();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const orderedMessages = [...activeThread.messages].reverse();

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
          {orderedMessages.map((message) => (
            <ChatMessage key={message.id} role={message.role}>
              {message.content}
            </ChatMessage>
          ))}
        </div>

        <div className="mt-4 shrink-0">
          <PromptComposer className="w-full" />
        </div>
      </div>
    </PanelShell>
  );
}
