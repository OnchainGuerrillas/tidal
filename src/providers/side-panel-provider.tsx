"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const overlayPanelIds = ["nodes", "chat"] as const;

export type OverlayPanelId = (typeof overlayPanelIds)[number];

export type WorkspacePanelState = {
  nodes: boolean;
  chat: boolean;
};

type SidePanelContextValue = {
  getPanelState: (workspaceId: string) => WorkspacePanelState;
  togglePanel: (workspaceId: string, panel: OverlayPanelId) => void;
  setPanelOpen: (
    workspaceId: string,
    panel: OverlayPanelId,
    open: boolean
  ) => void;
  closePanel: (workspaceId: string, panel: OverlayPanelId) => void;
};

const DEFAULT_PANEL_STATE: WorkspacePanelState = {
  nodes: false,
  chat: false,
};

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function SidePanelProvider({ children }: { children: ReactNode }) {
  const [panelsByWorkspace, setPanelsByWorkspace] = useState<
    Record<string, WorkspacePanelState>
  >({});

  const getPanelState = useCallback(
    (workspaceId: string): WorkspacePanelState => {
      return panelsByWorkspace[workspaceId] ?? DEFAULT_PANEL_STATE;
    },
    [panelsByWorkspace]
  );

  const setPanelOpen = useCallback(
    (workspaceId: string, panel: OverlayPanelId, open: boolean) => {
      setPanelsByWorkspace((current) => ({
        ...current,
        [workspaceId]: {
          ...(current[workspaceId] ?? DEFAULT_PANEL_STATE),
          [panel]: open,
        },
      }));
    },
    []
  );

  const togglePanel = useCallback(
    (workspaceId: string, panel: OverlayPanelId) => {
      setPanelsByWorkspace((current) => {
        const active = current[workspaceId] ?? DEFAULT_PANEL_STATE;
        return {
          ...current,
          [workspaceId]: {
            ...active,
            [panel]: !active[panel],
          },
        };
      });
    },
    []
  );

  const closePanel = useCallback(
    (workspaceId: string, panel: OverlayPanelId) => {
      setPanelOpen(workspaceId, panel, false);
    },
    [setPanelOpen]
  );

  const value = useMemo<SidePanelContextValue>(
    () => ({
      getPanelState,
      togglePanel,
      setPanelOpen,
      closePanel,
    }),
    [closePanel, getPanelState, setPanelOpen, togglePanel]
  );

  return (
    <SidePanelContext.Provider value={value}>
      {children}
    </SidePanelContext.Provider>
  );
}

export function useSidePanel() {
  const context = useContext(SidePanelContext);

  if (!context) {
    throw new Error("useSidePanel must be used within SidePanelProvider.");
  }

  return context;
}
