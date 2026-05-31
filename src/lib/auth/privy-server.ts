import "server-only";

import { PrivyClient } from "@privy-io/server-auth";
import { eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/lib/db/client";
import { users, type User } from "@/lib/db/schema";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const appSecret = process.env.PRIVY_SECRET_KEY;

if (!appId || !appSecret) {
  throw new Error(
    "Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_SECRET_KEY in .env.local.",
  );
}

const privy = new PrivyClient(appId, appSecret);

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function extractToken(req: Request | NextRequest): string | null {
  const header = req.headers.get("authorization");
  if (header && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [rawName, ...rest] = part.split("=");
    if (!rawName) continue;
    if (rawName.trim() === "privy-token") {
      return decodeURIComponent(rest.join("=")).trim() || null;
    }
  }
  return null;
}

/**
 * Verifies the request's Privy auth token, upserts the users row keyed on
 * privy_user_id, and returns the DB user. Throws UnauthorizedError if the
 * token is missing or invalid.
 */
export async function requireUser(req: Request | NextRequest): Promise<User> {
  const token = extractToken(req);
  if (!token) throw new UnauthorizedError("missing auth token");

  let claims;
  try {
    claims = await privy.verifyAuthToken(token);
  } catch {
    throw new UnauthorizedError("invalid auth token");
  }

  const privyUserId = claims.userId;
  if (!privyUserId) throw new UnauthorizedError("token missing userId");

  const [row] = await db
    .insert(users)
    .values({ privyUserId })
    .onConflictDoUpdate({
      target: users.privyUserId,
      set: { updatedAt: sql`now()` },
    })
    .returning();

  return row;
}

/**
 * Returns the linked Solana wallet address for a Privy user, or null if none.
 * Used to populate users.primary_wallet_address lazily on first /api/me hit.
 */
export async function getPrimarySolanaWallet(
  privyUserId: string,
): Promise<string | null> {
  const user = await privy.getUserById(privyUserId);
  if (!user) return null;
  const wallets = user.linkedAccounts.filter(
    (a): a is typeof a & { type: "wallet"; address: string; chainType?: string } =>
      a.type === "wallet" && typeof (a as { address?: unknown }).address === "string",
  );
  const solana = wallets.find((w) => w.chainType === "solana") ?? wallets[0];
  return solana?.address ?? null;
}

/**
 * Persists primaryWalletAddress on the users row if it's currently null.
 * Returns the (possibly updated) wallet address.
 */
export async function ensurePrimaryWallet(user: User): Promise<string | null> {
  if (user.primaryWalletAddress) return user.primaryWalletAddress;
  const address = await getPrimarySolanaWallet(user.privyUserId);
  if (!address) return null;
  await db
    .update(users)
    .set({ primaryWalletAddress: address, updatedAt: sql`now()` })
    .where(eq(users.id, user.id));
  return address;
}
