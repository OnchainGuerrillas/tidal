# Checkpoint

**Last updated:** 2026-05-03
**Branch:** main (clean, pushed to origin)
**Latest commit:** `826cfa0` — feat(solana): Kamino repay+withdraw adapter (Tier 1.6c)
**Hackathon submission:** ~2026-05-10 (7 days out, comfortable runway)

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

**🎉 A1 CHAT PLUMBING LANDED on 2026-04-23.** Streaming chat works end-to-end via AI SDK v6 + Claude Sonnet 4.6.
- `ede017b` — A1 part 1: `/api/chat` route using `streamText` with `convertToModelMessages` (v6 returns `Promise<ModelMessage[]>`, must `await`). System prompt primes Claude on the composition paradigm, current adapter vocabulary (Jito / Kamino / Jupiter), and risk-tier framework. Returns `result.toUIMessageStreamResponse()`.
- `076cd67` — A1 part 2: chat section in `/privy-smoke` using `useChat` from `@ai-sdk/react`. v6 caller now holds input state and calls `sendMessage({ text })`; messages render via `UIMessage.parts` (typed content array) — text parts only for now, tool parts will render when A2 lands.
- Requires `ANTHROPIC_API_KEY` in `.env.local` (server-only). Route returns 500 with a clear message if missing.

**🎉 A2 composeStrategy TOOL LANDED on 2026-04-25.** The agent stops being a chat bot and becomes a *composer*.
- New tool `composeStrategyTool` in `src/lib/ai/tools/compose-strategy.ts` using AI SDK v6's `tool({ description, inputSchema, execute })` with a Zod schema. Three canonical intents: `liquid-stake-sol`, `lend-usdc-kamino`, `swap-sol-then-supply-usdc`. Tool runs server-side, calls `registerAllAdapters()`, and synthesizes `WorkspaceGraphNode`s from each adapter's `catalogItem` metadata (so the visual catalog stays untouched and the executable adapter IDs are the source of truth).
- Tool output: `{ summary, mutations: GraphMutation[], executable: { nodes, edges }, warnings }`. Mutations drive the canvas via `applyMutations`; the executable plan feeds directly into E1's `executeGraph`. The split is deliberate — `WorkspaceGraphNode` doesn't carry `catalogItemId` natively, so the tool emits both shapes side-by-side. Bridging them on the canvas (e.g., stamping `catalogItemId` into `node.data` when the user runs the graph) is a follow-up.
- Wired into `/api/chat` via `tools: { composeStrategy: composeStrategyTool }`. System prompt updated to direct Claude to call the tool for actionable strategy requests.
- Smoke UI in `/privy-smoke` renders `tool-composeStrategy` parts: shows the streaming state, the composed summary, the resulting graph state from `applyMutations({ nodes: [], edges: [] }, mutations)`, and the executable plan JSON.
- `zod@4.3.6` added as a direct dependency.

The ComfyUI-for-DeFi thesis is now functionally proven end-to-end **on the API surface**: chat → tool call → graph mutations → executable plan → E1 runner → mainnet.

**🎉 WORKSPACE CHAT PANEL WIRED on 2026-04-25.** The thesis demo is now in the actual product surface, not just the smoke page.
- `ChatPanel` (`src/components/workspace/panels/chat-panel.tsx`) replaces the presentational composer with `useChat` against `/api/chat`. Streams text and `tool-composeStrategy` parts.
- New `applyGraphMutations(mutations, workspaceId?)` on `WorkspaceProvider` runs the pure `applyMutationsToWorkspace` fold against the active workspace. Returns warnings.
- `useEffect` over `messages` applies each tool result exactly once, deduping by `toolCallId` via a ref-Set. (Side-effecting in render is wrong; the effect catches every `output-available` transition without re-applying.)
- New `StrategyComposeMessage` (`src/components/workspace/strategy-compose-message.tsx`) renders the tool result as a chat bubble with summary, warnings, and a **Run graph** button. The button derives `ExecutableNode[]` from `output.executable.nodes` (converting the wire-friendly string `sourceAmount` back to `bigint`), runs `executeGraph` with `useAdapterNodeRunner`, and streams `GraphExecutionEvent`s inline.

