# Tidal: Solana-First Consumer DeFi Product

**Version:** 2.2
**Date:** April 18, 2026
**Status:** Active — supersedes v2.1
**Transition:** EVM hackathon prototype (Base) → Solana-first consumer product
**Team:** 0xSardius (engineering) + 0xJulo (design engineering)

---

## Executive Summary

Tidal is **ComfyUI for Solana DeFi**: a visual, typed, composable canvas where users build yield strategies as node graphs. An AI agent composes graphs on the user's behalf, drops them onto the canvas for inspection, and the user runs them with one click. Every step is visible, every parameter is editable, and every transaction is explained before signing.

### Taglines

- **User-facing:** "Your AI tidekeeper for Solana DeFi."
- **Architectural:** "Compose Solana yield like a workflow."

### Design Thesis

The composition paradigm is the differentiator. See `docs/design-thesis.md` — required reading before product or architecture decisions. The short version: nobody on Solana ships a composition surface today. Phantom is a wallet, Jupiter is an aggregator, Step is a dashboard, Griffain is a token, The Hive is multi-agent chat. None of them are a graph.

### Why Solana-First

- 77% of AI agent transaction volume happens on Solana (Franklin Templeton, Dec 2025)
- 400ms finality + sub-cent fees = instant, frictionless UX
- $11.5B DeFi TVL with deep lending/staking markets
- No consumer-grade AI yield advisor exists on Solana today
- 20M+ Phantom users = massive addressable market already on-chain

### Product Philosophy

**Make Solana DeFi composable, visible, and shareable.** Users build strategies the way ComfyUI users build image pipelines — by dragging typed nodes onto a canvas. The AI agent composes graphs on the user's behalf when asked ("earn yield on my USDC"), but the user always sees the graph before it runs. No black-box execution. No buried parameters. Every step is a node, every connection is typed, every widget is editable.

Comfort and safety are side effects of the paradigm: when every step is visible before signing, users don't sign things they don't understand.

### Core Value Proposition

- **For Solana users** who want to earn yield but find DeFi protocols overwhelming
- **Tidal** eliminates complexity with an AI that explains every action, personalizes by risk, and executes transactions
- **Unlike** raw protocol UIs (Kamino, Jupiter, Drift) that assume expertise
- **Unlike** DeFAI token projects (Griffain, Virtuals) that are speculative, not functional
- **Tidal** is a working product where every recommendation is explained and every action is transparent

---

## Problem Statement

1. **Yield is everywhere on Solana** — Kamino ($3B TVL), Jupiter Lend ($1.6B), Jito ($2.9B), Sanctum, Drift, Marinade — but comparing them requires protocol-by-protocol research
2. **Security is a real concern** — $250M+ stolen from Solana users in H1 2025 via phishing and malicious approvals. Users need help understanding what they're signing.
3. **No standard vault interface** — Unlike EVM's ERC-4626, every Solana protocol has a unique API. This makes building universal tools hard (and is therefore a moat once built).
4. **Yield changes constantly** — The best option last week may not be the best option today. Manual monitoring is exhausting.

---

## Target Users

### Primary: "Solana Sophie"

- Has SOL and USDC in Phantom, trades on Jupiter sometimes
- Knows staking exists, has maybe staked SOL natively
- Doesn't understand the difference between Kamino, Marginfi, and Jupiter Lend
- Wants to earn yield without becoming a full-time DeFi researcher
- **Quote:** "I have SOL and USDC sitting in my wallet. I know I should be earning something but I don't know which protocol to trust."

### Secondary: "Busy Builder Brian"

- DeFi-literate, has used multiple Solana protocols
- Time-constrained — checking Kamino vs Jupiter Lend vs Drift daily is unsustainable
- Wants optimization handled for him
- **Quote:** "I know what I'm doing but I don't have time to do it every day."

---

## Product Architecture

### Risk Tiers (Unchanged — Tidal's Core UX)

| Tier | Name           | Solana Strategies                    | Target APY | Protocols                                              |
| ---- | -------------- | ------------------------------------ | ---------- | ------------------------------------------------------ |
| 1    | **Shallows**   | Liquid staking, stablecoin lending   | 4-8%       | JitoSOL, Kamino USDC, Jupiter Lend USDC                |
| 2    | **Mid-Depth**  | Single-asset lending, curated vaults | 8-15%      | Kamino Earn Vaults, Jupiter Lend, Drift lending        |
| 3    | **Deep Water** | Leveraged yield, LP positions        | 15%+       | Jupiter Multiply, Kamino LP (Orca), Drift perp funding |

