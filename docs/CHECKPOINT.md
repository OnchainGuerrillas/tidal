# Checkpoint

**Last updated:** 2026-04-27
**Branch:** main (clean, pushed to origin)
**Latest commit:** `6164bad` — fix(workspace): sync AI-composed nodes onto the canvas
**Hackathon meeting:** Thursday 2026-04-30 — present MVP demo

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

## Next Session Starts Here — Tuesday 2026-04-28 (heavy coding day before Thursday meeting)

### Demo readiness checklist — what we have

The MVP works end-to-end on mainnet. Thursday's demo can confidently show:

1. Open `/workspace-new-strategy` (or any builder workspace URL) in **incognito** to dodge form-filler hydration noise.
2. Login with Privy (embedded wallet auto-provisions).
3. In chat: `stake 0.01 SOL with Jito` (single-node, ~$2 cost) **OR** `swap 0.01 SOL to USDC and lend it on Kamino` (two-node, dramatic — but ~$2 cost).
4. Watch the strategy nodes appear on the canvas in real time.
5. Click Run graph in the bubble. Two mainnet txs settle in ~30s. The user controls signing — agent is composer, not executor.

### Highest-leverage Tuesday work (in priority order)

1. **Verify the streaming events display in `StrategyComposeMessage` actually shows event lines during a Run.** The events stream into local `runState`, but I never confirmed they render visibly during the test pass — the user reported "nothing really changed on the screen" for one run, even though logs show submit-transaction returned 200. Could be a re-render timing thing, could be local state being reset when the parent re-renders. 30 min to verify and fix if broken. Demo loses dramatic punch without the event ticker.

2. **AI node positioning.** Hardcoded `(320, 240)` / `(700, 240)` collides with existing nodes on workspaces that aren't pristine. Make the tool place new nodes relative to the rightmost existing node (or below it) so composing onto a partially-built graph doesn't pile on top. Also consider an auto-fitView nudge after applying mutations so the user doesn't miss the new content. ~30-45 min.

3. **Run-graph from canvas state (so hand-built graphs are runnable).** Currently the Run button uses `output.executable.nodes` from the tool's plan, which is fine for AI-composed graphs. To run a graph the user built from the picker, we need to derive `ExecutableNode[]` by walking workspace nodes/edges and pulling `node.data.catalogItemId` (already stamped) + a `sourceAmount`. That last piece is the blocker — needs E2 widgets. **Skip this for the meeting MVP**; AI-composed runs are the demo.

4. **E2: minimal source-amount widget on adapter strategy nodes.** Single number input that writes back to node data. Needed for hand-built graphs to run. Probably 1-2 hours including respecting `WidgetSchema` from each adapter (jito + kamino + jupiter all expose it). Worth doing if the meeting's response is "now let me try building one myself."

5. **Wallet node showing real Privy balance.** Currently mocked (126.40 SOL, 42,000 USDC). For Thursday it's fine to keep mocked; but reading the actual balance via `getSolanaRpc().getBalance(walletAddress)` would make the demo feel more honest. ~20 min.

### Demo polish (lower priority but cheap)

- Auto-fitView (or pan-to) on AI-composed nodes after they land
- Clean console — already cleaned diagnostic logs out, but watch for new ones during testing
- Subtle "AI composed this" indicator on AI-added strategy nodes (the `draftState.changedFields: ["composed-by-ai"]` is already set; just expose it visually)
- Demo script in `docs/demo-script.md` — three prompts, expected outputs, recovery if a prompt misbehaves

### Don't pull on these threads before Thursday

- Adding more adapter integrations (Drift, Sanctum, etc.)
- Real `readRate` for Jito (5.9% stub is fine)
- Real `readPosition` for Kamino obligations
- Position fetching for `/api/solana/positions`
- Bidirectional Jupiter swap
- Any frontend refactor of 0xJulo's existing components

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
| Streaming events ticker on Run graph | 🟡 Wire is there; visual confirmation pending |
| **AI node positioning relative to existing graph** | Tuesday |
| **Demo script + dry-run** | Tuesday/Wednesday |
| E2 Widget system (per-adapter amount input) | Optional for Thursday — needed for hand-built runs |
| Real wallet balance on the wallet node | Optional polish |

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
