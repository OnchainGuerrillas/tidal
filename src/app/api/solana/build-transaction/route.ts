import { NextResponse } from "next/server";

import { registerAllAdapters } from "@/lib/solana/adapters";
import { getAdapter } from "@/lib/solana/registry";

export const runtime = "nodejs";

type BuildTransactionRequestBody = {
  catalogItemId?: unknown;
  walletPublicKey?: unknown;
  inputAmount?: unknown;
  widgets?: unknown;
};

export async function POST(request: Request): Promise<NextResponse> {
  registerAllAdapters();

  let body: BuildTransactionRequestBody;
  try {
    body = (await request.json()) as BuildTransactionRequestBody;
  } catch {
    return NextResponse.json(
      { error: "request body must be valid JSON" },
      { status: 400 },
    );
  }

  const { catalogItemId, walletPublicKey, inputAmount, widgets } = body;

  if (typeof catalogItemId !== "string" || catalogItemId.length === 0) {
    return NextResponse.json(
      { error: "catalogItemId (string) is required" },
      { status: 400 },
    );
  }
  if (typeof walletPublicKey !== "string" || walletPublicKey.length === 0) {
    return NextResponse.json(
      { error: "walletPublicKey (string) is required" },
      { status: 400 },
    );
  }
  if (typeof inputAmount !== "string" || !/^\d+$/.test(inputAmount)) {
    return NextResponse.json(
      {
        error:
          "inputAmount must be a decimal string of raw base units (e.g., lamports). JSON cannot carry bigint natively.",
      },
      { status: 400 },
    );
  }

  const adapter = getAdapter(catalogItemId);
  if (!adapter) {
    return NextResponse.json(
      { error: `no adapter registered for "${catalogItemId}"` },
      { status: 404 },
    );
  }

  try {
    const result = await adapter.buildTransaction({
      walletPublicKey,
      inputAmount: BigInt(inputAmount),
      widgets:
        widgets && typeof widgets === "object"
          ? (widgets as Record<string, unknown>)
          : {},
    });
    return NextResponse.json({
      transactionsBase64: result.transactionsBase64,
      expectedOutputAmount: result.expectedOutputAmount.toString(),
      fees: {
        networkLamports: result.fees.networkLamports.toString(),
        priorityLamports: result.fees.priorityLamports?.toString(),
      },
      warnings: result.warnings ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "buildTransaction failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
