import { and, desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser, UnauthorizedError } from "@/lib/auth/privy-server";
import { db } from "@/lib/db/client";
import { workspaceGraphs, workspaces } from "@/lib/db/schema";

export const runtime = "nodejs";

const SaveGraphSchema = z.object({
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

async function loadOwnedWorkspace(workspaceId: string, userId: string) {
  const [row] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)));
  return row ?? null;
}

export async function GET(req: Request, ctx: RouteContext) {
  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id } = await ctx.params;
  const workspace = await loadOwnedWorkspace(id, user.id);
  if (!workspace) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [latestGraph] = await db
    .select()
    .from(workspaceGraphs)
    .where(eq(workspaceGraphs.workspaceId, id))
    .orderBy(desc(workspaceGraphs.version))
    .limit(1);

  return NextResponse.json({ workspace, graph: latestGraph ?? null });
}

export async function PUT(req: Request, ctx: RouteContext) {
  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id } = await ctx.params;
  const workspace = await loadOwnedWorkspace(id, user.id);
  if (!workspace) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SaveGraphSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [latest] = await db
    .select({ version: workspaceGraphs.version })
    .from(workspaceGraphs)
    .where(eq(workspaceGraphs.workspaceId, id))
    .orderBy(desc(workspaceGraphs.version))
    .limit(1);

  const nextVersion = (latest?.version ?? 0) + 1;

  const [graph] = await db
    .insert(workspaceGraphs)
    .values({
      workspaceId: id,
      version: nextVersion,
      nodesJson: parsed.data.nodes,
      edgesJson: parsed.data.edges,
      metadataJson: parsed.data.metadata ?? null,
    })
    .returning();

  await db
    .update(workspaces)
    .set({ updatedAt: sql`now()` })
    .where(eq(workspaces.id, id));

  return NextResponse.json({ graph }, { status: 201 });
}
