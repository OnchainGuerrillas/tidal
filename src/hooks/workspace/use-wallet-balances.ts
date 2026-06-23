"use client";

import { useCallback, useEffect, useState } from "react";
import { useTidalWallets } from "@/hooks/use-tidal-wallets";
import { isDesignMode } from "@/lib/app-mode";
import { designModeWalletBalances } from "@/mock-data/design-mode/wallet";
import { useChainStateSignal } from "@/providers/chain-state-signal-provider";

const USDC_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export type AssetBalance = {
  rawAmount: bigint;
  displayAmount: string;
};

export type WalletBalances = {
  address: string;
  sol: AssetBalance;
  usdc: AssetBalance;
};

type State =
  | { kind: "no-wallet" }
  | { kind: "loading"; address: string }
  | { kind: "ready"; balances: WalletBalances }
  | { kind: "error"; address: string; message: string };

type RpcResponse<T> = {
  jsonrpc: "2.0";
  id: number | string;
  result?: T;
  error?: { code: number; message: string };
};

type GetBalanceResult = {
  context: { slot: number };
  value: number;
};

type ParsedTokenAccountInfo = {
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number | null;
  };
};

type GetTokenAccountsResult = {
  context: { slot: number };
  value: Array<{
    account: { data: { parsed: { info: ParsedTokenAccountInfo } } };
  }>;
};

async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const response = await fetch("/api/solana/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) {
    throw new Error(`RPC ${method} HTTP ${response.status.toString()}`);
  }
  const data = (await response.json()) as RpcResponse<T>;
  if (data.error) {
    throw new Error(`RPC ${method} error: ${data.error.message}`);
  }
  if (data.result === undefined) {
    throw new Error(`RPC ${method} returned no result`);
  }
  return data.result;
}

function formatTokenAmount(
  raw: bigint,
  decimals: number,
  precision: number,
): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const remainder = raw % divisor;
  const remainderStr = remainder.toString().padStart(decimals, "0");
  const decimalPart = remainderStr.slice(0, precision);
  return `${whole.toString()}.${decimalPart}`;
}

async function fetchBalances(address: string): Promise<WalletBalances> {
  const [solResult, usdcResult] = await Promise.all([
    rpcCall<GetBalanceResult>("getBalance", [address]),
    rpcCall<GetTokenAccountsResult>("getTokenAccountsByOwner", [
      address,
      { mint: USDC_MINT_ADDRESS },
      { encoding: "jsonParsed" },
    ]),
  ]);

  const solLamports = BigInt(solResult.value);

  let usdcRaw = 0n;
  let usdcDecimals = 6;
  for (const entry of usdcResult.value) {
    const info = entry.account.data.parsed.info;
    usdcRaw += BigInt(info.tokenAmount.amount);
    usdcDecimals = info.tokenAmount.decimals;
  }

  return {
    address,
    sol: {
      rawAmount: solLamports,
      displayAmount: `${formatTokenAmount(solLamports, 9, 4)} SOL`,
    },
    usdc: {
      rawAmount: usdcRaw,
      displayAmount: `${formatTokenAmount(usdcRaw, usdcDecimals, 2)} USDC`,
    },
  };
}

/**
 * Fetches the connected Privy wallet's SOL + USDC balances from Helius
 * via the /api/solana/rpc proxy. Refetches on mount and exposes a
 * `refetch` callback so callers can refresh after an on-chain action
 * (e.g., the canvas Run button).
 *
 * Returns `{ kind: "no-wallet" }` when Privy hasn't provisioned a wallet
 * yet — callers should fall back to mocked balances or hide the affected
 * UI until login completes.
 */
function useDesignModeWalletBalances() {
  const refetch = useCallback(async () => {}, []);

  return {
    state: { kind: "ready", balances: designModeWalletBalances } as State,
    refetch,
  };
}

function useLiveWalletBalances() {
  const { wallets } = useTidalWallets();
  const wallet = wallets[0];
  const address = wallet?.address;
  const { signal } = useChainStateSignal();
  const [state, setState] = useState<State>({ kind: "no-wallet" });

  const refetch = useCallback(async () => {
    if (!address) {
      setState({ kind: "no-wallet" });
      return;
    }
    setState({ kind: "loading", address });
    try {
      const balances = await fetchBalances(address);
      setState({ kind: "ready", balances });
    } catch (err) {
      setState({
        kind: "error",
        address,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }, [address]);

  // Refetch on mount, when the wallet address changes, and whenever
  // the chain-state signal bumps (after a successful canvas run or AI
  // compose run). The "set state in an effect" rule is suppressed
  // because the data lives off-chain and we explicitly want to fetch
  // when any of these inputs change.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void refetch();
  }, [refetch, signal]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { state, refetch };
}

export const useWalletBalances = isDesignMode
  ? useDesignModeWalletBalances
  : useLiveWalletBalances;
