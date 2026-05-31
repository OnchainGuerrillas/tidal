import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { ensurePrimaryWallet, requireUser, UnauthorizedError } from "@/lib/auth/privy-server";
import { db } from "@/lib/db/client";
import { runHistory, workspaces } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const walletAddress = await ensurePrimaryWallet(user);

  const userWorkspaces = await db
    .select({
      id: workspaces.id,
      slug: workspaces.slug,
      name: workspaces.name,
      createdAt: workspaces.createdAt,
      updatedAt: workspaces.updatedAt,
      lastRunAt: workspaces.lastRunAt,
    })
    .from(workspaces)
    .where(eq(workspaces.userId, user.id))
    .orderBy(desc(workspaces.updatedAt));

  const lastRunRows = await db
    .select({
      id: runHistory.id,
      workspaceId: runHistory.workspaceId,
      status: runHistory.status,
      startedAt: runHistory.startedAt,
      completedAt: runHistory.completedAt,
    })
    .from(runHistory)
    .innerJoin(workspaces, eq(workspaces.id, runHistory.workspaceId))
    .where(eq(workspaces.userId, user.id))
    .orderBy(desc(runHistory.startedAt))
    .limit(1);

  return NextResponse.json({
    user: {
      id: user.id,
      privyUserId: user.privyUserId,
      displayName: user.displayName,
      primaryWalletAddress: walletAddress,
      createdAt: user.createdAt,
    },
    workspaces: userWorkspaces,
    lastRun: lastRunRows[0] ?? null,
  });
}
