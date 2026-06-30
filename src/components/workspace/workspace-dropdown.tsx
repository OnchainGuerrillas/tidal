"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";

import { MaterialIcon } from "@/components/tidal/material-icon";
import { cn } from "@/lib/utils";
import { getWorkspaceHref } from "@/lib/routes/workspace";
import type { Workspace } from "@/mock-data/workspace/types";

type WorkspaceDropdownProps = {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => Workspace;
};

export function WorkspaceDropdown({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
}: WorkspaceDropdownProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const otherWorkspaces = workspaces.filter(
    (workspace) => workspace.id !== activeWorkspace.id,
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const navigateToWorkspace = (workspaceId: string) => {
    onSelectWorkspace(workspaceId);
    router.push(getWorkspaceHref(workspaceId));
    setOpen(false);
  };

  const handleCreateWorkspace = () => {
    const next = onCreateWorkspace();
    router.push(getWorkspaceHref(next.id));
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="tidal-workspace-dropdown">
      <button
        type="button"
        className={cn(
          "tidal-workspace-strategy-trigger",
          open && "tidal-workspace-strategy-trigger--open",
        )}
        aria-label="Switch workspace"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{activeWorkspace.name}</span>
        <MaterialIcon name="keyboard_arrow_down" className="text-sm" />
      </button>

      {open ? (
        <div
          className="tidal-workspace-dropdown-menu"
          role="listbox"
          aria-label="Workspaces"
        >
          {otherWorkspaces.map((workspace) => (
            <button
              key={workspace.id}
              type="button"
              role="option"
              aria-selected={false}
              className="tidal-workspace-dropdown-row tidal-workspace-dropdown-row--item"
              onClick={() => navigateToWorkspace(workspace.id)}
            >
              <span className="truncate">{workspace.name}</span>
              <MaterialIcon name="chevron_right" className="text-sm opacity-60" />
            </button>
          ))}

          <button
            type="button"
            className="tidal-workspace-dropdown-row tidal-workspace-dropdown-row--new tidal-workspace-dropdown-row--bottom"
            onClick={handleCreateWorkspace}
          >
            <Plus
              weight="bold"
              className="h-2.5 w-2.5 shrink-0 text-tidal-placeholder"
            />
            <span>New workspace</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
