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
  SidebarFooter,
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
import { getAmplifyWorkspaceHref } from "@/lib/amplify-routes";
import { sidebarNavigation } from "@/mock-data/shell/mocks/navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const isPoolRoute = pathname.startsWith("/pool");
  const isAmplifyRoute = pathname.startsWith("/amplify");
  const [isPoolExpanded, setIsPoolExpanded] = useState(true);
  const [collapsedAmplifySectionIds, setCollapsedAmplifySectionIds] = useState<string[]>([]);
  const { activeChat, chats, setActiveChatId } = useGlobalChatWorkspace();
  const {
    workspaces: amplifyWorkspaces,
    workspace: amplifyWorkspace,
    activeThread: activeAmplifyThread,
    setActiveWorkspaceId,
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

  const globalChats = chats.map((chat) => ({
    ...chat,
    href: chat.href ?? "/",
  }));
  const userInitials = sidebarNavigation.userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

        {amplifyWorkspaces.map((workspace) => {
          const workspaceHref = getAmplifyWorkspaceHref(workspace.id);
          const amplifyChatItems = workspace.threads.map((thread) => ({
            title: thread.title,
            href: workspaceHref,
            id: thread.id,
          }));
          const sectionId = workspace.id;
          const isSectionCollapsed = collapsedAmplifySectionIds.includes(sectionId);
          const isActiveWorkspace = amplifyWorkspace.id === workspace.id;

          return (
          <div key={sectionId}>
            <SidebarGroup>
              <div className="flex items-center gap-1 px-0.5">
                <SidebarGroupLabel className="tidal-sidebar-group-title flex-1 px-0">
                  <Lightning weight="bold" className="mr-1" />
                  <span className="truncate">{workspace.name}</span>
                  {workspace.kind === "example" ? (
                    <span className="ml-2 text-[10px] font-medium uppercase tracking-[0.04em] text-tidal-muted">
                      Example
                    </span>
                  ) : null}
                </SidebarGroupLabel>
                <button
                  type="button"
                  aria-label={
                    isSectionCollapsed
                      ? `Expand ${workspace.name}`
                      : `Collapse ${workspace.name}`
                  }
                  aria-expanded={!isSectionCollapsed}
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
                      isSectionCollapsed ? "rotate-0" : "rotate-180"
                    )}
                  />
                </button>
              </div>
              {!isSectionCollapsed ? (
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href={workspaceHref} />}
                        tooltip="Overview"
                        className="tidal-sidebar-item"
                        isActive={isAmplifyRoute && isActiveWorkspace}
                        onClick={() => setActiveWorkspaceId(workspace.id)}
                      >
                        <span className="text-[0.8125rem] leading-[1.1rem]">
                          Overview
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {amplifyChatItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          tooltip={item.title}
                          className="tidal-sidebar-item"
                          isActive={
                            isAmplifyRoute &&
                            isActiveWorkspace &&
                            item.id === activeAmplifyThread.id
                          }
                          onClick={() =>
                            setActiveAmplifyThreadId(item.id, workspace.id)
                          }
                        >
                          <span className="text-[0.8125rem] leading-[1.1rem]">
                            {item.title}
                          </span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        render={<Link href={workspaceHref} />}
                        tooltip="New thread"
                        className="tidal-sidebar-item"
                        onClick={() => createBlankAmplifyThread(workspace.id)}
                      >
                        <span className="text-[0.8125rem] leading-[1.1rem]">
                          New thread
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              ) : null}
            </SidebarGroup>
            {workspace.id !== amplifyWorkspaces[amplifyWorkspaces.length - 1]?.id ? (
              <SidebarSeparator />
            ) : null}
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
      <SidebarFooter className="border-t border-tidal-border pt-3">
        <div className="rounded-xl border border-tidal-border bg-tidal-card/75 p-3">
          <div className="flex items-start gap-3">
            <div className="tidal-user-avatar text-[11px] font-semibold text-background">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {sidebarNavigation.wallet.addressLabel}
              </div>
              <div className="mt-0.5 truncate text-[11px] text-tidal-muted">
                {sidebarNavigation.wallet.solBalanceLabel}
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
