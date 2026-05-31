import { config as loadEnv } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

loadEnv({ path: ".env.local" });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL_UNPOOLED (preferred) or DATABASE_URL in .env.local before running migrations.",
  );
}

async function main() {
  const sql = neon(connectionString!);
  const db = drizzle(sql);

  console.log("[migrate] applying migrations from src/lib/db/migrations …");
  await migrate(db, { migrationsFolder: "src/lib/db/migrations" });
  console.log("[migrate] done.");
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
