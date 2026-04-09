"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CaretDown,
  Waves,
  Lightning,
  ChatCircle,
  Plus,
  LinkSimple,
} from "@phosphor-icons/react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGlobalChatWorkspace } from "@/features/home/providers/global-chat-workspace-provider";
import { useAmplifyWorkspace } from "@/features/amplify/providers/amplify-workspace-provider";
import { usePoolWorkspace } from "@/features/pool/providers/pool-workspace-provider";
import { cn } from "@/lib/utils";
import type { SidebarNavigation } from "@/mock-data/shell/types";

type AppSidebarProps = {
  navigation: SidebarNavigation;
};

export function AppSidebar({ navigation }: AppSidebarProps) {
  const pathname = usePathname();
  const isPoolRoute = pathname.startsWith("/pool");
  const isAmplifyRoute = pathname.startsWith("/amplify");
  const [isPoolExpanded, setIsPoolExpanded] = useState(true);
  const [isAmplifyExpanded, setIsAmplifyExpanded] = useState(true);
  const [collapsedAmplifySectionIds, setCollapsedAmplifySectionIds] = useState<string[]>([]);
  const { activeChat, chats, setActiveChatId } = useGlobalChatWorkspace();
  const {
    workspace: amplifyWorkspace,
    activeThread: activeAmplifyThread,
    setActiveThreadId: setActiveAmplifyThreadId,
    createBlankThread: createBlankAmplifyThread,
  } = useAmplifyWorkspace();
  const {
    workspace,
    isOverviewActive,
    activeThread,
    showOverview,
    setActiveThreadId,
  } = usePoolWorkspace();

  const poolChatItems = workspace.threads.map((thread) => ({
    title: thread.title,
    href: "/pool",
    id: thread.id,
  }));
  const amplifyChatItems = amplifyWorkspace.threads.map((thread) => ({
    title: thread.title,
    href: "/amplify",
    id: thread.id,
  }));

  const globalChats = chats.map((chat) => ({
    ...chat,
    href: chat.href ?? "/",
  }));
  const extraAmplifyItems = navigation.amplifyItems.filter(
    (item) => item.id !== amplifyWorkspace.id && item.title !== amplifyWorkspace.name
  );

  return (
    <Sidebar
      collapsible="offcanvas"
      className="top-14 h-[calc(100svh-3.5rem)] border-t border-tidal-border"
    >
      <SidebarHeader className="h-2 p-0" />

      <SidebarContent>
        <SidebarGroup className="pt-1.5">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/" />}
                tooltip="New"
                className="tidal-sidebar-primary-action"
                isActive={pathname === "/"}
                onClick={() => setActiveChatId("global-chat-new")}
              >
                <Plus weight="bold" />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span>New</span>
                  <span className="text-[10px] font-medium text-background/80">
                    Cmd + K
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center gap-1 px-0.5">
            <SidebarGroupLabel className="tidal-sidebar-group-title flex-1 px-0">
              <Waves weight="bold" className="mr-1" />
              {workspace.name}
            </SidebarGroupLabel>
            <button
              type="button"
              aria-label={isPoolExpanded ? "Collapse pool chats" : "Expand pool chats"}
              aria-expanded={isPoolExpanded}
              onClick={() => setIsPoolExpanded((current) => !current)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-tidal-accent transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
            >
              <CaretDown
                weight="bold"
                className={cn(
                  "h-3 w-3 transition-transform",
                  isPoolExpanded ? "rotate-180" : "rotate-0"
                )}
              />
            </button>
          </div>
          <SidebarGroupContent>
            {isPoolExpanded ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/pool" />}
                    tooltip="Overview"
                    className="tidal-sidebar-item"
                    isActive={isPoolRoute && isOverviewActive}
                    onClick={showOverview}
                  >
                    <span className="text-[0.8125rem] leading-[1.1rem]">
                      Overview
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {poolChatItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      render={<Link href="/pool" />}
                      tooltip={item.title}
                      className="tidal-sidebar-item"
                      isActive={
                        isPoolRoute && !isOverviewActive && item.id === activeThread.id
                      }
                      onClick={() => setActiveThreadId(item.id)}
                    >
                      <span className="text-[0.8125rem] leading-[1.1rem]">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            ) : null}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <div className="flex items-center gap-1 px-0.5">
            <SidebarGroupLabel className="tidal-sidebar-group-title flex-1 px-0">
              <Lightning weight="bold" className="mr-1" />
              {amplifyWorkspace.name}
            </SidebarGroupLabel>
            <button
              type="button"
              aria-label={
                isAmplifyExpanded
                  ? "Collapse Amplify threads"
                  : "Expand Amplify threads"
              }
              aria-expanded={isAmplifyExpanded}
              onClick={() => setIsAmplifyExpanded((current) => !current)}
              className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-tidal-accent transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
            >
              <CaretDown
                weight="bold"
                className={cn(
                  "h-3 w-3 transition-transform",
                  isAmplifyExpanded ? "rotate-180" : "rotate-0"
                )}
              />
            </button>
          </div>
          <SidebarGroupContent>
            {isAmplifyExpanded ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/amplify" />}
                    tooltip="Overview"
                    className="tidal-sidebar-item"
                    onClick={() => setActiveAmplifyThreadId(activeAmplifyThread.id)}
                  >
                    <span className="text-[0.8125rem] leading-[1.1rem]">
                      Overview
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {amplifyChatItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      render={<Link href="/amplify" />}
                      tooltip={item.title}
                      className="tidal-sidebar-item"
                      isActive={
                        isAmplifyRoute && item.id === activeAmplifyThread.id
                      }
                      onClick={() => setActiveAmplifyThreadId(item.id)}
                    >
                      <span className="text-[0.8125rem] leading-[1.1rem]">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/amplify" />}
                    tooltip="New thread"
                    className="tidal-sidebar-item"
                    onClick={createBlankAmplifyThread}
                  >
                    <span className="text-[0.8125rem] leading-[1.1rem]">
                      New thread
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            ) : null}
          </SidebarGroupContent>
        </SidebarGroup>

        {extraAmplifyItems.map((item) => {
          const sectionId = item.id ?? item.title;

          return (
          <div key={sectionId}>
            <SidebarSeparator />
            <SidebarGroup>
              <div className="flex items-center gap-1 px-0.5">
                <SidebarGroupLabel className="tidal-sidebar-group-title flex-1 px-0">
                  <Lightning weight="bold" className="mr-1" />
                  {item.title}
                </SidebarGroupLabel>
                <button
                  type="button"
                  aria-label={
                    collapsedAmplifySectionIds.includes(sectionId)
                      ? `Expand ${item.title}`
                      : `Collapse ${item.title}`
                  }
                  aria-expanded={!collapsedAmplifySectionIds.includes(sectionId)}
                  onClick={() =>
                    setCollapsedAmplifySectionIds((current) =>
                      current.includes(sectionId)
                        ? current.filter((id) => id !== sectionId)
                        : [...current, sectionId]
                    )
                  }
                  className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-tidal-accent transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent"
                >
                  <CaretDown
                    weight="bold"
                    className={cn(
                      "h-3 w-3 transition-transform",
                      collapsedAmplifySectionIds.includes(sectionId)
                        ? "rotate-0"
                        : "rotate-180"
                    )}
                  />
                </button>
              </div>
              {!collapsedAmplifySectionIds.includes(sectionId) ? (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<Link href={item.href ?? "/amplify"} />}
                      tooltip="Overview"
                      className="tidal-sidebar-item"
                    >
                        <span className="text-[0.8125rem] leading-[1.1rem]">
                          Overview
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : null}
            </SidebarGroup>
          </div>
        )})}

        <SidebarSeparator />

        <SidebarGroup>
          <div className="flex items-center gap-1 px-0.5">
            <SidebarGroupLabel className="tidal-sidebar-group-title flex-1 px-0">
              <ChatCircle weight="bold" className="mr-1" />
              All Chats
            </SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {globalChats.map((chat) => (
                <SidebarMenuItem key={chat.id}>
                  <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                    <SidebarMenuButton
                      render={<Link href={chat.href} />}
                      tooltip={chat.preview}
                      className="tidal-sidebar-subitem flex-1"
                      isActive={pathname === chat.href && chat.id === activeChat.id}
                      onClick={() => setActiveChatId(chat.id)}
                    >
                      <span className="text-[0.8125rem] leading-[1.1rem]">
                        {chat.title}
                      </span>
                    </SidebarMenuButton>

                    {chat.links.length > 0 ? (
                      <Tooltip>
                        <TooltipTrigger className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-tidal-muted transition-colors hover:bg-tidal-sidebar-active hover:text-tidal-accent">
                          <LinkSimple weight="bold" className="h-3.5 w-3.5" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          align="start"
                          className="max-w-[18rem] flex-col items-start gap-2 rounded-lg border border-tidal-border bg-tidal-card px-3 py-2 text-tidal-card-foreground"
                        >
                          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-tidal-muted">
                            Linked context
                          </p>
                          <div className="flex flex-col gap-1">
                            {chat.links.map((link) => (
                              <span
                                key={link.id}
                                className="text-xs leading-tight text-foreground"
                              >
                                {link.label}
                              </span>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : null}
                  </div>

                  <div className="hidden group-data-[collapsible=icon]:block">
                    <SidebarMenuButton
                      render={<Link href={chat.href} />}
                      tooltip={chat.title}
                      className="tidal-sidebar-subitem"
                      isActive={pathname === chat.href && chat.id === activeChat.id}
                      onClick={() => setActiveChatId(chat.id)}
                    >
                      <span className="text-[0.8125rem] leading-[1.1rem]">
                        {chat.title}
                      </span>
                    </SidebarMenuButton>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

    </Sidebar>
  );
}
