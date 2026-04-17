import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { SidePanelProvider } from "@/providers/side-panel-provider";
import { PreferenceProfileProvider } from "@/providers/preference-profile-provider";
import { AppHeader } from "@/components/shell/app-header";
import { AppSidebar } from "@/components/shell/app-sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tidal",
  description: "AI-powered DeFi investment on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="flex h-screen flex-col overflow-hidden">
        <TooltipProvider>
          <PreferenceProfileProvider>
            <WorkspaceProvider>
              <SidePanelProvider>
                <SidebarProvider>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <AppHeader />
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                      <AppSidebar />
                      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        {children}
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </SidePanelProvider>
            </WorkspaceProvider>
          </PreferenceProfileProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
