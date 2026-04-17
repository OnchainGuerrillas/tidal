"use client";

import { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
  value: string;
};

export type PromptComposerProps = {
  className?: string;
  inputClassName?: string;
  sendButtonClassName?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  onSubmit?: (payload: PromptComposerSubmitPayload) => void;
} & VariantProps<typeof promptComposerVariants>;

export function PromptComposer({
  className,
  inputClassName,
  sendButtonClassName,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Message Tidal",
  onSubmit,
  surface,
}: PromptComposerProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const currentValue = value ?? uncontrolledValue;

  const handleValueChange = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
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

        onSubmit?.({ value: trimmedValue });

        if (value === undefined) {
          setUncontrolledValue("");
        }
      }}
    >
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
    </form>
  );
}
