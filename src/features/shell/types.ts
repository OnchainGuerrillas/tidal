export const appModes = ["Chat", "Pool", "Swap", "Amplify"] as const;

export type AppMode = (typeof appModes)[number];

export type SidebarItem = {
  title: string;
  href?: string;
};

export type SidebarNavigation = {
  poolItems: SidebarItem[];
  amplifyItems: SidebarItem[];
  chatItems: SidebarItem[];
  userName: string;
};
