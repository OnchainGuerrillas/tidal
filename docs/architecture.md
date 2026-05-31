# Architecture

## Purpose

Tidal Prototype is a frontend and design experimentation repo for a Solana DeFi product concept. It is used to explore the product experience, interaction model, visual system, and integration-facing frontend structure before the work is moved into a production application.

This is not the production app.

## Constraints

- All product data is mocked.
- Do not add external API calls.
- Do not add blockchain, RPC, Solana program, or wallet-adapter connections.
- Do not add real wallet integrations.
- Keep the frontend easy to hand off into a production app later.

## Product Model

The live product has consolidated around a single surface: the **workspace**.

A workspace is a node-based strategy canvas with associated side-panel context. Users can create, switch between, and work across multiple workspaces using tabs in the header. The active workspace owns its graph, chat transcript/history, investment list, discovery feed, and template gallery.

Each workspace exposes five side panels:

- **Nodes**: searchable node catalog for dropping new nodes onto the canvas.
- **Chat**: mocked per-workspace transcript and chat history.
- **Investments**: mocked active positions and performance chart.
- **Discover**: mocked recommendations and discovery opportunities.
- **Templates**: placeholder gallery of starter graphs and teaching examples.

Closing the active side panel hides it entirely and gives the canvas the full available workspace area.

## Live App Structure

### Routes

Live route files are intentionally thin and live in `src/app`.

- `src/app/layout.tsx`: global app shell. It wraps the app with tooltip, preference-profile, workspace, and side-panel providers, then renders the header/sidebar frame.
- `src/app/page.tsx`: root bootstrap route. It resolves the active mocked workspace and redirects/replaces to `/<workspaceId>` on the client while rendering the workspace screen.
- `src/app/[workspaceId]/page.tsx`: addressable workspace route. Workspace IDs are top-level URL segments, for example `/workspace-sol-yield-loop`.

There are no live Home, Pool, Swap, Global Chat, or Amplify routes. Earlier versions of those surfaces are archived under `_archive/` and are not part of the live architecture.

### Component Layers

React components are split into three live layers:

- `src/components/ui`: generic product-agnostic primitives, including buttons, inputs, cards, dialogs, dropdown menus, sheets, sidebar primitives, skeletons, separators, and tooltips.
- `src/components/tidal`: branded Tidal components and app-frame pieces. This includes `AppHeader`, `AppSidebar`, `WorkspaceTabs`, `PromptComposer`, `PreferenceContextPanel`, `ChatMessage`, `SurfaceCard`, `Badge`, `SectionLabel`, `SuggestionAction`, `CompactSelect`, and `WorkspaceHeader`.
- `src/components/workspace`: the only live product-area component tree. It owns the canvas, node cards, node picker, side panels, investment cards, discovery cards, and workspace-specific composition.

### Workspace Components

`src/components/workspace/workspace-screen.tsx` is the main product composition component. It connects the active workspace state to:

- the client-only React Flow canvas
- the canvas status overlay
- the side panel currently selected by `SidePanelProvider`
- the node picker overlay used by context-menu and drag-from-output flows
- the node editing context exposed to node components

Canvas node components live directly under `src/components/workspace`:

- `wallet-node.tsx`
- `amount-node.tsx`
- `strategy-node.tsx`
- `split-node.tsx`
- `reward-node.tsx`
- `destination-node.tsx`

Panels live under `src/components/workspace/panels`:

- `PanelShell`
- `NodesPanel`
- `ChatPanel`
- `InvestmentsPanel`
- `DiscoverPanel`
- `TemplatesPanel`

Investment and discovery cards live under:

- `src/components/workspace/investments`
- `src/components/workspace/discover`

## State And Data Flow

The app uses local mocked React state only.

```
src/mock-data/*
  -> src/providers/*
  -> src/components/workspace/workspace-screen.tsx
  -> workspace panels, canvas nodes, and tidal components
```

### Providers

- `src/providers/workspace-provider.tsx`: mocked multi-workspace state. It owns the workspace list, active workspace selection, active chat thread, thread creation, graph updates, and workspace execution metadata. It also initializes from the current top-level workspace route when possible.
- `src/providers/side-panel-provider.tsx`: per-workspace side-panel selection. It defaults to `chat` and supports `null` for canvas-focus mode.
- `src/providers/preference-profile-provider.tsx`: mocked global risk appetite and investment-interest preferences used by header dialogs.

### Hooks And Helpers

- `src/hooks/workspace/use-canvas-state.ts`: React Flow graph behavior, local node/edge state, draft/impact propagation, connection handling, picker state, node creation, and mocked draft-run behavior.
- `src/lib/workspace/graph-utils.ts`: pure graph helpers, cloning, connection compatibility, edge construction, display labels, timestamp labels, and active holdings labels.
- `src/lib/workspace/picker-utils.ts`: picker filtering, search matching, group labels, and disabled-state rules.
- `src/lib/workspace/status.ts`: status label formatting.
- `src/lib/routes/workspace.ts`: workspace URL helper.

