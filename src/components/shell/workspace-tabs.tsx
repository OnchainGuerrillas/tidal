"use client";

import { useRouter } from "next/navigation";
import { Plus, X } from "@phosphor-icons/react";

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
    closeWorkspace,
  } = useWorkspace();

  return (
    <div className="tidal-workspace-tabs">
      {workspaces.map((workspace) => {
        const isActive = workspace.id === activeWorkspace.id;

        return (
          <div
            key={workspace.id}
            className={cn(
              "tidal-workspace-tab group",
              isActive && "tidal-workspace-tab--active"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setActiveWorkspaceId(workspace.id);
                router.push(getWorkspaceHref(workspace.id));
              }}
              className="tidal-workspace-tab-label"
              title={workspace.name}
            >
              <span className="truncate">{workspace.name}</span>
            </button>
            {workspaces.length > 1 ? (
              <button
                type="button"
                aria-label={`Close ${workspace.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  const nextIds = workspaces
                    .filter((candidate) => candidate.id !== workspace.id)
                    .map((candidate) => candidate.id);
                  closeWorkspace(workspace.id);
                  if (isActive) {
                    const nextId = nextIds[0];
                    if (nextId) {
                      router.push(getWorkspaceHref(nextId));
                    }
                  }
                }}
                className="tidal-workspace-tab-close"
              >
                <X weight="bold" className="h-3 w-3" />
              </button>
            ) : null}
          </div>
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
