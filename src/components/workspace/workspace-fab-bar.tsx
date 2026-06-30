"use client";

import { MaterialIcon } from "@/components/tidal/material-icon";
import type { OverlayPanelId } from "@/providers/side-panel-provider";

type WorkspaceFabBarProps = {
  panelState: { nodes: boolean; chat: boolean };
  onTogglePanel: (panel: OverlayPanelId) => void;
};

export function WorkspaceFabBar({
  panelState,
  onTogglePanel,
}: WorkspaceFabBarProps) {
  return (
    <>
      {!panelState.nodes ? (
        <button
          type="button"
          aria-label="Open nodes panel"
          onClick={() => onTogglePanel("nodes")}
          className="tidal-workspace-fab tidal-workspace-fab--left"
        >
          <MaterialIcon name="account_tree" className="text-[28px]" />
        </button>
      ) : null}

      {!panelState.chat ? (
        <button
          type="button"
          aria-label="Open chat panel"
          onClick={() => onTogglePanel("chat")}
          className="tidal-workspace-fab tidal-workspace-fab--right"
        >
          <MaterialIcon name="chat_bubble" className="text-[28px]" />
        </button>
      ) : null}
    </>
  );
}
