import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import { SidePanelProvider } from "@/providers/side-panel-provider";
import { PreferenceProfileProvider } from "@/providers/preference-profile-provider";
import { ChainStateSignalProvider } from "@/providers/chain-state-signal-provider";
import { RunStatusProvider } from "@/providers/run-status-provider";
import { PrivyProvider } from "@/components/providers/privy-provider";
import { AppHeader } from "@/components/tidal/app-header";
import { AppSidebar } from "@/components/tidal/app-sidebar";
import { DesignModeBanner } from "@/components/tidal/design-mode-banner";

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
        <PrivyProvider>
          <ChainStateSignalProvider>
            <RunStatusProvider>
            <TooltipProvider>
              <PreferenceProfileProvider>
                <WorkspaceProvider>
                  <SidePanelProvider>
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
                  </SidePanelProvider>
                </WorkspaceProvider>
              </PreferenceProfileProvider>
            </TooltipProvider>
            </RunStatusProvider>
          </ChainStateSignalProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
