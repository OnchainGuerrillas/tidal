"use client";

import { createContext, useContext } from "react";
import type { WorkspaceGraphNode } from "@/mock-data/workspace/types";

type WorkspaceBuilderContextValue = {
  isEditable: boolean;
  updateNodeData: (
    nodeId: string,
    updater: (data: WorkspaceGraphNode["data"]) => WorkspaceGraphNode["data"]
  ) => void;
};

const WorkspaceBuilderContext = createContext<WorkspaceBuilderContextValue | null>(
  null
);

export function WorkspaceBuilderContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: WorkspaceBuilderContextValue;
}) {
  return (
    <WorkspaceBuilderContext.Provider value={value}>
      {children}
    </WorkspaceBuilderContext.Provider>
  );
}

export function useWorkspaceBuilderContext() {
  return useContext(WorkspaceBuilderContext);
}
