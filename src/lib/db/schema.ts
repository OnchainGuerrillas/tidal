import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    privyUserId: text("privy_user_id").notNull(),
    primaryWalletAddress: text("primary_wallet_address"),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_privy_user_id_idx").on(table.privyUserId)],
);

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    chain: text("chain").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("wallets_address_chain_idx").on(table.address, table.chain)],
);

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("workspaces_user_slug_idx").on(table.userId, table.slug)],
);

export const workspaceGraphs = pgTable(
  "workspace_graphs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    nodesJson: jsonb("nodes_json").$type<unknown[]>().notNull(),
    edgesJson: jsonb("edges_json").$type<unknown[]>().notNull(),
    metadataJson: jsonb("metadata_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("workspace_graphs_workspace_version_idx").on(
      table.workspaceId,
      table.version,
    ),
  ],
);

export const runHistory = pgTable("run_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  graphVersion: integer("graph_version").notNull(),
  walletAddress: text("wallet_address").notNull(),
  status: text("status", { enum: ["success", "partial", "failed"] }).notNull(),
  txSignatures: jsonb("tx_signatures").$type<string[]>().notNull().default([]),
  eventsJson: jsonb("events_json").$type<unknown[]>().notNull().default([]),
  failureNodeId: text("failure_node_id"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type WorkspaceGraph = typeof workspaceGraphs.$inferSelect;
export type NewWorkspaceGraph = typeof workspaceGraphs.$inferInsert;
export type RunHistoryRow = typeof runHistory.$inferSelect;
export type NewRunHistory = typeof runHistory.$inferInsert;