End-to-end demo path on `/<workspaceId>`: open chat panel → "swap 0.01 SOL to USDC and lend it on Kamino" → graph nodes appear on the canvas → click Run graph → two transactions execute on mainnet, events stream in the bubble.

**🎉 BRIDGE LANDED on 2026-04-25.** Hand-built strategy nodes are now identifiable as runnable, and the picker offers the registered adapters.
- New `src/lib/solana/adapter-catalog.ts` — client-safe single source of truth for adapter `NodeCatalogItem`s plus display hints (action label, APY display, output asset, primary handle id/label). The three adapter modules (`jito.ts`, `kamino.ts`, `jupiter-swap.ts`) now import their `CATALOG_ITEM` from here, so the registry and the workspace UI can never drift.
- `StrategyNodeData` gains an optional `catalogItemId` field. Set when a strategy node is bound to a registered `ProtocolAdapter`. Visual-only entries (Marinade, Kamino-borrow, Marginfi, Drift, Orca, Raydium) leave it undefined and remain non-runnable until adapters land for them.
- `nodeCatalog` (the picker source) now appends the three adapter-backed entries (Jito, Kamino USDC, Jupiter swap). Picking any of them creates a strategy node with `catalogItemId` stamped on its data.
- `createNodeFromCatalog` gained a generic `buildAdapterStrategyNode(entry, position)` path that synthesizes nodes from `AdapterCatalogEntry`. The compose-strategy tool reuses the same metadata (no more hardcoded action/APY strings in the tool).

What this unlocks: a user can drop "Lend USDC on Kamino" from the picker, drop "Swap SOL → USDC (Jupiter)" too, wire them up, and the graph is structurally identifiable as runnable (`node.data.catalogItemId !== undefined` for every strategy node). What it does NOT unlock yet: actually pressing Run, because the source-amount widget input doesn't exist yet — that's E2.

## Session 2026-04-27 — MAINNET-VERIFIED + canvas sync fix

**🌊 The thesis demo runs on mainnet.** Four real transactions landed during this session's hands-on test pass against `/workspace-new-strategy`:
- Multiple successful `swap-sol-then-supply-usdc` two-node runs (Jupiter SOL→USDC, then Kamino supply, all programmatically composed and chained)
- Single-node `liquid-stake-sol` run

User confirmed end-to-end: chat → tool call → graph mutations → canvas → Run graph button → Privy embedded-wallet auto-sign → mainnet confirmation.

### Bugs found and fixed during the test pass

1. **No login surface in the workspace UI.** The `/privy-smoke` page was the only place wired to login. Live workspace had Privy in the provider tree but no Login button. Fix: added a small login bar above the chat composer in `ChatPanel`. Shows "Login to compose strategies and run on mainnet." with a Login button when unauthenticated; switches to truncated wallet address + Logout link when authenticated. (Bundled into `6164bad`.)

2. **AI-composed nodes never appeared on the canvas.** Root cause: `useCanvasState` keeps a local `useState` mirror of `workspace.nodes` / `workspace.edges`, initialized once on mount. After that, no resync — so `applyGraphMutations` correctly added nodes to the provider but the canvas's React Flow render didn't see them. Fix in `6164bad`: added a `useEffect` in `useCanvasState` that watches `workspace.nodes` / `workspace.edges` and merges in externally-added items (append-only — drag/edit still flows through `persistGraph`, keeping both sides in lockstep without clobbering in-flight edits). Verified: `[tidal] applying compose mutations { mutationCount: 1 }` → `[tidal] applyGraphMutations result {warnings: []}` → Jito node renders.

