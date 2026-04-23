# Checkpoint

**Last updated:** 2026-04-23
**Branch:** main (clean, pushed to origin)
**Latest commit:** `431a7d6` — feat(smoke): multi-node pipeline demo button (E1 part 3b)

---

## Where We Are

Phase 1 (Composition Foundation + Two Protocols) is in flight. Docs locked. **Privy Solana smoke test PASSED** on 2026-04-20 — all 4 gates cleared (page init, login, Solana wallet provisioned, signMessage returned a valid signature).

**🎉 P2 JitoSOL write path LANDED ON MAINNET on 2026-04-21.** Staked 0.01 SOL → 0.0078 JitoSOL (tx `5TERmKWN...`).

**🎉 P3 Kamino USDC supply path LANDED ON MAINNET on 2026-04-22.** Supplied 1 USDC to Kamino main market (tx `4RxYqWUSbjfCuZoTNAr8aMjVtQmh1mFtZ3rqRA6qfBEivRaqnDy1ZmgFKX9GJRfGFAHgTy7AG4EeSvduHZc4DV1c`). The `ProtocolAdapter` contract is now validated across two different protocol shapes (staking + lending).

**🎉 P4 Jupiter Ultra SOL→USDC swap LANDED ON MAINNET on 2026-04-23.** Swapped 0.01 SOL to USDC (tx `ku369YjfNfG1N3z6cFWDXapiVNKkdQ4WnRFaUc26MoXvYL13ii63D6wRCC3AxqADANQHiNepA6nx5DJAntMVMuv`). Third protocol shape validated — asset-transformation (SOL→USDC) vs. asset-consumption (stake/lend). The three adapters together cover the vocabulary needed for compelling multi-hop strategies.

**🎉 E1 GRAPH EXECUTION ENGINE LANDED ON MAINNET on 2026-04-23.** First multi-node pipeline through Tidal: Jupiter swap → Kamino supply, programmatically composed and executed via `executeGraph`. Two transactions chained automatically:
- swap `2ZFQMdWThetGX3t5u2qLayMSNk9UFPp153fFAwRtxkxhG3b1ZTJBwwdLYd5cfgUYiJGNyRCC7dNsYhLMQpFVKfPW`
- supply `2HET2RRvKZjMmUp4gf5rKSnNvT2DL7598k8TbJXE2paWxq3Wzr7WxQUuF7Ljent5EDRbKTNwpNNoQJ4W9VWi86Gc`

Engine architecture: pure topological sort + state machine + async generator (`graph-exec.ts`), plus a React hook (`useAdapterNodeRunner`) that binds the build-sign-submit pipeline as the runner. Confirmation polling in the submit route ensures downstream nodes see upstream state. UI streaming via `for await...of` over the event stream.

The ComfyUI-for-DeFi thesis is functionally proven. Remaining for the full Phase 1 demo: A1+A2 (chat endpoint + composeStrategy tool that produces GraphMutation[] consumed by the canvas), and E2 (widget editing on nodes). E1 + the three adapters means everything from "user has a graph" forward already works on mainnet.

**ComfyUI-for-DeFi** remains the foundational design thesis. Agent is a *composer*, not an executor. See `docs/design-thesis.md`.

## Session Work (2026-04-18 and 2026-04-19)

### Docs committed

1. `c3a7838` — Backend integration phase marked in `CLAUDE.md` and `docs/architecture.md`. Scoped existing frontend constraints to UI/mock-data patterns.
2. `c2bf241` — Same phase-shift in `AGENTS.md`.
3. `5c1a8b4` — Claude Code skills list in `CLAUDE.md`.
4. `e9333ac` — New `docs/design-thesis.md` naming ComfyUI paradigm.
5. `8ecc574` — PRD restructured to v2.2 around composition paradigm. Phase 1 now covers composition engine (E1-E6) + 2 adapters + AI + comfort baseline.
6. `7aaaaa1` — `CLAUDE.md` and `AGENTS.md` cite thesis as required reading.
7. `5315452` — First checkpoint at paradigm pivot.
8. `26596a6` — `docs/phase-1-plan.md` with critical path, week-by-week, decisions to resolve, test plan, risks.

