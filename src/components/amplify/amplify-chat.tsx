"use client";

import { ChatInput } from "@/components/chat-input";
import type { AmplifyChatMessage } from "@/features/amplify/types";
import type { AppMode } from "@/features/shell/types";

type AmplifyChatProps = {
  messages: AmplifyChatMessage[];
  suggestions: string[];
  mode?: AppMode;
  defaultMode?: AppMode;
  onModeChange?: (mode: AppMode) => void;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
  onSubmit?: () => void;
};

export function AmplifyChat({
  messages,
  suggestions,
  mode,
  defaultMode = "Amplify",
  onModeChange,
  inputValue,
  onInputValueChange,
  onSubmit,
}: AmplifyChatProps) {
  const aiMessages = messages.filter((message) => message.role === "ai");
  const userMessages = messages.filter((message) => message.role === "user");

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-[27px] px-[43px] pb-5">
        <div className="flex flex-col gap-2">
          {aiMessages.map((message, index) => (
            <p key={`${message.role}-${index}`} className="text-[13px]/[20px] text-tidal-muted">
              {message.content}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[11px]/[14px] text-tidal-muted">
            Suggestions
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion}
                className="cursor-pointer rounded-[4px] border border-tidal-accent/50 bg-tidal-card px-3 py-1.5 text-[11px]/[14px] font-medium text-tidal-accent"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>

        {userMessages.map((message, index) => (
          <div key={`${message.role}-${index}`} className="flex justify-end">
            <div className="rounded-[10px] border border-tidal-border bg-tidal-card p-5">
              <p className="text-[13px]/[20px] font-medium text-tidal-muted">
                {message.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-3 px-[43px] pt-5">
        <ChatInput
          className="w-full rounded-full px-[17px]"
          mode={mode}
          defaultMode={defaultMode}
          onModeChange={onModeChange}
          value={inputValue}
          onValueChange={onInputValueChange}
          onSubmit={onSubmit}
          sendButtonClassName="rounded-full"
        />

        <span className="text-center text-[11px]/[14px] font-medium text-tidal-placeholder">
          Tidal will ask for approval before executing any transactions
        </span>
      </div>
    </div>
  );
}
