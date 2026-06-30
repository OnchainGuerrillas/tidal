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
import { AppShell } from "@/components/tidal/app-shell";

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
                      <AppShell>{children}</AppShell>
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
