"use client";

import { createContext, useContext } from "react";
import type { AmplifyGraphNode } from "@/mock-data/amplify/types";

type AmplifyBuilderContextValue = {
  isEditable: boolean;
  updateNodeData: (
    nodeId: string,
    updater: (data: AmplifyGraphNode["data"]) => AmplifyGraphNode["data"]
  ) => void;
};

const AmplifyBuilderContext = createContext<AmplifyBuilderContextValue | null>(
  null
);

export function AmplifyBuilderContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AmplifyBuilderContextValue;
}) {
  return (
    <AmplifyBuilderContext.Provider value={value}>
      {children}
    </AmplifyBuilderContext.Provider>
  );
}

export function useAmplifyBuilderContext() {
  return useContext(AmplifyBuilderContext);
}
