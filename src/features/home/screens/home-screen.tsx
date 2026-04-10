"use client";

import { useRouter } from "next/navigation";
import { Lightning } from "@phosphor-icons/react";

import { ChatMessage } from "@/components/tidal/chat-message";
import { CreateWorkspaceRecommendationCard } from "@/components/tidal/create-workspace-action-card";
import { ThreadOwnershipBanner } from "@/components/tidal/thread-ownership-banner";
import { PromptComposer } from "@/components/tidal/prompt-composer";
import { SectionLabel } from "@/components/tidal/section-label";
import { SuggestionAction } from "@/components/tidal/suggestion-action";
import { useGlobalChatWorkspace } from "@/features/home/providers/global-chat-workspace-provider";
import { usePoolWorkspace } from "@/features/pool/providers/pool-workspace-provider";
import { homeScreenContent } from "@/mock-data/home/mocks/home-screen";
import { useAmplifyWorkspace } from "@/features/amplify/providers/amplify-workspace-provider";
import { WorkspacePromotionCard } from "@/components/tidal/workspace-promotion-card";
import { WorkspaceButton } from "@/components/tidal/workspace-button";
import { getAmplifyWorkspaceHref } from "@/lib/amplify-routes";

export function HomeScreen() {
  const router = useRouter();
  const {
    activeChat,
    completeWorkspaceActionCard,
    mentionTargets,
    submitMessage,
  } = useGlobalChatWorkspace();
  const { getPromotedThreadBySourceChatId, promoteGlobalChatToThread } =
    usePoolWorkspace();
  const {
    getPromotedThreadBySourceChatId: getPromotedAmplifyThreadBySourceChatId,
    promoteGlobalChatToThread: promoteGlobalChatToAmplifyThread,
    createWorkspace: createAmplifyWorkspace,
  } = useAmplifyWorkspace();
  const isEmptyChat = activeChat.messages.length === 0;
  const orderedMessages = [...activeChat.messages].reverse();
  const poolLinks = activeChat.links.filter((link) => link.workspaceType === "pool");
  const amplifyLinks = activeChat.links.filter(
    (link) => link.workspaceType === "amplify"
  );
  const promotedPoolThread = getPromotedThreadBySourceChatId(activeChat.id);
  const promotedAmplifyThread =
    getPromotedAmplifyThreadBySourceChatId(activeChat.id);
  const latestUserMessage = [...activeChat.messages]
    .reverse()
    .find((message) => message.role === "user" && message.content)?.content;
  const handleCreateAmplify = () => {
    const workspace = createAmplifyWorkspace();
    router.push(getAmplifyWorkspaceHref(workspace.id));
  };

  if (isEmptyChat) {
    return (
      <div className="tidal-page tidal-page-center">
        <div className="tidal-content-column tidal-content-column-wide tidal-stack-gap">
          <div className="space-y-2 text-center">
            <h1 className="tidal-text-display">What can I help you explore?</h1>
            <p className="mx-auto max-w-2xl tidal-text-message">
              Start broad, ask about Solana opportunities, or describe the Pool
              or Amplify strategy you want to build.
            </p>
          </div>

          <div className="pt-6">
            <PromptComposer
              className="tidal-content-column tidal-content-column-wide"
              mentionTargets={mentionTargets}
              showMentions
              onSubmit={submitMessage}
            />
          </div>

          <div className="flex justify-center pt-2">
            <WorkspaceButton
              className="gap-2"
              onClick={handleCreateAmplify}
            >
              <Lightning weight="bold" className="h-3.5 w-3.5" />
              <span>Create new Amplify</span>
            </WorkspaceButton>
          </div>

          <div className="mx-auto w-full max-w-3xl space-y-3 pt-5 md:w-3/4">
            <SectionLabel>Suggestions</SectionLabel>
            <div className="flex flex-col gap-2">
              {homeScreenContent.suggestions.map((suggestion) => (
                <SuggestionAction key={suggestion} variant="row">
                  {suggestion}
                </SuggestionAction>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="tidal-page min-h-full">
      <div className="mx-auto flex min-h-full w-full max-w-5xl min-w-0 flex-1 flex-col">
        <div className="mb-6 flex flex-col gap-3">
          <ThreadOwnershipBanner
            ownershipLabel="General chat"
            title={activeChat.title}
            description={activeChat.preview}
            linkedLabels={activeChat.links.map((link) => link.label)}
          />

          {poolLinks.length > 0 ? (
            <WorkspacePromotionCard
              workspaceType="pool"
              hasDedicatedThread={Boolean(promotedPoolThread)}
              onOpen={() => {
                promoteGlobalChatToThread({
                  sourceChatId: activeChat.id,
                  sourceChatTitle: activeChat.title,
                  sourceChatPreview: activeChat.preview,
                  latestUserMessage,
                  promotedFromLinkIds: poolLinks.map((link) => link.id),
                  promotedLinkLabels: poolLinks.map((link) => link.label),
                });
                router.push("/pool");
              }}
            />
          ) : null}

          {amplifyLinks.length > 0 ? (
            <WorkspacePromotionCard
              workspaceType="amplify"
              hasDedicatedThread={Boolean(promotedAmplifyThread)}
              onOpen={() => {
                const result = promoteGlobalChatToAmplifyThread({
                  sourceChatId: activeChat.id,
                  sourceChatTitle: activeChat.title,
                  sourceChatPreview: activeChat.preview,
                  latestUserMessage,
                  promotedFromLinkIds: amplifyLinks.map((link) => link.id),
                  promotedLinkLabels: amplifyLinks.map((link) => link.label),
                  targetWorkspaceId: amplifyLinks[0]?.workspaceId,
                });
                router.push(getAmplifyWorkspaceHref(result.workspaceId));
              }}
            />
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col justify-end gap-4 overflow-y-auto pb-8">
          {orderedMessages.map((message) => {
            const { actionCard } = message;

            return (
              <div key={message.id} className="space-y-3">
                {message.content ? (
                  <ChatMessage role={message.role}>{message.content}</ChatMessage>
                ) : null}

                {actionCard ? (
                  <CreateWorkspaceRecommendationCard
                    actionCard={actionCard}
                    onPrimaryAction={() =>
                      completeWorkspaceActionCard(activeChat.id, actionCard.id)
                    }
                  />
                ) : null}
              </div>
            );
          })}
          </div>

          <div className="sticky bottom-0 z-10 mt-auto border-t border-tidal-border bg-gradient-to-t from-background via-background/95 to-background/80 pt-4 pb-2 backdrop-blur-sm">
            <div>
              <PromptComposer
                className="w-full"
                mentionTargets={mentionTargets}
                showMentions
                onSubmit={submitMessage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
