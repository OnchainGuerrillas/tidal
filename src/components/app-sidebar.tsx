"use client";

import Link from "next/link";

import {
  ArrowsLeftRight,
  Waves,
  Lightning,
  ChatCircle,
  Plus,
  User,
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
import { Card, CardContent } from "@/components/ui/card";
import type { SidebarNavigation } from "@/features/shell/types";

type AppSidebarProps = {
  navigation: SidebarNavigation;
};

export function AppSidebar({ navigation }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link
          href="/"
          className="text-lg font-semibold text-tidal-accent group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:text-sm"
        >
          <span className="group-data-[collapsible=icon]:hidden">Tidal</span>
          <span className="hidden group-data-[collapsible=icon]:inline">T</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/" />}
                tooltip="New"
                className="cursor-pointer bg-tidal-accent text-background font-medium hover:bg-tidal-accent/90 hover:text-background"
              >
                <Plus weight="bold" />
                <span>New</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Tidal Swap">
                <ArrowsLeftRight weight="bold" className="text-tidal-accent" />
                <span className="text-tidal-accent">Tidal Swap</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-tidal-accent">
            <Waves weight="bold" className="mr-2" />
            Tidal Pool
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.poolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="cursor-pointer pl-6"
                  >
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-tidal-accent">
            <Lightning weight="bold" className="mr-2" />
            Tidal Amplify
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.amplifyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href ?? "/amplify"} />}
                    tooltip={item.title}
                    className="cursor-pointer pl-6"
                  >
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className="text-tidal-accent">
            <ChatCircle weight="bold" className="mr-2" />
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className="cursor-pointer pl-6"
                  >
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Card size="sm" className="bg-tidal-card ring-tidal-border group-data-[collapsible=icon]:hidden">
          <CardContent className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tidal-accent">
              <User weight="bold" className="h-4 w-4 text-tidal-card" />
            </div>
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {navigation.userName}
            </span>
          </CardContent>
        </Card>
        <div className="hidden group-data-[collapsible=icon]:flex justify-center">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tidal-accent">
            <User weight="bold" className="h-4 w-4 text-tidal-card" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
