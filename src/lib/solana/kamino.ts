import "server-only";

import {
  KaminoAction,
  PROGRAM_ID,
  VanillaObligation,
} from "@kamino-finance/klend-sdk";
import { address } from "@solana/kit";
import { createNoopSigner } from "@solana/signers";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { getAdapterCatalogEntry } from "./adapter-catalog";
import { getSolanaRpc, getSolanaWeb3Connection } from "./connection";
import {
  KAMINO_PROTOCOL_METADATA,
  USDC_MINT_ADDRESS,
  kitIxToWeb3Ix,
  loadKaminoMainMarket,
  type KitInstruction,
} from "./kamino-shared";
import type {
  APYQuote,
  BuildTransactionParams,
  BuildTransactionResult,
  PositionSnapshot,
  ProtocolAdapter,
  ReadPositionParams,
  WidgetSchema,
} from "./types";

// Re-exported for callers that imported these from kamino.ts before the
// shared-module split (jupiter-swap.ts in particular).
export { USDC_MINT_ADDRESS, KAMINO_MAIN_MARKET_ADDRESS } from "./kamino-shared";

const ENTRY = getAdapterCatalogEntry("kamino-usdc-supply")!;
const CATALOG_ITEM = ENTRY.catalogItem;
const WIDGETS: WidgetSchema[] = ENTRY.widgets;

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
  const market = await loadKaminoMainMarket();
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

async function buildTransaction(
  params: BuildTransactionParams,
): Promise<BuildTransactionResult> {
  const amount = params.inputAmount;
  if (amount <= 0n) {
    throw new Error(
      `Kamino supply requires a positive amount (got ${amount.toString()})`,
    );
  }

  const market = await loadKaminoMainMarket();

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
    transactionsBase64: [transactionBase64],
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
  protocol: KAMINO_PROTOCOL_METADATA,
  readPosition,
  readRate,
  buildTransaction,
};
