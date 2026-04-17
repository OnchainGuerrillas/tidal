"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const sidePanelIds = [
  "nodes",
  "investments",
  "discover",
  "chat",
  "templates",
] as const;

export type SidePanelId = (typeof sidePanelIds)[number];

export type SidePanelSelection = SidePanelId | null;

type SidePanelContextValue = {
  getActivePanel: (workspaceId: string) => SidePanelSelection;
  setActivePanel: (workspaceId: string, panel: SidePanelSelection) => void;
  togglePanel: (workspaceId: string, panel: SidePanelId) => void;
};

const DEFAULT_PANEL: SidePanelId = "chat";

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

export function SidePanelProvider({ children }: { children: ReactNode }) {
  const [panelsByWorkspace, setPanelsByWorkspace] = useState<
    Record<string, SidePanelSelection>
  >({});

  const getActivePanel = useCallback(
    (workspaceId: string): SidePanelSelection => {
      if (!(workspaceId in panelsByWorkspace)) {
        return DEFAULT_PANEL;
      }
      return panelsByWorkspace[workspaceId];
    },
    [panelsByWorkspace]
  );

  const setActivePanel = useCallback(
    (workspaceId: string, panel: SidePanelSelection) => {
      setPanelsByWorkspace((current) => ({
        ...current,
        [workspaceId]: panel,
      }));
    },
    []
  );

  const togglePanel = useCallback(
    (workspaceId: string, panel: SidePanelId) => {
      setPanelsByWorkspace((current) => {
        const active = workspaceId in current ? current[workspaceId] : DEFAULT_PANEL;
        return {
          ...current,
          [workspaceId]: active === panel ? null : panel,
        };
      });
    },
    []
  );

  const value = useMemo<SidePanelContextValue>(
    () => ({
      getActivePanel,
      setActivePanel,
      togglePanel,
    }),
    [getActivePanel, setActivePanel, togglePanel]
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
