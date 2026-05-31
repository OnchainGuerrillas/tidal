import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

loadEnv({ path: ".env.local" });

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL_UNPOOLED (preferred) or DATABASE_URL in .env.local before running drizzle-kit.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./src/lib/db/migrations",
  dbCredentials: {
    url: connectionString,
  },
  verbose: true,
  strict: true,
});
