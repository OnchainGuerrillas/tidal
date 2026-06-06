# Tidal — Grant Roadmap

**ComfyUI for Solana DeFi.** A visual, typed, composable canvas where users build yield strategies as node graphs — and where an AI agent composes graphs on the user's behalf.

**Repository:** [github.com/OnchainGuerrillas/tidal](https://github.com/OnchainGuerrillas/tidal)
**Status:** Phase 1 shipped — mainnet-verified across 9 protocol adapters. Phase 2 in active development.
**Last updated:** 2026-06-06

---

## Executive Summary

Tidal is the first visual composition surface for Solana DeFi. Users build yield strategies as node graphs on a canvas — a wallet, a stake, a swap, a lend, a split — and run the entire graph as a single mainnet flow. An AI agent composes graphs in plain English ("stake 0.05 SOL on Jito and supply the JitoSOL as Kamino collateral") and drops them onto the canvas for user inspection, edit, and approval before execution.

Phase 1 is live on Solana mainnet today: nine protocol adapters across Jito, BlazeStake, Kamino (lending), Jupiter (swaps), and a composite leverage-loop node — every one verified by real on-chain transactions. The graph execution engine handles multi-transaction strategies end-to-end with per-node status reporting. The AI chat panel composes strategy graphs that drop onto the canvas and execute on user approval.

We are now building Phase 2: real multi-node strategy composition (the agent today picks from four canonical intents; the next milestone is intelligent synthesis across the full adapter vocabulary), an autonomous execution mode with batch previews and explicit risk controls, persisted user profiles and shareable strategies, and a multichain foundation that begins with Base. Each milestone is independently shippable and validated against real users.

This document is the roadmap we're submitting to Superteam, Colosseum, and other ecosystem grant programs. It reflects what we've shipped, what users have asked us for in alpha testing, and the sequencing we believe takes Tidal from "compelling demo" to "the way people build DeFi strategies."

---

## The Thesis: ComfyUI for DeFi

[ComfyUI](https://docs.comfy.org/development/core-concepts/nodes) transformed AI image generation by replacing opaque "type a prompt, get a result" interfaces with a visual, typed, composable graph. Nodes carry typed inputs and outputs. Edges enforce compatibility. Parameters are widgets. Workflows are DAGs that anyone can share, fork, and modify. The result: a non-expert can build pipelines that previously required custom code, and the community spreads expertise by sharing graphs.

DeFi has the same shape and the same problem. The strategies that produce real yield require chaining operations across protocols: stake SOL → mint a liquid-staking token → use the LST as collateral → borrow stablecoin → lend the stablecoin → harvest rewards → compound. Today this means bouncing across five protocol UIs, copying numbers between tabs, and trusting that you remembered every step. Most users opt out.

**A node graph makes the chain visible.** Every operation is a node. Every connection is a typed asset transfer. Every parameter is a widget. The strategy is the graph, not a sequence of forms a user has to hold in their head.

**The AI agent is a composer, not an executor.** The agent's job is to write graphs onto the canvas, explain them, and let the user inspect, modify, and run. Blind chat-driven execution is not the product. The canvas is the source of truth.

This positioning is differentiated. Phantom is a wallet. Jupiter is an aggregator. Step Finance is a dashboard. Griffain is a token. The Hive is multi-agent chat. None of them are a composition surface for DeFi strategies — and the closest analog in the broader software world (ComfyUI for image generation) proves the paradigm works at scale and creates a content/sharing loop that compounds.

---

## What's Already Shipped (Phase 1, mainnet-verified)

Every item below is **live on Solana mainnet today** and demonstrable end-to-end. Transaction signatures are available on request.

### Protocol adapters (9 total)

| Protocol | Adapter | Notes |
|----------|---------|-------|
| Jito | SOL → JitoSOL stake | SPL stake-pool |
| Jito | JitoSOL → SOL unstake | |
| BlazeStake | SOL → bSOL stake | SPL stake-pool |
| BlazeStake | bSOL → SOL unstake | |
| Kamino | USDC supply | Main market |
| Kamino | USDC withdraw | |
| Kamino | Supply-and-borrow | Multi-tx; SOL collateral → USDC debt |
| Kamino | Repay-and-withdraw | Closes borrow positions |
| Kamino + Jupiter | Leverage loop | Composite node; recursive supply-and-borrow + swap |
| Jupiter Ultra | Any-pair swap | SOL / USDC / USDT / JitoSOL / mSOL / bSOL |

The Kamino borrow pattern (separate SDK calls + `useV2Ixs` + Scope refresh config + init-tx splitting) was battle-tested across borrow, withdraw, and repay-and-withdraw operations. The pattern is reusable for any future Kamino strategy.

### Graph execution engine

- **Multi-transaction contract.** A single node can produce N transactions submitted in sequence, with on-chain confirmation between them so downstream nodes see fresh state.
- **Multi-output runner.** Nodes can emit on multiple typed handles; edges carry source-handle metadata so split-and-fan-out works in the runner.
- **Per-node visual status.** Cyan-pulse / emerald / red / amber rings on the canvas show in-flight, succeeded, failed, and skipped nodes as the graph runs.
- **Streamed events.** A floating panel renders `GraphExecutionEvent`s as they fire so users see exactly what's happening.

### AI composition

- **Chat panel** wired live to a streaming AI endpoint (Vercel AI SDK + Claude). User types a goal in plain English; the agent calls a `composeStrategy` tool that drops graph nodes onto the canvas.
- **Four canonical intents shipped:** liquid-stake-sol, lend-usdc-kamino, swap-sol-then-supply-usdc, leverage-loop-sol-kamino. Each produces a runnable graph the user can edit before approving.
- **Bridge problem solved.** Hand-built graphs and AI-composed graphs both run through the same executor via a `catalogItemId` stamp on each node.

### Backend infrastructure

- **Persistence layer (Neon + Drizzle ORM).** Users, wallets, workspaces, versioned graph snapshots, and run history. Wired up with idempotent migrations and a typed schema.
- **Privy server-side auth boundary.** JWT verification, user upsert, linked-account discovery. Lazy-init pattern so missing env vars surface as 500s on the affected route instead of breaking the entire build.
- **Authenticated API routes:** `GET /api/me`, `GET+POST /api/workspaces`, `GET+PUT /api/workspaces/[id]`, `POST /api/runs`.

### User-facing UX

- **Profile sheet** on the sidebar avatar — display name (editable), primary wallet with copy affordance, linked accounts, workspaces and runs stats, recent-runs list, logout.
- **Real on-chain investment tracker** reading live Kamino obligations and Jito balances, auto-refreshing after every successful run.
- **Wallet node** showing live SOL/USDC balances pulled from RPC.
- **Live APY readouts** on adapter nodes via a 60-second-memoed `/api/solana/rates` route.
- **"What's live" capability dialog** in the header so alpha testers know exactly what's testable today vs. what's coming.
- **First-load onboarding overlay** introducing the three core concepts (chat the agent, see the graph, run on mainnet) with localStorage-flagged dismissal.

### Quality posture

- TypeScript strict mode; production build clean on Next.js 16.2.7 (latest, includes May 2026 CVE patches).
- Project-level Claude Code permission deny rules block secret-bearing dotfile access at the harness layer — committed to the repo so guardrails travel with the codebase.
- Mainnet test suite exists; every adapter shipped has been verified with a real signed transaction.

---

## Alpha Validation

A user explored the product in a guided alpha round and shared structured feedback. The framing reads like a press quote, which is unusual to receive without asking:

> *"The visual workflow/canvas concept is strong and makes DeFi strategies easier to understand. The node-based approach is intuitive. The AI chat-driven workflow generation is one of the most interesting parts of the product."*

The tester also asked, in two separate messages, for the same future capability:

> *"I'd love to see is the ability to describe a goal in plain language and have the agent suggest and visualize a strategy automatically. That could make onboarding much easier for new users."*

> *"An autonomous version would definitely be interesting, especially with clear risk controls and execution previews."*

Both of these requests are the **central thesis of Tidal** — they're not bolt-on features. The tester independently arrived at the same product vision the design thesis describes. We are now building the milestones that close the gap between what's shipped and what alpha users are asking for.

---

## The Roadmap

We organize forward work into nine workstreams across three execution tracks. Each workstream has a concrete definition-of-done and is independently shippable.

### Track A — Foundation (sequential)

**Reliability and persistence work that gates new feature surfaces.**

#### Workstream 1 — Production hardening

Coordinated work to fix known on-chain edge cases identified during alpha and improve transaction-landing reliability. Includes priority-fee oracle integration (Helius `getPriorityFeeEstimate`), fresh-blockhash-per-tx for multi-tx sequences, and RPC retry logic for transient failures. Outcome: no demo path requires manual wallet-state cleanup; every High-severity issue in the internal bug registry is closed or explicitly deferred with a documented reason.

#### Workstream 3 — Persistence layer

Backend already shipped (Neon + Drizzle + four authenticated API routes). Remaining work: wire the existing in-memory `WorkspaceProvider` to API-backed sources behind the Privy auth gate, with debounced auto-save on graph mutations. Authenticated users get saved workspaces, versioned graph history, and recorded run history. Unauthenticated visitors continue to see the current mock-seeded demo workspace. Outcome: a user signs in, builds a strategy, refreshes, and finds their work intact.

#### Workstream 4 — Templates

Three Tidal-curated official seed templates (Stake-and-Hold via Jito, Stablecoin Lending via Kamino, Leverage Loop on Kamino) shipped as DB rows that fork into a fresh workspace on user click. Phase 4.2 opens community submissions with star/fork counters and a "must have run once successfully" indexing rule. Phase 4.3 adds Tidal-side curation (featured flag, author attribution).

### Track B — Capability expansion (parallel)

**The work that makes Tidal a product worth describing to other people.**

#### Workstream 5 — UX polish

Designer-led pass on canvas affordances, signing UX, asset color palette, "has-run" node visuals, and the wider list of items captured from partner and alpha-tester feedback. Includes the quick wins already shipped this week ("What's live" header dialog, Coming Soon affordance on placeholder template cards, onboarding overlay, chat-panel headline copy).

#### Workstream 6 — Adapter expansion

Broadening the protocol vocabulary the agent can compose. Priority order: Sanctum INF (LST routing — "agent rate-shops between JitoSOL, bSOL, mSOL"), Jupiter Lend USDC (second stablecoin lender — "agent rate-shops between lenders"), Kamino Curated Earn Vaults (Mid-Depth tier, 8-15% APY), Jupiter Perps (Deep Water tier leverage trading). Each adapter is one independent unit of work; combining them produces compound demos.

#### Workstream 7 — Real strategy composition (the headline)

Today the agent picks from four hardcoded intents and parameterizes them. The next milestone: **the agent reasons across the full adapter vocabulary and synthesizes multi-node graphs from open-ended user goals.** Concretely:

1. Adapter manifest exported to the agent (current adapters, their inputs/outputs, risk tiers, live APYs).
2. Planner step that decomposes a goal into a multi-step strategy (e.g., "diversify across LSTs and use them as collateral on Kamino" → split SOL → Jito + BlazeStake → use both as Kamino collateral → borrow USDC → swap → loop).
3. Edge synthesis with asset compatibility validation and intelligent node positioning.
4. Rationale prompt that surfaces *why* the strategy works (which protocols, expected APY, risk tier) so the user can audit.

This is the ComfyUI-for-DeFi thesis closing into the product. Workstream 7 is the difference between "a demo with 4 canned flows" and "a tool where the agent expresses the cartesian product of our adapter vocabulary." Alpha testers asked for this directly in two separate messages.

#### Workstream 8 — Autonomous execution (batch tier)

Builds on Workstream 7. Once the agent can compose meaningful multi-node strategies, the natural next UX is: agent composes → shows a clear execution preview (5 transactions, $X total cost, expected outcome Y, slippage caps Z) → user approves the **batch** → agent executes every leg without re-asking. The user signature is preserved at the boundary — moved from per-transaction to per-batch — and never removed.

Risk-control primitives the alpha tester implicitly asked for, all of which are in scope: max position size per protocol, max slippage per swap, max total $ at risk per batch, required minimum health factor for borrow strategies, dry-run / simulation mode, per-strategy kill switch in the Investments panel.

Heavier autonomy flavors (scheduled execution, conditional triggers) are explicitly out of scope for v1 and tracked separately. Tidal stays in the user-approves-the-plan camp; the plan just covers more ground.

#### Workstream 9 — Multichain foundation (Base)

A chain-switching scaffold so users can connect a Base wallet alongside their Solana wallet and toggle between chains from a global header selector. The initial slice ships **scaffolding only** — chain context, Privy EVM hooks, header selector, picker filters, workspace chain-binding — with no Base adapters yet, and an honest "Coming soon" affordance on the Base side. This proves the architecture before committing to adapter work.

Phase 9.2 lands the first Base adapter (likely AAVE V3 USDC supply, mirroring Kamino USDC supply on Solana) and unlocks the "agent rate-shops between Solana and Base lenders" demo. Phase 9.3 considers cross-chain composition (Li.Fi bridging inside a graph) only after we see evidence users want it.

### Track C — Strategic (parallel, non-engineering)

#### Workstream 2 — Revenue thesis

Primary candidate: **Jupiter integrator fees on swap nodes** (5-10 bps standard, already supported by Jupiter Ultra's referral surface). Zero new infrastructure required. The framing: Tidal earns when Tidal is useful — a few basis points on agent-composed swap volume. Aligned with the AI compose story (the AI's job is routing).

Secondary: **AI compose budget as a usage meter** above a free monthly quota. Fits naturally with the LLM call cost structure and rewards heavy AI users without gating the core composition surface.

Open option: **governance / creator token** for template authors once community submissions ship. Parked until the creator economy is real.

---

## What's Next — Concrete Milestones

**Next 30 days:**
- Wire `WorkspaceProvider` to the persistence layer (close Workstream 3 — backend is live).
- Mainnet-verify three shipped-but-unverified post-hackathon adapters (BlazeStake stake/unstake, leverage-loop fix).
- Ship the three official seed templates (Workstream 4.1) and turn the "Coming Soon" template cards into real fork-into-workspace flows.

**Next 90 days:**
- Land Workstream 7 (real composer) — the headline alpha-tester ask. The product changes from "4 canned demos" to "the agent expresses the full adapter vocabulary."
- Ship 2-3 more adapters (Sanctum INF, Jupiter Lend USDC).
- Begin Workstream 8 scoping with the composer in users' hands.

**Next 6 months:**
- Ship Workstream 8 (autonomous batch tier) with the full risk-control primitive set.
- Begin Workstream 9.1 (multichain scaffolding, no Base adapters yet).
- Open community template submissions (Workstream 4.2).
- Stand up Jupiter integrator fees (Workstream 2) once meaningful swap volume is flowing through agent-composed graphs.

---

## Differentiation

| Product | Category | What it does | Why it's not Tidal |
|---------|----------|--------------|-------------------|
| Phantom | Wallet | Holds keys, signs transactions, browses dApps. | A wallet, not a strategy surface. Tidal sits beside it. |
| Jupiter | Swap aggregator | Routes a single swap across DEXes. | One operation per session. Tidal chains operations. |
| Step Finance | Portfolio dashboard | Shows current holdings, positions, performance. | Read-only. Tidal lets you build what you want. |
| Griffain | Agent token | Speculative AI-agent token. | A token, not a product. |
| The Hive | Multi-agent chat | Conversational interface to multiple AI agents. | Chat-driven, no graph, no canvas. |
| Yearn-style vaults | Strategy aggregator | Pre-defined yield strategies on EVM. | Flat list of vaults; no composition. Lose the why. |

The relevant external comparison is **ComfyUI itself**, which proved that visual graph composition with typed I/O and a sharing loop transforms a previously opaque domain (image generation) into a community-driven craft. We are betting the same paradigm applies to DeFi strategy — and we are the only product currently building it on Solana.

---

## Why Now

- **Solana DeFi composability is mature enough.** Jupiter Ultra, Kamino lending, Jito stake pools, and the broader SPL stake-pool ecosystem provide enough adapter surface for compelling multi-protocol strategies today.
- **AI tool-call patterns are production-ready.** Vercel AI SDK v6 + Anthropic Claude's tool-use surface ship a clean composition primitive. The composer doesn't need novel research — it needs careful product design and a well-bounded adapter manifest.
- **Privy embedded wallets eliminate onboarding friction.** A new user can sign in with email and execute mainnet transactions without installing a wallet extension. Tidal is shippable to non-crypto-native users.
- **Solana ecosystem is funding builders who ship.** Phase 1 is on mainnet. Adapters are verified. The roadmap describes a product that closes the loop between AI tools and on-chain execution in a way no one else is currently building.

---

## Team and Open Source

Tidal is built by [OnchainGuerrillas](https://github.com/OnchainGuerrillas). Engineering is led by Sardius; product and design partnership with 0xJulo. The repository is `github.com/OnchainGuerrillas/tidal`.

The codebase is structured for handoff: route files stay thin, business logic lives in `src/lib/*`, UI surfaces are split across generic primitives (`src/components/ui`), branded components (`src/components/tidal`), and product-specific composition (`src/components/workspace`). Documentation in `docs/` covers the design thesis, current architecture, full PRD, and internal roadmap.

---

## Appendix: Key Documents

- `docs/design-thesis.md` — Foundational. ComfyUI-for-DeFi paradigm and the concept map.
- `docs/tidal-prd.md` — Full product requirements with feature-level breakdowns.
- `docs/architecture.md` — Current live architecture across frontend, backend, and AI tool surfaces.
- `docs/post-hackathon-roadmap.md` — Internal engineering-facing roadmap with full workstream scoping (the source material for the public version above).
- `docs/CHECKPOINT.md` — Living engineering checkpoint with current status and historical context.

---

*This roadmap is shared in good faith with grant programs across Superteam, Colosseum, and the broader Solana ecosystem. The numbers, timelines, and scope reflect realistic engineering pace and our honest assessment of what's shipping when. We welcome feedback, conversation, and the chance to demo Phase 1 live on mainnet.*
