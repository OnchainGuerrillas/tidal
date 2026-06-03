"use client";

import { useState, type ComponentType } from "react";
import {
  ChatCircle,
  Coins,
  SquaresFour,
  TreeStructure,
  User,
  type IconProps,
} from "@phosphor-icons/react";
import { usePrivy } from "@privy-io/react-auth";

import { ProfileSheet } from "@/components/tidal/profile-sheet";
import { useMe } from "@/hooks/use-me";
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
  { id: "templates", label: "Templates", icon: SquaresFour },
];

function deriveInitials(source: string | null | undefined): string {
  if (!source) return "··";
  const parts = source.trim().split(/[\s@]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AppSidebar() {
  const { workspace } = useWorkspace();
  const { getActivePanel, togglePanel } = useSidePanel();
  const { ready, authenticated, login } = usePrivy();
  const { state: meState } = useMe();
  const [profileOpen, setProfileOpen] = useState(false);
  const activePanel = getActivePanel(workspace.id);

  const initials =
    meState.status === "ready"
      ? deriveInitials(
          meState.profile.user.displayName ??
            meState.profile.user.email ??
            meState.profile.user.primaryWalletAddress,
        )
      : deriveInitials(shellUser.name);

  const handleProfileClick = () => {
    if (!ready) return;
    if (!authenticated) {
      void login();
      return;
    }
    setProfileOpen(true);
  };

  const profileLabel = authenticated ? "Open profile" : "Sign in";

  return (
    <>
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
          <button
            type="button"
            className="tidal-sidebar-rail-user"
            onClick={handleProfileClick}
            aria-label={profileLabel}
            title={profileLabel}
          >
            <div className="tidal-sidebar-rail-user-avatar">
              <span className="text-[11px] font-semibold text-background">
                {initials}
              </span>
            </div>
            <User weight="bold" className="h-4 w-4 text-tidal-muted" />
          </button>
        </div>
      </aside>
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