### Code committed

9. `31a389a` — **E5 ProtocolAdapter scaffolding**. `src/lib/solana/types.ts` + `registry.ts`. Pure TypeScript contract. Every adapter binds to a `NodeCatalogItem.id` and implements `readPosition` / `readRate` / `buildTransaction`. Registry is in-memory.
10. `48d8d09` — **P1 Privy wiring**. Installed `@privy-io/react-auth@3.22.1` + Solana peers (`@solana/kit`, `@solana-program/{system,token,memo}`). Created `src/components/providers/privy-provider.tsx` with Tidal dark theme + Solana embedded/external wallets. Wired at outermost layer in `layout.tsx`. Added `/privy-smoke` debug page exercising login, wallet listing, and `signMessage` on first Solana wallet.
11. `8e51d8b` — **GraphMutation + workflow schema** (A2/E3 prep). `src/lib/workspace/mutations.ts` discriminated-union mutations + pure `applyMutations` fold. `src/lib/workspace/workflow-schema.ts` for `tidal.workflow.v1` export/import.
12. `c31d73d` — **Solana RPC connection factory**. `src/lib/solana/connection.ts` with `server-only` guard, cached `createSolanaRpc` bound to `HELIUS_RPC_URL`.
13. `09f3139` — **JitoSOL adapter reads + positions API route** (P2 part 1). Real `readPosition` via `getTokenAccountsByOwner`. Stub `readRate`. `buildTransaction` throws until smoke test clears (it has now). `/api/solana/positions` wires the adapter pattern end-to-end. Verified working on 2026-04-20.

### Key decisions locked

- **Single repo** — evolving the prototype into the working product. No fork.
- **ComfyUI framing** — every product/arch decision goes through the typed-graph filter.
- **Server-side tx build** — adapters run in `src/app/api/*`, client just signs returned base64 tx. Keeps RPC key server-only.
- **Env var naming** (locked): `NEXT_PUBLIC_PRIVY_APP_ID` (public by design), `PRIVY_APP_SECRET` (server-only), `HELIUS_RPC_URL` (server-only). `.env*` gitignored (`.gitignore:35`).
- **RPC provider**: Helius free tier.
- **No substantive design changes** — reuse existing primitives from `src/components/ui` and `src/components/tidal`. 0xJulo's frontend architecture stays intact.
- **Minimal 0xJulo asks**: (1) review 6-asset color palette, (2) "graph appears" animation preference (or ship "just appear" for MVP).
- **Agent's role** — composer, not executor. Tools return `GraphMutation[]` which the client applies to `WorkspaceProvider`.

### Package decisions

- Privy 3.22.1 — uses `@privy-io/react-auth/solana` subpath for `useWallets`, `useSignMessage`, `useSignTransaction`, `toSolanaWalletConnectors`
- `@solana/kit` 6.x (modern replacement for `@solana/web3.js`) — new Solana toolkit
- `@solana-program/{system,token,memo}` — program bindings per the new SDK pattern

## Current Repo State

### Frontend (complete, 0xJulo)

Unchanged from last checkpoint. Tree is: `TooltipProvider` (now nested under `PrivyProvider`) → `PreferenceProfileProvider` → `WorkspaceProvider` → `SidePanelProvider`.

### Backend (in progress)

- `src/lib/solana/types.ts` — `ProtocolAdapter` interface + supporting types
- `src/lib/solana/registry.ts` — `registerAdapter` / `getAdapter` / `listAdaptersByRiskTier` / `clearAdaptersForTesting`
- `src/components/providers/privy-provider.tsx` — configured for Solana
- `src/app/privy-smoke/page.tsx` — debug smoke-test page (remove after verified)

Still empty: `src/lib/ai/*`, `src/app/api/*`.

## Next Session Starts Here

### Immediate next work — E1 Graph Execution Engine

