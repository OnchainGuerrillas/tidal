# CLAUDE.md

## Role

You are collaborating on Tidal Prototype, a frontend-only experimentation repo for a Solana DeFi product concept. Treat this as a design and product prototype, not a production app.

Your job is to help evolve the live workspace experience while keeping the codebase easy for a developer to understand and eventually integrate into a production application.

## Non-Negotiable Constraints

- All product data must be mocked.
- Do not add external API calls for product data.
- Do not add blockchain, RPC, Solana program, or wallet-adapter connections.
- Do not add real wallet integrations.
- Do not add production authentication, account, or transaction flows.
- Do not import live code from `_archive/`.
- Use Bun for all commands.

Use:

```bash
bun install
bun run dev
bun run lint
bun run build
bun add <package>
bunx <tool>
```

Do not use `npm install`, `npm run`, `yarn`, `pnpm`, or `npx`.

## Current Product

The product has consolidated around one live surface: the **workspace**.

A workspace is a node-based canvas with associated side panels:

- **Nodes**: searchable node catalog.
- **Chat**: mocked per-workspace transcript and history.
- **Investments**: mocked active positions and performance chart.
- **Discover**: mocked recommendations and discovery opportunities.
- **Templates**: placeholder starter graph gallery.

Multiple workspaces can be open at once and are shown as tabs in the header next to the Tidal logo. Workspace URLs are top-level routes like:

```text
/workspace-sol-yield-loop
```

Closing the active side panel should hide it and give the canvas the full available workspace area.

## Live Architecture

Read `docs/architecture.md` for the full current architecture. The short version:

```text
src/mock-data/*
  -> src/providers/*
  -> src/components/workspace/workspace-screen.tsx
  -> workspace panels, canvas nodes, and tidal components
```

Important live folders:

- `src/app`: Next.js routes, global layout, and global CSS.
- `src/components/ui`: generic UI primitives.
- `src/components/tidal`: branded Tidal components and app shell pieces.
- `src/components/workspace`: the only live product surface.
- `src/providers`: local mocked state providers.
- `src/hooks/workspace`: React Flow canvas behavior and graph interaction logic.
- `src/lib/workspace`: pure graph, picker, and status helpers.
- `src/mock-data/shell`: mocked shell/preference data.
- `src/mock-data/workspace`: mocked workspace data, graph seeds, catalog, investments, discover, templates, and types.

Live routes:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/[workspaceId]/page.tsx`

There are no live Home, Pool, Swap, Global Chat, or Amplify routes.

## Archive

`_archive/` is frozen reference material from earlier product explorations. It is excluded from the live app.

You may inspect it for patterns, but do not import from it. If a pattern is useful, copy or adapt it into the live workspace architecture.

Do not describe archived surfaces as current product architecture.

## Implementation Rules

- Keep route files thin.
- Keep product-specific workspace UI under `src/components/workspace`.
- Keep reusable branded UI under `src/components/tidal`.
- Keep generic primitives under `src/components/ui`.
- Keep mock data and lightweight frontend-facing types under `src/mock-data`.
- Keep graph/domain helpers in `src/lib/workspace`.
- Keep canvas interaction state in `src/hooks/workspace`.
- Prefer existing patterns before introducing new abstractions.
- Avoid broad refactors unless they directly support the requested change.

## Graph And Canvas Rules

The workspace canvas uses React Flow.

Important graph conventions:

- `WorkspaceNodeOutput.asset` is the canonical asset identity used for compatibility checks.
- `WorkspaceNodeOutput.amountLabel` is display text.
- Edge `data.asset` is a display label.
- Do not put route percentages such as `50% SOL` in `output.asset`. Use `asset: "SOL"` and `amountLabel: "50% SOL"`.

The React Flow canvas is intentionally loaded client-only in `workspace-screen.tsx` using `next/dynamic({ ssr: false })`. This avoids hydration mismatches from browser-measured viewport transforms. Do not re-enable SSR for React Flow without verifying hydration.

## Styling Rules

The styling system is centralized in `src/app/globals.css`.

- Prefer semantic classes from `globals.css`.
- Promote repeated visual treatments into shared classes or `src/components/tidal`.
- Keep one-off Tailwind values limited and purposeful.
- Preserve the current dark Tidal visual language unless explicitly asked to change it.
- Keep responsive behavior in mind for panels, tabs, and canvas layout.

## Mocking And Future Integration

This repo is meant to be easy to integrate later.

When adding behavior:

- Model it with mocked data and local state.
- Keep boundaries clear enough that mocked data can be replaced by production adapters.
- Do not couple UI components directly to future backend assumptions.
- Do not add placeholder production clients.

The chat composer is presentational/prototype-level. Production chat behavior will be connected later outside this prototype.

## Docs Maintenance

When structural frontend changes are made:

- update `docs/architecture.md`
- update `README.md` if the developer-facing overview changes
- update `AGENTS.md` and `CLAUDE.md` if the AI guidance changes

Do not point docs at deleted or ignored planning files as required reading.

## Validation

For code changes, run the relevant checks with Bun:

```bash
bun run lint
bun run build
```

Note: the current build may require network access because `next/font/google` fetches Inter. If that becomes a problem, replace it with a local font or system font stack as a separate change.
