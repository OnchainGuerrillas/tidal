# Amplify Nodes

## Purpose

This document is the implementation tracker for evolving Tidal Amplify from a static strategy example into a builder-first node workspace.

It should be used as a phased checklist that can be updated as work lands across Home, Amplify, the shared sidebar, and the shared mock-data model.

Important framing:

- this is a frontend prototype tracker, not a backend or protocol integration spec
- all data remains mocked
- no wallet connections, external APIs, blockchain execution, or protocol integrations should be introduced
- `docs/architecture.md` should be updated when structural changes land
- `docs/codex-plan.md` should be updated as progress is made against this work

## Locked Product Decisions

These decisions are assumed and should not be re-opened unless the product direction changes materially.

- [x] Amplify should support user-built flows, not only a prebuilt demo graph
- [x] new Amplify workspaces should start from a blank canvas with a wallet node
- [x] the current example flow should remain accessible as its own separate example workspace
- [x] Amplify should keep the split chat + canvas layout for now
- [x] Home should include an explicit `Create new Amplify` CTA below the prompt
- [x] the CTA should create a new Amplify directly rather than relying only on chat inference
- [x] node creation from an output should show the full catalog, with incompatible nodes disabled and explained
- [x] users should be able to right-click the canvas and create a node from the full list
- [x] core node configuration should happen inside the node card
- [x] once a strategy is running, active nodes should be locked
- [x] rewards and fees should be represented as separate node outputs, not only inline controls
- [x] a global `Run` action should simulate execution with mocked data
- [x] editing an upstream node after a run should create draft changes and mark downstream nodes as impacted
- [x] downstream impact should be communicated with visible node states plus an inline warning banner
- [x] all execution states, balances, APYs, and platform links remain mocked in v1

## Shared Vocabulary

These concepts should guide implementation naming and ownership.

- [x] `AmplifyWorkspace` means one strategy workspace, either user-created or example
- [x] `ExampleWorkspace` means a seeded running reference strategy that is not the primary editable builder
- [x] `BuilderWorkspace` means a user-authored Amplify strategy that starts from a wallet node
- [x] `WalletNode` means the source node that exposes mocked wallet assets such as SOL and USDC
- [x] `AmountNode` means a node that selects a fixed amount or percentage of an upstream asset
- [x] `StrategyNode` means a protocol action such as stake, lend, supply/borrow, or LP
- [x] `SplitNode` means a routing node that divides one asset stream into two paths
- [x] `RewardNode` means a node representing fees or rewards emitted from an upstream strategy
- [x] `DestinationNode` means a node that routes assets or rewards back to wallet
- [x] `ActiveSnapshot` means the last successful mocked run state
- [x] `DraftState` means editable changes that have not yet been rerun
- [x] `ImpactedNode` means a downstream node whose assumptions are no longer valid after an upstream draft change

## Phase Tracker

### Phase 1: Multi-Workspace Foundation

Status: Pending

#### Goal

Convert Amplify from a single hardcoded graph into a workspace system that can support both user-authored strategies and sidebar examples.

#### Tasks

- [ ] expand Amplify state from one workspace into multiple workspaces
- [ ] introduce active workspace selection in the Amplify provider
- [ ] add a blank builder workspace seeded with a wallet node
- [ ] keep the current SOL loop as a separate example workspace
- [ ] ensure the example workspace appears in the Amplify sidebar
- [ ] ensure newly created Amplify workspaces appear in the Amplify sidebar
- [ ] preserve existing Amplify thread behavior per workspace where practical

#### Deliverable

- [ ] Amplify can switch between a blank builder workspace and the example workspace
- [ ] the current graph no longer has to serve as both demo and editable builder state

### Phase 2: Home Entry And Workspace Creation

Status: Pending

#### Goal

Give users a direct path from Home into building a new Amplify strategy.

#### Tasks

- [ ] add a `Create new Amplify` CTA below the empty-state Home prompt composer
- [ ] wire that CTA to create a new blank Amplify workspace immediately
- [ ] route the user to `/amplify` with the new workspace selected
- [ ] give new workspaces a sensible default name such as `New Amplify Strategy`
- [ ] keep the existing in-chat Amplify recommendation flow intact for conversational discovery

#### Deliverable

- [ ] a user can create a new Amplify directly from Home without first typing a chat prompt
- [ ] the new workspace opens on a blank wallet-led builder canvas

### Phase 3: Graph Model And Node Types

Status: Pending

#### Goal

