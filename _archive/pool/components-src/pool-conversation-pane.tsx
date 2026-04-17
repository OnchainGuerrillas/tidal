import { ChatMessage } from "@/components/tidal/chat-message";
import { PromotionSummaryPanel } from "@/components/tidal/promotion-summary-panel";
import { PromptComposer } from "@/components/tidal/prompt-composer";
import { SectionLabel } from "@/components/tidal/section-label";
import type { PoolThread } from "@/mock-data/pool/types";

type PoolConversationPaneProps = {
  activeThread: PoolThread;
};

export function PoolConversationPane({
  activeThread,
}: PoolConversationPaneProps) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-3 pt-5 pb-3 md:px-4">
      <div className="mb-6 max-w-4xl shrink-0">
        <h1 className="tidal-text-thread-title">{activeThread.title}</h1>
      </div>

      <div className="tidal-context-panel mb-6 shrink-0">
        <div className="mb-2">
          <SectionLabel>Active thread context</SectionLabel>
          <p className="mt-2 tidal-text-body">
            {activeThread.context?.title ?? "Pool-wide strategy"}
          </p>
        </div>
        <p className="tidal-text-message">
          {activeThread.context?.description ?? activeThread.preview}
        </p>
      </div>

      {activeThread.source ? (
        <div className="mb-6 shrink-0">
          <PromotionSummaryPanel
            summary={activeThread.summarySeed ?? activeThread.source.summary}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-6 flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-y-auto pr-1">
          <div className="flex w-[80%] self-center flex-col gap-4">
            {activeThread.messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "w-[70%] self-end"
                    : "w-[70%] self-start"
                }
              >
                <ChatMessage
                  role={message.role}
                >
                  {message.content}
                </ChatMessage>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3">
          <PromptComposer
            className="w-[90%] max-w-none"
            defaultMode="Pool"
          />
          <span className="tidal-note">
            Tidal will ask you to confirm before taking any Pool action
          </span>
        </div>
      </div>
    </section>
  );
}
