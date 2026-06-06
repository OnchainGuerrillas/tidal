# Tidal — Post-hackathon Roadmap

Submission landed (Colosseum, 2026-05-10). This document captures the six workstreams driving the project from here. It is a living doc — update it as scope solidifies, decisions land, or priorities shift.

For checkpoint-level progress, see `docs/CHECKPOINT.md`. For the on-chain hardening plan specifically, see `docs/hardening-plan.md`. For the bug registry, see `docs/internal/bug-registry.md` (gitignored).

---

## Nine workstreams at a glance

| # | Workstream | Type | Track | Blocking? |
|---|------------|------|-------|-----------|
| 1 | Wrap up hardening | code | A (sequential) | unblocks new feature work that touches adapters |
| 2 | Revenue strategy | strategy | C (parallel, non-code) | not blocking eng |
| 3 | Database (Neon) — user profiles + strategies | code | A (sequential) | unblocks #4, partially #1 |
| 4 | Templates (DB-persisted) | code | A (sequential, after #3) | requires #3 |
| 5 | UI updates per 0xJulo feedback + 5b alpha-tester quick wins | code | B (parallel) | requires the feedback lists |
| 6 | Adapter expansion + stress testing + combo verification | code | B (parallel) | independent; touches hardening surface |
| 7 | Real strategy composition (close the composer gap) | code | B (parallel) | gates the core "ComfyUI for DeFi" thesis demo; pairs with #6 |
| 8 | Autonomous execution — batch tier (preview + batch sign) | code | B (parallel, **after #7**) | gated by #7; relaxes the user-signs-each-tx rule in a bounded way |
| 9 | Multichain foundation (Base / EVM) — chain switching scaffold | code | B (parallel, **after #7+#8**) | partially un-parks v1 EVM scope; scaffolding-only first slice |

**Track A:** sequential coding chain — finish hardening, then DB, then templates.
**Track B:** parallelizable coding work — UI + adapters + composer can run alongside Track A once each has a brief.
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

## 5b. Alpha tester feedback

**Goal:** apply concrete UX changes that resolve the "is this clickable or is it broken?" problem that surfaced in alpha testing, and close the gap between what the product *can* do and what testers *perceive* it can do.

### First captured round (2026-06-04)

Tester explored the app and gave a structured breakdown, followed shortly by a brief addendum. Raw feedback archived below; parsed action items follow. The composer ask was repeated across both messages — treating it as the tester's headline request.

#### What's working (preserve these)

- Visual workflow / canvas concept reads as the strongest differentiator.
- Node-based authoring is intuitive without explanation.
- Templates surface possible use cases quickly (even in placeholder form).
- AI chat-driven workflow generation registered as one of the most interesting parts of the product.

#### Pain points

- Several tabs, buttons, and actions appear clickable but produce no visible response.
- No signal whether unresponsive UI is intentionally disabled, requires setup, or is broken.
- Sections feel like an interactive prototype rather than a fully testable product, making execution flows hard to evaluate.

#### Explicit UX asks

1. "Coming Soon" labels or disabled states for unfinished features.
2. Tooltips or onboarding guidance for first-time users.
3. Demo walkthrough showing the intended end-to-end journey.
4. Clearer separation between what can be tested now vs. what's planned.

#### Future feature asks (substantive — re-read carefully)

The tester asked for two substantive future features, the first repeated across both feedback rounds:

1. Describe a goal in plain language → agent **intelligently composes a multi-node graph** that achieves the goal. (Repeated.)
2. An **autonomous version** with clear risk controls and execution previews.

##### Future ask 1: Real composition

**What `composeStrategy` actually does today:** `src/lib/ai/tools/compose-strategy.ts` exposes a `z.enum(["liquid-stake-sol", "lend-usdc-kamino", "swap-sol-then-supply-usdc", "leverage-loop-sol-kamino"])` input. The agent picks one of four hardcoded intents and parameterizes it with `sourceAmount`, `loopCount`, `targetLTV`. Each intent maps to a fixed graph (1-2 nodes plus a composite leverage node). There is **no synthesis** — the agent is a classifier with parameters, not a composer.

**What the tester is asking for:** given a goal like *"maximize yield on 1 SOL with moderate risk"* or *"diversify across LSTs and use them as collateral on Kamino"*, the agent should:
1. Reason over the live adapter manifest (Jito stake, BlazeStake stake, Kamino supply / borrow / leverage loop / withdraw / repay, Jupiter swap, and their inverses — 9 mainnet-verified adapters today, more coming via #6.1).
2. Plan a multi-step strategy that composes them: e.g., split SOL → Jito + BlazeStake → use both LSTs as Kamino collateral → borrow USDC → swap to SOL → loop.
3. Emit a 5-10 node graph with correctly wired edges, asset-compatible handles, sensible widget defaults, and clean positioning.
4. Surface a "why this works" rationale in chat (which protocols, what risk tier, what's the projected APY) so the user can audit.

**Why this matters:** this is the ComfyUI-for-DeFi thesis. `docs/design-thesis.md` calls the agent a "composer" but today it's a template picker. Closing this gap turns "4 canned demo flows" into "the agent can express the cartesian product of our adapter vocabulary." It's the difference between a demo and a product.

**Rough scope estimate:** non-trivial. Probably 1-2 weeks of focused work covering: adapter-manifest export for the agent, a planner step (probably a second tool call that emits a graph spec), edge/handle synthesis with asset compatibility validation, layout pass for clean positioning, rationale prompt tuning. Pairs naturally with **#6.1 adapter expansion** (more adapters = richer compositions) and arguably should land before more adapters since the composer is what makes the adapter vocabulary leverageable.

**Suggested promotion:** move this from "future feature ask" to a first-class workstream. Proposed name: **Workstream #7 — Real strategy composition (close the composer gap).** It's pitched as a future ask in tester language but it's actually the core product thesis.

##### Future ask 2: Autonomous execution mode

**Tester language:** *"An autonomous version would definitely be interesting, especially with clear risk controls and execution previews."*

**Why this is a strategic question, not just a feature ticket:** Tidal's current safety posture is *user signs everything* (per `CLAUDE.md` and the `ai-sdk-ui` skill notes — "DeFi actions must require user signature; never auto-execute from a tool call"). The design thesis casts the agent as a *composer*, not an *executor*. Moving to autonomy reframes the product. Worth doing — almost every long-term user wants to set strategies and walk away — but worth thinking through deliberately rather than bolting on.

**Three possible flavors, ranked by lift and by how much they relax the safety rule:**

| Flavor | Description | Lift | Relaxes safety rule? | Infra needed |
|---|---|---|---|---|
| **A. Pre-authorized batches** | Agent composes a multi-tx plan → shows preview ("5 txs, expected outcome Y, max slippage Z") → user approves the **batch** → agent executes through every leg without re-asking. | Small (1-2 weeks) | No — signature still required, just at the batch boundary instead of each leg. | None new; uses existing Privy embedded-wallet flow. |
| **B. Scheduled / recurring** | Agent runs a strategy on a schedule (DCA, weekly rebalance, auto-compound). Currently parked as "auto-compounding scheduler" in `CLAUDE.md`. | Medium-large (3-4 weeks + ops) | Yes — agent acts when user is not present. Mitigated by pre-set bounds. | Off-chain keeper / cron infra, persistent DB state, session keys via Privy. |
| **C. Reactive / conditional** | Agent monitors on-chain conditions (rates, prices, health factor) and executes when triggers fire ("if Kamino APY > Marginfi by 100bps, migrate"). | Large (5-6 weeks + ops) | Yes, and the trigger surface is unbounded. | Real-time event streams (Helius webhooks or similar), risk-cap state machine, kill switches, audit log. |

**The "execution previews" qualifier is doing real work.** It maps cleanest to **Flavor A**: the tester is fine with bounded autonomy *if they can see the plan first*. That preserves the user-signs-everything rule by moving the signature one level up (from per-tx to per-batch). It's also the smallest lift and the safest first step toward autonomy.

**Recommended sequencing:**
1. Ship Workstream #7 (real composition) first — autonomy is meaningless if the agent can't compose anything beyond 4 canned intents.
2. Layer Flavor A on top — "batch preview + batch approval" is a natural UX evolution of the existing per-graph Run button. This becomes **Workstream #8** (autonomous execution — batch tier).
3. Defer B and C until #8 is in users' hands and we understand what conditional / scheduled triggers users actually want. Don't build keeper infra speculatively.

**Risk-control primitives the tester is implicitly asking for** (worth scoping for Flavor A regardless of when B/C land):
- Max position size per protocol
- Max slippage per swap
- Max total $ value at risk per batch
- Required minimum health factor on borrow-based strategies
- "Dry-run / simulation" mode that shows expected outcome without executing
- Per-strategy kill switch in the Investments panel

### Parsed action items

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done · `[parked]` deferred with reason.

#### Quick wins (~3-5 hrs total, ship before next testing round)

- [ ] **Audit every clickable surface for "does nothing" interactions.** Walk the workspace shell + panels + header tabs and either wire each action up, disable it explicitly with `aria-disabled`, or remove it. Surfaces to check: workspace header tabs, side-panel toggle row, node picker categories, investment card actions, template card buttons, prompt composer secondary actions.
- [ ] **Add `"Coming soon"` tooltips + visual disabled state** to all in-flight but not-yet-wired affordances. Standard pattern: `aria-disabled="true"` + muted text + a `Tooltip` with "Coming soon: {one-line description}".
- [ ] **Re-position the chat panel as the headline interaction.** Current chip-based empty state (commit `564d742`) is a start; consider opening the workspace with chat panel pre-focused on first visit, plus an above-the-composer line: "Tell me what you want to do — I'll build the graph." Goal: alpha testers find composeStrategy without being told.
- [ ] **First-load onboarding overlay.** Lightweight one-time popover with 3 callouts pointing at chat panel ("ask in plain English"), canvas ("see the strategy as a graph"), Run button ("execute on mainnet"). Dismissible, doesn't return after dismissal. localStorage flag.
- [ ] **Add a "what's testable right now?" badge or banner.** Could live in the header. Two states: "Live: stake / lend / swap / leverage / unwind" (current) vs. parked: portfolio management, templates, etc. Sets expectations upfront.

#### Medium lifts (folds into existing workstreams)

- [ ] **Demo walkthrough.** Belongs in workstream #4 (Templates). The three official seed templates (Stake-and-Hold, Stablecoin Lending, Leverage Loop) already double as walkthroughs — making them ship-quality and discoverable from the workspace solves this. Cross-reference: #4.1.
- [ ] **Tooltips library audit.** We have a `Tooltip` primitive; needs a sweep to ensure every interactive surface uses it consistently. Pairs with #5 (UI updates).
- [ ] **Disabled-state styling pass.** Promote the "disabled" treatment into `globals.css` as a semantic class so the audit above doesn't introduce one-offs.

#### Larger / strategic (post-templates)

- [ ] **Real strategy composition (Workstream #7 candidate — see "Future ask 1" above).** Multi-node graphs synthesized intelligently by the agent from a plain-language goal, not picked from a 4-intent enum. This is the tester's repeated headline ask AND the core product thesis. ~1-2 weeks; would justify being its own workstream rather than a bullet here.
- [ ] **Autonomous execution — batch tier (Workstream #8 candidate — see "Future ask 2" above, Flavor A).** Agent composes → shows execution preview → user approves the batch → agent runs every leg without re-asking. Smallest, safest first step toward agent autonomy. Pre-requires #7 (no point auto-executing 4 canned intents). ~1-2 weeks after #7 lands.
- [ ] **Portfolio management surface.** Tester explicitly wants to see real "actual strategy deployment, transaction handling, and portfolio management" next round. Today's Investments panel is read-only positions; doesn't yet model strategy *deployment* as a first-class concept distinct from runs. Open question: do positions need a "deployment" wrapper that aggregates "I composed → ran → now tracking" into one card with rebalance / unwind actions? Defer to a focused design pass.

### Cross-references

- The "everything looks clickable" problem maps directly to **workstream #5** (UI updates per 0xJulo feedback) — fold the quick wins into the same UI polish pass.
- The "what can I test" question maps to **workstream #1** (hardening) plus **#4** (templates) — once the mainnet smokes finish and templates ship, the testable surface area is concrete and demoable.
- The "intelligent multi-node composition" ask should become **Workstream #7** (real strategy composition) — see the "Future feature ask" subsection. Pairs with **#6.1** (adapter expansion) since a richer adapter vocabulary makes composition demos more impressive, but composition is the gating capability and should land first.

**Definition of done for the captured round:** the five quick wins are shipped and visible in the live app; tester is invited back for a second round.

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

## 9. Multichain foundation (Base / EVM) — scaffolding only

**Status:** captured 2026-06-06. **Partially un-parks** the v1 EVM scope previously listed in `CLAUDE.md` "Parked Features" (which said *"wagmi hooks. Stays parked permanently for v1"*) — see "Reversal note" below. Adapter expansion across full EVM stays parked.

**Goal:** ship a chain-switching foundation so users can connect a Base wallet alongside their Solana wallet and toggle between chains from a global header selector. **First slice is scaffolding only** — no Base adapters land in 9.1; users see an empty picker on Base with a "Coming soon" affordance. Adapter coverage on Base happens in subsequent phases as a deliberate sequencing decision.

**Why scaffold first, adapters later:** the architectural lift (chain context, header selector, picker filters, workspace chain-binding, EVM wallet hooks) is the part that touches the most surfaces. Doing it first with zero adapters proves the architecture is sound. Adding a Base adapter in 9.2 then becomes a localized change. The alternative — building adapter + scaffold together — couples two big lifts and makes mistakes in either harder to isolate.

### Pre-requisites

This workstream is gated by **#7 (real composition) + #8 (autonomous batch)**. Reasoning: the composer is what makes the adapter vocabulary feel like a product; shipping multichain before the composer just gives users more buttons to manually wire up. Sequencing #9 after #7+#8 means by the time Base lands, "AI composes a Solana strategy" and "AI composes a Base strategy" are both compelling demos, and "AI rate-shops across chains" becomes a future pitch beat (#9.3+).

### Phasing

#### Phase 9.1 — chain-switching scaffold (no adapters)

**Scope:**
- **Chain context provider.** New `src/providers/chain-context-provider.tsx` exposing `{ chain: "solana" | "base", setChain }`. Defaults to `solana`. Persists to `localStorage` so the choice survives reloads.
- **EVM wallet integration via Privy.** Privy is already configured with `walletChainType: 'ethereum-and-solana'`, so EVM wallets are provisioned today; we just need the read hooks. Use `@privy-io/react-auth` EVM hooks (`useWallets`, `useSignMessage`, `useSignTransaction`) — wagmi stays parked permanently. (One Privy is simpler than two wallet libraries.)
- **Header chain selector.** Compact dropdown in `AppHeader` showing the current chain with a small chain icon. Click → menu → switch. Triggers `setChain`. Disabled tooltip when no connected wallet of that chain type.
- **Workspace chain attribute.** Add `chain: "solana" | "base"` to the `Workspace` type. Defaults to the active chain on creation. Workspaces are chain-bound; switching the global chain shows only workspaces matching the new chain in the tab bar.
- **Adapter registry chain filter.** Add `chain` field to `ProtocolAdapter`. `listAdapters()` filters by current chain. Existing Solana adapters all get `chain: "solana"`.
- **Picker filter by chain.** Node catalog only surfaces adapters matching the current chain.
- **Empty-state UX on Base.** Picker, chat composer empty state, and Investments panel all show a "Base adapters coming soon — switch to Solana for the current product" message. Honest, not pretending.
- **Wallet connection UX.** Login flow auto-provisions both wallets; user can see both addresses in the Profile sheet under "Linked accounts" (already wired — the existing `linkedAccounts` list will include the EVM wallet once Privy provisions it).

**Estimated effort:** 1-1.5 weeks. Most of it is touching the right files (provider tree, header, registry, picker, types), not deep new code.

**Definition of done:** I can sign in with both wallets, toggle chain in the header, see the picker / chat composer go empty on Base with a clear "coming soon" message, and toggle back to Solana to see the full current product unchanged.

#### Phase 9.2 — first Base adapter (post-9.1)

**Open question — defer choice to scoping time:** likely **AAVE V3 USDC supply** on Base (mirrors Kamino USDC supply on Solana → unlocks "agent rate-shops between Solana and Base lenders"). Alternatives: a Base liquid-staking adapter for direct parity with Jito/BlazeStake, or a Uniswap swap for parity with Jupiter.

**Pre-existing prep:** the parked v1 EVM scope already named **AAVE V3 adapters** and **ERC-4626 vault adapter** as future work. Those parked notes become the starting point for 9.2 scoping.

#### Phase 9.3 — cross-chain composition (defer further)

**Stays out of scope** until 9.1 and 9.2 ship and there's evidence users want to *bridge inside a strategy* rather than *pick a chain per strategy*. Re-introducing Li.Fi for this is non-trivial (bridge-as-node UX, asset compatibility across chains, settlement timing); don't pull on that thread speculatively.

### Reversal note

`CLAUDE.md` "Parked Features" currently says:

> **EVM chain configs** (Base, Arbitrum, Optimism). **Reintroduce when:** the Solana surface is mature and there's a clear cross-chain story.
>
> **wagmi hooks** — replaced by Solana wallet adapter / Privy Solana hooks. Stays parked permanently for v1.

Workstream #9 partially un-parks the first item (Base specifically, not the full EVM expansion) and keeps wagmi parked permanently (Privy EVM hooks cover the use case without adding a second wallet library). `CLAUDE.md` updated in lockstep to reflect this — see the "Parked Features → EVM and cross-chain" section there for the new state.

The Solana-surface-maturity gate is still respected by sequencing #9 after #7 and #8. The reversal is about *intent* (we now plan to do Base in v1.x), not about *jumping the queue*.

---

## Out of scope for v1 (parked, not forgotten)

These live in CLAUDE.md "Parked Features" with revival conditions. Repeated here for visibility:

- **Full EVM expansion beyond Base** (Arbitrum, Optimism, Li.Fi cross-chain bridging, AAVE on other chains, ERC-4626 vault adapter). Partially un-parked: Base lands in #9 above. Other chains stay parked until Base ships and demand for additional EVM coverage is concrete.
- **wagmi hooks** — permanently parked. Privy EVM hooks cover the use case in #9 without adding a second wallet library.
- Auto-compounding scheduler. Needs off-chain keeper infra. Partial overlap with #8 Flavor B; revisit once #8 Flavor A ships.
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