### Agent Decision Loop

```
User sets risk depth
    │
    ▼
AI scans yields (DeFi Llama + on-chain reads)
    │
    ▼
AI filters by risk tier → ranks by APY
    │
    ▼
AI recommends with plain-English explanation
    │
    ▼
User approves (or autopilot auto-executes)
    │
    ▼
Tidal executes via protocol adapter
    │
    ▼
Dashboard updates, AI monitors for changes
```

### Tech Stack (Solana-First)

| Layer       | Technology                                           | Notes                                                                                                                              |
| ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Frontend    | Next.js 16, React 19, Tailwind v4                    | Reuse from v1                                                                                                                      |
| Auth/Wallet | Privy (embedded Solana wallet + external connectors) | Already integrated for EVM; add Solana via config. Supports Phantom/Backpack externally + embedded wallets for new users.          |
| AI Agent    | Vercel AI SDK v6 + Claude                            | Reuse from v1, new Solana tools                                                                                                    |
| Swaps       | Jupiter Ultra API (direct)                           | 2-endpoint flow, no RPC needed (Beam relayer), 2-10 bps fees, same liquidity Li.Fi would use. Revenue: integrator fees (keep 80%). |
| Lending     | Kamino Lend, Jupiter Lend                            | Custom adapters (no ERC-4626 equivalent)                                                                                           |
| Staking     | Jito, Sanctum                                        | LST minting + redemption                                                                                                           |
| Yield Data  | DeFi Llama Yields API                                | Already scanning Solana (chain === "Solana")                                                                                       |
| Chain       | Solana Mainnet                                       | Devnet for testing                                                                                                                 |

### Target Architecture

```
lib/
├── solana/
│   ├── connection.ts      # Solana RPC connection + fallback
│   ├── kamino.ts           # Kamino Lend adapter (supply, withdraw, positions)
│   ├── jupiter-lend.ts     # Jupiter Lend adapter
│   ├── jito.ts             # JitoSOL staking (mint/redeem)
│   ├── sanctum.ts          # Sanctum INF staking
│   ├── jupiter-swap.ts     # Jupiter swap aggregation
│   └── registry.ts         # Protocol registry (like EVM vault-registry)
├── ai/
│   ├── tools-solana.ts     # Solana-specific AI tools
│   ├── tools.ts            # Shared tools (yield scanning)
│   └── prompts.ts          # Updated for Solana context
└── hooks/
    ├── useSolanaPositions.ts
    └── useSolanaYields.ts

app/api/
├── chat/route.ts           # AI agent (reuse, add Solana tools)
├── yields/route.ts         # DeFi Llama scanner (already has Solana)
└── solana/
    ├── rates/route.ts      # Live APY from on-chain reads
    └── positions/route.ts  # Portfolio positions
```

---

## Features (Phased)

### Phase 1: Composition Foundation + Two Protocols (MVP — 4-5 weeks)

**Phase thesis:** Ship the composition paradigm with the smallest set of real protocol adapters that demonstrates it. Two protocols (one staking, one stablecoin lending) plus Jupiter swap as a bridge leg is enough to show typed edges, widget editing, agent-composed graphs, and end-to-end execution on mainnet. The point of Phase 1 is to prove the paradigm works on real Solana, not to maximize protocol count.

#### Composition Engine (must ship before any protocol feature is meaningful)

**E1: Graph execution engine**

- Topological execution from any sink node
- Per-node state machine: `pending → running → succeeded → failed`
- Error propagation halts downstream nodes and surfaces the failure
- Cancellation: user can abort a running graph mid-execution
- Per-workspace execution history (last N runs, viewable)

**E2: Widget system (data-driven)**

- Per-node parameter UI rendered from a schema (`number`, `percentage`, `asset-selector`, `address`, `threshold`, `deadline`)
- Adding a new node type adds a schema entry, not new UI components
- Widget changes mark downstream nodes as `impacted` (already modeled in `WorkspaceNodeStatus`)

**E3: Workflow serialization**

- Versioned JSON format: `tidal.workflow.v1`
- Export current graph to JSON (download or copy)
- Import a workflow JSON into a new or existing workspace
- Shareable URL: workspace state encoded into URL query (with size cap and a fallback to JSON paste)
- Migration scaffold for future format versions