3. **`ChatPanel` tool-result dedupe was fragile.** Required `toolCallId` to be set; if missing it would skip applying. Hardened to fall back to `messageId:partIndex` so the effect stays idempotent if the AI SDK's part shape evolves.

### Notable architectural finding (recorded for Tuesday)

The example workspace (`workspace-sol-yield-loop`) is `isEditable: false` and `executionState: "active"` — it presents as a locked, deployed strategy. AI-composed mutations would still apply but interactive UI is suppressed. **For demos, always start on a builder workspace** (created via the `+` tab in the header, or any URL like `/workspace-anything`).

Browser form-fillers (Edge autofill, LastPass, etc.) inject `fdprocessedid` attributes that trigger Next.js hydration warnings. Cosmetic only. **Demo in incognito.**

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

## Session 2026-04-29 — heavy coding day, six features shipped

**Two hands-on test passes worth of mainnet runs.** Counted 7+ real Solana transactions across the day's commits.

### Shipped (in commit order)

1. `e1b4ddd` — **AI node positioning relative to existing graph**. New pure helper `placeMutationsRelativeTo(existing, mutations, options?)` in `mutations.ts`. Translates `add-node` positions so the leftmost new node lands `gap` (default 350) pixels right of the rightmost existing node, preserving the AI's relative x-spacing. ChatPanel uses a latest-ref pattern to read the freshest workspace.nodes inside the apply effect without re-running on every drag/edit.

2. `ff24bc5` — **E2 widgets + run-from-canvas-state.** The big one. The canvas is now a real composition surface.
   - `AdapterCatalogEntry` gained `widgets: WidgetSchema[]` and `inputDecimals`.
   - Adapter modules (jito/kamino/jupiter-swap) pull their WIDGETS from the shared catalog (single source of truth).
   - `decimalToBaseUnits(decimal, decimals)` helper converts user-entered amounts (0.01 SOL) to base-unit BigInts (10_000_000n lamports).
   - `StrategyNodeData.widgetValues?: Record<string, unknown>` stores user inputs.
   - `node-factories.ts` seeds widget defaults so picker-dropped nodes are immediately runnable.
   - `strategy-node.tsx` renders number inputs per widget when `isEditable`. `nodrag` className prevents React Flow from dragging while the user types.
   - New pure `deriveExecutablePlan(workspace) → { nodes, edges, errors }` walks canvas state, validates required widgets, derives entry-node sourceAmount via `decimalToBaseUnits`, drops edges through visual-only nodes.
   - New `CanvasRunPanel` floating top-right of the canvas. Click → derive plan → if errors show in amber, else `executeGraph` with `useAdapterNodeRunner`. Streams events into a floating panel below the button.
   - **Verified mainnet:** dropped Jito from picker, hit Run, single-tx mainnet stake settled (`2AMAniAK…qqDjcS`). Then a hand-built two-hop graph (Jupiter swap → Kamino supply, wired by hand) settled (`2TUdy6bV…EqoJYA` + `H9CGywsN…V76mAc`).

3. `c122b10` — **Explicit delete button on adapter-backed strategy nodes**. React Flow's default Backspace shortcut gets eaten by widget-input focus state. Added a small × button on the node header (top-right, next to status badge) when `isEditable`. Uses `useReactFlow().deleteElements({ nodes: [{ id }] })` so it goes through the existing onNodesChange pipeline and connected edges clean up automatically.

4. `9241784` — **Real on-chain SOL/USDC balances on the wallet node**. New `useWalletBalances` hook calls `getBalance` + `getTokenAccountsByOwner` through the existing `/api/solana/rpc` Helius proxy. Discriminated state (no-wallet / loading / ready / error). Wallet node shows mocked balances when no wallet connected (preserves seeded look), real balances when ready, status feedback for loading/error. New refresh icon (top-right of node) animates while a fetch is in flight. USD value slot becomes the truncated wallet address (more honest than a stale dollar figure with no price feed wired).

