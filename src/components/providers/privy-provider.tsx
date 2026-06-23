"use client";

import { useMemo } from "react";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";

import { isDesignMode } from "@/lib/app-mode";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// Privy's Solana hooks require an RPC config at provider level. We route
// HTTP requests through /api/solana/rpc so the client never sees our paid
// Helius key - the server-side HELIUS_RPC_URL does the actual work.
//
// Subscriptions (WebSocket) are harder to proxy through a REST route, so
// we point them at the public WS endpoint. Our flow uses signTransaction
// + server-side submit + polling via /api/solana/positions, so we do not
// depend on subscriptions in practice; Privy may attempt to connect for
// confirmation and fail silently, which is acceptable.
const RPC_PROXY_PATH = "/api/solana/rpc";
const PUBLIC_SOLANA_WS = "wss://api.mainnet-beta.solana.com";

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const solanaRpcConfig = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return {
      rpc: createSolanaRpc(`${origin}${RPC_PROXY_PATH}`),
      rpcSubscriptions: createSolanaRpcSubscriptions(PUBLIC_SOLANA_WS),
    };
  }, []);

  if (isDesignMode) {
    return <>{children}</>;
  }

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
            "solana:mainnet": solanaRpcConfig,
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