**E4: Type-colored edges**

- Each canonical asset (`SOL`, `USDC`, `mSOL`, `JitoSOL`, `INF`, `kTokens`) gets a distinct edge color
- Color-coded handles on node inputs/outputs
- Visual feedback when a drag-from-output hovers over an incompatible input

**E5: Node ↔ Adapter contract**

- TypeScript interface `ProtocolAdapter` in `src/lib/solana/registry.ts`
- Required methods: `readPosition`, `readRate`, `buildTransaction`, `metadata`
- Each adapter exports a `nodeDefinition` (catalog entry + widget schema + handle types) so the catalog is generated, not hand-maintained

**E6: Signing UX**

- Single confirm-and-sign sheet used whether the user clicks Run on a single node, runs the whole graph, or accepts an agent-proposed graph from chat
- Sheet shows: full step list, expected outcome per step (from `simulateTransaction`), fees (network + priority), slippage budget, plain-English summary
- Wallet signature always required (Privy embedded or external)

#### Protocol Adapters

**P1: Wallet (Privy)**

- Privy with `walletChainType: 'ethereum-and-solana'`
- External connectors: Phantom, Backpack
- Embedded wallets: email/social login → auto-provisioned Solana wallet
- Display SOL, USDC, and major SPL token balances on the wallet node

**P2: JitoSOL staking adapter (Shallows)**

- Stake SOL → mint JitoSOL (~5.9% APY)
- Unstake JitoSOL → SOL (epoch delay disclosed in widget)
- Position read: JitoSOL balance + accrued yield
- Rate read: live APY from Jito stake pool

**P3: Kamino USDC lending adapter (Shallows)**

- Supply USDC → receive kToken position (Kamino main market)
- Withdraw USDC + interest
- Position read: kToken balance → underlying USDC value
- Rate read: live supply APY from Kamino

**P4: Jupiter Ultra swap adapter**

- Used as a bridge leg when the user has the wrong asset for a chosen strategy
- 2-endpoint flow: `/order` → user signs → `/execute` (Beam relayer)
- No RPC required for the swap itself
- Slippage and route-display widgets exposed on the swap node

#### AI Agent

**A1: Vercel AI SDK v6 + Claude chat endpoint**

- `src/app/api/chat/route.ts`
- Streaming responses, tool-call surface
- Per-workspace transcript persisted in `WorkspaceProvider`

**A2: Composition-mode tools**

- `composeStrategy({ goal, riskTier })` — agent returns graph mutations (`addNode`, `connect`, `setWidget`) that the canvas applies
- `explainGraph({ workspaceId })` — agent returns plain-English summary of the current graph
- `scanSolanaYields({ asset, riskTier })` — DeFi Llama scan filtered by chain and tier
- `compareYields({ asset })` — side-by-side comparison surface

**A3: Risk-tier filtering**

- Reuse existing `PreferenceProfileProvider`
- Risk tier filters the node catalog (Shallows users see staking + base lending only)
- Risk tier is passed to `composeStrategy` and constrains the agent's choices

#### Comfort Baseline (pulled forward from Phase 2)

**C1: Pre-sign breakdown (minimal F11)**

- Plain-English summary of every transaction in the queue, generated from adapter metadata
- Anomaly flags: high slippage (>1%), unknown program, unusually large amount

**C2: Protocol risk badges (minimal F12)**

- Per-protocol badge on every node: audit count, TVL, age in months
- Sourced from a static `protocol-risk.ts` table in Phase 1; live data lands in Phase 2

#### Deferred to Phase 2

- **F4 Jupiter Lend** — second stablecoin lender, not required for MVP demo
- Full F11 (live `simulateTransaction` integration), full F12 (live risk data)

#### Phase 1 Done When

A user can:

1. Connect a wallet (Privy embedded or Phantom/Backpack)
2. Ask the agent for "safe USDC yield"
3. Receive a composed graph onto the canvas
4. Edit a widget (e.g., increase deposit amount)
5. See the pre-sign breakdown with risk badges
6. Sign once
7. Watch the graph execute end-to-end on Solana mainnet
8. Export the resulting graph as JSON and share it

### Phase 2: Protocol Expansion + Differentiation (3 weeks)

**P5: Jupiter Lend USDC adapter (deferred from Phase 1)**

