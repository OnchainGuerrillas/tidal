import "server-only";

import { withdrawSol } from "@solana/spl-stake-pool";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { getAdapterCatalogEntry } from "./adapter-catalog";
import { getSolanaWeb3Connection } from "./connection";
import { JITO_STAKE_POOL_ADDRESS } from "./jito";
import type {
  APYQuote,
  BuildTransactionParams,
  BuildTransactionResult,
  PositionSnapshot,
  ProtocolAdapter,
  ProtocolMetadata,
  ReadPositionParams,
  WidgetSchema,
} from "./types";

const ENTRY = getAdapterCatalogEntry("jito-sol-unstake")!;
const CATALOG_ITEM = ENTRY.catalogItem;
const WIDGETS: WidgetSchema[] = ENTRY.widgets;

const PROTOCOL: ProtocolMetadata = {
  id: "jito",
  name: "Jito",
  auditCount: 3,
  tvlUsd: 2_900_000_000,
  ageMonths: 36,
  riskTier: "shallows",
};

async function readPosition(
  params: ReadPositionParams,
): Promise<PositionSnapshot | null> {
  // The unstake adapter is action-only — the JitoSOL balance it
  // operates on is already surfaced by the jito-sol-stake adapter's
  // readPosition. Returning null avoids double-counting.
  void params;
  return null;
}

async function readRate(): Promise<APYQuote | null> {
  // Unstaking has no yield. The Jito stake adapter reports the live
  // staking APY for the underlying JitoSOL position.
  return null;
}

async function buildTransaction(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  // inputAmount arrives in JitoSOL base units (9 decimals like SOL).
  // derive-executable-plan converts the user's `amount` widget value
  // via decimalToBaseUnits(value, 9). For chained execution
  // (e.g., upstream Jito stake -> Jito unstake), the upstream's
  // expectedOutputAmount is the lamports staked, which is a lower
  // bound for JitoSOL minted; close enough to use as a downstream
  // unstake amount in practice.
  const jitoSolBaseUnits = params.inputAmount;
  if (jitoSolBaseUnits <= 0n) {
    throw new Error(
      `Jito unstake requires a positive JitoSOL amount (got ${jitoSolBaseUnits.toString()})`,
    );
  }
  // SDK quirk: depositSol takes lamports (param literally named
  // `lamports`), but withdrawSol takes a DECIMAL number — internally
  // it calls solToLamports(amount), multiplying by 1e9. Passing raw
  // base units to withdrawSol blows up the comparison: a 0.003
  // JitoSOL (3_000_000 raw) request becomes "3 million JitoSOL" and
  // fails the balance check. Convert back to decimal here.
  if (jitoSolBaseUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `unstake amount exceeds JS number safe range: ${jitoSolBaseUnits.toString()} JitoSOL base units`,
    );
  }
  const jitoSolDecimal = Number(jitoSolBaseUnits) / 1_000_000_000;

  const connection = getSolanaWeb3Connection();
  const fromPubkey = new PublicKey(params.walletPublicKey);
  const stakePool = new PublicKey(JITO_STAKE_POOL_ADDRESS);

  // tokenOwner = fromPubkey (holds the JitoSOL being burned)
  // solReceiver = fromPubkey (gets the SOL back)
  const { instructions, signers } = await withdrawSol(
    connection,
    stakePool,
    fromPubkey,
    fromPubkey,
    jitoSolDecimal,
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  if (signers.length > 0) {
    tx.sign(signers);
  }

  const transactionBase64 = Buffer.from(tx.serialize()).toString("base64");

  // Expected output is approximately the input lamports — the actual
  // SOL received is slightly less due to the stake pool's withdrawal
  // fee and exchange rate. Returning the input as a lower bound is
  // fine for downstream chaining.
  return {
    transactionsBase64: [transactionBase64],
    expectedOutputAmount: jitoSolBaseUnits,
    fees: {
      networkLamports: 5000n,
    },
    warnings: [
      "Instant withdrawal via the stake pool reserve incurs a small fee (~0.04%). Larger unstakes may also be limited by available reserve liquidity.",
    ],
  };
}

export const jitoSolUnstakeAdapter: ProtocolAdapter = {
  catalogItemId: CATALOG_ITEM.id,
  catalogItem: CATALOG_ITEM,
  widgets: WIDGETS,
  protocol: PROTOCOL,
  readPosition,
  readRate,
  buildTransaction,
};
