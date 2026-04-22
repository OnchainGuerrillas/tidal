"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// Client-side RPC used by Privy's Solana wallet hooks (submit, preflight,
// subscriptions). The public endpoint (api.mainnet-beta.solana.com) blocks
// browser-origin requests with 403, so we need a browser-friendly RPC.
// Prefer NEXT_PUBLIC_HELIUS_RPC_URL if set - Helius allows browser traffic
// by default. Lock access to your domain in the Helius dashboard before
// deploying publicly, or refactor to a server-side submit route.
// Falls back to the public endpoint for local dev without the env set
// (signAndSendTransaction will 403, but everything else will init).
const clientHeliusHttp = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
const clientHeliusWs = clientHeliusHttp?.replace(/^http/, "ws");
const SOLANA_RPC_URL =
  clientHeliusHttp ?? "https://api.mainnet-beta.solana.com";
const SOLANA_WS_URL =
  clientHeliusWs ?? "wss://api.mainnet-beta.solana.com";

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
              rpc: createSolanaRpc(SOLANA_RPC_URL),
              rpcSubscriptions: createSolanaRpcSubscriptions(SOLANA_WS_URL),
            },
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