- Second stablecoin lending option as a separate node
- Agent can propose Kamino or Jupiter Lend depending on live rates
- Same `ProtocolAdapter` shape as Kamino

**F8: Kamino Curated Earn Vaults (Mid-Depth)**

- Gauntlet/Steakhouse curated vaults as separate node types
- Higher yields with explicit manager attribution shown on the node
- AI explains the risk tradeoff vs. base Kamino lending

**F9: Sanctum INF staking adapter**

- Best-in-class LST APY (~6.4%)
- Sanctum router node enables LST swaps as a graph leg (e.g., JitoSOL → INF)
- AI recommends JitoSOL vs INF vs mSOL based on current rates

**F10: Drift lending adapter (Mid-Depth)**

- Supply USDC/SOL to Drift's money market
- Cross-margin awareness disclosed in the widget
- AI surfaces when Drift rates beat Kamino/Jupiter

**F11 (full): Transaction explanation engine**

- Live `simulateTransaction` integration replaces the Phase 1 static breakdown
- Per-step expected balance changes and post-state preview
- Configurable slippage and deadline budgets at the graph level

**F12 (full): Live protocol risk scoring**

- Replace the static `protocol-risk.ts` table with live data
- TVL trend (24h, 7d), exploit history, last audit date
- Surfaced both on the node badge and in the pre-sign breakdown

**E7: Per-node execution modes**

- `Always` / `Manual` / `Bypass` / `Mute` per node, mirroring ComfyUI
- Foundation for Phase 3 autopilot — `Always` nodes re-run when upstream rates change
- `Bypass` lets a user skip a leg without deleting it; `Mute` pauses an entire branch

### Phase 3: Intelligence + Differentiation (3 weeks)

**F13: Auto-rebalancing (built on execution modes)**

- Vercel Cron triggers `Always`-mode nodes when upstream rate conditions change
- Per-node thresholds (delta APY, time since last run, max gas) as widgets
- Pre-execution notification window with one-click "pause" — never blind execute
- Daily caps and emergency-pause-all controls (the safety rails autopilot needs)

**F14: Portfolio view**

- Unified Solana positions across all adapters
- Total yield earned, APY history, allocation breakdown
- Per-graph performance attribution: which workflow earned what

**F15: DeFi education mode**

- Inline term explanations on every widget and node (hover/click)
- Contextual explanations triggered from chat using the user's actual positions
- Concept tracking — don't re-explain what the user has already seen

**E8: Subgraphs / saved compositions**

- Collapse a multi-node strategy into a reusable group node
- Save to a personal library; share via the same workflow JSON format
- Saved subgraphs become candidate building blocks for the AI agent's `composeStrategy` tool

### Phase 4: Agent Infrastructure + Monetization (4 weeks)

**F16: Lucid Agents + x402 paid API**

- Expose Tidal as a paid composition surface for other agents
- Endpoints: yield scan, recommendation, transaction prep, **graph composition** (other agents pay to receive a strategy graph for a stated goal)
- Pricing: $0.01/yield scan, $0.05/recommendation, $0.10/tx prep, $0.20/graph composition
- Revenue dashboard for tracking agent API income

**F17: Points system**

- Points per action: stake (10), lend (15), vault deposit (25), rebalance (50), share workflow (30)
- Streak multiplier for weekly activity
- Pseudonymous wallet-based leaderboard
- Creates token-launch optionality

**E9: Custom node authoring (platform play)**

- Third-party protocols can publish their own Tidal nodes
- Node manifest format extends `ProtocolAdapter` with publisher metadata
- Review process before new nodes appear in the public catalog
- This is the long-term moat — when Drift, Marginfi, or a new protocol ships their own node, the catalog becomes an ecosystem

---

## Solana Protocol Details

### Kamino Finance (Primary Lending)

- **TVL**: ~$3B (largest Solana lender)
- **Interface**: Custom — `deposit()`, `withdraw()` on Kamino market accounts
- **Key innovation**: V2 Curated Earn Vaults (managed by Gauntlet, Steakhouse)
- **kTokens**: Yield-bearing receipt tokens usable as collateral elsewhere
- **SDK**: `@kamino-finance/klend-sdk`

### Jupiter Lend (Secondary Lending)

