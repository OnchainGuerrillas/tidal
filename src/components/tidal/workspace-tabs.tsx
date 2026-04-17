"use client";

import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";
import { getWorkspaceHref } from "@/lib/routes/workspace";

export function WorkspaceTabs() {
  const router = useRouter();
  const {
    workspaces,
    workspace: activeWorkspace,
    setActiveWorkspaceId,
    createWorkspace,
  } = useWorkspace();

  return (
    <div className="tidal-workspace-tabs">
      {workspaces.map((workspace) => {
        const isActive = workspace.id === activeWorkspace.id;

        return (
          <button
            key={workspace.id}
            type="button"
            onClick={() => {
              setActiveWorkspaceId(workspace.id);
              router.push(getWorkspaceHref(workspace.id));
            }}
            title={workspace.name}
            className={cn(
              "tidal-workspace-tab",
              isActive && "tidal-workspace-tab--active"
            )}
          >
            <span className="truncate">{workspace.name}</span>
          </button>
        );
      })}
      <button
        type="button"
        aria-label="New workspace"
        onClick={() => {
          const next = createWorkspace();
          router.push(getWorkspaceHref(next.id));
        }}
        className="tidal-workspace-tab-add"
      >
        <Plus weight="bold" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
