import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ensurePrimaryWallet, requireUser, UnauthorizedError } from "@/lib/auth/privy-server";
import { db } from "@/lib/db/client";
import { runHistory, users, workspaces } from "@/lib/db/schema";

export const runtime = "nodejs";

const RECENT_RUNS_LIMIT = 5;

async function loadUserOrUnauthorized(req: Request) {
  try {
    const user = await requireUser(req);
    return { user, error: null as null };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return {
        user: null,
        error: NextResponse.json({ error: err.message }, { status: 401 }),
      };
    }
    throw err;
  }
}

export async function GET(req: Request) {
  const { user, error } = await loadUserOrUnauthorized(req);
  if (error) return error;

  const snapshot = await ensurePrimaryWallet(user);

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

  const recentRuns = await db
    .select({
      id: runHistory.id,
      workspaceId: runHistory.workspaceId,
      workspaceName: workspaces.name,
      workspaceSlug: workspaces.slug,
      status: runHistory.status,
      txSignatures: runHistory.txSignatures,
      startedAt: runHistory.startedAt,
      completedAt: runHistory.completedAt,
    })
    .from(runHistory)
    .innerJoin(workspaces, eq(workspaces.id, runHistory.workspaceId))
    .where(eq(workspaces.userId, user.id))
    .orderBy(desc(runHistory.startedAt))
    .limit(RECENT_RUNS_LIMIT);

  return NextResponse.json({
    user: {
      id: user.id,
      privyUserId: user.privyUserId,
      displayName: user.displayName,
      primaryWalletAddress: snapshot.primaryWalletAddress,
      email: snapshot.email,
      createdAt: user.createdAt,
    },
    linkedAccounts: snapshot.linkedAccounts,
    workspaces: userWorkspaces,
    recentRuns,
  });
}

const PatchSchema = z.object({
  displayName: z.string().trim().min(1).max(60).nullable(),
});

export async function PATCH(req: Request) {
  const { user, error } = await loadUserOrUnauthorized(req);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(users)
    .set({
      displayName: parsed.data.displayName,
      updatedAt: sql`now()`,
    })
    .where(eq(users.id, user.id))
    .returning();

  return NextResponse.json({
    user: {
      id: updated.id,
      displayName: updated.displayName,
    },
  });
}
