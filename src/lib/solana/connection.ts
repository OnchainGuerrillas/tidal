import "server-only";

import { createSolanaRpc } from "@solana/kit";
import { Connection } from "@solana/web3.js";

type SolanaRpc = ReturnType<typeof createSolanaRpc>;

let cachedRpc: SolanaRpc | null = null;
let cachedLegacyConnection: Connection | null = null;

function getRpcUrl(): string {
  const url = process.env.HELIUS_RPC_URL;
  if (!url) {
    throw new Error(
      "HELIUS_RPC_URL is not set. Add it to .env.local (server-only, no NEXT_PUBLIC_ prefix).",
    );
  }
  return url;
}

export function getSolanaRpc(): SolanaRpc {
  if (cachedRpc) return cachedRpc;
  cachedRpc = createSolanaRpc(getRpcUrl());
  return cachedRpc;
}

/**
 * Legacy @solana/web3.js v1 Connection, kept alongside the kit RPC for
 * ecosystem SDKs that still target v1 (e.g., @solana/spl-stake-pool,
 * most Kamino/Drift helpers). Kit is preferred for new reads; v1 is
 * used at the buildTransaction boundary where the helper libraries live.
 */
export function getSolanaWeb3Connection(): Connection {
  if (cachedLegacyConnection) return cachedLegacyConnection;
  cachedLegacyConnection = new Connection(getRpcUrl(), "confirmed");
  return cachedLegacyConnection;
}

export function resetSolanaRpcForTesting(): void {
  cachedRpc = null;
  cachedLegacyConnection = null;
}
