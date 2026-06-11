"use client";

import { useCallback } from "react";
import {
  useSignTransaction,
  useWallets,
} from "@privy-io/react-auth/solana";

import { isDesignMode } from "@/lib/app-mode";
import type {
  NodeRunInput,
  NodeRunner,
  NodeRunResult,
} from "@/lib/workspace/graph-exec";

type BuildTransactionResponse = {
  transactionsBase64?: string[];
  expectedOutputAmount?: string;
  fees?: { networkLamports?: string; priorityLamports?: string };
  warnings?: string[];
  error?: string;
  detail?: string;
};

type SubmitResponse = {
  signature?: string;
  error?: string;
  detail?: string;
};

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let out = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(out);
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Returns a NodeRunner bound to the user's first connected Privy Solana
 * wallet. Each invocation builds the transaction server-side (via the
 * catalogItemId -> ProtocolAdapter registry), signs client-side via
 * Privy's useSignTransaction, and submits server-side through our
 * Helius-backed /api/solana/submit-transaction route.
 *
 * The returned function is suitable for passing into executeGraph from
 * src/lib/workspace/graph-exec.ts. It is also used directly by the
 * /privy-smoke page for single-node tests - the same flow, one node
 * at a time.
 */
function useDesignModeAdapterNodeRunner(): NodeRunner {
  return useCallback(
    async ({ inputAmount }: NodeRunInput): Promise<NodeRunResult> => ({
      outputs: new Map([["next", inputAmount]]),
    }),
    [],
  );
}

function useLiveAdapterNodeRunner(): NodeRunner {
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

  return useCallback(
    async ({ node, inputAmount }: NodeRunInput): Promise<NodeRunResult> => {
      const wallet = wallets[0];
      if (!wallet) {
        throw new Error("No Solana wallet connected.");
      }

      const buildResp = await fetch("/api/solana/build-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: node.catalogItemId,
          walletPublicKey: wallet.address,
          inputAmount: inputAmount.toString(),
          widgets: node.widgets,
        }),
      });
      const buildData = (await buildResp.json()) as BuildTransactionResponse;
      if (!buildResp.ok) {
        throw new Error(
          buildData.detail ||
            buildData.error ||
            `build HTTP ${buildResp.status.toString()}`,
        );
      }
      if (
        !buildData.transactionsBase64 ||
        buildData.transactionsBase64.length === 0
      ) {
        throw new Error("build response missing transactionsBase64");
      }

      // Sign and submit each tx in order, waiting for confirmation
      // between them. The submit route polls for `confirmed` so the
      // next tx in the sequence sees the on-chain state created by
      // the previous one (e.g., Kamino's init tx creates the user
      // metadata + obligation accounts that the lending tx reads).
      let lastSignature = "";
      for (let i = 0; i < buildData.transactionsBase64.length; i++) {
        const txBase64 = buildData.transactionsBase64[i];
        const signed = await signTransaction({
          transaction: base64ToUint8Array(txBase64),
          wallet,
        });
        const signedBase64 = uint8ArrayToBase64(signed.signedTransaction);

        const submitResp = await fetch("/api/solana/submit-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transactionBase64: signedBase64 }),
        });
        const submitData = (await submitResp.json()) as SubmitResponse;
        if (!submitResp.ok || !submitData.signature) {
          // Surface the failing tx's index so users debugging a multi-
          // tx adapter (e.g., Kamino setup vs lending) know which leg
          // tripped.
          throw new Error(
            `tx ${i.toString()}/${buildData.transactionsBase64.length.toString()}: ${
              submitData.detail ||
              submitData.error ||
              `submit HTTP ${submitResp.status.toString()}`
            }`,
          );
        }
        lastSignature = submitData.signature;
      }

      const outputAmount = buildData.expectedOutputAmount
        ? BigInt(buildData.expectedOutputAmount)
        : 0n;

      // Adapters always emit a single output on the conventional "next"
      // handle. Multi-output runners (Split, future Amount-with-fanout)
      // are handled internally by executeGraph rather than via this
      // adapter pipeline.
      return {
        txSignature: lastSignature,
        outputs: new Map([["next", outputAmount]]),
      };
    },
    [wallets, signTransaction],
  );
}

export const useAdapterNodeRunner = isDesignMode
  ? useDesignModeAdapterNodeRunner
  : useLiveAdapterNodeRunner;
