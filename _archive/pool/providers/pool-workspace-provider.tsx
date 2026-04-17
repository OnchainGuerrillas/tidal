"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { usePreferenceProfile } from "@/providers/preference-profile-provider";
import { poolWorkspace } from "@/mock-data/pool/workspace";
import type {
  PoolPanelTab,
  PendingPoolAction,
  PoolThread,
  PoolThreadContext,
  PoolWorkspace,
} from "@/mock-data/pool/types";

type PoolThreadSeed = {
  title: string;
  preview: string;
  context: PoolThreadContext;
  initialUserMessage: string;
};

type PromoteGlobalChatToPoolThreadInput = {
  sourceChatId: string;
  sourceChatTitle: string;
  sourceChatPreview: string;
  latestUserMessage?: string;
  promotedFromLinkIds: string[];
  promotedLinkLabels: string[];
};

type PoolWorkspaceContextValue = {
  workspace: PoolWorkspace;
  isOverviewActive: boolean;
  activePanelTab: PoolPanelTab;
  panelFeedback: string | null;
  activeThread: PoolThread;
  recentThreads: PoolThread[];
  showOverview: () => void;
  setActivePanelTab: (tab: PoolPanelTab) => void;
  queuePendingAction: (action: PendingPoolAction) => void;
  setActiveThreadId: (threadId: string) => void;
  createBlankThread: () => void;
  createFocusedThread: (seed: PoolThreadSeed) => void;
  getPromotedThreadBySourceChatId: (chatId: string) => PoolThread | null;
  promoteGlobalChatToThread: (
    input: PromoteGlobalChatToPoolThreadInput
  ) => PoolThread;
};

const PoolWorkspaceContext = createContext<PoolWorkspaceContextValue | null>(null);

function cloneThread(thread: PoolThread): PoolThread {
  return {
    ...thread,
    messages: thread.messages.map((message) => ({ ...message })),
    context: thread.context ? { ...thread.context } : undefined,
    source: thread.source ? { ...thread.source } : undefined,
  };
}

function createThreadId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildPromotionSummary(input: PromoteGlobalChatToPoolThreadInput) {
  const linkedContext =
    input.promotedLinkLabels.length > 0
      ? input.promotedLinkLabels.join(", ")
      : "the current Pool context";
  const latestPrompt =
    input.latestUserMessage && input.latestUserMessage.trim().length > 0
      ? ` Latest user focus: "${input.latestUserMessage.trim()}".`
      : "";

  return `Promoted from the global chat "${input.sourceChatTitle}" so the conversation can continue as focused Pool work around ${linkedContext}. ${input.sourceChatPreview}${latestPrompt}`;
}

