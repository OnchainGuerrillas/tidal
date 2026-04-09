"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  getGlobalChatHref,
  getGlobalChatIdFromPathname,
  NEW_GLOBAL_CHAT_ID,
} from "@/lib/global-chat-routes";
import {
  amplifyWorkspaceSummaries,
  globalChats,
  mentionTargets,
  poolWorkspaceSummaries,
} from "@/mock-data/shell/mocks/hybrid-chat";
import type {
  AppMode,
  ChatLink,
  CreateWorkspaceActionCard,
  GlobalChat,
  GlobalChatMessage,
  MentionTarget,
  WorkspaceEntityType,
  WorkspaceSummary,
} from "@/mock-data/shell/types";

type SubmitGlobalChatMessageInput = {
  mentions: MentionTarget[];
  mode: AppMode;
  value: string;
};

type GlobalChatWorkspaceContextValue = {
  chats: GlobalChat[];
  activeChat: GlobalChat;
  recentChats: GlobalChat[];
  mentionTargets: MentionTarget[];
  setActiveChatId: (chatId: string) => void;
  submitMessage: (input: SubmitGlobalChatMessageInput) => void;
  completeWorkspaceActionCard: (chatId: string, cardId: string) => void;
};

const GlobalChatWorkspaceContext =
  createContext<GlobalChatWorkspaceContextValue | null>(null);

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') !== null
  );
}

function cloneChat(chat: GlobalChat): GlobalChat {
  return {
    ...chat,
    messages: chat.messages.map((message) => ({
      ...message,
      actionCard: message.actionCard ? { ...message.actionCard } : undefined,
    })),
    links: chat.links.map((link) => ({ ...link })),
  };
}

const poolIntentKeywords = [
  "pool",
  "portfolio",
  "allocate",
  "allocation",
  "rebalance",
  "stablecoin",
  "diversif",
  "deploy",
  "watchlist",
];

const amplifyIntentKeywords = [
  "amplify",
  "loop",
  "looping",
  "reloop",
  "reinvest",
  "reinvestment",
  "reinvesting",
  "compound",
  "compounding",
  "compounder",
  "strategy",
  "strategies",
  "strategy graph",
  "node",
  "graph",
  "borrow",
  "recursive",
  "borrow and reinvest",
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createSlug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  return normalized.length > 0 ? normalized : "new-chat";
}

function buildChatTitle(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 36) {
    return normalized;
  }

  return `${normalized.slice(0, 33).trimEnd()}...`;
}

function buildChatPreview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 88) {
    return normalized;
  }

  return `${normalized.slice(0, 85).trimEnd()}...`;
}

function buildChatLink(target: MentionTarget): ChatLink {
  return {
    id: createId(`link-${target.workspaceType}`),
    targetId: target.id,
    targetKind: target.kind,
    label: target.title,
    workspaceType: target.workspaceType,
    workspaceId: target.workspaceId,
    mode: "reference-only",
  };
}

function buildUserMessage(content: string): GlobalChatMessage {
  return {
    id: createId("message-user"),
    role: "user",
    content,
  };
}

function buildAssistantTextMessage(content: string): GlobalChatMessage {
  return {
    id: createId("message-ai"),
    role: "ai",
    content,
  };
}

function buildAssistantRecommendationMessage(
  actionCard: CreateWorkspaceActionCard
): GlobalChatMessage {
  return {
    id: createId("message-ai-card"),
    role: "ai",
    actionCard,
  };
}

function scoreIntent(value: string, keywords: string[]) {
  return keywords.reduce(
    (score, keyword) => score + Number(value.includes(keyword)),
    0
  );
}

function getIntentScores(value: string) {
  const poolScore = scoreIntent(value, poolIntentKeywords);
  let amplifyScore = scoreIntent(value, amplifyIntentKeywords);

  if (
    value.includes("design") &&
    (value.includes("loop") ||
      value.includes("reinvest") ||
      value.includes("compound") ||
      value.includes("strategy"))
  ) {
    amplifyScore += 2;
  }

  if (
    value.includes("sol") &&
    (value.includes("loop") ||
      value.includes("reloop") ||
      value.includes("reinvest") ||
      value.includes("compound"))
  ) {
    amplifyScore += 2;
  }

  return { poolScore, amplifyScore };
}

