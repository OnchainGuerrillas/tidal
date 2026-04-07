"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { appModes, type AppMode } from "@/features/shell/types";

type ChatInputProps = {
  className?: string;
  inputClassName?: string;
  modeTriggerClassName?: string;
  sendButtonClassName?: string;
  mode?: AppMode;
  defaultMode?: AppMode;
  onModeChange?: (mode: AppMode) => void;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  modes?: readonly AppMode[];
  onSubmit?: () => void;
};

export function ChatInput({
  className,
  inputClassName,
  modeTriggerClassName,
  sendButtonClassName,
  mode,
  defaultMode = "Chat",
  onModeChange,
  value,
  defaultValue = "",
  onValueChange,
  placeholder = "Message Tidal",
  modes = appModes,
  onSubmit,
}: ChatInputProps) {
  const [uncontrolledMode, setUncontrolledMode] = useState<AppMode>(defaultMode);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const currentMode = mode ?? uncontrolledMode;
  const currentValue = value ?? uncontrolledValue;

  const handleModeChange = (nextMode: AppMode) => {
    if (mode === undefined) {
      setUncontrolledMode(nextMode);
    }
    onModeChange?.(nextMode);
  };

  const handleValueChange = (nextValue: string) => {
    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  return (
    <form
      className={cn(
        "flex w-1/2 items-center justify-between rounded-lg border border-tidal-border bg-tidal-card px-[10px] py-[9px] pl-3",
        className
      )}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Input
        value={currentValue}
        onChange={(event) => handleValueChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-auto border-0 bg-transparent p-0 text-[13px]/[16px] font-medium text-foreground placeholder:text-tidal-placeholder focus-visible:ring-0",
          inputClassName
        )}
      />
      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex w-[90px] cursor-pointer items-center justify-between gap-1.5 rounded-[4px] border border-tidal-accent/50 px-2 py-1.5 outline-none",
              modeTriggerClassName
            )}
          >
            <span className="text-[11px]/[14px] font-medium text-tidal-accent">
              {currentMode}
            </span>
            <svg
              width="8"
              height="5"
              viewBox="0 0 8 5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L4 4L7 1"
                stroke="#61B3CF"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            sideOffset={8}
            className="min-w-[120px] bg-tidal-card border border-tidal-border rounded-[4px]"
          >
            {modes.map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => handleModeChange(option)}
                className="text-[11px]/[14px] text-tidal-accent cursor-pointer"
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="submit"
          className={cn(
            "flex h-[30px] w-[30px] items-center justify-center rounded-md bg-tidal-accent",
            sendButtonClassName
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0F151F"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