- **TVL**: ~$1.6B (launched Aug 2025, growing fast)
- **Interface**: Isolated vaults with Fluid liquidation engine
- **Key innovation**: 0.1% liquidation penalties (100x lower than industry)
- **Supported**: cbBTC, JupSOL, JitoSOL, USDC, USDT, EURC
- **SDK**: Jupiter Lend API

### Jito (Liquid Staking)

- **TVL**: ~$2.9B, 14.5M+ SOL staked
- **JitoSOL APY**: ~5.9% (staking rewards + MEV tips)
- **Interface**: Stake pool program — `depositSol()` → receive JitoSOL
- **SDK**: `@jito-foundation/jito-ts-sdk` or direct stake pool IX

### Sanctum (LST Aggregator)

- **TVL**: ~$1.2B
- **INF APY**: ~6.4% (best among Solana LSTs)
- **Role**: Liquidity layer for all Solana LSTs
- **Interface**: Router program for LST swaps

### Drift Protocol (Deep Water)

- **TVL**: ~$494M
- **Features**: Perps (101x), unified cross-margin, lending
- **Use for Tidal**: Drift lending yields for Deep Water tier
- **SDK**: `@drift-labs/sdk`

---

## Competitive Analysis

| Product              | What They Do                       | Tidal's Edge                                                                |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| **Griffain**         | Agent token platform ($457M mcap)  | We're a product, not a token. Working UX, not speculation.                  |
| **The Hive**         | Multi-agent investment system      | Risk personalization, plain-English explanations, consumer UX               |
| **SendAI Agent Kit** | Developer toolkit (60+ actions)    | Consumer product on top of infra. Different layer.                          |
| **Phantom**          | Wallet with built-in swaps/staking | We're the AI advisor Phantom doesn't have. Route users to optimal protocol. |
| **Jupiter**          | Swap aggregator + lending          | We route TO Jupiter when it's the best option. Complementary.               |
| **Step Finance**     | Solana portfolio dashboard         | We act on data, not just display it. AI executes.                           |

**Key insight**: The Solana AI-DeFi space is crowded with infrastructure and speculative tokens but thin on consumer-grade yield management. Tidal occupies the "advisor layer" — we don't compete with protocols, we route users to the right one.

---

## Grant & Launch Strategy

### Primary Target: Colosseum Hackathon

- **Prize**: $250K investment + 6-week accelerator
- **Fit**: AI + consumer DeFi on Solana — exactly what they fund
- **Timing**: Ship Phase 1, submit to next Colosseum cycle
- **Previous winners**: The Hive ($60K from SendAI) — validates the AI-DeFi thesis

### Secondary Targets

| Program              | Amount     | Timing                     | Angle                      |
| -------------------- | ---------- | -------------------------- | -------------------------- |
| Superteam Microgrant | Up to $10K | Apply now with prototype   | Consumer AI DeFi on Solana |
| Solana Foundation    | Varies     | After Phase 1 ships        | AI + DeFi tooling          |
| Kamino Grants        | TBD        | After Kamino adapter ships | Driving deposits via AI    |
| Jupiter Grants       | TBD        | After Jupiter Lend adapter | Driving lending deposits   |

### Distribution Channels

- **Phantom**: 20M+ users already on Solana — target with content/education
- **Backpack xNFT**: Package Tidal as an executable NFT inside Backpack wallet
- **Superteam network**: Community distribution across emerging markets
- **X/Twitter**: Solana CT is highly engaged — demo videos, threads

---

## Phase Dependency Graph

```
Phase 1: Composition Foundation + Two Protocols (MVP)
├── Engine
│   ├── E1 Graph execution engine
│   ├── E2 Widget system (data-driven)
│   ├── E3 Workflow serialization (JSON + share URL)
│   ├── E4 Type-colored edges
│   ├── E5 Node ↔ Adapter contract
│   └── E6 Signing UX
├── Adapters
│   ├── P1 Wallet (Privy)
│   ├── P2 JitoSOL staking
│   ├── P3 Kamino USDC lending
│   └── P4 Jupiter Ultra swap (bridge leg)
├── AI
│   ├── A1 Chat endpoint (AI SDK v6 + Claude)
│   ├── A2 Composition tools (composeStrategy, explainGraph, ...)
│   └── A3 Risk-tier filtering
└── Comfort baseline
    ├── C1 Pre-sign breakdown (minimal)
    └── C2 Protocol risk badges (static)
    │
    ▼
Phase 2: Protocol Expansion + Differentiation
├── P5 Jupiter Lend (deferred from Phase 1)
├── F8 Kamino Earn Vaults
├── F9 Sanctum INF
├── F10 Drift lending
├── F11 (full) Live tx simulation
├── F12 (full) Live protocol risk scoring
└── E7 Per-node execution modes
    │
    ▼
Phase 3: Intelligence + Differentiation
├── F13 Auto-rebalancing (built on E7)
├── F14 Portfolio view
├── F15 Education mode
└── E8 Subgraphs / saved compositions
    │
    ▼
Phase 4: Agent Infrastructure + Monetization
├── F16 Lucid Agents + x402 (incl. graph composition endpoint)
├── F17 Points system
└── E9 Custom node authoring (platform play)
```

