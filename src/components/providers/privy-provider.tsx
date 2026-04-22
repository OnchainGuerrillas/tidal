"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// Client-side RPC used by Privy's Solana wallet hooks (e.g.,
// signAndSendTransaction). Kept on the public Solana endpoint so our
// server-only HELIUS_RPC_URL never leaves the backend. Rate-limited —
// fine for prototype submissions. Production should route submissions
// through a server-side /api/solana/submit route that uses Helius.
const PUBLIC_SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const PUBLIC_SOLANA_WS = "wss://api.mainnet-beta.solana.com";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  if (!appId) {
    if (typeof window !== "undefined") {
      console.warn(
        "NEXT_PUBLIC_PRIVY_APP_ID is not set — wallet features are disabled. Set it in .env.local.",
      );
    }
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "dark",
          accentColor: "#61B3CF",
          logo: undefined,
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors(),
          },
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
        solana: {
          rpcs: {
            "solana:mainnet": {
              rpc: createSolanaRpc(PUBLIC_SOLANA_RPC),
              rpcSubscriptions: createSolanaRpcSubscriptions(PUBLIC_SOLANA_WS),
            },
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
