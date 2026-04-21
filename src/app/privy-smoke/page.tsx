"use client";

import { useState } from "react";
import bs58 from "bs58";
import { usePrivy } from "@privy-io/react-auth";
import {
  useSignAndSendTransaction,
  useSignMessage,
  useWallets,
} from "@privy-io/react-auth/solana";

const JITO_CATALOG_ITEM_ID = "jito-sol-stake";
const STAKE_LAMPORTS = "10000000";

type BuildTransactionResponse = {
  transactionBase64?: string;
  expectedOutputAmount?: string;
  fees?: { networkLamports?: string; priorityLamports?: string };
  warnings?: string[];
  error?: string;
  detail?: string;
};

export default function PrivySmokePage() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { signMessage } = useSignMessage();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [signature, setSignature] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  const [stakeTxSig, setStakeTxSig] = useState<string | null>(null);
  const [stakeWarnings, setStakeWarnings] = useState<string[]>([]);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [staking, setStaking] = useState(false);

  const handleSign = async () => {
    setSignError(null);
    setSignature(null);
    const wallet = wallets[0];
    if (!wallet) {
      setSignError("No Solana wallet connected.");
      return;
    }
    try {
      const result = await signMessage({
        message: new TextEncoder().encode("tidal-smoke-test"),
        wallet,
      });
      const hex = Array.from(result.signature)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      setSignature(hex);
    } catch (err) {
      setSignError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStake = async () => {
    setStakeError(null);
    setStakeTxSig(null);
    setStakeWarnings([]);
    const wallet = wallets[0];
    if (!wallet) {
      setStakeError("No Solana wallet connected.");
      return;
    }
    setStaking(true);
    try {
      const buildResp = await fetch("/api/solana/build-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalogItemId: JITO_CATALOG_ITEM_ID,
          walletPublicKey: wallet.address,
          inputAmount: STAKE_LAMPORTS,
        }),
      });
      const buildData = (await buildResp.json()) as BuildTransactionResponse;
      if (!buildResp.ok) {
        throw new Error(
          buildData.detail || buildData.error || `HTTP ${buildResp.status}`,
        );
      }
      if (!buildData.transactionBase64) {
        throw new Error("response missing transactionBase64");
      }
      if (buildData.warnings && buildData.warnings.length > 0) {
        setStakeWarnings(buildData.warnings);
      }

      const binary = atob(buildData.transactionBase64);
      const txBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        txBytes[i] = binary.charCodeAt(i);
      }

      const result = await signAndSendTransaction({
        transaction: txBytes,
        wallet,
      });
      setStakeTxSig(bs58.encode(result.signature));
    } catch (err) {
      setStakeError(err instanceof Error ? err.message : String(err));
    } finally {
      setStaking(false);
    }
  };

  if (!ready) {
    return <div className="p-8 font-mono text-sm">Loading Privy…</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-8 font-mono text-sm">
      <header className="flex items-baseline gap-4">
        <h1 className="text-xl">Privy Solana smoke test</h1>
        <span className="text-muted-foreground">
          (debug page — not linked from app nav)
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <div>
          <span className="opacity-60">authenticated:</span>{" "}
          <strong>{String(authenticated)}</strong>
        </div>
        {user && (
          <div>
            <span className="opacity-60">user id:</span> {user.id}
          </div>
        )}
        <div className="flex gap-2">
          {!authenticated ? (
            <button
              className="rounded border border-white/30 px-3 py-1 hover:bg-white/5"
              onClick={() => login()}
            >
              Login
            </button>
          ) : (
            <button
              className="rounded border border-white/30 px-3 py-1 hover:bg-white/5"
              onClick={() => logout()}
            >
              Logout
            </button>
          )}
        </div>
      </section>

      {authenticated && (
        <section className="flex flex-col gap-2">
          <h2 className="opacity-60">Solana wallets</h2>
          {wallets.length === 0 ? (
            <div className="opacity-60">No Solana wallets linked.</div>
          ) : (
            <ul className="flex flex-col gap-1">
              {wallets.map((w) => (
                <li key={w.address} className="flex gap-2">
                  <span className="opacity-60">
                    {w.standardWallet?.name ?? "wallet"}:
                  </span>
                  <span>{w.address}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {authenticated && wallets.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="opacity-60">Sign message test</h2>
          <button
            className="w-fit rounded border border-white/30 px-3 py-1 hover:bg-white/5"
            onClick={handleSign}
          >
            Sign &quot;tidal-smoke-test&quot; with first Solana wallet
          </button>
          {signature && (
            <div className="break-all text-emerald-400">
              signature (hex): {signature}
            </div>
          )}
          {signError && <div className="text-red-400">error: {signError}</div>}
        </section>
      )}

      {authenticated && wallets.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="opacity-60">
            Stake test — 0.01 SOL → JitoSOL via Jito stake pool (MAINNET)
          </h2>
          <p className="opacity-60">
            Uses the JitoSOL adapter&apos;s buildTransaction + Privy
            signAndSendTransaction. Submits a real mainnet transaction for
            0.01 SOL. Cancelable in the Privy modal.
          </p>
          <button
            disabled={staking}
            className="w-fit rounded border border-white/30 px-3 py-1 hover:bg-white/5 disabled:opacity-50"
            onClick={handleStake}
          >
            {staking ? "Staking…" : "Stake 0.01 SOL with Jito"}
          </button>
          {stakeWarnings.length > 0 && (
            <ul className="flex flex-col gap-1 text-amber-400">
              {stakeWarnings.map((w, i) => (
                <li key={i}>warning: {w}</li>
              ))}
            </ul>
          )}
          {stakeTxSig && (
            <div className="flex flex-col gap-1 text-emerald-400">
              <div className="break-all">tx signature: {stakeTxSig}</div>
              <a
                className="underline hover:text-emerald-300"
                href={`https://solscan.io/tx/${stakeTxSig}`}
                target="_blank"
                rel="noreferrer"
              >
                view on solscan ↗
              </a>
            </div>
          )}
          {stakeError && (
            <div className="text-red-400">error: {stakeError}</div>
          )}
        </section>
      )}
    </div>
  );
}