export function PoolWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = usePreferenceProfile();
  const [threads, setThreads] = useState<PoolThread[]>(() =>
    poolWorkspace.threads.map(cloneThread)
  );
  const [pendingActions, setPendingActions] = useState<PendingPoolAction[]>(() =>
    poolWorkspace.pendingActions.map((action) => ({ ...action }))
  );
  const [activeThreadId, setActiveThreadIdState] = useState(
    poolWorkspace.activeThreadId
  );
  const [activePanelTab, setActivePanelTab] = useState<PoolPanelTab>(
    poolWorkspace.defaultPanelTab
  );
  const [panelFeedback, setPanelFeedback] = useState<string | null>(null);
  const [isOverviewActive, setIsOverviewActive] = useState(true);

  const showOverview = useCallback(() => {
    setIsOverviewActive(true);
  }, []);

  const setActiveThreadId = useCallback((threadId: string) => {
    setActiveThreadIdState(threadId);
    setIsOverviewActive(false);
  }, []);

  const queuePendingAction = useCallback((action: PendingPoolAction) => {
    setPendingActions((currentActions) => {
      const existingAction = currentActions.find(
        (currentAction) =>
          currentAction.sourceType === action.sourceType &&
          currentAction.sourceId === action.sourceId
      );

      if (existingAction) {
        setPanelFeedback(`Pending action already queued: ${existingAction.title}`);
        return currentActions;
      }

      setPanelFeedback(`Pending action added: ${action.title}`);
      return [action, ...currentActions];
    });
  }, []);

  const createBlankThread = useCallback(() => {
    const nextIndex = threads.length + 1;
    const nextThread: PoolThread = {
      id: `pool-thread-${nextIndex}`,
      title: `New chat ${nextIndex}`,
      preview: "A fresh Pool chat for researching a new idea or testing a strategy change.",
      lastViewedLabel: "Created just now",
      context: {
        type: "pool",
        entityId: poolWorkspace.id,
        title: "Pool-wide strategy",
        description: "A blank thread for broader portfolio research or a new idea.",
      },
      messages: [
        {
          id: `pool-thread-${nextIndex}-ai-1`,
          role: "ai",
          content:
            "New Pool thread ready. We can review a protocol, compare positions, or test a fresh allocation idea here.",
        },
      ],
    };

    setThreads((currentThreads) => [...currentThreads, nextThread]);
    setActiveThreadIdState(nextThread.id);
    setIsOverviewActive(false);
  }, [threads.length]);

  const createFocusedThread = useCallback((seed: PoolThreadSeed) => {
    const existingThread = threads.find(
      (thread) =>
        thread.context?.type === seed.context.type &&
        thread.context.entityId === seed.context.entityId
    );

    if (existingThread) {
      setActiveThreadIdState(existingThread.id);
      setIsOverviewActive(false);
      return;
    }

    const nextIndex = threads.length + 1;
    const nextThread: PoolThread = {
      id: `pool-thread-${nextIndex}`,
      title: seed.title,
      preview: seed.preview,
      lastViewedLabel: "Created just now",
      context: seed.context,
      messages: [
        {
          id: `pool-thread-${nextIndex}-ai-1`,
          role: "ai",
          content:
            "Focused research thread created. I can use this context to compare risk, yield, and fit within the wider Pool.",
        },
        {
          id: `pool-thread-${nextIndex}-user-1`,
          role: "user",
          content: seed.initialUserMessage,
        },
      ],
    };

    setThreads((currentThreads) => [...currentThreads, nextThread]);
    setActiveThreadIdState(nextThread.id);
    setIsOverviewActive(false);
  }, [threads]);

  const getPromotedThreadBySourceChatId = useCallback(
    (chatId: string) =>
      threads.find((thread) => thread.source?.sourceChatId === chatId) ?? null,
    [threads]
  );

  const promoteGlobalChatToThread = useCallback(
    (input: PromoteGlobalChatToPoolThreadInput) => {
      const existingThread = threads.find(
        (thread) => thread.source?.sourceChatId === input.sourceChatId
      );

      if (existingThread) {
        setActiveThreadIdState(existingThread.id);
        setIsOverviewActive(false);
        return existingThread;
      }

      const summarySeed = buildPromotionSummary(input);
      const nextThread: PoolThread = {
        id: createThreadId("pool-thread-promoted"),
        title: input.sourceChatTitle,
        preview: `Promoted from global chat for focused Pool research.`,
        lastViewedLabel: "Created just now",
        context: {
          type: "pool",
          entityId: poolWorkspace.id,
          title: poolWorkspace.name,
          description:
            "Focused Pool thread created from a broader general chat. This thread now belongs to the Pool workspace only.",
        },
        summarySeed,
        source: {
          sourceChatId: input.sourceChatId,
          summary: summarySeed,
          promotedFromLinkIds: input.promotedFromLinkIds,
        },
        messages: [
          {
            id: createThreadId("pool-thread-promoted-ai"),
            role: "ai",
            content:
              "I’ve turned the relevant part of the global chat into a focused Pool thread. We can continue with Pool-specific research and actions here without carrying over the full general transcript.",
          },
        ],
      };

      setThreads((currentThreads) => [...currentThreads, nextThread]);
      setActiveThreadIdState(nextThread.id);
      setIsOverviewActive(false);

      return nextThread;
    },
    [threads]
  );

  const workspace = useMemo<PoolWorkspace>(
    () => ({
      ...poolWorkspace,
      threads,
      riskOptions: profile.riskOptions,
      interestOptions: profile.interestOptions,
      pendingActions,
      activeThreadId,
    }),
    [threads, profile.interestOptions, profile.riskOptions, pendingActions, activeThreadId]
  );

  const activeThread =
    threads.find((thread) => thread.id === activeThreadId) ?? threads[0];

  const recentThreads = threads.filter((thread) => thread.id !== activeThread.id);

  const value = useMemo(
    () => ({
      workspace,
      isOverviewActive,
      activePanelTab,
      panelFeedback,
      activeThread,
      recentThreads,
      showOverview,
      setActivePanelTab,
      queuePendingAction,
      setActiveThreadId,
      createBlankThread,
      createFocusedThread,
      getPromotedThreadBySourceChatId,
      promoteGlobalChatToThread,
    }),
    [
      workspace,
      isOverviewActive,
      activePanelTab,
      panelFeedback,
      activeThread,
      recentThreads,
      showOverview,
      setActivePanelTab,
      queuePendingAction,
      setActiveThreadId,
      createBlankThread,
      createFocusedThread,
      getPromotedThreadBySourceChatId,
      promoteGlobalChatToThread,
    ]
  );

  return (
    <PoolWorkspaceContext.Provider value={value}>
      {children}
    </PoolWorkspaceContext.Provider>
  );
}

export function usePoolWorkspace() {
  const context = useContext(PoolWorkspaceContext);

  if (!context) {
    throw new Error("usePoolWorkspace must be used within PoolWorkspaceProvider.");
  }

  return context;
}