Replace the static node model with a builder-capable graph model.

#### Tasks

- [ ] define a discriminated node union for wallet, amount, strategy, split, reward, and destination nodes
- [ ] add compatibility metadata for allowed input assets
- [ ] add output metadata for primary outputs and reward outputs
- [ ] add mocked holdings, APY or cost, and platform link metadata to relevant nodes
- [ ] add node run states such as `draft`, `ready`, `active`, `impacted`, and `error`
- [ ] add active snapshot and draft state types for post-run editing
- [ ] migrate the current example graph onto the new node model

#### Deliverable

- [ ] Amplify graph state can represent both editable draft strategies and running example strategies
- [ ] the type model is ready for compatibility-aware creation and mocked execution

### Phase 4: Builder Interactions

Status: Pending

#### Goal

Turn the canvas into a real strategy-building surface.

#### Tasks

- [ ] add wallet node UI that shows mocked wallet assets and balances
- [ ] support creating a new node from a wallet asset output
- [ ] add a contextual node picker near the cursor when creating from an output
- [ ] show the full node catalog in that picker
- [ ] disable incompatible nodes and explain why they cannot be selected
- [ ] auto-connect newly created nodes to the originating output
- [ ] add right-click creation on empty canvas from the full node catalog
- [ ] allow disconnected nodes to exist in draft state
- [ ] enforce compatibility rules on manual edge creation via `onConnect`
- [ ] preserve edge labels that communicate the asset stream

#### Deliverable

- [ ] users can build an Amplify flow directly on the canvas
- [ ] creation feels guided without hiding the full strategy space

### Phase 5: Inline Node Editing And Reward Routing

Status: Pending

#### Goal

Make node cards informative and directly editable while keeping active strategies locked.

#### Tasks

- [ ] add inline amount controls where relevant
- [ ] add inline protocol or action-specific controls inside node cards
- [ ] add separate reward output handling for earning nodes
- [ ] support routing rewards to wallet, split nodes, or downstream strategy nodes
- [ ] show mocked amount-held in the platform on each relevant node
- [ ] show APY or borrow cost on each relevant node
- [ ] show a link to the mocked underlying platform destination
- [ ] lock active nodes once a strategy is running
- [ ] keep the example workspace non-editable

#### Deliverable

- [ ] nodes communicate both strategy intent and mocked investment state
- [ ] users can configure draft strategies without leaving the canvas

### Phase 6: Run Simulation And Downstream Impact States

Status: Pending

#### Goal

Make Amplify feel operational by simulating strategy execution and downstream consequences.

#### Tasks

- [ ] add a workspace-level `Run` action
- [ ] validate graph structure before run
- [ ] validate asset compatibility before run
- [ ] simulate mocked execution outputs across the graph
- [ ] mark successful nodes as `active`
- [ ] mark invalid or blocked nodes as `error`
- [ ] preserve the last successful run as an active snapshot
- [ ] allow edits by creating draft changes over the active snapshot
- [ ] mark downstream descendants as `impacted` after upstream edits
- [ ] show a persistent inline banner explaining how many downstream nodes are affected
- [ ] require rerun before impacted draft changes become the new active state

#### Deliverable

- [ ] Amplify communicates not just how to build a strategy, but how changes ripple through later positions
- [ ] the prototype expresses DeFi-style downstream consequences without requiring real execution

### Phase 7: Polish, Navigation, And Documentation

Status: Pending

#### Goal

Make the builder legible, maintainable, and coherent with the rest of the prototype.

#### Tasks

- [ ] refine sidebar labeling for example vs user-created Amplify workspaces
- [ ] ensure the builder works at desktop and mobile breakpoints
- [ ] preserve the split chat + canvas layout while keeping the graph legible
- [ ] align new node states with the existing Tidal visual system
- [ ] update `docs/architecture.md` to reflect the new Amplify structure
- [ ] update `docs/codex-plan.md` to reflect work completed here
- [ ] keep this document updated as implementation progresses

#### Deliverable

- [ ] Amplify reads as a builder-first feature instead of a static graph demo
- [ ] docs stay aligned with the resulting structure and phased progress

## Open Notes

These are implementation notes to keep visible while building.

- upstream edits in a DeFi strategy cannot be treated like harmless visual tweaks; they change assumptions for downstream positions
- v1 should communicate those consequences clearly without introducing full protocol state management
- the example workspace should act as a strong reference for what a fully built Amplify can look like
- the builder workspace should optimize for user creation first, with AI-assisted placement left for later work