5. `e3e1242` — **Live APY readouts on adapter-backed strategy nodes.** New `GET /api/solana/rates?catalogItemId=<id>` route → `adapter.readRate()`. New `useAdapterRate(catalogItemId)` hook with module-level memo cache (60s TTL) so multiple Kamino nodes share a single fetch per minute. Strategy node shows static catalog fallback (`~5.9%`, `variable`, `n/a`) first, then swaps to live percentage with a small `· live` accent label once the round-trip resolves. Jupiter swap returns null (no APY semantics) so its node stays on `n/a` without a `· live` label.

6. `a837987` — **Bidirectional Jupiter swap across any supported pair.** Generalized the SOL→USDC-only swap into a configurable any-pair node.
   - New `SwapAsset` type + `SWAP_ASSETS` registry in adapter-catalog.ts (SOL, USDC, USDT, JitoSOL, mSOL with mint addresses + decimals). Adding a new pair is one entry.
   - `WidgetSchema` gained an optional `options: string[]` field for select/asset-selector kinds.
   - Jupiter catalog entry renamed to "Swap (Jupiter)", widgets become inputAsset (default SOL) + outputAsset (default USDC) + amount + slippageBps. Catalog id kept as `jupiter-swap-sol-usdc` for backwards compat with the AI compose tool.
   - `jupiter-swap.ts` `buildTransaction` reads inputAsset/outputAsset widgets, looks up mints via `getSwapAsset`, validates input ≠ output. Defaults preserved for when widgets are absent.
   - Strategy node: new `<select>` rendering for asset-selector kind, dynamic action label `"Swap USDC → SOL"` when both asset widgets are set.
   - `derive-executable-plan` now uses the swap asset's decimals (looked up via getSwapAsset) when an inputAsset widget is set; falls back to entry's static inputDecimals for single-asset adapters. Validates input/output assets differ.
   - **Verified mainnet:** hand-built reverse swap settled (`7dbndrJ6…XLMT95`) — first time the wallet swapped in a non-SOL→USDC direction.

### Demo readiness for tomorrow's informal progress check

The MVP is dramatically more functional than yesterday. Confidently demonstrable:

- Build a strategy graph by hand from the picker (Jito stake, Kamino USDC supply, bidirectional Jupiter swap)
- Edit per-node inputs (amount, slippage, swap direction)
- Hit Run → real mainnet transactions stream events into the floating panel
- OR: ask the AI in chat → strategy graph appears on canvas → same Run flow
- Wallet shows real on-chain balances; nodes show real APYs
- Delete + refresh + drag + connect — all the real composition affordances are there

### What did NOT ship today

- `#4 Another adapter` (Sanctum / Jupiter Lend / Drift / Kamino Earn Vaults). Recommendation in CHECKPOINT.md prioritized Sanctum (smallest, biggest demo unlock — LST routing).

## Session 2026-05-03 — Tier 1.6 inverse paths closed in one sprint

Three adapters shipped on mainnet in a single ~3-hour run, each first-try (or near it). The Kamino recipe (separate SDK calls + `useV2Ixs: true` + `scopeRefreshConfig` + init-tx splitting) is now battle-tested across borrow, withdraw, and repay+withdraw — anything else we build against Kamino can copy this pattern directly.

| Commit | Adapter | Notes |
|---|---|---|
| `a9694e0` | Kamino USDC withdraw | Single tx via `KaminoAction.buildWithdrawTxns`. First-try success. |
| `07afbbf` | Jito unstake | Single tx via spl-stake-pool's `withdrawSol`. Caught SDK quirk: `withdrawSol` takes DECIMAL SOL, not lamports (unlike `depositSol`). Documented in commit body. |
| `826cfa0` | Kamino repay+withdraw | Multi-tx (init-noop + repay + withdraw). Two separate SDK calls — same pattern that unblocked the borrow. Recovers locked SOL collateral. |

The strategy lifecycle is now complete on the canvas: enter → track → exit. **Eight adapters total**, all mainnet-verified, all chainable via the typed-edge contract. Tier 1 #5 (active position locking) was dropped earlier today (parked — see CLAUDE.md).

