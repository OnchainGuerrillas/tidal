# CLAUDE.md

## Role

You are collaborating on Tidal, a Solana DeFi product whose design thesis is **ComfyUI for DeFi**: a visual, typed, composable canvas where users build yield strategies as node graphs and an AI agent composes graphs on their behalf.

Your job is to help build out the working product — backend adapters, AI agent, composition engine — while preserving the partner's existing frontend architecture.

## Required Reading (Before Product Or Architecture Decisions)

1. `docs/design-thesis.md` — names the ComfyUI paradigm, maps concepts to Tidal, and lists the engineering implications. Foundational.
2. `docs/tidal-prd.md` (v2.2+) — feature roadmap organized around the composition paradigm.
3. `docs/architecture.md` — current live frontend architecture and the backend layer plan.
4. `docs/post-hackathon-roadmap.md` — six post-hackathon workstreams (hardening, revenue, database, templates, UI, adapter expansion) with sequencing. Active planning surface.

If a request would bypass the typed-graph mental model (e.g., "let's just have the agent execute trades from chat without showing a graph"), push back — that's the anti-paradigm.

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

## Secrets Safety (Non-Negotiable)

**Never read, print, grep, or echo the contents of any `.env*` file, or any other file containing credentials (keys, tokens, signing material, PEM, JWKs).** A leaked secret in the conversation transcript must be treated as compromised and rotated. This has happened once and cost real recovery time.

The harness enforces this via deny rules in `.claude/settings.json` for `Read`, `Edit`, `Write`, and the obvious dump commands (`cat`, `head`, `tail`, `less`, `more`, `grep`, `awk`, `sed`, `Get-Content`, etc.) against `.env*` paths. Do not work around these denies.

**If you need to know what env keys exist** (e.g., to check whether `DATABASE_URL` is configured), use commands that emit keys only, never values:

```bash
cut -d= -f1 .env.local              # print all keys, one per line
grep -oE '^[A-Z_]+=' .env.local     # print KEYS= prefixes only
ls .env*                            # just confirm file exists
test -f .env.local && echo exists   # exists check
```

**Never use** these patterns on env files: `cat`, `head`, `tail`, `less`, `grep -n PATTERN file`, `awk '{print}' file`. Any of these print full lines, and env-file lines are `KEY=value` so the value leaks.

**If you need to know what a specific value is**, ask the user — do not read the file yourself.

**When introducing new env vars** in code, document the keys in `README.md` under Environment Variables. Do not document values, examples that look like real values, or anything that could be mistaken for a real secret.

**Commit messages must not name specific env var keys that have been or could be exposed.** Use generic phrasing like "secret-bearing dotfiles" or "credentialed env" instead of naming `PRIVY_SECRET_KEY`, `DATABASE_URL`, etc. (Naming a key in a commit message that is then leaked is itself a partial leak.)

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

The workspace chat panel is now wired to `/api/chat` via `useChat` from `@ai-sdk/react`. When the agent calls `composeStrategy`, the panel applies the returned mutations to the active workspace via `WorkspaceProvider.applyGraphMutations` and renders a `StrategyComposeMessage` bubble with a "Run graph" button that drives `executeGraph` end-to-end.

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

## Backend Integration Phase (Active)

The frontend prototype is complete. The repo is now evolving into a working product per `docs/tidal-prd.md` (v2.2). Backend integration is in scope.

### Phase 1 — shipped 2026-05-04

Always read `docs/CHECKPOINT.md` for current status — it's the source of truth. Phase 1 thesis demo is fully shippable on mainnet. Snapshot:

**Adapters mainnet-verified (9 total):**
- Jito stake / unstake (SPL stake-pool)
- Kamino USDC supply / withdraw / supply-and-borrow / repay-and-withdraw
- Kamino + Jupiter leverage loop composite (recursive supply-and-borrow + swap)
- Jupiter Ultra swap (any pair across SOL / USDC / USDT / JitoSOL / mSOL)

