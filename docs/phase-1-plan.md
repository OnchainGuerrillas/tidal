# Phase 1 Execution Plan

**Status:** Active
**Timeline:** 4-5 weeks
**Companion:** `docs/tidal-prd.md` v2.2 (scope), `docs/design-thesis.md` (paradigm), `docs/architecture.md` (layout)

---

## Phase 1 Demo Target

A user can:

1. Connect a wallet (Privy embedded, Phantom, or Backpack)
2. Ask the agent for "safe USDC yield"
3. Receive a composed graph onto the canvas
4. Edit a widget (e.g., deposit amount)
5. See the pre-sign breakdown with protocol risk badges
6. Sign once
7. Watch the graph execute end-to-end on Solana mainnet
8. Export the resulting graph as JSON and share it

## Critical Path

```
E5 (adapter contract) ─┬─> P2 (JitoSOL) ─┐
                       └─> P3 (Kamino)   ├─> E6 (signing UX) ─> C1 ─> DEMO
P1 (Privy wallet) ────────────────────────┤
E1 (exec engine) + E2 (widgets) ──────────┘
                                           ┌─> A2 (composeStrategy) ─> AGENT DEMO
A1 (chat endpoint) ────────────────────────┤
                                           └─> A3 (risk filter)

Non-blocking side tracks: E3 serialization, E4 type-colored edges, C2 risk badges
```

The spine is **E5 → P2 → E6**. If anything slips, everything downstream slips. E5 is Week 1 priority.

## Week 1 — Foundations + Decisions

### Decisions to resolve before writing adapter code

| Decision | Recommendation | Blocker for |
| --- | --- | --- |
| **RPC provider** | Helius free tier (100 RPS, Solana-native). Store key in `.env.local` only. | P2, P3 reads |
| **Tx build location** | Server-side in `src/app/api/*`. Client just signs prepared tx. Keeps RPC key server-only; cleaner separation. | Every adapter |
| **Privy Solana smoke test** | Day-1 task: wire Privy with `walletChainType: 'ethereum-and-solana'`, send 0.001 SOL transfer from embedded wallet to confirm it works. | Entire Phase 1 |
| **Signing UX mockup** | 0xJulo drafts this week (step list + simulated outcomes + fees + plain-English summary) | E6 |
| **Workflow JSON schema `v1`** | Locked before E3 lands. Shape: `{version, nodes[], edges[], meta}` with widget values inline. | E3 |
| **Agent → graph mutation wire** | AI SDK v6 tool returns `GraphMutation[]`; client `useChat` dispatches to `WorkspaceProvider`. Prove with a hello-world tool in Week 1. | A2 |

### Week 1 work

- Resolve all 6 decisions above
- **P1** Privy wired into `src/app/layout.tsx`; smoke-test Solana signing with embedded wallet
- **E5** `ProtocolAdapter` interface + `registry.ts` scaffolding in `src/lib/solana/`
- **E4** type-colored edges (pure frontend, signals the paradigm visually)
- **P2 reads only** — JitoSOL balance + live APY via stake pool read
- **Tests:** LiteSVM adapter harness set up (per `solana-dev` skill)

## Week 2 — First Adapter End-to-End

- **P2 writes** — `depositSol` transaction build + server route + client sign flow
- **E1** graph execution engine (topo order, per-node state machine, error propagation, cancellation)
- **E2** widget system — schema-driven; JitoSOL's `amount` widget is the first real case
- **Tests:** mainnet smoke test — stake 0.01 SOL from test wallet

⚠️ **Go/no-go checkpoint:** if P2 end-to-end does not work by end of Week 2, extend timeline. Do not skip.

## Week 3 — Second Adapter + Signing UX

- **E6** signing-and-confirm sheet (uses 0xJulo's Week 1 design)
- **P3** Kamino USDC supply/withdraw via `@kamino-finance/klend-sdk`
- **P4** Jupiter Ultra swap adapter (`/order` → sign → `/execute`)
- **C1** pre-sign breakdown wired into E6
- **Tests:** mainnet smoke test — Kamino USDC deposit with 1 USDC

## Week 4 — Agent + Comfort + Serialization

- **A1** `/api/chat` route with AI SDK v6 + Claude
- **A2** composition tools: `composeStrategy`, `explainGraph`, `scanSolanaYields`, `compareYields`
- **A3** risk-tier filter on catalog + `composeStrategy` constraint
- **C2** static protocol risk badges (`src/lib/solana/protocol-risk.ts`)
- **E3** workflow JSON export/import + share URL

## Week 5 — Buffer + Demo Prep

- End-to-end: agent composes graph → user edits widget → signs → executes on mainnet → exports JSON
- Edge cases: failed tx, network errors, wallet disconnect mid-run
- Demo video + script for Colosseum / Superteam grant applications
- Absorption buffer for any week that slipped

## Parallelizable Work For 0xJulo

Unblocks downstream weeks without blocking on backend:

- **Week 1:** signing sheet design, widget UI components (number, percentage, asset-selector, threshold, deadline), type-color palette for 6 canonical assets
- **Week 2:** execution state UI — per-node spinner, succeeded/failed states, error toast
- **Week 3:** share-URL and JSON-export UI (copy-to-clipboard, download)
- **Week 4:** agent tool-call rendering in chat panel ("I'm composing a graph…" → graph appears)

## Test Plan

- **LiteSVM / Mollusk** (per `solana-dev` skill) — unit tests for every adapter's `buildTransaction`
- **Mainnet with test wallet** — small amounts (~$50 total across all Phase 1 tests), per PRD's "mainnet with small amounts" decision
- **Integration tests** — graph execution with a mocked `Connection` that replays recorded mainnet responses
- **End-to-end** — Playwright covering the demo script at the end of Week 4

## Risks

1. **Privy Solana embedded wallet maturity** — not as battle-tested as EVM. If embedded signing fails, fall back to Phantom/Backpack only for MVP and defer embedded to Phase 2. **Test Day 1.**
2. **Kamino SDK docs / stability** — unknown quality. If blocked, substitute Jupiter Lend (P5 from Phase 2) as the second adapter.
3. **AI SDK v6 tool-call → graph mutation pattern** — novel shape. Spend 2 hours in Week 1 proving a hello-world tool that adds a single node. De-risks A2.
4. **Mainnet testing costs time** — transactions land in ~400ms but retries + RPC failures eat clock. Budget for it.

## Vocabulary In Phase 1

Fully active, crypto-enabled node kinds at Phase 1 completion:

| Node | Reads | Writes |
| --- | --- | --- |
| Wallet | Real SOL + USDC + SPL balances via Privy | n/a |
| JitoSOL strategy | Live APY, position balance | `depositSol` / unstake |
| Kamino USDC strategy | Live supply APY, kToken position | Supply / withdraw |
| Jupiter swap | Live route quote | `/order` → `/execute` |
| Amount, Split, Destination | Pure graph logic via E1 + E2 | n/a |

**Reward node** remains projection-only in Phase 1. Real on-chain harvest lands per-adapter in Phase 2.

Catalog size at end of Phase 1: ~8-10 node kinds. Phase 2 doubles it. Phase 4 (E9 custom node authoring) makes it unbounded.
