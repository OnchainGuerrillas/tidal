"use client";

import { MaterialIcon } from "@/components/tidal/material-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ChatContextWorkspace = {
  id: string;
  name: string;
};

type ChatPromptComposerProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  contextWorkspace: ChatContextWorkspace | null;
  onContextWorkspaceChange: (workspace: ChatContextWorkspace | null) => void;
  workspaces: ChatContextWorkspace[];
};

export function ChatPromptComposer({
  value,
  onValueChange,
  onSubmit,
  placeholder = "Message Tidekeeper",
  disabled = false,
  contextWorkspace,
  onContextWorkspaceChange,
  workspaces,
}: ChatPromptComposerProps) {
  const hasContext = contextWorkspace !== null;

  return (
    <div className="tidal-chat-composer-stack">
      {hasContext ? (
        <div className="tidal-chat-context-bar">
          <span>
            Workspace context:{" "}
            <strong className="font-semibold">{contextWorkspace.name}</strong>
          </span>
          <button
            type="button"
            aria-label="Remove workspace context"
            onClick={() => onContextWorkspaceChange(null)}
            className="flex h-5 w-5 items-center justify-center rounded text-tidal-card/80 transition-colors hover:text-tidal-card"
          >
            <MaterialIcon name="close" className="text-sm" />
          </button>
        </div>
      ) : null}

      <form
        className={cn(
          "tidal-chat-composer",
          hasContext && "tidal-chat-composer--with-context"
        )}
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = value.trim();
          if (trimmed.length === 0 || disabled) return;
          onSubmit(trimmed);
        }}
      >
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          className="tidal-chat-composer-input"
        />
        <div className="flex shrink-0 items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={
                hasContext
                  ? "Change workspace context"
                  : "Attach workspace context"
              }
              className={cn(
                "tidal-chat-context-toggle",
                hasContext && "tidal-chat-context-toggle--active"
              )}
            >
              <MaterialIcon name="graph_2" className="text-[18px]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => onContextWorkspaceChange(workspace)}
                >
                  {workspace.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="submit"
            disabled={disabled || value.trim().length === 0}
            aria-label="Send message"
            className="tidal-chat-composer-send"
          >
            <MaterialIcon name="arrow_upward" className="text-[18px] font-semibold" />
          </button>
        </div>
      </form>
    </div>
  );
}
