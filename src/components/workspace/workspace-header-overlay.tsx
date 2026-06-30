"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProfileSheet } from "@/components/tidal/profile-sheet";
import { WhatsLiveDialog } from "@/components/tidal/whats-live-dialog";
import { WorkspaceDropdown } from "@/components/workspace/workspace-dropdown";
import { useTidalAuth } from "@/hooks/use-tidal-auth";
import { useTidalWallets } from "@/hooks/use-tidal-wallets";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/providers/workspace-provider";

export type WorkspaceCenterView = "workspace" | "investments";

type WorkspaceHeaderOverlayProps = {
  centerView: WorkspaceCenterView;
  onCenterViewChange: (view: WorkspaceCenterView) => void;
};

export function WorkspaceHeaderOverlay({
  centerView,
  onCenterViewChange,
}: WorkspaceHeaderOverlayProps) {
  const {
    workspaces,
    workspace: activeWorkspace,
    setActiveWorkspaceId,
    createWorkspace,
  } = useWorkspace();
  const { ready, authenticated, login } = useTidalAuth();
  const { wallets } = useTidalWallets();
  const [profileOpen, setProfileOpen] = useState(false);

  const wallet = wallets[0];
  const walletLabel = wallet
    ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
    : "Connect wallet";

  const handleWalletClick = () => {
    if (!ready) return;
    if (!authenticated) {
      void login();
      return;
    }
    setProfileOpen(true);
  };

  return (
    <>
      <header className="tidal-workspace-header-overlay pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-5 pt-5">
        <div className="pointer-events-auto flex items-start gap-3">
          <Link href="/" className="flex h-8 items-center" aria-label="Tidal home">
            <Image
              src="/SVG/tidal-single-logo.svg"
              alt="Tidal"
              width={92}
              height={28}
              className="h-7 w-auto"
              priority
            />
          </Link>

          <WorkspaceDropdown
            workspaces={workspaces}
            activeWorkspace={activeWorkspace}
            onSelectWorkspace={setActiveWorkspaceId}
            onCreateWorkspace={createWorkspace}
          />
        </div>

        <div className="tidal-view-toggle pointer-events-auto absolute left-1/2 -translate-x-1/2">
          <button
            type="button"
            className={cn(
              "tidal-view-toggle-segment tidal-view-toggle-segment--left",
              centerView === "workspace" && "tidal-view-toggle-segment--active"
            )}
            onClick={() => onCenterViewChange("workspace")}
          >
            Workspace
          </button>
          <button
            type="button"
            className={cn(
              "tidal-view-toggle-segment tidal-view-toggle-segment--right",
              centerView === "investments" && "tidal-view-toggle-segment--active"
            )}
            onClick={() => onCenterViewChange("investments")}
          >
            Investments
          </button>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <WhatsLiveDialog compact />
          <span className="tidal-workspace-header-chip">30/250 Credits</span>
          <button
            type="button"
            className="tidal-workspace-header-chip tidal-workspace-header-chip--interactive"
            onClick={handleWalletClick}
            aria-label={authenticated ? "Open wallet profile" : "Connect wallet"}
          >
            <span>{walletLabel}</span>
          </button>
        </div>
      </header>

      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
