# Checkpoint

**Last updated:** 2026-04-21
**Branch:** main (clean, pushed to origin)
**Latest commit:** `f3b9dbe` — refactor: proxy RPC through server + use sign-only flow (prod architecture)

---

## Where We Are

Phase 1 (Composition Foundation + Two Protocols) is in flight. Docs locked. **Privy Solana smoke test PASSED** on 2026-04-20 — all 4 gates cleared (page init, login, Solana wallet provisioned, signMessage returned a valid signature).

**🎉 P2 JitoSOL write path LANDED ON MAINNET on 2026-04-21.** Staked 0.01 SOL → received 0.0078 JitoSOL (tx signature `5TERmKWNBNHai62GCB22mJhYTyZDioCdrBMLLQwmYzwhRr7NU91Au9VUFjG4SNtNEWrwHJ2efbLtXcntzppQDx2c`, wallet `BdPGUFcYUQ2FsLqjit9BKhccwUvpzeMFwhJvNs2y5pLa`). Position verified via `/api/solana/positions`. The entire build-sign-submit architecture is proven and generalizes to every future adapter.

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

### Immediate next work — P3 Kamino USDC adapter

With P2 proven end-to-end on mainnet, P3 is the next natural step. It validates the adapter pattern against a second protocol (lending, not staking) and gives us the multi-lender comparison narrative the PRD leans on.

1. `bun add @kamino-finance/klend-sdk`
2. `src/lib/solana/kamino.ts` implementing `ProtocolAdapter`:
   - `readPosition` — kToken balance → underlying USDC value
   - `readRate` — supply APY from Kamino main market
   - `buildTransaction` — supply USDC → kToken, withdraw path
3. Register in `src/lib/solana/adapters.ts`
4. Should work with the existing `/api/solana/build-transaction` and `/api/solana/submit-transaction` routes without change (that's the whole point of the contract)
5. Mainnet test: supply 1 USDC from the smoke-test wallet

### Followup polish from P2 landing

- Real `readRate` for Jito (replace 5.9% stub) — fetch from Jito's public yield endpoint or derive from stake pool exchange rate
- Better `expectedOutputAmount` in `buildTransaction` (read pool exchange rate)
- Unstake path for JitoSOL (`withdrawSol` or `withdrawStake`)

### Parallel side tracks (can ship anytime)

- **E4 type-colored edges** (CSS + React Flow edge styling; palette defaults approved)
- **A2 `composeStrategy` tool shape** — draft the AI SDK v6 tool that returns `GraphMutation[]`. Pairs with the `GraphMutation` work already committed.

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
