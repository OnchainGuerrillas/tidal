"use client";

import { useMemo, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  type AppMode,
  type MentionTarget,
} from "@/mock-data/shell/types";

const promptComposerVariants = cva(
  "relative flex flex-col gap-2 border border-tidal-border bg-tidal-card",
  {
    variants: {
      surface: {
        default: "w-full rounded-lg pl-3 pr-2 py-2",
        pill: "w-full rounded-full pl-4 pr-2 py-2",
      },
    },
    defaultVariants: {
      surface: "default",
    },
  }
);

const promptComposerSendButtonVariants = cva(
  "flex h-8 w-8 items-center justify-center bg-tidal-accent",
  {
    variants: {
      surface: {
        default: "rounded-md",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      surface: "default",
    },
  }
);

export type PromptComposerSubmitPayload = {
  mentions: MentionTarget[];
  mode: AppMode;
  value: string;
};

export type PromptComposerProps = {
  className?: string;
  inputClassName?: string;
  sendButtonClassName?: string;
  mode?: AppMode;
  defaultMode?: AppMode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  mentionTargets?: MentionTarget[];
  showMentions?: boolean;
  onSubmit?: (payload: PromptComposerSubmitPayload) => void;
} & VariantProps<typeof promptComposerVariants>;

function getActiveMentionQuery(value: string) {
  const lastAtIndex = value.lastIndexOf("@");

  if (lastAtIndex < 0) {
    return null;
  }

  if (lastAtIndex > 0) {
    const characterBeforeAt = value[lastAtIndex - 1];

    if (!/\s/.test(characterBeforeAt)) {
      return null;
    }
  }

  const query = value.slice(lastAtIndex + 1);

  if (/\s/.test(query)) {
    return null;
  }

  return {
    query: query.toLowerCase(),
    startIndex: lastAtIndex,
  };
}

export function PromptComposer({
  className,
  inputClassName,
  sendButtonClassName,
  mode,
  defaultMode = "Chat",
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Message Tidal",
  mentionTargets = [],
  showMentions = false,
  onSubmit,
  surface,
}: PromptComposerProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [selectedMentions, setSelectedMentions] = useState<MentionTarget[]>([]);

  const currentMode = mode ?? defaultMode;
  const currentValue = value ?? uncontrolledValue;
  const activeMentionQuery = showMentions
    ? getActiveMentionQuery(currentValue)
    : null;
  const filteredMentionTargets = useMemo(() => {
    if (!activeMentionQuery) {
      return [];
    }

    const normalizedQuery = activeMentionQuery.query.trim();

    return mentionTargets
      .filter((target) => {
        if (normalizedQuery.length === 0) {
          return true;
        }

        return (
          target.title.toLowerCase().includes(normalizedQuery) ||
          target.subtitle?.toLowerCase().includes(normalizedQuery)
        );
      })
      .filter(
        (target) =>
          !selectedMentions.some((selectedMention) => selectedMention.id === target.id)
      )
      .slice(0, 6);
  }, [activeMentionQuery, mentionTargets, selectedMentions]);

  const handleValueChange = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  const handleMentionSelect = (target: MentionTarget) => {
    if (!activeMentionQuery) {
      return;
    }

    const nextValue = `${currentValue.slice(0, activeMentionQuery.startIndex)}@${target.title} `;

    setSelectedMentions((currentMentions) => [...currentMentions, target]);
    handleValueChange(nextValue);
  };

  const handleMentionRemove = (targetId: string) => {
    setSelectedMentions((currentMentions) =>
      currentMentions.filter((mention) => mention.id !== targetId)
    );
  };

  return (
    <form
      className={cn(promptComposerVariants({ surface }), className)}
      onSubmit={(event) => {
        event.preventDefault();

        const trimmedValue = currentValue.trim();

        if (trimmedValue.length === 0) {
          return;
        }

        onSubmit?.({
          mentions: selectedMentions,
          mode: currentMode,
          value: trimmedValue,
        });

        if (value === undefined) {
          setUncontrolledValue("");
        }

        setSelectedMentions([]);
      }}
    >
      {showMentions && selectedMentions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedMentions.map((mention) => (
            <button
              key={mention.id}
              type="button"
              onClick={() => handleMentionRemove(mention.id)}
              className="inline-flex items-center gap-1 rounded-full border border-tidal-border px-2 py-1 text-[11px] leading-none text-tidal-accent transition-colors hover:bg-tidal-sidebar-active"
            >
              <span>@{mention.title}</span>
              <span className="text-tidal-muted">×</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Input
          value={currentValue}
          onChange={(event) => handleValueChange(event.target.value)}
          placeholder={placeholder}
          className={cn(
            "tidal-text-body h-auto border-0 bg-transparent p-0 placeholder:text-tidal-placeholder focus-visible:ring-0 dark:bg-transparent",
            inputClassName
          )}
        />
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="submit"
            className={cn(
              promptComposerSendButtonVariants({ surface }),
              sendButtonClassName
            )}
          >
            <svg
              className="text-tidal-card"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {showMentions && activeMentionQuery ? (
        <div className="absolute inset-x-3 top-full z-20 mt-2 rounded-md border border-tidal-border bg-tidal-card shadow-lg shadow-black/30">
          {filteredMentionTargets.length > 0 ? (
            filteredMentionTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleMentionSelect(target)}
                className="flex w-full flex-col items-start gap-1 border-b border-tidal-border/60 px-3 py-2 text-left last:border-b-0 hover:bg-tidal-sidebar-active"
              >
                <span className="text-sm text-foreground">@{target.title}</span>
                <span className="text-[11px] leading-tight text-tidal-muted">
                  {target.subtitle ?? target.workspaceType}
                </span>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-[11px] text-tidal-muted">
              No matching Pool or Amplify context
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}
