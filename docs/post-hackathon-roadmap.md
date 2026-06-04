# Tidal — Post-hackathon Roadmap

Submission landed (Colosseum, 2026-05-10). This document captures the six workstreams driving the project from here. It is a living doc — update it as scope solidifies, decisions land, or priorities shift.

For checkpoint-level progress, see `docs/CHECKPOINT.md`. For the on-chain hardening plan specifically, see `docs/hardening-plan.md`. For the bug registry, see `docs/internal/bug-registry.md` (gitignored).

---

## Six workstreams at a glance

| # | Workstream | Type | Track | Blocking? |
|---|------------|------|-------|-----------|
| 1 | Wrap up hardening | code | A (sequential) | unblocks new feature work that touches adapters |
| 2 | Revenue strategy | strategy | C (parallel, non-code) | not blocking eng |
| 3 | Database (Neon) — user profiles + strategies | code | A (sequential) | unblocks #4, partially #1 |
| 4 | Templates (DB-persisted) | code | A (sequential, after #3) | requires #3 |
| 5 | UI updates per 0xJulo feedback | code | B (parallel) | requires the feedback list from 0xJulo |
| 6 | Adapter expansion + stress testing + combo verification | code | B (parallel) | independent; touches hardening surface |

**Track A:** sequential coding chain — finish hardening, then DB, then templates.
**Track B:** parallelizable coding work — UI + adapters can run alongside Track A once each has a brief.
**Track C:** non-coding strategy work — revenue thinking happens in parallel without blocking eng.

---

## 1. Wrap up hardening (in flight)

**Goal:** every adapter + the runner are reliable enough that we don't lose users to on-chain bugs. The hardening plan (`docs/hardening-plan.md`) lays out 5 phases / 17–30 days; this workstream is the targeted top-of-funnel: ship the bugs we already know about before opening more.

**Status snapshot (2026-05-14):**
- Bug registry seeded (10 carry-over bugs in `docs/internal/bug-registry.md`).
- **Bug #1 (Jupiter speculative-build)** — fixed via the scoped `buildJupiterSwapLazy` codepath in `jupiter-swap.ts`. Leverage-loop now uses `/quote` + `/swap` (no taker pre-validation). Needs mainnet verification with a wallet holding zero USDC.
- **Bug #2 (Kamino `0x1776` on dirty obligations)** — original "missing historical reserves" hypothesis disproved; root cause unknown. Needs a mainnet reproduction with full program logs to identify the failing account index. **Blocking further Kamino work for repeat users.**

**Remaining inside this workstream:**
- Bugs #3–#10 from the registry, in severity order. Highest-leverage next picks:
  - **#4** Single blockhash for multi-tx sequence — refactor to fresh blockhash per tx.
  - **#5** Hardcoded 5000-lamport priority fee — implement a priority-fee oracle (Helius `getPriorityFeeEstimate`).
  - **#10** No retry logic for transient RPC failures in `submit-transaction/route.ts`.
- These pair naturally with the adapter audit in workstream #6 since both touch the same code.

**Definition of done:** every High-severity bug in the registry is `fixed`; Mediums are either `fixed` or have an explicit `wontfix` / `parked` decision; no demo path requires manual wallet-state setup (e.g., the current Kamino "unwind to zero before recording" workaround).

---

## 2. Revenue strategy

**Decision space:** open. Top-of-mind candidates, ranked by alignment with product:

### Fee on adapter swaps/routing — primary candidate

The product is a typed graph of protocol calls. Every adapter execution is a natural fee surface.

- **Jupiter swap nodes** — Jupiter already supports referral/integrator fees on Ultra (5–10 bps standard, 20% share on custom fees). We pass a `feeAccount` and a `feeBps`; the fee comes off the swap output. Zero new infrastructure.
- **Kamino lending nodes** — no native integrator fee surface in the klend SDK. Options: (a) skip fees on Kamino entirely; (b) add a small fixed fee tx in front of the Kamino tx that transfers SOL/USDC to a Tidal-owned account. Option (b) adds tx weight and may feel extractive on small positions.
- **Stake adapters (Jito, BlazeStake)** — same as Kamino: no native integrator fee, would have to be additive. Probably skip.

**Pitch:** "Tidal earns when Tidal is useful — a few bps on agent-composed swap volume." Aligned with the AI compose story (the AI's whole job is routing).

### Token / governance — open option

Bigger lift, regulatory considerations, but worth keeping in the option space because:
- Aligns ownership with active users (composers, template authors).
- Funds fee share back to users without taking the fee at swap time (more user-favorable framing).
- Gives template authors / strategy designers a way to earn on adoption (creator economy fit with the ComfyUI thesis).

If pursued, the cleanest minimal viable token is: governance-only (no fee share, no airdrop, no public sale) used to gate template curation and let active composers vote on adapter additions. Real fee share comes later when accounting infra exists.

### Subscription / Pro tier — discounted

Mentioned in the brief but probably not the best fit:
- The product's value is the composition surface, not gated features. Free tier with N strategies feels artificial.
- Limits on AI compose budget could work (Anthropic API costs are real), but probably better priced as "AI requests" not "subscription tier."

### Suggested directional take

**Primary:** ship Jupiter swap fees as soon as the product has consistent users (after templates + DB land). Small, easy, no new infra.

**Secondary:** AI compose budget as a usage meter (pay-per-compose above a free monthly quota) — fits naturally with Anthropic API economics and rewards heavy AI users without gating the core composition surface.

**Open option:** governance/creator token, parked until templates are user-submittable and there's a real distinction between "consumer" and "creator" users to align tokens with.

**Definition of done:** a revenue thesis document explaining the chosen model(s), expected unit economics, integration plan, and what gates flipping the switch.

---

## 3. Database (Neon) — user profiles + strategies

**Goal:** persistence layer for everything the product currently keeps in memory or in-bundle. Once this lands, the product can offer "your saved strategies," "your run history," "your favorited templates," and the social/discover features that have been parked.

### Schema sketch

```text
users
  id (uuid)
  privy_user_id (text, unique)             — primary identity
  primary_wallet_address (text)            — Solana pubkey
  display_name (text, nullable)
  created_at, updated_at

wallets
  user_id -> users
  address (text)                           — Solana pubkey
  chain (text)                             — "solana" for v1; "evm" later
  is_primary (bool)
  created_at

workspaces
  id (uuid)
  user_id -> users
  slug (text)                              — URL slug, e.g. "sol-yield-loop"
  name (text)
  created_at, updated_at, last_run_at

workspace_graphs
  id (uuid)
  workspace_id -> workspaces
  version (int)                            — monotonic; latest is current
  nodes_json (jsonb)                       — WorkspaceGraphNode[]
  edges_json (jsonb)                       — WorkspaceGraphEdge[]
  metadata_json (jsonb)                    — composedBy, AI tool call refs
  created_at

run_history
  id (uuid)
  workspace_id -> workspaces
  graph_version (int)                      — which graph version was run
  wallet_address (text)
  status (text)                            — "success" | "partial" | "failed"
  tx_signatures (jsonb)                    — array of base58 sigs
  events_json (jsonb)                      — GraphExecutionEvent stream
  failure_node_id (text, nullable)
  started_at, completed_at

templates
  id (uuid)
  author_user_id -> users (nullable)       — null = Tidal-curated seed
  is_official (bool)                       — admin flag
  slug (text, unique)
  title (text)
  description (text)
  graph_nodes_json (jsonb)
  graph_edges_json (jsonb)
  required_adapters (text[])               — catalogItemIds the template uses
  risk_tier (text)                         — shallows | mid-depth | deep-water
  created_at, updated_at
  fork_count (int)                         — denormalized
  star_count (int)                         — denormalized

template_stars
  user_id -> users
  template_id -> templates
  created_at
  primary key (user_id, template_id)

template_forks
  user_id -> users
  template_id -> templates                  — source
  workspace_id -> workspaces                 — destination
  created_at

ai_compose_log
  id (uuid)
  user_id -> users (nullable)              — null = unauthenticated session
  workspace_id -> workspaces (nullable)
  request_text (text)
  tool_calls_json (jsonb)
  mutations_applied (bool)
  created_at
```

### Tech choices

- **Database:** Neon (managed Postgres). Branching support is genuinely useful for migrations; serverless compute fits Vercel deployment.
- **Driver:** `@neondatabase/serverless` (Edge-compatible) for API routes that don't need full Postgres features; `pg` for any node-runtime routes.
- **ORM / query builder:** Drizzle ORM. Schema-first, type-safe, no Prisma-style codegen step that breaks bundling. Migrations via `drizzle-kit`.
- **Auth boundary:** Privy is the source of identity. Server routes verify Privy JWT → derive `privy_user_id` → upsert `users` row → look up via that user's id.
- **Env vars:** `DATABASE_URL` (Neon connection string), `DATABASE_URL_UNPOOLED` (for migrations). Both server-only, gitignored via `.env*`.

### API surface (new)

- `GET /api/me` — return current user's profile, list of workspaces, last run.
- `POST /api/workspaces` — create new workspace.
- `GET /api/workspaces/:id` / `PUT /api/workspaces/:id` — load / save graph state.
- `POST /api/runs` — record a run (called from `executeGraph`'s `finally`).
- `GET /api/templates` — list official + popular community templates.
- `POST /api/templates` — submit a template (later — gated initially to official seeds).
- `POST /api/templates/:id/fork` — clone a template into a new workspace for the user.
- `POST /api/templates/:id/star` — star/unstar.

### Migration path from current state

The current product keeps workspace state in-memory in `WorkspaceProvider` plus mock seeds in `src/mock-data/workspace/`. Migration steps:

1. Land Neon + schema + Drizzle scaffolding without touching the UI.
2. Add API routes (`/api/me`, workspaces, runs) with feature-flag opt-in.
3. Behind the flag, swap `WorkspaceProvider`'s source from mock data to API-backed.
4. Persist run history on `CanvasRunPanel` + `StrategyComposeMessage` completions.
5. Migrate templates to DB-backed (workstream #4).
6. Flip the flag on; mock data stays as fallback for unauthenticated browsing.

**Definition of done:** authenticated users can create, save, and re-open workspaces; run history shows in the Investments panel alongside the live on-chain positions; the in-memory mock seeds work as a "demo mode" for unauthenticated visitors.

---

## 4. Templates (DB-persisted)

**Goal:** ship the 3 canonical templates 0xJulo asked for (Leverage Loop, Stake-and-Hold, Stablecoin Lending), persist them in the DB so a future workstream can open template submission to users.

### Phase 4.1 — official seeds (post-DB)

Seed three official templates as DB rows owned by the Tidal team (`author_user_id = null`, `is_official = true`):

- **Stake-and-Hold (Jito).** Single-node Jito stake. The "hello world" template — shows the affordance.
- **Stablecoin Lending (Kamino USDC).** Single-node Kamino supply. The "yield without volatility" template.
- **Leverage Loop on Kamino.** Composite Leverage Loop node with default widget values. The "ComfyUI for DeFi" thesis template — exactly the multi-tx complexity that demos best.

**UI surfaces needed:**
- Templates panel in the workspace sidebar (already a stub).
- "Fork to new workspace" button on each template card.
- Template detail view with the graph rendered statically.

### Phase 4.2 — community submissions (later)

Once Phase 4.1 lands and authentication is solid, open template submission:
- "Save as template" button on a workspace's three-dot menu.
- Submission form: title, description, optional thumbnail.
- Initial state: published but unindexed. Indexed once the submitter has executed it ≥ once successfully (no untested templates).
- Star + fork counters (already in schema).
- Discover view filters by star/fork rank, risk tier, required adapters.

### Phase 4.3 — Tidal-side curation

- "Featured" flag for the Discover view.
- Comment/report flow if a community template has a bug.
- Author attribution on the template card (links to author profile).

**Definition of done (4.1):** three official templates render in the Templates panel; "Fork to new workspace" creates a new workspace from each; opens the canvas with the template's graph; user can run it without further edits.

---

## 5. UI updates per 0xJulo feedback

**Goal:** apply 0xJulo's specific feedback list to the live workspace UI.

**Blocking gap:** I don't have the feedback list captured in this repo. Next action on this workstream: capture 0xJulo's feedback as a checklist in this section before scoping.

### Captured items (rolling)

- [ ] **ChatPanel** — contents clip at the right edge at moderate viewport widths (strategy compose bubble, wallet badge, composer placeholder all truncating mid-word). Looks like the panel column itself is narrower than the inner content needs — likely a min-width or inner-padding issue rather than a content-truncation issue. Noticed 2026-06-03 while smoke-testing the profile sheet; deferring to designer review. (`src/components/workspace/panels/chat-panel.tsx` + `src/components/workspace/strategy-compose-message.tsx`.)

### Suggested template for capturing future feedback

When you have the list, add it here as:

```markdown
### 0xJulo feedback (captured YYYY-MM-DD)

- [ ] **{component}** — {what to change} ({why})
- [ ] ...
```

### Likely candidates (placeholder until real feedback lands)

- Asset color palette review (10-min ask, was in CHECKPOINT.md decisions list)
- "Graph appears" animation choice (10-min ask)
- Signing UX sheet design
- "How do you show if a node has run or not?" — Tier 1.7d "has-run" visuals are pending
- Copy wallet address affordance on the wallet node

**Definition of done:** every item in the captured feedback list is `done`, `parked-with-reason`, or `won't-do-because`; 0xJulo signs off on the workspace UI.

---

## 6. Adapter expansion + stress testing + combo verification

**Goal:** broaden the protocol vocabulary the AI can compose, prove the runner handles arbitrary combinations correctly under realistic conditions, and put automated rails in place so regressions surface before users do.

### 6.1 New adapters (parallelizable)

In priority order — each independent of the others:

- **Sanctum INF** (LST router). High pitch value: "AI rate-shops between JitoSOL, bSOL, mSOL." Pairs perfectly with the BlazeStake adapter shipped 2026-05-14.
- **Jupiter Lend USDC.** Second stablecoin lender; same adapter shape as Kamino USDC. Enables "agent rate-shops between lenders."
- **Kamino Earn Vaults** (curated). Mid-Depth tier; 8–15% APY. Expands strategy vocabulary upward.
- **Jupiter Perps.** Deep Water tier leverage trading. Replaces the parked Drift slot once perps becomes a priority.
- **Marinade Liquid Staking** (mSOL). Requires `@marinade.finance/marinade-ts-sdk` as a new dep (custom program, not SPL stake-pool). Lower priority given BlazeStake covers the second-LST role.

### 6.2 Stress testing infrastructure

Overlaps with hardening Phase 0 in `docs/hardening-plan.md`. Once landed, both workstream #1 and workstream #6 benefit.

- **LiteSVM / Mollusk** harness for fast adapter unit tests against in-process Solana state.
- **Surfpool** for forked-mainnet integration tests of multi-tx flows (Kamino borrow, leverage loop, repay-and-withdraw).
- **Smoke suite** running nightly against mainnet with ~$10 of capital, executing each adapter end-to-end.
- **Structured run logs** persisted to `run_history` (DB workstream) so we can grep for failure patterns across users.

### 6.3 Combo verification

Once the adapter set passes ~5 entries, the cartesian product of multi-node graphs gets unwieldy. Need:

- A test matrix of named multi-node combos that must always pass:
  - `Jito stake → Jupiter swap → Kamino supply` (LST collateralization)
  - `Kamino borrow → Jupiter swap → Jito stake` (borrowed-leverage staking)
  - `Sanctum LST swap → Kamino supply` (LST rate-shop into yield)
  - `Leverage Loop → Unwind Leverage` (full lifecycle, requires Unwind composite)
- A snapshot test that captures the executable plan derived from each combo and fails the build if the plan shape changes unexpectedly.
- Property-based tests on `derive-executable-plan.ts` and `graph-exec.ts` — random DAGs of various shapes (no cycles, with cycles, missing widgets, mixed adapter/compute nodes).

**Definition of done:** the named combo matrix passes in CI; new adapter additions don't break existing combos without an explicit acceptance step; nightly smoke catches regressions before users do.

---

## Sequencing

### Track A — sequential coding chain (one engineer)

```text
Wrap up hardening (Bug #2 repro, Bugs #3–#10)
  → Neon DB scaffold + schema + auth boundary
  → Templates Phase 4.1 (official seeds)
  → Templates Phase 4.2 (community submissions)
```

This is the critical path. ~6–10 weeks at a sustainable pace, less if parallelized.

### Track B — parallelizable coding (second engineer or hand-off)

```text
UI updates (once 0xJulo feedback is captured)
Adapter expansion (Sanctum first, then Jupiter Lend, then Kamino Earn)
Stress testing infra (LiteSVM + Surfpool harness; benefits A too)
```

### Track C — non-coding (you / strategic time)

```text
Revenue thesis doc (suggested next sub-deliverable: Jupiter swap fee plan + AI compose metering plan)
Coauthor sync rhythm
Hackathon retro + Colosseum feedback loop
```

### Suggested first 2-week slice

Concrete proposal for the very next two weeks:

- **Week 1:**
  - Mainnet-verify Bug #1 fix + BlazeStake (already shipped, just needs eyeballs on chain).
  - Reproduce Bug #2 with full program logs; choose fix path.
  - Capture 0xJulo's UI feedback list into section #5 of this doc.
  - Stand up Neon + Drizzle skeleton (no UI changes); land the `users` + `workspaces` + `run_history` tables.
- **Week 2:**
  - Wire `/api/me` + `/api/workspaces` behind a feature flag.
  - Sanctum INF adapter (parallel with the DB work).
  - Revenue thesis doc draft (Track C).

---

## Out of scope for v1 (parked, not forgotten)

These live in CLAUDE.md "Parked Features" with revival conditions. Repeated here for visibility:

- Cross-chain (EVM, Base, Arbitrum, Li.Fi, AAVE, ERC-4626, wagmi). Stays parked until Solana surface is mature.
- Auto-compounding scheduler. Needs off-chain keeper infra.
- Cycle-on-canvas leverage loops (flavor B). Composite leverage loop covers the use case.
- NFT position representation. Revisit when lifecycles are long enough that wrapping adds value.
- Active position locking on the canvas. Investments panel + inverse adapters cover the use case.

---

## Document maintenance

Update this doc when:
- A workstream's status changes (especially #1, #5).
- A decision lands that affects sequencing (e.g., revenue model picked, second engineer onboarded).
- A workstream is parked or split into sub-deliverables.

Don't update it for:
- Daily progress (use `docs/CHECKPOINT.md`).
- Specific bug fixes (use `docs/internal/bug-registry.md`).
- Adapter-level patterns (those belong in code comments + `docs/architecture.md`).
