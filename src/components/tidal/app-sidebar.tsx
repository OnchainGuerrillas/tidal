"use client";

import type { ComponentType } from "react";
import {
  ChatCircle,
  Compass,
  Coins,
  SquaresFour,
  TreeStructure,
  User,
  type IconProps,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { useSidePanel, type SidePanelId } from "@/providers/side-panel-provider";
import { useWorkspace } from "@/providers/workspace-provider";
import { shellUser } from "@/mock-data/shell/navigation";

type RailItem = {
  id: SidePanelId;
  label: string;
  icon: ComponentType<IconProps>;
};

const railItems: RailItem[] = [
  { id: "nodes", label: "Nodes", icon: TreeStructure },
  { id: "chat", label: "Chat", icon: ChatCircle },
  { id: "investments", label: "Investments", icon: Coins },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "templates", label: "Templates", icon: SquaresFour },
];

export function AppSidebar() {
  const { workspace } = useWorkspace();
  const { getActivePanel, togglePanel } = useSidePanel();
  const activePanel = getActivePanel(workspace.id);

  const initials = shellUser.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="tidal-sidebar-rail-shell">
      <nav className="tidal-sidebar-rail" aria-label="Workspace panels">
        {railItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "tidal-sidebar-rail-item",
                isActive && "tidal-sidebar-rail-item--active"
              )}
              aria-pressed={isActive}
              onClick={() => togglePanel(workspace.id, item.id)}
            >
              <Icon weight={isActive ? "fill" : "regular"} className="h-7 w-7" />
              <span className="tidal-sidebar-rail-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="tidal-sidebar-rail-footer">
        <div className="tidal-sidebar-rail-user" role="presentation">
          <div className="tidal-sidebar-rail-user-avatar">
            <span className="text-[11px] font-semibold text-background">
              {initials}
            </span>
          </div>
          <User weight="bold" className="h-4 w-4 text-tidal-muted" />
        </div>
      </div>
    </aside>
  );
}