function getWorkspaceSummaries(workspaceType: WorkspaceEntityType) {
  return workspaceType === "pool"
    ? poolWorkspaceSummaries
    : amplifyWorkspaceSummaries;
}

function findContextWorkspaceSummary(
  workspaceType: WorkspaceEntityType,
  mentions: MentionTarget[],
  existingLinks: ChatLink[]
) {
  const summaries = getWorkspaceSummaries(workspaceType);
  const directMention = mentions.find(
    (mention) =>
      mention.workspaceType === workspaceType && mention.kind === workspaceType
  );
  const nestedMention = mentions.find(
    (mention) => mention.workspaceType === workspaceType
  );
  const directLink = existingLinks.find(
    (link) => link.workspaceType === workspaceType && link.targetKind === workspaceType
  );
  const nestedLink = existingLinks.find(
    (link) => link.workspaceType === workspaceType
  );
  const workspaceId =
    directMention?.workspaceId ??
    nestedMention?.workspaceId ??
    directLink?.workspaceId ??
    nestedLink?.workspaceId;

  if (!workspaceId) {
    return null;
  }

  return (
    summaries.find((summary) => summary.id === workspaceId) ?? null
  );
}

function buildCreatedWorkspaceTitle(
  workspaceType: WorkspaceEntityType,
  value: string
) {
  if (workspaceType === "pool") {
    if (value.includes("stablecoin")) {
      return "Stablecoin Yield Pool";
    }

    if (value.includes("sol")) {
      return "SOL Income Pool";
    }

    return "New Solana Pool";
  }

  if (value.includes("staking") || value.includes("compound")) {
    return "Staking Compounder";
  }

  if (value.includes("sol")) {
    return "SOL Loop Amplify";
  }

  return "New Amplify Strategy";
}

function buildWorkspaceActionCard(
  input: SubmitGlobalChatMessageInput,
  existingLinks: ChatLink[]
) {
  const normalizedValue = input.value.toLowerCase();
  const { poolScore, amplifyScore } = getIntentScores(normalizedValue);

  let workspaceType: WorkspaceEntityType | null = null;

  if (poolScore > amplifyScore && poolScore > 0) {
    workspaceType = "pool";
  } else if (amplifyScore > poolScore && amplifyScore > 0) {
    workspaceType = "amplify";
  }

  if (!workspaceType) {
    return null;
  }

  const contextSummary = findContextWorkspaceSummary(
    workspaceType,
    input.mentions,
    existingLinks
  );

  if (contextSummary) {
    return {
      id: createId(`action-card-${workspaceType}`),
      workspaceType,
      actionType: "open",
      title:
        workspaceType === "pool"
          ? "Open existing Pool context"
          : "Open existing Amplify context",
      description:
        workspaceType === "pool"
          ? `This prompt sounds like Pool work, and ${contextSummary.title} is already relevant context. Link it here so the chat stays broad without creating a dedicated Pool thread yet.`
          : `This prompt sounds like Amplify work, and ${contextSummary.title} is already relevant context. Link it here so the chat stays broad without creating a dedicated Amplify thread yet.`,
      primaryLabel: `Link ${contextSummary.title}`,
      status: "pending",
      targetWorkspaceId: contextSummary.id,
      targetWorkspaceTitle: contextSummary.title,
      completionLabel: `${contextSummary.title} linked`,
    } satisfies CreateWorkspaceActionCard;
  }

  const targetWorkspaceTitle = buildCreatedWorkspaceTitle(
    workspaceType,
    normalizedValue
  );

  return {
    id: createId(`action-card-${workspaceType}`),
    workspaceType,
    actionType: "create",
    title:
      workspaceType === "pool"
        ? "Create a new Pool"
        : "Create a new Amplify workspace",
    description:
      workspaceType === "pool"
        ? "This prompt is describing a diversified investment workflow. Create a Pool so Tidal can keep the research linked to a dedicated investment workspace when you want to go deeper."
        : "This prompt is describing a loop or reinvestment workflow. Create an Amplify workspace so Tidal can keep the strategy graph linked to this research when you want to deepen it.",
    primaryLabel: `Create ${targetWorkspaceTitle}`,
    status: "pending",
    targetWorkspaceId: `${workspaceType}-${createSlug(input.value)}`,
    targetWorkspaceTitle,
    completionLabel: `${targetWorkspaceTitle} linked`,
  } satisfies CreateWorkspaceActionCard;
}

