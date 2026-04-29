import "server-only";

import {
  KaminoAction,
  KaminoMarket,
  PROGRAM_ID,
  VanillaObligation,
} from "@kamino-finance/klend-sdk";
import { address } from "@solana/kit";
import { createNoopSigner } from "@solana/signers";
import {
  PublicKey,
  TransactionInstruction,
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

export const USDC_MINT_ADDRESS =
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

// Kamino main market (primary USDC/SOL lending market on Solana mainnet).
export const KAMINO_MAIN_MARKET_ADDRESS =
  "7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF";

// Typical Solana mainnet slot time is ~400-450ms. Kamino uses this to
// annualize accrued interest for APR/APY calculations.
const RECENT_SLOT_DURATION_MS = 450;

const ENTRY = getAdapterCatalogEntry("kamino-usdc-supply")!;
const CATALOG_ITEM = ENTRY.catalogItem;
const WIDGETS: WidgetSchema[] = ENTRY.widgets;

const PROTOCOL: ProtocolMetadata = {
  id: "kamino",
  name: "Kamino",
  auditCount: 3,
  tvlUsd: 3_000_000_000,
  ageMonths: 30,
  riskTier: "shallows",
};

async function loadMainMarket(): Promise<KaminoMarket> {
  const rpc = getSolanaRpc();
  // Kamino's klend-sdk bundles @solana/kit v2; our app uses v6 via Privy's
  // peer dep. Runtime RPC shape is compatible (JSON-RPC is JSON-RPC) but
  // the branded types diverge. The casts here pin types at the SDK boundary.
  const market = await KaminoMarket.load(
    rpc as unknown as Parameters<typeof KaminoMarket.load>[0],
    address(KAMINO_MAIN_MARKET_ADDRESS) as unknown as Parameters<
      typeof KaminoMarket.load
    >[1],
    RECENT_SLOT_DURATION_MS,
    PROGRAM_ID,
    true,
  );
  if (!market) {
    throw new Error(
      `Kamino main market not found at ${KAMINO_MAIN_MARKET_ADDRESS}`,
    );
  }
  return market;
}

async function readPosition(
  params: ReadPositionParams,
): Promise<PositionSnapshot | null> {
  // Obligation reading is deferred until the write path lands. Users
  // that have not deposited into Kamino do not have an obligation
  // account, and returning null for them is the correct shape. Real
  // obligation reads for existing depositors arrive in the follow-up
  // commit alongside buildTransaction.
  void params;
  return null;
}

async function readRate(): Promise<APYQuote> {
  const rpc = getSolanaRpc();
  const market = await loadMainMarket();
  const reserve = market.getReserveByMint(
    address(USDC_MINT_ADDRESS) as unknown as Parameters<
      typeof market.getReserveByMint
    >[0],
  );
  if (!reserve) {
    throw new Error(
      `Kamino main market has no USDC reserve (expected mint ${USDC_MINT_ADDRESS})`,
    );
  }
  const slot = await rpc.getSlot().send();
  const apy = Number(
    reserve.totalSupplyAPY(
      slot as unknown as Parameters<typeof reserve.totalSupplyAPY>[0],
    ),
  );
  return {
    apy,
    fetchedAt: Date.now(),
  };
}

type KitInstruction = {
  programAddress: string;
  accounts?: ReadonlyArray<{ address: string; role: number }>;
  data?: Uint8Array;
};

// @solana/instructions AccountRole is a 2-bit field: bit 0 = writable,
// bit 1 = signer. Using bit math sidesteps the kit v2/v6 enum mismatch.
function kitIxToWeb3Ix(ix: KitInstruction): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(ix.programAddress),
    keys: (ix.accounts ?? []).map((acc) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: (acc.role & 0b10) !== 0,
      isWritable: (acc.role & 0b01) !== 0,
    })),
    data: Buffer.from(ix.data ?? new Uint8Array()),
  });
}

async function buildTransaction(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  const amount = params.inputAmount;
  if (amount <= 0n) {
    throw new Error(
      `Kamino supply requires a positive amount (got ${amount.toString()})`,
    );
  }

  const market = await loadMainMarket();

  const owner = createNoopSigner(address(params.walletPublicKey));
  const obligation = new VanillaObligation(PROGRAM_ID);

  type DepositArgs = Parameters<typeof KaminoAction.buildDepositTxns>;
  const kaminoAction = await KaminoAction.buildDepositTxns(
    market as unknown as DepositArgs[0],
    amount.toString(),
    address(USDC_MINT_ADDRESS) as unknown as DepositArgs[2],
    owner as unknown as DepositArgs[3],
    obligation as unknown as DepositArgs[4],
    false,
    undefined,
  );

  const allKitIxs = [
    ...kaminoAction.setupIxs,
    ...kaminoAction.lendingIxs,
    ...kaminoAction.cleanupIxs,
  ] as unknown as KitInstruction[];

  const web3Ixs = allKitIxs.map(kitIxToWeb3Ix);

  const connection = getSolanaWeb3Connection();
  const fromPubkey = new PublicKey(params.walletPublicKey);
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({
    payerKey: fromPubkey,
    recentBlockhash: blockhash,
    instructions: web3Ixs,
  }).compileToV0Message();
  const tx = new VersionedTransaction(message);
  const transactionBase64 = Buffer.from(tx.serialize()).toString("base64");

  return {
    // Expected output is approximately 1:1 - Kamino kTokens mint at a
    // pool exchange rate >= 1.0 that rises with accrued interest. For
    // a first supply, amount in raw USDC units is a close lower bound.
    // Computing the exact kToken amount is deferred.
    transactionBase64,
    expectedOutputAmount: amount,
    fees: {
      networkLamports: 5000n,
    },
    warnings: [],
  };
}

export const kaminoUsdcSupplyAdapter: ProtocolAdapter = {
  catalogItemId: CATALOG_ITEM.id,
  catalogItem: CATALOG_ITEM,
  widgets: WIDGETS,
  protocol: PROTOCOL,
  readPosition,
  readRate,
  buildTransaction,
};
