# Tidal Design Thesis

**Status:** Foundational. Required reading before product or architecture decisions.
**Companion:** `docs/tidal-prd.md` (features), `docs/architecture.md` (implementation).

---

## The Paradigm

**Tidal is ComfyUI for Solana DeFi.**

[ComfyUI](https://docs.comfy.org/development/core-concepts/nodes) made image generation tractable for non-experts by giving them a visual, typed, composable graph: nodes with typed inputs and outputs, parameter widgets per node, workflows expressed as DAGs, and a community that shares those workflows as JSON.

Tidal applies the same paradigm to Solana yield generation. A user composes a strategy by dragging nodes — a wallet, a stake, a swap, a lend, a split — onto a canvas, configures each node's parameters in-place, and runs the whole graph. An AI agent can compose graphs on the user's behalf and drop them onto the canvas for inspection and editing before execution.

This is the differentiator. No product on Solana does this today. Phantom is a wallet. Jupiter is an aggregator. Step is a dashboard. Griffain is a token. The Hive is multi-agent chat. None of them are a composition surface for DeFi strategies.

## Why Composition

DeFi rewards people who can think in chains: stake SOL → mint LST → use LST as collateral → borrow stablecoin → lend stablecoin → harvest rewards weekly → compound. Today this requires bouncing across five protocol UIs, copying numbers between tabs, and trusting that you remembered every step. Most users opt out.

A node graph makes the chain visible. Every step is a node. Every connection is a typed asset transfer. Every parameter is a widget. The strategy is the graph, not a sequence of forms a user has to hold in their head.

## Concept Map

| ComfyUI                    | Tidal                                                |
| -------------------------- | ---------------------------------------------------- |
| Node                       | DeFi operation (wallet, stake, swap, lend, split, harvest, destination) |
| Typed input/output         | Asset (SOL, USDC, mSOL, JitoSOL, INF, kTokens)       |
| Color-coded edges          | Color-coded asset edges (visual type compatibility)  |
| Widget                     | Per-node parameter (amount, slippage, deadline, threshold, split ratio) |
| Workflow (DAG)             | Strategy graph                                        |
| Queue Prompt               | Run Strategy                                          |
| Always / Never / Bypass    | Per-node execution mode (used by autopilot rules)    |
| Caching of intermediate state | Memoization of APY reads, swap quotes, balance reads |
| Custom node authoring      | Third-party protocol nodes (later phase)             |
| Subgraph / group           | Saved sub-strategy ("leveraged SOL loop" as one node) |
| Workflow JSON              | Strategy export/import + shareable URLs               |
| Node library               | `src/mock-data/workspace/catalog.ts` → backed by `src/lib/solana/registry.ts` |

## What This Means For The Product

1. **The canvas is the product.** It is not a side feature, not an alternative to chat, not a power-user mode. It is the primary surface.

2. **The AI agent is a composer, not an executor.** The agent's job is to write graphs onto the canvas, explain them, and let the user inspect, modify, and run. Chat-driven blind execution is not the product.

3. **Templates are first-class shareable workflows.** A template is a graph. Users share strategies on Twitter as workflow JSON or a Tidal URL. This is a content/community loop, not a placeholder gallery.

4. **Comfort is a side effect, not the pitch.** Because every step is visible, typed, and parameterized, users see what they're about to sign. The "comfy DeFi" outcome (safety, transparency, plain-English) is delivered by the paradigm, not bolted on as a separate feature set.

5. **Risk tiers filter the node library, not the chat.** Shallows users see a subset of nodes available to them. Mid-Depth and Deep Water unlock more nodes. Risk tier is a graph constraint, not a recommendation modality.

## Anti-Paradigm — What Tidal Is Not

- **Not a chat-only AI assistant.** Chat is one input modality. The graph is the source of truth.
- **Not a flat aggregator form.** Yearn-style "pick a vault, click deposit" loses the composition story.
- **Not a portfolio dashboard.** Step Finance shows what you have. Tidal lets you build what you want.
- **Not a token speculation play.** Griffain and similar are speculative agent tokens. Tidal is a working product.
- **Not a wallet replacement.** Phantom and Backpack remain the user's wallet. Tidal sits beside them as a strategy surface.

## Engineering Implications

This paradigm is load-bearing for engineering decisions:

1. **The graph execution engine is core infrastructure, not a feature.** It needs topological execution, per-node state machines (`pending → running → succeeded → failed`), error propagation, and cancellation. It is the runtime of the product.

2. **The `Node ↔ ProtocolAdapter` interface is the load-bearing contract.** Every protocol Tidal supports must conform to a uniform shape:
   - `readPosition(wallet, params) → PositionSnapshot`
   - `readRate(params) → APYQuote`
   - `buildTransaction(wallet, params, inputAmount) → VersionedTransaction`
   - `metadata: { name, audits, tvl, riskTier }`

3. **The widget system must be data-driven.** Adding a new node type cannot require new UI components per node. Widgets render from a schema attached to the node definition (number, percentage, asset selector, threshold, deadline).

4. **Workflow serialization needs versioning from day one.** Workflows are user-owned content. They must survive product evolution. Use a versioned JSON format (`tidal.workflow.v1`) and a migration path.

5. **Type safety on edges must be enforced both at link time and run time.** ComfyUI-style type compatibility is enforced when the user attempts to connect handles. Tidal must do the same — a SOL edge cannot connect to a USDC input. The existing `WorkspaceNodeOutput.asset` field is the canonical identity for this check; never overload it with display text.

6. **The agent generates graph mutations, not text answers.** AI tool calls return structured edits to the active workspace graph (`addNode`, `connect`, `setWidget`, `removeNode`). The chat panel shows a transcript; the canvas shows the result. The agent does not "answer questions" about DeFi in isolation — it builds graphs that answer the question.

7. **Reactivity matters.** Changing a widget upstream marks downstream nodes as `impacted`. The existing `WorkspaceNodeStatus` and `WorkspaceNodeDraftState` model this correctly — preserve it.

## Implications For The Roadmap

- **Phase 1 must include the composition primitives**, not just protocol adapters. A graph execution engine, widget system, workflow serialization, and the first two protocol adapters together form the MVP. Two protocols + a half-built canvas is not a demo of the thesis.

- **F11 (transaction explanation) is partially absorbed by the paradigm.** The canvas already shows what each step does. The remaining work is the pre-sign breakdown sheet — important but smaller than the PRD scope implies.

- **F13 (autopilot) maps to ComfyUI execution modes.** Per-node `Always` mode triggers re-run when upstream rates change. This is the same mental model.

- **F16 (paid API for other agents) gains depth.** Other agents can pay to compose graphs, not just to query yields. The API surface is graph mutations.

- **Custom node authoring (post-Phase-4)** is the real platform play. When Drift, Marginfi, or a new protocol can publish their own Tidal node, the node library becomes an ecosystem.

## Decision Filter

When facing a product or architecture decision, ask:

- Does this make the composition surface more capable, more legible, or more shareable?
- Does this preserve the typed-graph mental model, or does it bypass it?
- Would a ComfyUI user recognize this pattern?

If the answer to the first is no, or to the second is "bypass," the decision is probably wrong.
