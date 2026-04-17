# AGENTS.md

## Project

Tidal Prototype is a frontend and design experimentation repo for a Solana DeFi product concept. It is not the production app.

The live product is a single unified **workspace** experience. A workspace combines:

- a React Flow node canvas
- per-workspace chat transcript and chat history
- active investments panel
- discovery/recommendation panel
- node catalog panel
- template gallery panel

Multiple workspaces are available as tabs in the header. Workspace URLs are top-level routes like `/<workspaceId>`.

## Hard Constraints

- All product data must be mocked.
- Do not add external API calls for product data.
- Do not add blockchain, RPC, Solana program, or wallet-adapter connections.
- Do not add real wallet integrations.
- Do not import live code from `_archive/`.
- Use Bun for commands and package changes.

## Commands

Use:

- `bun install`
- `bun run dev`
- `bun run lint`
- `bun run build`
- `bun add <package>`
- `bunx <tool>`

Do not use `npm install`, `npm run`, `yarn`, `pnpm`, or `npx` in this repo.

## Live Architecture

Key docs:

- `docs/architecture.md`: current live architecture.
- `README.md`: developer overview.
- `docs/product-vision.md`: product vision.
- `docs/product-strategy.md`: product strategy.
- `_archive/README.md`: archive rules.

Live code is organized around:

- `src/app`: thin Next.js routes and global shell.
- `src/components/ui`: generic primitives.
- `src/components/tidal`: branded Tidal UI and app-frame components.
- `src/components/workspace`: the only live product area.
- `src/providers`: mocked client state.
- `src/hooks/workspace`: canvas and graph interaction behavior.
- `src/lib/workspace`: pure graph, picker, and status helpers.
- `src/mock-data`: mocked shell and workspace data.

## Workspace Rules

- Keep route files thin.
- Keep workspace product UI under `src/components/workspace`.
- Keep branded reusable components under `src/components/tidal`.
- Keep generic primitives product-agnostic under `src/components/ui`.
- Keep mocked content in `src/mock-data` where practical.
- Prefer prop/data boundaries that will be easy to replace with production adapters later.

## Graph Rules

The graph uses React Flow.

- `WorkspaceNodeOutput.asset` is canonical asset identity for compatibility checks.
- `WorkspaceNodeOutput.amountLabel` is display text.
- Edge `data.asset` is a display label.
- Do not store values like `50% SOL` in `output.asset`; use `asset: "SOL"` and `amountLabel: "50% SOL"`.

The React Flow canvas is intentionally loaded client-only in `workspace-screen.tsx` with SSR disabled. Do not re-enable SSR for the canvas unless hydration has been tested.

## Archive Rules

`_archive/` contains frozen reference code from older Home, Pool, Swap, Global Chat, Amplify, and promotion experiments. It is excluded from the live build and should not be treated as current architecture.

You may read `_archive/` for patterns, but copy any useful pattern into the live workspace structure rather than importing from archive.

## Docs Maintenance

When structural frontend changes are made:

- update `docs/architecture.md`
- update `README.md` if developer-facing orientation changes
- update `AGENTS.md` and `CLAUDE.md` if AI guidance changes
