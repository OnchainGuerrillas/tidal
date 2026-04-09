"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { amplifyWorkspace } from "@/mock-data/amplify/mocks/workspace";
import type {
  AmplifyThread,
  AmplifyWorkspace,
} from "@/mock-data/amplify/types";

type PromoteGlobalChatToAmplifyThreadInput = {
  sourceChatId: string;
  sourceChatTitle: string;
  sourceChatPreview: string;
  latestUserMessage?: string;
  promotedFromLinkIds: string[];
  promotedLinkLabels: string[];
};

type AmplifyWorkspaceContextValue = {
  workspace: AmplifyWorkspace;
  activeThread: AmplifyThread;
  recentThreads: AmplifyThread[];
  setActiveThreadId: (threadId: string) => void;
  createBlankThread: () => void;
  getPromotedThreadBySourceChatId: (chatId: string) => AmplifyThread | null;
  promoteGlobalChatToThread: (
    input: PromoteGlobalChatToAmplifyThreadInput
  ) => AmplifyThread;
};

const AmplifyWorkspaceContext =
  createContext<AmplifyWorkspaceContextValue | null>(null);

function cloneThread(thread: AmplifyThread): AmplifyThread {
  return {
    ...thread,
    messages: thread.messages.map((message) => ({ ...message })),
    source: thread.source ? { ...thread.source } : undefined,
  };
}

function createThreadId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildPromotionSummary(input: PromoteGlobalChatToAmplifyThreadInput) {
  const linkedContext =
    input.promotedLinkLabels.length > 0
      ? input.promotedLinkLabels.join(", ")
      : "the current Amplify strategy context";
  const latestPrompt =
    input.latestUserMessage && input.latestUserMessage.trim().length > 0
      ? ` Latest user focus: "${input.latestUserMessage.trim()}".`
      : "";

  return `Promoted from the global chat "${input.sourceChatTitle}" so the conversation can continue as focused Amplify work around ${linkedContext}. ${input.sourceChatPreview}${latestPrompt}`;
}

export function AmplifyWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [threads, setThreads] = useState<AmplifyThread[]>(() =>
    amplifyWorkspace.threads.map(cloneThread)
  );
  const [activeThreadId, setActiveThreadIdState] = useState(
    amplifyWorkspace.activeThreadId
  );

  const setActiveThreadId = useCallback((threadId: string) => {
    setActiveThreadIdState(threadId);
  }, []);

  const createBlankThread = useCallback(() => {
    const nextIndex = threads.length + 1;
    const nextThread: AmplifyThread = {
      id: createThreadId("amplify-thread"),
      title: `New thread ${nextIndex}`,
      preview:
        "A fresh Amplify thread for refining a loop, adding a node, or stress-testing strategy changes.",
      lastViewedLabel: "Created just now",
      messages: [
        {
          id: createThreadId("amplify-thread-ai"),
          role: "ai",
          content:
            "New Amplify thread ready. We can adjust the loop, compare protocol paths, or model the impact of a new node here.",
        },
      ],
    };

    setThreads((currentThreads) => [...currentThreads, nextThread]);
    setActiveThreadIdState(nextThread.id);
  }, [threads.length]);

  const getPromotedThreadBySourceChatId = useCallback(
    (chatId: string) =>
      threads.find((thread) => thread.source?.sourceChatId === chatId) ?? null,
    [threads]
  );

  const promoteGlobalChatToThread = useCallback(
    (input: PromoteGlobalChatToAmplifyThreadInput) => {
      const existingThread = threads.find(
        (thread) => thread.source?.sourceChatId === input.sourceChatId
      );

      if (existingThread) {
        setActiveThreadIdState(existingThread.id);
        return existingThread;
      }

      const summarySeed = buildPromotionSummary(input);
      const nextThread: AmplifyThread = {
        id: createThreadId("amplify-thread-promoted"),
        title: input.sourceChatTitle,
        preview: "Promoted from global chat for focused Amplify strategy work.",
        lastViewedLabel: "Created just now",
        summarySeed,
        source: {
          sourceChatId: input.sourceChatId,
          summary: summarySeed,
          promotedFromLinkIds: input.promotedFromLinkIds,
        },
        messages: [
          {
            id: createThreadId("amplify-thread-promoted-ai"),
            role: "ai",
            content:
              "I’ve turned the relevant part of the general chat into a focused Amplify thread. We can refine this strategy here without carrying over the whole broad transcript.",
          },
        ],
      };

      setThreads((currentThreads) => [...currentThreads, nextThread]);
      setActiveThreadIdState(nextThread.id);

      return nextThread;
    },
    [threads]
  );

  const workspace = useMemo<AmplifyWorkspace>(
    () => ({
      ...amplifyWorkspace,
      threads,
      activeThreadId,
    }),
    [threads, activeThreadId]
  );

  const activeThread =
    threads.find((thread) => thread.id === activeThreadId) ?? threads[0];
  const recentThreads = threads.filter((thread) => thread.id !== activeThread.id);

  const value = useMemo(
    () => ({
      workspace,
      activeThread,
      recentThreads,
      setActiveThreadId,
      createBlankThread,
      getPromotedThreadBySourceChatId,
      promoteGlobalChatToThread,
    }),
    [
      workspace,
      activeThread,
      recentThreads,
      setActiveThreadId,
      createBlankThread,
      getPromotedThreadBySourceChatId,
      promoteGlobalChatToThread,
    ]
  );

  return (
    <AmplifyWorkspaceContext.Provider value={value}>
      {children}
    </AmplifyWorkspaceContext.Provider>
  );
}

export function useAmplifyWorkspace() {
  const context = useContext(AmplifyWorkspaceContext);

  if (!context) {
    throw new Error(
      "useAmplifyWorkspace must be used within AmplifyWorkspaceProvider."
    );
  }

  return context;
}