## Graph Model

The graph uses React Flow nodes and edges with frontend-facing types in `src/mock-data/workspace/types.ts`.

Important conventions:

- `WorkspaceGraphNode.data.nodeKind` is the canonical node kind used by compatibility checks.
- `WorkspaceNodeOutput.asset` is the canonical asset identity used by compatibility checks.
- `WorkspaceNodeOutput.amountLabel` is display-oriented copy such as `50% SOL`, `40.6 mSOL`, or `$824 / month`.
- Edge `data.asset` is a display label for the visual edge. It may include percentages.

Keep asset identity and display labels separate. Do not put route percentages into `output.asset`, because compatibility checks need canonical asset names such as `SOL`, `USDC`, or `mSOL`.

## Mock Data

Live mocked data lives under `src/mock-data`.

- `src/mock-data/shell`: preference profile and shell user summary.
- `src/mock-data/workspace/types.ts`: workspace, node, edge, chat, catalog, and preference-facing types.
- `src/mock-data/workspace/catalog.ts`: node catalog and supported assets.
- `src/mock-data/workspace/node-factories.ts`: node creation helpers for builder flows.
- `src/mock-data/workspace/builder-workspace.ts`: blank builder workspace seed.
- `src/mock-data/workspace/example-workspace.ts`: seeded SOL yield loop example.
- `src/mock-data/workspace/workspace.ts`: workspace mock-data re-export surface.
- `src/mock-data/workspace/investments.ts`: mocked investment positions and performance data.
- `src/mock-data/workspace/discover.ts`: mocked recommendation and discovery data.
- `src/mock-data/workspace/templates.ts`: mocked template gallery data.

Mock content should not be embedded directly in UI components when it can live in `src/mock-data`.

## Styling

The styling system is centralized in `src/app/globals.css`.

It contains:

- theme tokens and brand colors
- semantic typography classes
- shared layout helpers
- shared app shell classes
- workspace tab and sidebar rail classes
- side-panel and catalog classes
- template grid/card classes
- React Flow dark theme overrides

Prefer semantic classes from `globals.css` before adding one-off Tailwind values. If a visual treatment repeats, promote it into a shared class or component.

## React Flow Rendering

The React Flow canvas is loaded client-only from `workspace-screen.tsx` using `next/dynamic({ ssr: false })`.

This is intentional. React Flow computes viewport transforms and node positions from browser layout measurements. Server-rendering the canvas can produce hydration mismatches between server HTML and client-measured transforms.

Do not convert the React Flow canvas back to SSR unless the hydration behavior is tested and stable.

## Archive

`_archive/` contains frozen reference material from earlier product explorations: Home, Pool, Swap, Global Chat, and promotion-related components.

Archive code is not part of the live architecture. It is excluded from TypeScript, ESLint, and Next output tracing. Nothing in live `src/` should import from `_archive/`.

Use `_archive/` only as reference material when copying a pattern back into the live workspace architecture.

## Integration Guidance

When moving this prototype into a production app:

1. Keep useful presentational components and workspace composition boundaries.
2. Replace `src/mock-data/*` and local providers with real adapters, application state, or server data.
3. Preserve the separation between graph/domain helpers and UI components.
4. Keep UI primitives generic.
5. Keep workspace-specific behavior under `src/components/workspace`, `src/hooks/workspace`, and `src/lib/workspace` until a production architecture requires a different boundary.

## Backend Layer (Active Development)

The repo is transitioning from frontend prototype to working product per `tidal-prd.md` (v2.1). Backend integration is in active development. The constraints in the "Constraints" section above apply to workspace UI and mock-data patterns; they do not block backend work described here.

### Backend Folder Layout