Also moved `src/mock-data/screenshots/` → `docs/screenshots/` since reference images aren't runtime mock data. 0xJulo's multi-branch flow sketch lives at `docs/screenshots/0xjulo-multi-branch-flow-example.png` and motivates the next sprint (Tier 1.7).

## Sessions 2026-05-01 + 2026-05-02 — Tier 1 #2 and #4 shipped

Two substantial Tier 1 deliverables landed on mainnet over two days. Six commits.

### 2026-05-01: Kamino supply-and-borrow + multi-tx contract

`16f0037` — Tier 1 #2 closed. Hand-built Supply & Borrow node executes against Kamino main market on mainnet. 0.02 SOL collateral + 1 USDC borrow settled in a deposit tx (1109 bytes) + borrow tx (972 bytes). Three architectural pieces went in together:

1. **Multi-tx adapter contract.** `BuildTransactionResult.transactionBase64: string` → `transactionsBase64: string[]`. `useAdapterNodeRunner` loops over the array, signs each via Privy, submits each, waits for `confirmed` between txs so subsequent txs see on-chain state created earlier. Failure surfaces the failing index (`tx 1/3: ...`). Returns the LAST signature as the canonical `txSignature` so existing event renderers work unchanged. All four existing adapters (Jito, Kamino supply, Jupiter swap, Kamino borrow) and the API route updated.

2. **Kamino supply-and-borrow adapter.** Uses TWO separate SDK calls (`buildDepositTxns` + `buildBorrowTxns`) instead of the combined `buildDepositAndBorrowTxns`. The combined call produces a single action whose `actionToIxs` interleaves `inBetweenIxs` (refresh ixs) between the deposit and borrow lending ixs, exceeding Solana's 1232-byte ceiling regardless of how the bundle is split afterward. Two separate actions give each its own self-contained refresh setup, fitting comfortably. Trade-off: cross-tx atomicity. If borrow fails after deposit succeeds, collateral is supplied with no loan opened; user can retry borrow alone.

3. **Discoveries baked into the code** (saved future-debug pain):
   - `useV2Ixs: true` is required. V1 deposit-and-borrow expects an external `RefreshFarmsForObligationForReserve` ix at a specific position the SDK doesn't insert. Anchor 6051 (IncorrectInstructionInPosition) without this.
   - `scopeRefreshConfig` is required for borrows. Construct via `new Scope("mainnet-beta", rpc) + scope.getAllConfigurations()`. Anchor 6017 (ObligationStale) without this — "price status: 00111111" bitmask = 6 reserves stale.
   - Kamino's `KaminoAction` has FOUR ix groups: `setupIxs`, `lendingIxs`, `inBetweenIxs`, `cleanupIxs`. Use `KaminoAction.actionToIxs()` for canonical assembly order.
   - Init ixs (createUserLut, initUserMetadata, initObligation, InitObligationForFarm) can be split into a standalone init tx by label prefix. Idempotent on subsequent runs.

### 2026-05-02: live investment tracker

`545aebc` — Tier 1 #4 closed. Investments panel shows real on-chain positions across every registered adapter for the connected Privy wallet. Five pieces shipped together:

- **Real `readPosition` on Kamino.** Both `kamino.ts` (USDC supply leg) and `kamino-borrow.ts` (SOL collateral + USDC debt leg) use `market.getObligationByWallet` → `obligation.getDeposits/getBorrows`. Replaced the null stubs with full position reads including USD values from `marketValueRefreshed` and a derived health factor.
- **`PositionSnapshot.debt` and `healthFactor`** added to the type for borrow positions.
- **`GET /api/solana/positions/all?wallet=X`** — aggregation route that walks `listAdapters()` and returns combined position+rate per adapter in one round-trip. Errored adapters surface as cards (rather than silently dropping).
- **Investments panel rewrite** with `useAllPositions` hook. Discriminated state, per-position cards with protocol/risk-tier/amount/USD value/live APY/projected annual yield. Borrow cards include debt sub-card + health factor + "near liquidation" warning when health < 1.2.
- **Auto-refresh after runs.** New `ChainStateSignalProvider` mounted at app root. Hooks (`useAllPositions`, `useWalletBalances`) subscribe to a monotonic counter; run buttons (`CanvasRunPanel`, `StrategyComposeMessage`) bump it in their `finally` block. Demo win: user runs strategy, Investments panel updates without manual refresh. Tier 1.5 item B (position aggregation) was promoted into this commit since the tracker needed it.

