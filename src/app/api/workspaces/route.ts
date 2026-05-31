import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser, UnauthorizedError } from "@/lib/auth/privy-server";
import { db } from "@/lib/db/client";
import { workspaces } from "@/lib/db/schema";

export const runtime = "nodejs";

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, digits, or hyphens")
    .optional(),
});

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `workspace-${suffix}`;
}

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

  const rows = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, user.id))
    .orderBy(desc(workspaces.updatedAt));

  return NextResponse.json({ workspaces: rows });
}

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
  const parsed = CreateWorkspaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const slug = parsed.data.slug ?? slugify(parsed.data.name);

  const [row] = await db
    .insert(workspaces)
    .values({ userId: user.id, name: parsed.data.name, slug })
    .returning();

  return NextResponse.json({ workspace: row }, { status: 201 });
}