function buildAssistantMessages(
  input: SubmitGlobalChatMessageInput,
  existingLinks: ChatLink[]
) {
  const labels = input.mentions.map((mention) => mention.title);
  const linkedLabel =
    labels.length > 0 ? ` using ${labels.join(", ")} as linked context` : "";
  const modeLabel = input.mode === "Chat" ? "this as a general chat" : input.mode;
  const actionCard = buildWorkspaceActionCard(input, existingLinks);

  if (actionCard) {
    const content =
      actionCard.workspaceType === "pool"
        ? `This is starting to sound more like Pool work than a broad market note. I can keep ${modeLabel.toLowerCase()}${linkedLabel}, or you can link a Pool now and keep the conversation moving without creating a dedicated thread yet.`
        : `This is starting to sound more like Amplify strategy design than a broad market note. I can keep ${modeLabel.toLowerCase()}${linkedLabel}, or you can link an Amplify workspace now and keep the conversation moving without creating a dedicated thread yet.`;

    return [
      buildAssistantTextMessage(content),
      buildAssistantRecommendationMessage(actionCard),
    ];
  }

  return [
    buildAssistantTextMessage(
      input.mentions.length > 0
        ? `I can keep ${modeLabel.toLowerCase()}${linkedLabel} while we compare options before turning anything into a dedicated Pool or Amplify thread.`
        : `I can keep this broad for now and help you explore Solana opportunities before we turn it into a dedicated Pool or Amplify workflow.`
    ),
  ];
}

function buildWorkspaceChatLink(
  actionCard: CreateWorkspaceActionCard,
  targetSummary?: WorkspaceSummary
) {
  return {
    id: createId(`link-${actionCard.workspaceType}`),
    targetId: actionCard.targetWorkspaceId,
    targetKind: actionCard.workspaceType,
    label: targetSummary?.title ?? actionCard.targetWorkspaceTitle,
    workspaceType: actionCard.workspaceType,
    workspaceId: actionCard.targetWorkspaceId,
    mode: "reference-only",
  } satisfies ChatLink;
}

