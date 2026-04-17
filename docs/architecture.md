# Architecture

## Purpose

This repo is a prototype frontend for Tidal. It exists to explore product flows, visual patterns, and interaction structure before those interfaces are connected to the real application.

It is not the production app and should not contain real data integrations, wallet connections, or blockchain execution.

Feature-specific implementation planning can live in dedicated docs alongside this file, such as [docs/workflow-refactor.md](workflow-refactor.md).

## Core Constraints

- All data is mocked
- No external API calls
- No Solana or wallet integration
- Frontend structure should stay integration-friendly for a later handoff

## Current Shape

After the workspace refactor the product is a single unified experience: every surface is a workspace (a node-based canvas plus its chat, investments, and discovery context). The earlier Home, Global Chat, Pool, and Swap product areas have been archived under `_archive/` for reference and are excluded from the build.

### 1. App routes

Thin route files in `src/app`.

Current routes:

- `src/app/page.tsx`: bootstrap — resolves the active workspace id and replaces the URL with `/workspace/<id>`
- `src/app/workspace/page.tsx`: client redirector that resolves `/workspace` to the active workspace URL
- `src/app/workspace/[workspaceId]/page.tsx`: addressable workspace route
- `src/app/layout.tsx`: shared shell with global header + sidebar, wrapping preference profile, workspace, side panel, sidebar, and tooltip providers

### 2. Shared UI components

Generic reusable primitives live in `src/components/ui` and remain product-agnostic (buttons, inputs, cards, dropdown menus, sidebar primitives).

### 3. Tidal design components

Reusable branded product-facing building blocks live in `src/components/tidal`.

Current set:

- `PromptComposer`
- `PreferenceContextPanel`
- `SuggestionAction`
- `SectionLabel`
- `ChatMessage`
- `WorkspaceHeader`
- `SurfaceCard`
- `Badge`
- `CompactSelect`

### 4. Product-area UI components

Product-area UI lives under `src/components` by product area.

Current product-area component folders:

- `src/components/shell` — `AppHeader`, `AppSidebar`, `WorkspaceTabs`, `WalletSummary`
- `src/components/workspace` — the unified workspace surface
  - `workspace-screen.tsx`: canvas + side-panel composition
  - `workspace-builder-context.tsx`: node-level editing context
  - `node-picker.tsx`: overlay picker for output-drag and pane context-menu creation
  - canvas node components: `wallet-node`, `amount-node`, `strategy-node`, `split-node`, `reward-node`, `destination-node`
  - `investments/`: `InvestmentCard`, `InvestmentPerformanceChart`
  - `discover/`: `RecommendationCard`, `DiscoveryCard`
  - `panels/`: `PanelShell`, `NodesPanel`, `InvestmentsPanel`, `DiscoverPanel`, `ChatPanel`, `TemplatesPanel`

### 5. Providers, hooks, and frontend helpers

- `src/providers/workspace-provider.tsx`: local mocked multi-workspace state (list, active, chats per workspace, graph updates)
- `src/providers/side-panel-provider.tsx`: per-workspace active side-panel selection, supports closing for canvas-focus mode
- `src/providers/preference-profile-provider.tsx`: global risk and investment-interest preferences
- `src/hooks/workspace/use-canvas-state.ts`: React Flow canvas behaviour, including `addCatalogNodeAtCenter` used by the Nodes panel
- `src/lib/workspace/graph-utils.ts`, `picker-utils.ts`, `status.ts`: pure graph and picker helpers
- `src/lib/routes/workspace.ts`: `getWorkspaceHref`

### 6. Mock-data layer

Mocked data and lightweight types live under `src/mock-data`.

- `src/mock-data/shell`: types and seed data for the shared shell (preference profile default, wallet/user summary)
- `src/mock-data/workspace`: node catalog, node factories, builder-workspace seed, example-workspace seed, types, investments per workspace, discover per workspace, templates

## Data Flow

`mock-data/*` → `providers/*` and `components/workspace/workspace-screen` → panel components, canvas nodes, and `components/tidal`.

Styling system:

`src/app/globals.css` → semantic typography/layout/sidebar/tab classes → `components/tidal` and `components/workspace`.

Rules:

- mock content should not live directly inside UI component files
- components should receive content via props where practical
- route files should compose screens using feature data instead of embedding it
- backend or blockchain integration clients should not be introduced in this prototype repo

## Current Feature Breakdown

### Shell

`src/mock-data/shell` holds app-wide prototype definitions supporting the shared frame.

- preference profile types (risk appetite, investment interests) and default seed
- wallet/user shell summary

`src/components/shell` owns the frame:

- `AppHeader`: logo, sidebar trigger, `WorkspaceTabs`, risk appetite dialog, investment interests dialog
- `WorkspaceTabs`: horizontal scrollable tabs backed by `WorkspaceProvider.workspaces`, with close (×) and `+` affordances
- `AppSidebar`: five-mode icon+label rail (Nodes, Investments, Discover, Chat, Templates) with user block at the bottom; selecting the active item again closes the panel for canvas focus

### Workspace

`src/components/workspace` owns the unified canvas + panel experience.

