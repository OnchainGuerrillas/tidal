# Tidal Prototype

Frontend and design experimentation repo for Tidal, a Solana DeFi product concept.

This repo is prototype-only. It exists to explore the unified workspace experience, visual language, graph interactions, side panels, and integration-facing frontend structure before the work moves into a production application.

## Core Rules

- Workspace UI consumes data through `src/providers/*`; mock seeds live in `src/mock-data/*`.
- Workspace UI components do not import from `src/lib/solana/*`, `src/lib/db/*`, or SDK clients directly — route through providers or API routes.
- Backend integration is in active development: adapters (`src/lib/solana/*`), DB (`src/lib/db/*`), auth (`src/lib/auth/*`), and API routes (`src/app/api/*`) are in scope. See `CLAUDE.md` and `docs/post-hackathon-roadmap.md`.
- Use Bun for package and script commands.

## Current Product Shape

The live product is a single unified **workspace** experience.

A workspace is a node-based canvas with five contextual side panels:

- **Nodes**: searchable catalog of nodes that can be dropped onto the canvas.
- **Chat**: mocked per-workspace transcript and chat history.
- **Investments**: mocked active positions and performance chart.
- **Discover**: mocked recommendations and discovery opportunities.
- **Templates**: placeholder gallery of starter graphs and teaching examples.

Multiple workspaces can be open at once and are shown as tabs in the header. Workspace URLs are top-level routes such as:

```text
/workspace-sol-yield-loop
```

Earlier Home, Pool, Swap, Global Chat, and Amplify experiments are archived under `_archive/`. They are reference material only and are not part of the live app.

## Quick Start

```bash
bun install
bun run dev
```

Useful commands:

```bash
bun run lint
bun run build
bun run db:generate   # generate a new SQL migration from src/lib/db/schema.ts
bun run db:migrate    # apply pending migrations to the Neon DB
bun run db:studio     # open Drizzle Studio against the configured DB
```

This project currently uses `next/font/google` for Inter, so production builds may need network access for the font fetch unless that is changed to a local font.

## Environment Variables

All env vars live in `.env.local` (gitignored). Server-only secrets must not have the `NEXT_PUBLIC_` prefix.

| Var | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | public | Privy app identifier for the wallet/auth provider. |
| `PRIVY_SECRET_KEY` | server | Privy app secret used by `@privy-io/server-auth` to verify access tokens. |
| `HELIUS_RPC_URL` | server | Solana RPC endpoint (Helius), used by `src/lib/solana/connection.ts`. |
| `ANTHROPIC_API_KEY` | server | Used by `/api/chat` (Vercel AI SDK + Claude). |
| `DATABASE_URL` | server | Neon **pooled** connection string (hostname contains `-pooler`). Used by runtime app code. |
| `DATABASE_URL_UNPOOLED` | server | Neon **unpooled/direct** connection string (no `-pooler` in hostname). Used by `drizzle-kit` and `bun run db:migrate`. |

## Database (Neon)

Persistence layer for user profiles, workspaces, graph versions, and run history. Schema lives in `src/lib/db/schema.ts`; the Drizzle client is `src/lib/db/client.ts`.

Initial setup against a fresh Neon project:

```bash
bun run db:generate   # creates SQL files under src/lib/db/migrations/
bun run db:migrate    # applies them to DATABASE_URL_UNPOOLED
```

Tables: `users`, `wallets`, `workspaces`, `workspace_graphs` (versioned graph snapshots), `run_history` (graph execution records).

## Live Backend Routes

- `/api/me` — authenticated user profile + workspaces + last run.
- `/api/workspaces` — list (`GET`) and create (`POST`) the caller's workspaces.
- `/api/workspaces/[id]` — load workspace + latest graph version (`GET`), save a new graph version (`PUT`).
- `/api/runs` — record a `run_history` row from `executeGraph` completions (`POST`).
- `/api/chat` — AI compose-strategy endpoint (Vercel AI SDK + Claude).
- `/api/solana/*` — protocol adapter routes (rates, positions, build/submit transaction, RPC proxy, prices).

## Live Routes

- `src/app/layout.tsx`: app shell and providers.
- `src/app/page.tsx`: root bootstrap route that moves to the active workspace.
- `src/app/[workspaceId]/page.tsx`: addressable workspace route.

There are no live `/pool`, `/swap`, `/chat`, `/home`, or `/amplify` routes.

## Folder Map

```text
src/app
  Next.js routes, global layout, and global CSS

src/components/ui
  generic reusable UI primitives

src/components/tidal
  branded Tidal components and app shell pieces

src/components/workspace
  the live product surface: canvas, nodes, panels, cards, and picker

src/providers
  mocked client-side app state

src/hooks/workspace
  React Flow canvas behavior and graph interaction state

src/lib/workspace
  pure graph, picker, and status helpers

src/mock-data/shell
  mocked shell and preference data

src/mock-data/workspace
  mocked workspace data, types, catalog, graph seeds, investments, discover, templates

docs
  product and architecture documentation

_archive
  frozen reference code from earlier experiments, excluded from the live app
```

## Architecture At A Glance

Data flow is intentionally simple:

```text
src/mock-data/*
  -> src/providers/*
  -> src/components/workspace/workspace-screen.tsx
  -> workspace panels, canvas nodes, and tidal components
```

The main composition file is `src/components/workspace/workspace-screen.tsx`.

It coordinates:

- the active workspace
- the active side panel
- React Flow nodes and edges
- node creation from the Nodes panel and node picker
- mocked draft/run states
- node edit context for canvas node components

The React Flow canvas is client-only. It is dynamically loaded with SSR disabled to avoid hydration mismatches caused by browser-measured viewport transforms.

## Important Graph Convention

Keep graph identity and display text separate.

- `WorkspaceNodeOutput.asset` is the canonical asset used for compatibility checks.
- `WorkspaceNodeOutput.amountLabel` is display text.
- Edge `data.asset` is a display label.

For example, a split output should use:

```ts
{
  asset: "mSOL",
  amountLabel: "50% mSOL"
}
```

Do not put `50% mSOL` into `asset`, because downstream compatibility checks expect canonical assets such as `SOL`, `USDC`, or `mSOL`.

## Docs

- `docs/architecture.md`: current live architecture and integration guidance.
- `docs/product-vision.md`: product vision.
- `docs/product-strategy.md`: product strategy.
- `docs/codex-refactor.md`: historical frontend cleanup playbook.
- `_archive/README.md`: archive contents and rules.

## Development Notes

- Route files should stay thin.
- Mock content should live in `src/mock-data`, not inside UI components.
- Product-specific UI should live under `src/components/workspace`.
- Reusable branded UI should live under `src/components/tidal`.
- Generic primitives should stay under `src/components/ui`.
- Prefer semantic classes in `src/app/globals.css` over repeated one-off Tailwind values.
- Do not import from `_archive/` into live code.
