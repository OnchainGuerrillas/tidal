"use client";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/tidal/app-header";
import { AppSidebar } from "@/components/tidal/app-sidebar";
import { DesignModeBanner } from "@/components/tidal/design-mode-banner";

function isWorkspaceRoute(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return false;
  }

  return pathname.split("/").filter(Boolean).length >= 1;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspaceRoute = isWorkspaceRoute(pathname);

  if (workspaceRoute) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DesignModeBanner />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DesignModeBanner />
      <AppHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
