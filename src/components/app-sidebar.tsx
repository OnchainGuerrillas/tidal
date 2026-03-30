"use client";

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

const chatItems = [
  { title: "Best APYs on Solana" },
  { title: "Stablecoin yield comparison" },
  { title: "SOL staking strategies" },
];

const poolItems = [
  { title: "My Solana Pool" },
  { title: "Stablecoin Strategy" },
];

const amplifyItems = [
  { title: "SOL Yield Loop" },
  { title: "Staking Compounder" },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <a href="/" className="text-lg font-semibold text-tidal-accent group-data-[collapsible=icon]:text-center group-data-[collapsible=icon]:text-sm">
          <span className="group-data-[collapsible=icon]:hidden">Tidal</span>
          <span className="hidden group-data-[collapsible=icon]:inline">T</span>
        </a>
      </SidebarHeader>

      <SidebarContent>
        {/* New button */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <a href="/">
                <SidebarMenuButton
                  tooltip="New"
                  className="cursor-pointer bg-tidal-accent text-background font-medium hover:bg-tidal-accent/90 hover:text-background"
                >
                  <Plus weight="bold" />
                  <span>New</span>
                </SidebarMenuButton>
              </a>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Tidal Swap */}
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

        {/* Tidal Pool */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-tidal-accent">
            <Waves weight="bold" className="mr-2" />
            Tidal Pool
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {poolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} className="cursor-pointer pl-6">
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Tidal Amplify */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-tidal-accent">
            <Lightning weight="bold" className="mr-2" />
            Tidal Amplify
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {amplifyItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <a href="/amplify">
                    <SidebarMenuButton tooltip={item.title} className="cursor-pointer pl-6">
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </a>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Chats */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-tidal-accent">
            <ChatCircle weight="bold" className="mr-2" />
            Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} className="cursor-pointer pl-6">
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
              Alex Thompson
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
