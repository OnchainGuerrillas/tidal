"use client";

import { ChatMessage } from "@/components/tidal/chat-message";
import { PromotionSummaryPanel } from "@/components/tidal/promotion-summary-panel";
import { PromptComposer } from "@/components/tidal/prompt-composer";
import { SectionLabel } from "@/components/tidal/section-label";
import type { AmplifyThread } from "@/mock-data/amplify/types";

type AmplifyChatProps = {
  activeThread: AmplifyThread;
};

export function AmplifyChat({
  activeThread,
}: AmplifyChatProps) {
  const orderedMessages = [...activeThread.messages].reverse();

  return (
    <div className="flex h-full flex-col px-3 pt-5 pb-1 md:px-4">
      <div className="mb-6 max-w-4xl shrink-0">
          <h1 className="tidal-text-thread-title">{activeThread.title}</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-6 flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-y-auto pr-1">
          <div className="space-y-2">
            <SectionLabel>Focused thread</SectionLabel>
            <p className="tidal-text-message">{activeThread.preview}</p>
          </div>

          {activeThread.source ? (
            <PromotionSummaryPanel
              summary={activeThread.summarySeed ?? activeThread.source.summary}
            />
          ) : null}

          {orderedMessages.map((message) => (
            <ChatMessage key={message.id} role={message.role}>
              {message.content}
            </ChatMessage>
          ))}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-3 pt-4 pb-1">
          <PromptComposer
            className="w-full"
            defaultMode="Amplify"
          />
        </div>
      </div>
    </div>
  );
}
