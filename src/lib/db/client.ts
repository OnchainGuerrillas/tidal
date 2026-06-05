import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let cached: Db | null = null;

function buildDb(): Db {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add the Neon pooled connection string to the environment.",
    );
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

/**
 * Lazily-constructed Drizzle client. The connection string is read on first
 * access, not at module load, so routes that never touch the DB can build
 * without DATABASE_URL set. Routes that do touch the DB will throw at the
 * first query if the env is missing — which surfaces as a 500 from that
 * specific endpoint instead of a build-time failure.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    cached ??= buildDb();
    const value = Reflect.get(cached, prop, cached);
    return typeof value === "function" ? value.bind(cached) : value;
  },
});

export { schema };