With three adapter types proven (stake, lend, swap) the backend is ready for the piece that ACTUALLY demonstrates the thesis: multi-node topological execution. The canvas currently is cosmetic; after E1 it runs workflows.

Scope:
1. Topological sort over `WorkspaceGraphNode[]` + `WorkspaceGraphEdge[]`
2. Per-node state machine: `pending → running → succeeded | failed | cancelled`
3. For each node: resolve which adapter to invoke by `catalogItemId`, call `buildTransaction`, sign via Privy, submit
4. Error propagation: a failed upstream node halts downstream execution, surfaces the failure to the user
5. Cancellation: user can abort a running graph mid-execution
6. Demo case: the "SOL → Jupiter swap → Kamino supply" pipeline (swap 0.01 SOL to USDC, then supply USDC to Kamino, all in one graph run)

Leverage existing:
- `src/lib/workspace/mutations.ts` (GraphMutation / applyMutations) - useful as the graph is built by the AI later, but E1 itself just needs to traverse
- `src/lib/workspace/workflow-schema.ts` - serialize for history
- `WorkspaceNodeStatus` enum from frontend types already models the states

### Critical path remaining for thesis demo

| Piece | Status |
|---|---|
| ProtocolAdapter contract (E5) | ✅ Done |
| Wallet (P1) | ✅ Done |
| JitoSOL (P2) | ✅ Done + mainnet verified |
| Kamino USDC (P3) | ✅ Done + mainnet verified |
| Jupiter swap (P4) | ✅ Done + mainnet verified |
| **E1 Graph execution engine** | ✅ Done + mainnet verified |
| **A1 Chat endpoint (AI SDK v6 + Claude)** | **Next** |
| **A2 composeStrategy tool** | **Next** (returns GraphMutation[], applied to canvas) |
| **E2 Widget system** | After A1+A2 |

### Followup polish that is not on the critical path

- Real `readRate` for Jito (replace 5.9% stub)
- Real `readPosition` for Kamino (obligation lookup for existing depositors)
- Unstake/withdraw paths for P2 and P3
- Bidirectional Jupiter swap (currently only SOL→USDC)
- E4 type-colored edges (purely visual)
- C1, C2 comfort baseline (polish once thesis demo is working)

### Parallel side tracks (can start anytime)

- **E4 type-colored edges** (pure frontend, awaits color palette from 0xJulo)
- **E3 prep**: draft `tidal.workflow.v1` JSON schema spec
- **A2 prep**: design `GraphMutation` type + `applyMutations` helper in `src/lib/workspace/` — unblocks the agent's composition-mode tools

### Decisions still to resolve

- Signing UX sheet design (0xJulo, needed before Week 3 E6 lands) — minimal: assemble from existing Sheet/Dialog primitives, so this is implementation more than design
- Asset color palette (10-min review by 0xJulo)
- "Graph appears" animation (10-min decision, fine to ship "just appear")

### Risks (updated)

1. ~~Privy Solana embedded wallet maturity~~ — **RESOLVED 2026-04-20** by smoke test
2. ~~Privy `signTransaction` hook behavior~~ — **RESOLVED 2026-04-21** by successful mainnet stake
3. Kamino SDK docs quality — to be tested in P3 (now the next priority)
4. AI SDK v6 tool-call → graph mutation pattern — `GraphMutation` + `applyMutations` are committed; still need a hello-world tool call to prove the wire
5. Mainnet testing costs time — budgeted

## Useful Pointers

- `docs/design-thesis.md` — foundational. Read first.
- `docs/tidal-prd.md` (v2.2) — feature roadmap.
- `docs/phase-1-plan.md` — critical path + week-by-week.
- `docs/architecture.md` — frontend architecture + backend plan.
- `CLAUDE.md` + `AGENTS.md` — agent instructions including Claude Code skills list.
- User: 0xSardius (engineering). Partner: 0xJulo (frontend/design).
- Single-repo: this repo becomes the working product.

## Command Reminders (Bun only)

```bash
bun install
bun run dev
bun run lint
bun run build
bun add <package>
bunx <tool>
```