Verified mainnet: panel renders user's actual JitoSOL stake (from 2026-04-29), Kamino USDC supply, and Kamino SOL/USDC obligation. Cost: $0 — pure reads.

## Session 2026-04-30 — meeting with 0xJulo + scope shift

Met with 0xJulo. Feedback was "on the right track" with significant scope expansion: lending is the priority, investment tracker is bread-and-butter, yield compounding is a huge selling point. The pre-meeting active list (one more adapter) is replaced by the post-meeting Tier 1 below.

**Adapter scope locked:** Jito + Jupiter + Kamino are the core three. Sanctum / Jupiter Lend / Kamino Earn Vaults are parked optional. **Drift is off** the v1 roadmap (recent hack); Jupiter Perps takes that slot if perps becomes a priority. See `_archive/` and CLAUDE.md "Parked Features" once those land.

Verified `38f7502` in browser: regression where bidirectional swap broke edge connectivity (Jupiter output advertised "selected" placeholder asset, didn't match Kamino's `acceptedAssets: ["USDC"]`). Fixed by promoting widget defaults onto typed metadata at node creation + mirroring widget changes back into typed handles.

## Next Session Starts Here — Tier 1.7 multi-output runner (~4-6 hrs)

Submission target ~2026-05-10. **7 days runway.** Tier 1 #1, #2, #4 closed. #5 dropped. Tier 1.6 (all 3 inverse paths) closed 2026-05-03. Remaining: Tier 1.7 (highest leverage) + Tier 1 #3 leverage loop. Comfortable.

### Tier 1.7 — runnable Split + multi-output runner (next sprint)

Highest-value remaining work. Higher leverage than any new adapter — unlocks branching/parallel strategies with **every existing adapter**. Maps directly to 0xJulo's multi-branch flow screenshot (`docs/screenshots/0xjulo-multi-branch-flow-example.png`).

| Phase | Item | Effort |
|---|---|---|
| 1.7a | Multi-output dispatch in `executeGraph` (per-handle output tracking, per-edge `sourceHandle` → child mapping). Today the runner sums all parents into one input and assumes single-output nodes. | ~1.5-2 hr |
| 1.7b | Runnable Split node — splits input by ratio, emits per-branch outputs | ~1 hr |
| 1.7c | Runnable Amount node — scales/fixes amount on a branch | ~45 min |
| 1.7d | "Has run" visual on nodes — border tint from `GraphExecutionEvent` stream | ~30 min |
| 1.7e | Run button counter ("X txs queued") — already have `executablePlan.nodes.length` | ~5 min |

After 1.7: **Tier 1 #3 leverage loop composite** (~2-3 hr) is the last big piece. Inverse paths in 1.6 also enable an "unwind leverage" composite as a future stretch.

### Tier 1 — must ship