**Engine & UI:**
- Graph execution engine with multi-tx contract (one node → N transactions submitted in sequence)
- Multi-output runner with per-handle edge dispatch (Split nodes execute as compute-only)
- Per-node run-status visuals (cyan-pulse / emerald / red / amber rings)
- Live investment tracker reading real Kamino obligations + Jito balances, auto-refreshing after runs via the chain-state signal provider
- Wallet node showing live SOL/USDC balances
- AI compose-strategy tool emitting canonical strategy graphs (single-node + two-node intents)
- Workspace chat panel wired to `/api/chat` with tool-call rendering and Run graph button on the chat bubble
- Canvas Run graph button with tx-count preview ("Run graph (N txs)")
- AI-composed nodes positioned relative to existing graph; bridge problem solved (`StrategyNodeData.catalogItemId` makes hand-built nodes runnable too)

### Phase 2 — Strategic Direction

**Going deep on Solana before going broad.** Cross-chain (Base, Arbitrum, Li.Fi, EVM adapters, wagmi) stays parked from v1 — see Parked Features. Tidal's wedge is the Solana composition surface; depth here matters more than breadth right now.

Phase 2 priority order (post-MVP, in increasing effort):

1. **Strengthen the existing demo** — compounded APY display, live SOL price feed (replaces leverage loop's hardcoded estimate), Amount node runnable, "Unwind Leverage" composite. ~3-4 hr total. Low risk, high pitch lift.
2. **Solana adapter expansion** — Marinade stake (cheapest, reuses SPL stake-pool patterns), Sanctum INF (LST routing — "agent rate-shops between liquid staking tokens"), Jupiter Lend USDC (rate-shop vs Kamino), Kamino Earn Vaults (Mid-Depth tier). ~1.5-2 hr each.
3. **Templates / starter graphs** — 3 canonical strategies (Leverage Loop, Stake-and-Hold, Stablecoin Lending) for onboarding. ~1.5 hr.
4. **Jupiter Perps** — Deep Water tier leverage trading. Replaces the parked Drift slot.

Bigger directional bets (post-launch material): auto-compounding scheduler, cycle-on-canvas leverage loops (flavor B), social features (Discover + gamification + sharing), NFT positions, real-time alerts, Orca/Raydium concentrated LP. All in `Parked Features` with what / why / when-to-revisit notes.

### Important Architectural Notes

- **Visual catalog and executable adapters are unified.** `src/mock-data/workspace/catalog.ts` (UI picker) merges adapter-backed entries from `src/lib/solana/adapter-catalog.ts` (`ADAPTER_CATALOG_ITEMS`). Strategy nodes carry a `catalogItemId` on `StrategyNodeData` when bound to a registered adapter, so hand-built and AI-composed graphs both run through the same executor. The legacy visual-only entries (Marinade, Marginfi, Orca, Raydium, the legacy Kamino-borrow) were dropped from the picker on 2026-04-30; the example workspace still references them by id but the picker only surfaces runnable adapters.
- **Adapters must be registered before use.** Server entry points call `registerAllAdapters()` (idempotent). Don't import individual adapters into UI code; go through the registry.
- **Multi-tx contract.** `BuildTransactionResult.transactionsBase64: string[]`. Single-tx adapters (Jito, simple Kamino supply, Jupiter swap) wrap their tx in a length-1 array. Multi-tx adapters (Kamino borrow, repay+withdraw, leverage loop) build the array by orchestration — usually multiple separate SDK calls rather than the combined ones, since the combined calls trip the 1232-byte single-tx ceiling.
- **Multi-output runner.** `ExecutableNode` is a discriminated union (`adapter` | `split`). Edges carry a `sourceHandle` so children consume the right output. Compute-only nodes (Split today, Amount tomorrow) execute locally without invoking the adapter pipeline.
- **Workspace chat panel is wired live** to `/api/chat`. `ChatPanel` uses `useChat`; `composeStrategy` tool results stream in as `tool-composeStrategy` parts, mutations are applied to the active workspace via `WorkspaceProvider.applyGraphMutations` (deduped per `toolCallId` in an effect), and the resulting `StrategyComposeMessage` carries the "Run graph" affordance.

### Scope Of Existing Constraints

The "no external API calls / no blockchain / no wallet integrations" rules above apply to **workspace UI and mock-data patterns**. They do not block the backend layer described in the PRD. Specifically:

- Workspace UI should still consume data through provider boundaries in `src/providers/*`.
- `src/mock-data/*` stays as the seed/fallback path and remains the source of truth for types the UI depends on.
- New adapters slot behind the existing provider interface so the partner's UI keeps working as real calls come online.
- Do not couple workspace UI components directly to SDK clients — route through providers or API routes.

### Backend Layout

Per the PRD, new backend code lives at:

- `src/lib/solana/*` — protocol adapters (Kamino, Jupiter Lend, Jito, Sanctum, Jupiter swap, registry, connection)
- `src/lib/ai/*` — Vercel AI SDK v6 tools, prompts, Solana-specific tool definitions
- `src/app/api/*` — route handlers for `chat`, `yields`, `solana/rates`, `solana/positions`

Keep route handlers thin. Business logic belongs in `src/lib/*`, not in `app/api/*/route.ts`.

### Stack Additions

- **Wallet/Auth:** Privy with `walletChainType: 'ethereum-and-solana'` (Phantom/Backpack external + embedded wallets)
- **AI:** Vercel AI SDK v6 + Claude (model IDs per root instructions — default to latest Claude 4.x)
- **Swaps:** Jupiter Ultra API direct (2-endpoint `/order` → `/execute`, Beam relayer, no RPC needed)
- **Lending:** `@kamino-finance/klend-sdk`, Jupiter Lend API (Jupiter Lend parked — see Parked Features)
- **Staking:** Jito stake pool (`@jito-foundation/jito-ts-sdk` or direct IX); Sanctum router parked
- **Perps:** Jupiter Perps if/when perps become a priority. Drift is **off the v1 roadmap** due to a recent hack — see Parked Features.
- **Yield Data:** DeFi Llama Yields API (filter `chain === "Solana"`)

Confirm exact package names against PRD before installing. Do not substitute deprecated alternatives.

### Parked Features

When a feature is removed or deferred, capture three things at the moment of decision: **what** was touched, **why** it was paused, **when** to bring it back. `docs/CHECKPOINT.md` is for active work; this section is the long-term graveyard with off-ramps.

Do not re-introduce anything below without explicit approval.

#### EVM and cross-chain (parked from v1)

- **EVM chain configs** (Base, Arbitrum, Optimism). **Reintroduce when:** the Solana surface is mature and there's a clear cross-chain story.
- **Li.Fi SDK** — cross-chain bridging.
- **AAVE V3 adapters** — EVM lending.
- **ERC-4626 vault adapter** — EVM yield-bearing tokens.
- **wagmi hooks** — replaced by Solana wallet adapter / Privy Solana hooks. Stays parked permanently for v1.

#### Solana protocol adapters (parked, not blocking)

The core adapter set is locked to **Jito + Jupiter + Kamino** for v1. The four entries below are optional vocabulary expansion, not v1 blockers.

- **Sanctum INF staking** — LST router, would let the agent route between liquid staking tokens (JitoSOL ↔ INF ↔ mSOL). **Reintroduce when:** Tier 1 ships and we want to pitch "AI rate-shops between LSTs."
- **Jupiter Lend USDC** — second stablecoin lender; same adapter shape as Kamino. **Reintroduce when:** "agent rate-shops between lenders" becomes a pitch beat.
- **Kamino Curated Earn Vaults** — Mid-Depth tier (8-15% APY). **Reintroduce when:** expanding strategy vocabulary into Mid-Depth.
- **Drift adapters** — **off the v1 roadmap due to a recent hack.** Trust/safety: shipping a Drift integration in the wake of an exploit signals weak diligence to a DeFi-curious user base. **Replacement:** Jupiter Perps takes Drift's perps slot if/when perps become a priority. **Reintroduce when:** Drift's safety profile is comprehensively cleaned up and audit posture re-established.

#### Workspace UI features parked

- **Discover panel** — removed in this commit. Sources moved to `_archive/discover/` (mock data + panel + discovery / recommendation cards) so resurrection is cheap. The panel was a mocked recommendations / discovery view. **Reintroduce when:** social features become a priority — sharing strategies, follower feeds, leaderboards, "what other Tidal users are running."
- **Gamification** (GitHub stars, public/private workspaces, achievement badges) — clusters with Discover; same social-features trigger.
- **NFT position representation** — wrap on-chain positions as NFTs for visibility / transferability. **Reintroduce when:** position lifecycle is mature enough that wrapping adds value (long-term lending locks, Tidal achievements, etc.).
- **Active position locking on the canvas** (formerly Tier 1 #5) — original idea was to gate the × delete button on any strategy node whose adapter has an on-chain match. Dropped 2026-05-03 because it conflates "node represents an active position" with "node represents a strategy I'm prototyping for the future." A user with one Kamino position would have every Kamino node in every workspace pre-locked, breaking multi-session and multi-strategy authoring. **Coverage instead:** the Investments panel is the source of truth for active positions; inverse-path adapters (Kamino withdraw, Jito unstake, Kamino repay+withdraw — Tier 1.6) are how a user closes a position from the canvas. **Reintroduce when:** user testing surfaces "I deleted a node and lost track of my position." Implementation path: stamp `runStatus: "active" | "closed" | "draft"` onto `node.data` after a successful run, and use that flag — not adapter-level matching — to gate the × button. Or just a soft confirmation modal: "Deleting this node won't close the position; it stays in Investments. Continue?"

#### Infrastructure parked

- **Auto-compounding scheduler** (flavor C of yield looping) — automated rebalancing / harvest-and-reinvest on a schedule. **Reintroduce when:** Tidal has off-chain backend infrastructure (cron / keeper bot / persistent storage) and the demand for unattended automation justifies the operational complexity.
- **Cycle-on-canvas leverage loops** (flavor B) — runner detects user-drawn cycles and asks for iteration count. Higher demo wow factor than the composite "Leverage Loop" node (flavor A), but harder. **Reintroduce when:** flavor A ships and demand for visual cycle authoring becomes apparent.

### Testing Notes

- Mainnet with small amounts. Kamino, Jupiter, and Jito lack reliable devnet deployments.
- Never commit private keys, RPC URLs with embedded API keys, or Privy app secrets. Use `.env.local` and document required vars in `README.md` as they are added.

### Docs To Keep In Sync

When backend structure changes, update `docs/architecture.md` to reflect the new `src/lib/solana`, `src/lib/ai`, and `src/app/api` surfaces alongside the existing frontend architecture.

### Claude Code Skills To Use

When the following skills are available, prefer them over general reasoning for their respective domains:

- **`solana-dev`** — Wallet-standard connection (Phantom/Backpack), Privy Solana integration, `src/lib/solana/*` adapter patterns, and on-chain testing with LiteSVM / Mollusk / Surfpool. This is the testing backbone.
- **`integrating-jupiter`** — Jupiter Ultra Swap (`/order` → `/execute` via Beam relayer) and Jupiter Lend. Use when touching `src/lib/solana/jupiter-swap.ts` or `src/lib/solana/jupiter-lend.ts`.
- **`ai-sdk-core`** — Vercel AI SDK v6 tool definitions, streaming, error handling, MCP. Use when touching `src/lib/ai/*` or `src/app/api/chat/route.ts`.
- **`ai-sdk-ui`** — `useChat` and tool-approval patterns for the workspace chat panel. DeFi actions must require user signature — never auto-execute a transaction from a tool call without an explicit approval step.
- **`claude-api`** — For direct Anthropic SDK usage and prompt caching. Matters because agent tool-call contexts get long.
- **`prompt-engineering-patterns`** — When tuning the agent's system prompt and tool descriptions.

Skills explicitly **not** for this repo:

- `wagmi`, `viem`, `ethereum-wingman` — EVM-only, parked from v1
- `solana-anchor-claude-skill` — we consume existing programs, we don't author Anchor programs

If a skill is not listed here and it looks relevant, check availability before using it — the skill list changes.