- `WorkspaceScreen`: wires `WorkspaceProvider` to `useCanvasState`, reads `useSidePanel` to select which panel renders alongside the canvas
- panel switching swaps the contents of the left-side column; with no active panel the canvas fills the full screen
- `WorkspaceBuilderContextProvider` exposes node-level edit and updateNodeData to canvas node components
- the existing `NodePicker` overlay is still available for output-drag and pane context-menu creation; the `NodesPanel` is the primary discovery path

`src/providers/workspace-provider.tsx`:

- list of workspaces, active workspace, active chat per workspace, chat history per workspace
- `createWorkspace`, `closeWorkspace`, `setActiveWorkspaceId`, `setActiveThreadId`, `createBlankThread`, `updateWorkspaceGraph`, `updateWorkspaceMeta`

`src/providers/side-panel-provider.tsx`:

- per-workspace active side panel, defaulting to `chat`
- `setActivePanel`, `togglePanel` (clicking the active mode again closes the panel)

`src/hooks/workspace/use-canvas-state.ts`:

- React Flow node/edge state, draft/impact propagation, context-menu and drag-from-output creation
- `addCatalogNodeAtCenter(catalogItemId)` used by `NodesPanel` to drop a node at the canvas viewport centre

### Panels

- `NodesPanel`: searchable, group-filtered node catalog; clicking a card drops the node on the canvas via `addCatalogNodeAtCenter`
- `InvestmentsPanel`: performance chart + active position cards sourced from `mock-data/workspace/investments.ts`
- `DiscoverPanel`: tabbed view of recommendations and discovery items from `mock-data/workspace/discover.ts`
- `ChatPanel`: per-workspace chat transcript with a history disclosure that lists past chats for this workspace and a new-chat button
- `TemplatesPanel`: placeholder template gallery backed by `mock-data/workspace/templates.ts`; shown as a responsive card grid matching the reference layout

### Mock data

`src/mock-data/workspace` currently provides:

- chat message and thread typing, workspace typing, workspace kind typing
- node kind, status, and execution state typing
- compatibility metadata for allowed input assets and downstream node types, plus output metadata for primary and reward streams
- node catalog definitions and factory helpers used by `NodesPanel`, the `NodePicker`, and the canvas
- builder and example workspace seeds (example SOL yield loop kept as reference)
- per-workspace investment positions + performance snapshots for `InvestmentsPanel`
- per-workspace recommendation and discovery seeds for `DiscoverPanel`
- template placeholder data for `TemplatesPanel`

## Component Boundary Rules

### UI primitives

Files under `src/components/ui` should:

- remain generic
- avoid feature-specific mock content
- avoid Tidal-specific data assumptions

### Tidal design components

Files under `src/components/tidal` should:

- encode reusable branded interface patterns
- compose generic UI primitives
- accept data and state via props
- prefer semantic classes from `src/app/globals.css` before introducing new one-off values
- avoid owning feature-specific mock content

### Product-area components

Files such as `src/components/shell/app-sidebar.tsx` or the panel components should:

- accept data and state via props or consume providers
- avoid owning embedded mock content
- keep the route layer thin
- stay separate from the `mock-data` layer
- keep raw visual values light, and promote repeated styling into `components/tidal` or `src/app/globals.css`

## Styling Conventions

The styling system lives in `src/app/globals.css`:

- theme tokens and brand colours
- semantic typography classes
- shared layout and spacing helpers
- shared interaction treatments
- sidebar rail, workspace tabs, panel shell, node catalog item, template grid classes
- React Flow theme overrides used by the workspace canvas

Rules for future work:

- prefer semantic classes from `globals.css` over introducing new arbitrary `text-[...]`, `px-[...]`, `gap-[...]` values
- if the same visual treatment appears in more than one place, move it into `components/tidal` or a shared semantic class
- keep new screens responsive by default, starting from narrow/mobile layouts and widening deliberately
- avoid creating a separate `src/styles` layer unless `globals.css` becomes a proven bottleneck

### Mock-data modules

Files under `src/mock-data/*` should:

- define lightweight frontend-facing types
- provide mocked content for the prototype
- be easy to replace later with integration adapters or real data sources

## Archive

`_archive/` at the repo root holds the earlier Pool, Swap, Home, and Global Chat surfaces — including their components, providers, mock data, app routes, and the tidal promotion helpers that were specific to promoting a general chat into a workspace thread. It is excluded from `tsconfig.json`, ESLint, and the Next.js build. Nothing under `_archive/` is imported from live code; it exists only as reference material if a pattern needs to be copied back out.

## Integration Guidance

When this prototype is later integrated into the real app, the intended replacement pattern is:

1. Keep presentational and shared components where they are if they remain useful.
2. Replace `mock-data/*` with real data adapters, view-model builders, or application state.
3. Preserve the prop boundaries rather than moving business logic back into UI files.
4. Continue to keep generic UI primitives separate from product-specific components.

## Maintenance Rule

Whenever structural frontend changes are made:

- update this file to reflect the new repo shape
- update [docs/codex-plan.md](codex-plan.md) to reflect progress against the cleanup plan
