import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser, UnauthorizedError } from "@/lib/auth/privy-server";
import { db } from "@/lib/db/client";
import { runHistory, workspaces } from "@/lib/db/schema";

export const runtime = "nodejs";

const RecordRunSchema = z.object({
  workspaceId: z.string().uuid(),
  graphVersion: z.number().int().nonnegative(),
  walletAddress: z.string().min(32).max(64),
  status: z.enum(["success", "partial", "failed"]),
  txSignatures: z.array(z.string()).default([]),
  events: z.array(z.unknown()).default([]),
  failureNodeId: z.string().nullable().optional(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable().optional(),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const body = await req.json().catch(() => null);
  const parsed = RecordRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [owned] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(
      and(eq(workspaces.id, parsed.data.workspaceId), eq(workspaces.userId, user.id)),
    );
  if (!owned) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const startedAt = new Date(parsed.data.startedAt);
  const completedAt = parsed.data.completedAt ? new Date(parsed.data.completedAt) : null;

  const [row] = await db
    .insert(runHistory)
    .values({
      workspaceId: parsed.data.workspaceId,
      graphVersion: parsed.data.graphVersion,
      walletAddress: parsed.data.walletAddress,
      status: parsed.data.status,
      txSignatures: parsed.data.txSignatures,
      eventsJson: parsed.data.events,
      failureNodeId: parsed.data.failureNodeId ?? null,
      startedAt,
      completedAt,
    })
    .returning();

  await db
    .update(workspaces)
    .set({ lastRunAt: completedAt ?? startedAt, updatedAt: sql`now()` })
    .where(eq(workspaces.id, parsed.data.workspaceId));

  return NextResponse.json({ run: row }, { status: 201 });
}