```
src/lib/solana/
  connection.ts                # Solana RPC connection
  adapter-catalog.ts           # client-safe catalog entries (single source of truth)
  adapters.ts                  # registerAllAdapters()
  registry.ts                  # ProtocolAdapter registry
  types.ts                     # ProtocolAdapter contract
  jito.ts / jito-unstake.ts    # Jito stake-pool stake + unstake
  blaze.ts / blaze-unstake.ts  # BlazeStake (bSOL) stake + unstake
  kamino.ts                    # Kamino USDC supply + withdraw
  kamino-borrow.ts             # Kamino supply-and-borrow
  kamino-repay-withdraw.ts     # Kamino repay + withdraw
  kamino-withdraw.ts           # Kamino USDC withdraw
  kamino-leverage-loop.ts      # Composite leverage loop
  kamino-shared.ts             # Shared Kamino helpers
  jupiter-swap.ts              # Jupiter Ultra + lazy /quote+/swap fallback

src/lib/db/
  schema.ts                    # Drizzle table defs (users, wallets, workspaces, workspace_graphs, run_history)
  client.ts                    # server-only Neon client + db export
  migrate.ts                   # one-shot migration runner (bun run db:migrate)
  migrations/                  # generated SQL migration files

src/lib/auth/
  privy-server.ts              # Privy JWT verification + users-row upsert (requireUser)

src/lib/ai/
  tools/                       # AI SDK v6 tool definitions (compose-strategy, etc.)

src/app/api/
  me/route.ts                  # authed user profile + workspaces + last run (GET)
  workspaces/route.ts          # list (GET), create (POST)
  workspaces/[id]/route.ts     # load with latest graph (GET), save graph version (PUT)
  runs/route.ts                # record a run_history row (POST)
  chat/route.ts                # AI compose-strategy endpoint
  solana/*                     # adapter routes (rates, positions, build/submit tx, RPC proxy, prices)
```

Route handlers stay thin. Business logic lives in `src/lib/*`.

### Data Flow (Backend-Integrated)

Mocked flow remains the fallback and UI-development path:

```
src/mock-data/* -> src/providers/* -> workspace UI
```

Real flow slots adapters behind the same provider boundary:

```
src/lib/solana/*  ─┐
src/lib/ai/*      ─┼─> src/app/api/* -> src/providers/* -> workspace UI
DeFi Llama API    ─┘
```

Workspace UI components should not import from `src/lib/solana` or SDK clients directly. They consume data through providers, which call API routes, which call adapters.

### Wallet And Auth

- **Privy** with `walletChainType: 'ethereum-and-solana'`
- External connectors for Phantom and Backpack
- Embedded wallets for email/social login (zero-friction onboarding)
- Wallet state is injected at the layout/provider level, not at the component level
- Server-side, `src/lib/auth/privy-server.ts` exposes `requireUser(req)` — verifies the Privy access token (from `Authorization: Bearer` or the `privy-token` cookie), upserts the `users` row keyed on `privy_user_id`, and returns the DB user. Routes wrap their handlers in a `try { await requireUser(req) } catch (UnauthorizedError)` block and return 401 on failure.

### Database (Neon + Drizzle)

Persistence for user profiles, workspaces, versioned graph snapshots, and run history. Schema lives in `src/lib/db/schema.ts`; the server-only Drizzle client is `src/lib/db/client.ts`.

Tables:

- `users` — keyed on Privy `privy_user_id`; carries optional `primary_wallet_address` lazily populated from Privy on first `/api/me` call.
- `wallets` — linked addresses per user, unique on `(address, chain)`.
- `workspaces` — owned by a user, unique on `(user_id, slug)`.
- `workspace_graphs` — versioned snapshots; `nodesJson` and `edgesJson` store the workspace graph; unique on `(workspace_id, version)`. The route layer appends a new row on every PUT rather than mutating.
- `run_history` — graph execution records; `events_json` is the streamed `GraphExecutionEvent[]`. Recorded by clients hitting `POST /api/runs` in the `finally` block of `executeGraph`.

Migrations: `bun run db:generate` (writes SQL to `src/lib/db/migrations/`) → `bun run db:migrate` (applies via `DATABASE_URL_UNPOOLED`). `drizzle-kit push` is avoided because its interactive TTY prompt blocks scripted environments.

### AI Agent

- **Vercel AI SDK v6** with Claude
- Tools defined in `src/lib/ai/tools-solana.ts`: `stakeSOL`, `lendUSDC`, `withdrawLend`, `swapToken`, `scanSolanaYields`, `getSolanaRates`, `compareYields`
- Chat endpoint at `src/app/api/chat/route.ts`
- Agent prepares transactions; user signs in the wallet; adapter executes

### Protocol Adapters

Each adapter in `src/lib/solana/*` exposes a uniform shape suitable for the `registry.ts` index:

- position reads (balance, accrued yield, current APY)
- action builders (returns a Solana `Transaction` or versioned tx for signing)
- metadata (protocol name, TVL pointer, risk tier)

No ERC-4626 equivalent exists on Solana — adapters are per-protocol rather than per-standard.

### Out Of Scope (Parked From v1)

EVM chain configs, Li.Fi SDK, AAVE V3 adapters, ERC-4626 vault adapter, and wagmi hooks are parked. Do not re-introduce without approval.

## Maintenance Rule

When structural frontend changes are made:

- update this architecture document
- update `README.md` if the developer-facing summary changes
- update `AGENTS.md` and `CLAUDE.md` if AI instructions need to change
