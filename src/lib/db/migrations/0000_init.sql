CREATE TABLE "run_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"graph_version" integer NOT NULL,
	"wallet_address" text NOT NULL,
	"status" text NOT NULL,
	"tx_signatures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"events_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failure_node_id" text,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"privy_user_id" text NOT NULL,
	"primary_wallet_address" text,
	"display_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"chain" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_graphs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"nodes_json" jsonb NOT NULL,
	"edges_json" jsonb NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_run_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "run_history" ADD CONSTRAINT "run_history_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_graphs" ADD CONSTRAINT "workspace_graphs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_privy_user_id_idx" ON "users" USING btree ("privy_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_address_chain_idx" ON "wallets" USING btree ("address","chain");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_graphs_workspace_version_idx" ON "workspace_graphs" USING btree ("workspace_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_user_slug_idx" ON "workspaces" USING btree ("user_id","slug");