export function GlobalChatWorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = useState<GlobalChat[]>(() => globalChats.map(cloneChat));
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);
  const routeChatId = getGlobalChatIdFromPathname(pathname);

  const setActiveChatIdSafe = useCallback(
    (chatId: string) => {
      if (chats.some((chat) => chat.id === chatId)) {
        setPendingChatId(null);
        router.push(getGlobalChatHref(chatId));
      }
    },
    [chats, router]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setPendingChatId(null);
      router.push(getGlobalChatHref(NEW_GLOBAL_CHAT_ID));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const completeWorkspaceActionCard = useCallback(
    (chatId: string, cardId: string) => {
      setChats((currentChats) => {
        const chat = currentChats.find((entry) => entry.id === chatId);

        if (!chat) {
          return currentChats;
        }

        const matchingMessage = chat.messages.find(
          (message) => message.actionCard?.id === cardId
        );
        const actionCard = matchingMessage?.actionCard;

        if (!actionCard) {
          return currentChats;
        }

        const resolvedCard: CreateWorkspaceActionCard = {
          ...actionCard,
          status: "completed",
        };
        const nextMessages = chat.messages.map((message) => {
          if (message.actionCard?.id !== cardId) {
            return message;
          }

          return {
            ...message,
            actionCard: resolvedCard,
          };
        });

        const linkAlreadyExists = chat.links.some(
          (link) =>
            link.targetKind === resolvedCard.workspaceType &&
            link.targetId === resolvedCard.targetWorkspaceId
        );
        const targetSummary = getWorkspaceSummaries(resolvedCard.workspaceType).find(
          (summary) => summary.id === resolvedCard.targetWorkspaceId
        );
        const nextLinks = linkAlreadyExists
          ? chat.links
          : [...chat.links, buildWorkspaceChatLink(resolvedCard, targetSummary)];
        const updatedChat: GlobalChat = {
          ...chat,
          lastViewedLabel: "Just now",
          messages: nextMessages,
          links: nextLinks,
        };
        const newChatSeed =
          currentChats.find((entry) => entry.id === NEW_GLOBAL_CHAT_ID) ??
          cloneChat(globalChats[0]);

        return [
          newChatSeed,
          updatedChat,
          ...currentChats.filter(
            (entry) =>
              entry.id !== NEW_GLOBAL_CHAT_ID && entry.id !== updatedChat.id
          ),
        ];
      });
    },
    []
  );

  const submitMessage = useCallback(
    (input: SubmitGlobalChatMessageInput) => {
      const trimmedValue = input.value.trim();

      if (trimmedValue.length === 0) {
        return;
      }

      const nextUserMessage = buildUserMessage(trimmedValue);
      const nextLinks = input.mentions.map(buildChatLink);
      const isNewChat = routeChatId === NEW_GLOBAL_CHAT_ID || !routeChatId;
      const nextChatIdBase = isNewChat
        ? `global-chat-${createSlug(trimmedValue)}`
        : routeChatId;
      const nextChatId =
        isNewChat && chats.some((chat) => chat.id === nextChatIdBase)
          ? `${nextChatIdBase}-${Date.now().toString().slice(-4)}`
          : nextChatIdBase;

      setChats((currentChats) => {
        const newChatSeed =
          currentChats.find((chat) => chat.id === NEW_GLOBAL_CHAT_ID) ??
          cloneChat(globalChats[0]);

        if (isNewChat) {
          const createdChat: GlobalChat = {
            id: nextChatId,
            title: buildChatTitle(trimmedValue),
            preview: buildChatPreview(trimmedValue),
            href: getGlobalChatHref(nextChatId),
            lastViewedLabel: "Just now",
            messages: [
              nextUserMessage,
              ...buildAssistantMessages(input, nextLinks),
            ],
            links: nextLinks,
          };

          return [
            newChatSeed,
            createdChat,
            ...currentChats.filter(
              (chat) =>
                chat.id !== NEW_GLOBAL_CHAT_ID && chat.id !== createdChat.id
            ),
          ];
        }

        const existingChat = currentChats.find((chat) => chat.id === nextChatId);

        if (!existingChat) {
          return currentChats;
        }

        const mergedLinks = [
          ...existingChat.links,
          ...nextLinks.filter(
            (nextLink) =>
              !existingChat.links.some(
                (existingLink) =>
                  existingLink.targetId === nextLink.targetId &&
                  existingLink.targetKind === nextLink.targetKind
              )
          ),
        ];

        const updatedChat: GlobalChat = {
          ...existingChat,
          preview: buildChatPreview(trimmedValue),
          lastViewedLabel: "Just now",
          messages: [
            ...existingChat.messages,
            nextUserMessage,
            ...buildAssistantMessages(input, mergedLinks),
          ],
          links: mergedLinks,
        };

        return [
          newChatSeed,
          updatedChat,
          ...currentChats.filter(
            (chat) =>
              chat.id !== NEW_GLOBAL_CHAT_ID && chat.id !== updatedChat.id
          ),
        ];
      });

      if (isNewChat) {
        setPendingChatId(nextChatId);
        router.push(getGlobalChatHref(nextChatId));
      }
    },
    [chats, routeChatId, router]
  );

  const resolvedChatId =
    routeChatId === NEW_GLOBAL_CHAT_ID && pendingChatId ? pendingChatId : routeChatId;
  const activeChat =
    chats.find((chat) => chat.id === resolvedChatId) ??
    chats.find((chat) => chat.id === NEW_GLOBAL_CHAT_ID) ??
    chats[0];
  const recentChats = chats.filter((chat) => chat.id !== activeChat.id);

  const value = useMemo(
    () => ({
      chats,
      activeChat,
      recentChats,
      mentionTargets,
      setActiveChatId: setActiveChatIdSafe,
      submitMessage,
      completeWorkspaceActionCard,
    }),
    [
      activeChat,
      chats,
      completeWorkspaceActionCard,
      recentChats,
      setActiveChatIdSafe,
      submitMessage,
    ]
  );

  return (
    <GlobalChatWorkspaceContext.Provider value={value}>
      {children}
    </GlobalChatWorkspaceContext.Provider>
  );
}

export function useGlobalChatWorkspace() {
  const context = useContext(GlobalChatWorkspaceContext);

  if (!context) {
    throw new Error(
      "useGlobalChatWorkspace must be used within GlobalChatWorkspaceProvider."
    );
  }

  return context;
}
