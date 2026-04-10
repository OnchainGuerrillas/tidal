import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AmplifyWorkspaceProvider } from "@/features/amplify/providers/amplify-workspace-provider";
import { GlobalChatWorkspaceProvider } from "@/features/home/providers/global-chat-workspace-provider";
import { PoolWorkspaceProvider } from "@/features/pool/providers/pool-workspace-provider";
import { AppHeader } from "@/features/shell/components/app-header";
import { AppSidebar } from "@/features/shell/components/app-sidebar";
import { PreferenceProfileProvider } from "@/features/shell/providers/preference-profile-provider";

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
            <GlobalChatWorkspaceProvider>
              <PoolWorkspaceProvider>
                <AmplifyWorkspaceProvider>
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
                </AmplifyWorkspaceProvider>
              </PoolWorkspaceProvider>
            </GlobalChatWorkspaceProvider>
          </PreferenceProfileProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