| # | Item | Effort | Status |
|---|---|---|---|
| 1 | Remove Discover panel | ~25 min | ✅ Done `2196d13` |
| 2 | Kamino borrow adapter | ~3-4 hrs | ✅ Done `16f0037` (mainnet verified 2026-05-01) |
| 4 | Investment tracker + Kamino position reads | ~3-3.5 hrs | ✅ Done `545aebc` (mainnet verified 2026-05-02) |
| ~~5~~ | ~~Active position locking~~ | — | Dropped 2026-05-03 (parked — see CLAUDE.md). Investments panel + inverse paths cover the use case. |
| 1.6 | Inverse paths sprint (Kamino withdraw, Jito unstake, Kamino repay+withdraw) | ~3 hrs | ✅ Done 2026-05-03 (`a9694e0`, `07afbbf`, `826cfa0`) — all three mainnet verified |
| **1.7** | **Runnable Split + Amount + multi-output runner + visuals** | **~4-6 hrs** | **next** — see breakdown above |
| **3** | **Leverage loop composite node** | **~2-3 hrs** | After 1.7. Composite "Leverage Loop on Kamino" node with widgets `collateralAsset`, `loopCount`, `targetLTV`. Internally expands to N rounds of supply→borrow→swap via `executeGraph`. With Tier 1.6 inverses landed, also unlocks an "unwind leverage" composite. |

### Tier 1.6 — inverse paths sprint (~2.5-3 hrs, NEW — slot before Tier 1 #3)

Recommended next sprint. Each adapter mirrors an existing supply/stake adapter and reuses patterns we've already debugged (multi-tx contract, scope refresh config, V2 ixs, init-tx splitting). Combined value: complete strategy lifecycle on the canvas (enter → track → exit). Cost-negative testing — the Kamino repay+withdraw recovers locked SOL collateral from prior tests.

