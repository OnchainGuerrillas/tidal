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

export type LinkedAccount =
  | {
      kind: "wallet";
      address: string;
      chainType: string | null;
      walletClientType: string | null;
    }
  | { kind: "email"; email: string }
  | { kind: "oauth"; provider: string; email: string | null };

export type PrivyProfileSnapshot = {
  primaryWalletAddress: string | null;
  email: string | null;
  linkedAccounts: LinkedAccount[];
};

function sanitizeLinkedAccounts(
  raw: Array<{ type: string } & Record<string, unknown>>,
): LinkedAccount[] {
  const out: LinkedAccount[] = [];
  for (const account of raw) {
    if (account.type === "wallet" && typeof account.address === "string") {
      out.push({
        kind: "wallet",
        address: account.address,
        chainType: typeof account.chainType === "string" ? account.chainType : null,
        walletClientType:
          typeof account.walletClientType === "string"
            ? account.walletClientType
            : null,
      });
    } else if (account.type === "email" && typeof account.address === "string") {
      out.push({ kind: "email", email: account.address });
    } else if (account.type.endsWith("_oauth")) {
      out.push({
        kind: "oauth",
        provider: account.type.replace(/_oauth$/, ""),
        email: typeof account.email === "string" ? account.email : null,
      });
    }
  }
  return out;
}

/**
 * Fetches the Privy user, returning a sanitized snapshot of identity-relevant
 * fields. Used by /api/me to populate the profile sheet.
 */
export async function getPrivyProfileSnapshot(
  privyUserId: string,
): Promise<PrivyProfileSnapshot | null> {
  const user = await privy.getUserById(privyUserId);
  if (!user) return null;

  const linkedAccounts = sanitizeLinkedAccounts(
    user.linkedAccounts as unknown as Array<
      { type: string } & Record<string, unknown>
    >,
  );

  const wallets = linkedAccounts.filter(
    (a): a is Extract<LinkedAccount, { kind: "wallet" }> => a.kind === "wallet",
  );
  const solana = wallets.find((w) => w.chainType === "solana") ?? wallets[0] ?? null;
  const emailAccount = linkedAccounts.find(
    (a): a is Extract<LinkedAccount, { kind: "email" }> => a.kind === "email",
  );

  return {
    primaryWalletAddress: solana?.address ?? null,
    email: emailAccount?.email ?? null,
    linkedAccounts,
  };
}

/**
 * Persists primaryWalletAddress on the users row if it's currently null.
 * Returns the (possibly updated) snapshot for downstream rendering.
 */
export async function ensurePrimaryWallet(
  user: User,
): Promise<PrivyProfileSnapshot> {
  const snapshot = (await getPrivyProfileSnapshot(user.privyUserId)) ?? {
    primaryWalletAddress: null,
    email: null,
    linkedAccounts: [],
  };

  if (!user.primaryWalletAddress && snapshot.primaryWalletAddress) {
    await db
      .update(users)
      .set({
        primaryWalletAddress: snapshot.primaryWalletAddress,
        updatedAt: sql`now()`,
      })
      .where(eq(users.id, user.id));
  } else if (user.primaryWalletAddress && !snapshot.primaryWalletAddress) {
    snapshot.primaryWalletAddress = user.primaryWalletAddress;
  }

  return snapshot;
}
