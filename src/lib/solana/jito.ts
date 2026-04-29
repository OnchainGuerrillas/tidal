import "server-only";

import { address } from "@solana/kit";
import { depositSol } from "@solana/spl-stake-pool";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { getAdapterCatalogEntry } from "./adapter-catalog";
import { getSolanaRpc, getSolanaWeb3Connection } from "./connection";
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

export const JITOSOL_MINT_ADDRESS =
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn";

export const JITO_STAKE_POOL_ADDRESS =
  "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb";

const ENTRY = getAdapterCatalogEntry("jito-sol-stake")!;
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

type ParsedTokenAccountInfo = {
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number | null;
  };
};

async function readPosition(
  params: ReadPositionParams,
): Promise<PositionSnapshot | null> {
  const rpc = getSolanaRpc();
  const owner = address(params.walletPublicKey);
  const mint = address(JITOSOL_MINT_ADDRESS);

  const response = await rpc
    .getTokenAccountsByOwner(owner, { mint }, { encoding: "jsonParsed" })
    .send();

  const accounts = response.value;
  if (accounts.length === 0) {
    return null;
  }

  let totalRaw = 0n;
  let decimals = 9;
  for (const entry of accounts) {
    const parsed = entry.account.data as {
      parsed: { info: ParsedTokenAccountInfo };
    };
    const info = parsed.parsed.info;
    totalRaw += BigInt(info.tokenAmount.amount);
    decimals = info.tokenAmount.decimals;
  }

  return {
    asset: "JitoSOL",
    rawAmount: totalRaw,
    displayAmount: `${formatTokenAmount(totalRaw, decimals, 4)} JitoSOL`,
    lastUpdatedAt: Date.now(),
  };
}

async function readRate(): Promise<APYQuote> {
  // Stub: ships Phase 1 only as a placeholder. Real APY is derived from
  // the Jito stake pool account state (exchange rate delta over recent
  // epochs) or fetched from the Jito public yield endpoint. Replace
  // before P2 write paths land.
  return {
    apy: 0.059,
    apyBreakdown: { base: 0.052, mev: 0.007 },
    fetchedAt: Date.now(),
  };
}

async function buildTransaction(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  const lamports = params.inputAmount;
  if (lamports <= 0n) {
    throw new Error(
      `JitoSOL stake requires a positive lamport amount (got ${lamports.toString()})`,
    );
  }
  // @solana/spl-stake-pool's depositSol takes a JS number for lamports.
  // Guard against overflow before converting.
  if (lamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(
      `stake amount exceeds JS number safe range: ${lamports.toString()} lamports`,
    );
  }

  const connection = getSolanaWeb3Connection();
  const fromPubkey = new PublicKey(params.walletPublicKey);
  const stakePool = new PublicKey(JITO_STAKE_POOL_ADDRESS);

  const { instructions, signers } = await depositSol(
    connection,
    stakePool,
    fromPubkey,
    Number(lamports),
  );

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);

  // The SPL stake pool depositSol helper routes funds through a fresh
  // ephemeral SOL account. That account signs the intermediate hop but
  // the user still signs for the fee-payer slot. We partial-sign here
  // so the client only has to add the user's signature via Privy.
  if (signers.length > 0) {
    tx.sign(signers);
  }

  const transactionBase64 = Buffer.from(tx.serialize()).toString("base64");

  const warnings: string[] = [];
  const minStakeLamports = 10_000_000n; // 0.01 SOL, conservative floor
  if (lamports < minStakeLamports) {
    warnings.push(
      `staking ${lamports.toString()} lamports (< 0.01 SOL) - small-stake economics may not be worthwhile after fees`,
    );
  }

  return {
    transactionBase64,
    // Stake pool exchange rate is >= 1.0 (JitoSOL appreciates vs SOL over
    // time). We return the input lamports as a lower bound; the actual
    // JitoSOL minted is slightly less because of the stake pool's deposit
    // fee and the exchange-rate denominator. Fetching the pool's exact
    // rate for an accurate quote is a follow-up.
    expectedOutputAmount: lamports,
    fees: {
      networkLamports: 5000n,
    },
    warnings,
  };
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

export const jitoStakeAdapter: ProtocolAdapter = {
  catalogItemId: CATALOG_ITEM.id,
  catalogItem: CATALOG_ITEM,
  widgets: WIDGETS,
  protocol: PROTOCOL,
  readPosition,
  readRate,
  buildTransaction,
};
