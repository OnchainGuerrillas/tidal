# Checkpoint

**Last updated:** 2026-04-18
**Branch:** main (clean, pushed to origin)
**Latest commit:** `7aaaaa1` — docs: cite design thesis as required reading

---

## Where We Are

Tidal Prototype has transitioned from **frontend-only prototype** to **working-product repo**. The frontend architecture (0xJulo's work) is complete. The backend phase is about to start (0xSardius).

**Major reframe this session:** the product is not "AI yield advisor that happens to have a node canvas." It is **ComfyUI for Solana DeFi** — a visual, typed, composable canvas is the differentiator. The AI agent's role is *composer*, not *executor*. This is now the foundational design thesis.

## What We Did This Session (2026-04-18)

### Doc infrastructure commits (on `main`, all pushed)

1. `c3a7838` — Marked backend integration phase in `CLAUDE.md` and `docs/architecture.md`. Scoped existing "no API / no blockchain / no wallet" rules to UI/mock-data patterns so backend work is unblocked.
2. `c2bf241` — Same phase-shift note added to `AGENTS.md`.
3. `5c1a8b4` — Listed Claude Code skills to use for backend work in `CLAUDE.md` (load-bearing: `solana-dev`, `integrating-jupiter`, `ai-sdk-core`, `ai-sdk-ui`, `claude-api`, `prompt-engineering-patterns`). Flagged not-for-this-repo: `wagmi`, `viem`, `solana-anchor-claude-skill`.
4. `e9333ac` — New `docs/design-thesis.md` naming ComfyUI as the paradigm, mapping concepts to Tidal, defining anti-paradigm, listing engineering implications.
5. `8ecc574` — PRD restructured to v2.2 around composition paradigm. Phase 1 now covers composition engine (E1–E6) + 2 adapters + AI + comfort baseline. Jupiter Lend deferred to Phase 2. Per-node execution modes (E7) in Phase 2 enable Phase 3 autopilot (F13). F16 paid API gains graph-composition endpoint. E9 custom node authoring added as long-term platform play.
6. `7aaaaa1` — `CLAUDE.md` and `AGENTS.md` cite the thesis as required reading and instruct agents to reject anti-paradigm requests.

### Key decisions

- **Single repo, not separate.** Partner agreed to evolve this repo into the working product rather than fork. `tidal-prototype` name stays for now.
- **ComfyUI framing is load-bearing.** Every feature decision goes through the "does this preserve the typed-graph mental model" filter.
- **Phase 1 scope deliberately expanded.** Four protocols shrank to two, but composition engine, widget system, workflow serialization, type-colored edges, node-adapter contract, and signing UX were added. Timeline: 4-5 weeks, not 3-4.
- **Agent's role shifted.** Not "chat executes trades." It is "chat proposes graphs onto the canvas; user inspects, edits, signs." The `composeStrategy` tool returns graph mutations, not text.
- **Comfort baseline pulled forward.** Minimal F11 (pre-sign breakdown) and minimal F12 (static protocol risk badges) land in Phase 1 so the first signed tx demonstrates the thesis. Full live versions in Phase 2.

## Current Repo State

### Frontend (complete, 0xJulo)

- Next.js 16, React 19, Tailwind v4, React Flow (`@xyflow/react`), shadcn, `@base-ui/react`
- Single live route: `/<workspaceId>` with a `workspace-screen.tsx` that composes canvas + side panels
- Three providers: `WorkspaceProvider`, `SidePanelProvider`, `PreferenceProfileProvider`
- Six node kinds: `wallet`, `amount`, `strategy`, `split`, `reward`, `destination`
- Five side panels: `nodes`, `chat`, `investments`, `discover`, `templates`
- All data mocked under `src/mock-data/*`
- Canonical asset identity in `WorkspaceNodeOutput.asset`; display text in `.amountLabel`
- React Flow client-only via `next/dynamic({ ssr: false })`

### Backend (not yet started)

Target layout per PRD v2.2:
- `src/lib/solana/*` — protocol adapters (empty)
- `src/lib/ai/*` — agent tools (empty)
- `src/app/api/*` — route handlers (empty)

Nothing committed yet beyond docs.

## Next Session Starts Here

### Immediate next step

**Plan Phase 1 execution.** The user (0xSardius) asked to do Phase 1 execution planning — actual week-by-week build order for E1–E6 + P1–P4 + A1–A3 across 4-5 weeks.

Suggested structure for that plan:
1. Critical-path identification — what blocks what (E5 node-adapter contract blocks P2/P3/P4; E1 engine blocks A2 composition tools; E2 widgets block E6 signing UX)
2. Week-by-week allocation
3. Decision points that need to be resolved before coding (RPC provider — Helius vs Triton; Privy Solana embedded wallet ergonomics; signing UX mockup)
4. Test plan per week (LiteSVM for unit tests, mainnet with small amounts for integration, per the `solana-dev` skill)

### Blockers / decisions to resolve early in Phase 1

- **RPC provider** for Kamino + Jito reads. Not decided. Helius or Triton likely. Jupiter Ultra uses Beam relayer so doesn't need one.
- **Privy Solana integration specifics** — does `walletChainType: 'ethereum-and-solana'` work cleanly with embedded wallets on Solana? Needs verification.
- **Signing UX mockup** — single confirm-and-sign sheet used whether the user clicks Run on a node, runs the whole graph, or accepts an agent-proposed graph. No design yet.
- **Workflow JSON schema** — `tidal.workflow.v1` format needs spec before E3 lands.

### Open questions from PRD

- Colosseum hackathon cycle timing (not resolved)
- Jupiter API tier (free 60 req/min vs Pro) — probably free for MVP
- Integrator fees on Jupiter swaps day-one — design decision, not blocker

## Useful Pointers

- Read `docs/design-thesis.md` first — foundational.
- Then `docs/tidal-prd.md` v2.2 — feature roadmap.
- Then `docs/architecture.md` — frontend architecture + backend layer plan.
- `CLAUDE.md` and `AGENTS.md` — current agent instructions including skills list.
- User is 0xSardius (engineering). Partner 0xJulo owns design/frontend.
- Single-repo decision: this repo evolves into the working product. No fork.

## Command Reminders (Bun only, never npm)

```bash
bun install
bun run dev
bun run lint
bun run build
bun add <package>
bunx <tool>
```