---

## What We're Carrying Forward from v1

| Asset                                         | Status      | Reusability                       |
| --------------------------------------------- | ----------- | --------------------------------- |
| Risk depth UX (Shallows/Mid-Depth/Deep Water) | Shipped     | 100% — brand and concept transfer |
| AI agent + chat interface                     | Shipped     | 90% — new tools, same UX          |
| DeFi Llama yield scanning                     | Shipped     | 100% — already scans Solana       |
| Landing page + brand                          | Shipped     | 95% — update copy                 |
| Tool architecture pattern (AI SDK v6)         | Shipped     | 80% — new adapters, same shape    |
| Test infrastructure (293 tests, vitest)       | Shipped     | 70% — new protocol tests          |
| Ocean metaphor + brand voice                  | Established | 100%                              |
| ActionCard component pattern                  | Shipped     | 85% — adapt for Solana tx types   |

### What We're Leaving Behind

- EVM chain configs (Base, Arbitrum, Optimism) — park, don't delete
- Li.Fi SDK integration — park for future cross-chain phase
- AAVE V3 adapters — EVM-only, not needed for Solana
- ERC-4626 vault adapter — no equivalent on Solana
- Wagmi hooks — replaced by Solana wallet adapter hooks

---

## Decisions Made

1. **Wallet**: Privy with `walletChainType: 'ethereum-and-solana'`. External connectors for Phantom/Backpack, embedded wallets for new users. Already integrated for EVM — Solana is a config change.
2. **Swaps**: Jupiter Ultra API direct. 2 endpoints (`/order` → sign → `/execute`), no RPC needed (Beam relayer handles tx landing), 2-10 bps fees. Li.Fi only makes sense when we add cross-chain bridging later.
3. **Team**: 0xSardius (engineering) + 0xJulo (design engineering).
4. **Testing**: Mainnet with small amounts. Kamino/Jupiter/Jito don't have reliable devnet deployments.

## Open Questions

1. **Colosseum timing**: When is the next hackathon cycle? This determines Phase 1 deadline.
2. **Jupiter API key**: Free tier (60 req/min) sufficient for launch? Or need Pro tier?
3. **Integrator fees**: Should we add a fee on Jupiter swaps from day one? (Keep 80% of fee revenue.)

---

## Success Metrics

### Phase 1 Launch

- [ ] Working demo: connect wallet → ask agent for safe USDC yield → graph appears on canvas → user edits a widget → pre-sign breakdown shown → user signs once → graph executes end-to-end on mainnet → graph exported as JSON
- [ ] Composition engine functional: graph execution, widget editing, JSON export/import, type-colored edges, signing sheet
- [ ] At least 2 Solana protocol adapters (Jito + Kamino) plus Jupiter Ultra swap as a bridge leg
- [ ] AI agent can compose graphs (`composeStrategy`) and explain them (`explainGraph`)
- [ ] Risk tier filters the node catalog and constrains agent compositions
- [ ] Pre-sign breakdown shown for every signed transaction
- [ ] < 3 second time-to-first-graph-on-canvas after user prompt

### Product-Market Fit Signals

- Users return to check yields (DAU/WAU ratio)
- Users execute AI-recommended actions (not just read)
- Users increase risk tier over time (trust building)
- Positive qualitative feedback on explanation quality

### Grant Application Readiness

- Working product on Solana mainnet
- Video demo showing full flow
- Traction numbers (users, TVL routed, transactions)
- Clear roadmap with Phase 2+ differentiation

---

_Tidal v2.2: ComfyUI for Solana DeFi — visual, typed, composable yield workflows._
