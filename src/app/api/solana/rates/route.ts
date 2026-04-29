import { NextResponse } from "next/server";

import { registerAllAdapters } from "@/lib/solana/adapters";
import { getAdapter } from "@/lib/solana/registry";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  registerAllAdapters();

  const url = new URL(request.url);
  const catalogItemId = url.searchParams.get("catalogItemId");

  if (!catalogItemId) {
    return NextResponse.json(
      { error: "missing ?catalogItemId=<id>" },
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
    const rate = await adapter.readRate();
    return NextResponse.json({
      catalogItemId,
      protocol: adapter.protocol,
      rate,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "adapter readRate failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
