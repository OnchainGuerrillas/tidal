import type { MeProfile } from "@/hooks/use-me";

export const designModeProfile: MeProfile = {
  user: {
    id: "design-user",
    privyUserId: "design-privy-user",
    displayName: "Design Mode",
    primaryWalletAddress: "DesignMode111111111111111111111111111111111",
    email: "design@tidal.local",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  linkedAccounts: [
    {
      kind: "wallet",
      address: "DesignMode111111111111111111111111111111111",
      chainType: "solana",
      walletClientType: "design-mode",
    },
  ],
  workspaces: [],
  recentRuns: [],
};