| # | Adapter | Effort | Why low complexity |
|---|---|---|---|
| 1.6a | **Kamino USDC withdraw** | ~30-45 min | Single tx. `KaminoAction.buildWithdrawTxns` mirrors `buildDepositTxns`. Same `useV2Ixs` + `scopeRefreshConfig` patterns. Lets users exit Kamino lending. |
| 1.6b | **Jito unstake** | ~45 min | Single tx via SPL stake-pool `withdrawSol`/`withdrawStake` helpers. Inverse of P2. Epoch delay disclosed in widget. |
| 1.6c | **Kamino repay+withdraw** | ~1-1.5 hr | Multi-tx (repay then withdraw, like the borrow's deposit+borrow). `buildRepayAndWithdrawV2Txns` is the SDK call. Closes the borrow loop. **Recovers test capital.** |

### Tier 1 optional (cut if pressure hits)

| # | Item | Effort | Notes |
|---|---|---|---|
| O1 | **3 templates** | ~1.5 hrs | 0xJulo specifically asked for ≥3, but explicitly cuttable. Best candidates: Leverage Loop on Kamino, Stake-and-Hold (Jito), Stablecoin Lending (Kamino USDC supply). One template should showcase the leverage loop. |

### Tier 2 — high-value polish, do after Tier 1 if time permits

| # | Item | Effort | Why |
|---|---|---|---|
| P1 | Markdown rendering in chat | ~30 min | Currently raw text; agent's lists/bold lose punch. `react-markdown`. |
| P2 | Agent reads wallet balances in chat | ~30 min | New AI tool `readWalletBalances`. Lets the agent answer "how much SOL do I have?" or use balances when composing. |
| P3 | Compounding APY display | ~30 min | Show "≈12% effective when looped 5x" alongside the base APY on adapter strategy nodes. Pairs with #3. |
| P4 | Visual feedback for rejected edges | ~30 min | Toast or red flash when React Flow rejects an incompatible drop. |
| P5 | × button on visual-only nodes (amount/split/destination/reward + legacy strategy nodes) | ~20 min | We have it on adapter-backed strategy nodes only today. |
| P6 | Auto fit-view on AI-composed nodes | ~15 min | `useReactFlow().fitBounds()` on the new node bbox after applying mutations. |
| P7 | "AI composed this" badge on AI-added nodes | ~15 min | `draftState.changedFields: ["composed-by-ai"]` already set; just expose visually. |
| P8 | Copy wallet address affordance on the wallet node | ~5-15 min | Either a copy button on the wallet node header, or activate the bottom-left profile button as a wallet-info popover. Popover variant is more demo-polished. |
| P9 | Favorite nodes / starred catalog items | ~45 min | Let users star catalog items so the picker surfaces frequently-used adapters first. Persist to `localStorage` keyed per workspace (or global). Pairs nicely with the Templates work — favorites are user-curated, templates are project-curated. |

### Stretch goals — only if everything else is done

- **Unroll everything** (~1 hr) — one-click liquidate all active positions
- **Cycle-on-canvas leverage loops** (flavor B) — runner detects user-drawn cycles and asks for iteration count. Higher demo wow factor than the composite node, but harder.
- **E4 type-colored edges** — partner needs to pick palette; pure visual.
- **Adapter expansion** — Sanctum INF (LST routing, "AI rate-shops between LSTs") if Tier 1 + 2 ships with time to spare. Otherwise parked.

### Don't pull on these threads

- Cross-chain (parked from v1)
- Frontend refactor of 0xJulo's existing components
- Auto-compounding scheduler (flavor C of looping) — needs off-chain keeper infra, days of work
- New abstractions for hypothetical future adapters before they exist
- Drift adapters (off due to recent hack — see CLAUDE.md / parked-features memory)

### Critical path remaining for thesis demo

| Piece | Status |
|---|---|
| ProtocolAdapter contract (E5) | ✅ Done |
| Wallet (P1) | ✅ Done |
| JitoSOL (P2) | ✅ Done + mainnet verified |
| Kamino USDC (P3) | ✅ Done + mainnet verified |
| Jupiter swap (P4) | ✅ Done + mainnet verified |
| E1 Graph execution engine | ✅ Done + mainnet verified |
| A1 Chat endpoint | ✅ Done |
| A2 composeStrategy tool | ✅ Done |
| Workspace chat panel + run-graph wire | ✅ Done + **mainnet verified 2026-04-27** |
| Bridge: catalogItemId on StrategyNodeData + adapters in picker | ✅ Done |
| Canvas sync: external mutations reach React Flow | ✅ Done + verified |
| Login surface in workspace UI | ✅ Done |
| Streaming events ticker on Run graph | ✅ Done + verified |
| AI node positioning relative to existing graph | ✅ Done |
| **E2 widgets + run-from-canvas-state** | ✅ Done + mainnet verified |
| Delete button on strategy nodes | ✅ Done |
| Real wallet balance on the wallet node | ✅ Done |
| Live APY readouts on strategy nodes | ✅ Done |
| Bidirectional Jupiter swap | ✅ Done + mainnet verified |
| Multi-tx adapter contract | ✅ Done (used by Kamino borrow) |
| Kamino supply-and-borrow adapter | ✅ Done + mainnet verified 2026-05-01 |
| Live investment tracker + real Kamino position reads | ✅ Done + mainnet verified 2026-05-02 |
| Chain-state signal provider (auto-refresh after runs) | ✅ Done |
| Active position locking | Dropped 2026-05-03 (parked — see CLAUDE.md) |
| Inverse paths: Kamino withdraw, Jito unstake, Kamino repay+withdraw | ✅ Done 2026-05-03 + mainnet verified |
| **Runnable Split + multi-output runner (Tier 1.7)** | **next sprint** |
| Leverage loop composite node (Tier 1 #3) | After Tier 1.7 |

### Followup polish that is not on the critical path

- Real `readRate` for Jito (replace 5.9% stub)
- `accruedYield` populated in Kamino position reads (the SDK has it; PositionSnapshot.accruedYield is in the type but unpopulated)
- USD price feed for assets without on-chain valuations (Jito's JitoSOL doesn't show $ value today)
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
3. ~~Kamino SDK docs quality~~ — **RESOLVED 2026-04-22** by successful mainnet supply
4. AI SDK v6 tool-call → graph mutation pattern — `GraphMutation` + `applyMutations` are committed and `/api/chat` streaming works; A2 will prove the tool-call → canvas wire
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
