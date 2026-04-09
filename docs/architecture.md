# Architecture

## Purpose

This repo is a prototype frontend for Tidal. It exists to explore product flows, visual patterns, and interaction structure before those interfaces are connected to the real application.

It is not the production app and should not contain real data integrations, wallet connections, or blockchain execution.

Feature-specific implementation planning can live in dedicated docs alongside this file, such as `docs/codex-pool-plan.md`.

## Core Constraints

- All data is mocked
- No external API calls
- No Solana or wallet integration
- Frontend structure should stay integration-friendly for a later handoff

## Current Shape

After the repo-wide cleanup phases and the first full Pool implementation, the repo is organised around five broad layers:

### 1. App routes

Thin route files in `src/app` assemble screens and pass mocked data into components.

Current routes:

- `src/app/page.tsx`: Home global chat workspace
- `src/app/chat/[chatId]/page.tsx`: route-backed global chat workspace for persisted chat URLs
- `src/app/pool/page.tsx`: Pool workspace prototype
- `src/app/amplify/page.tsx`: Amplify workspace prototype
- `src/app/layout.tsx`: shared shell with a global top header above the sidebar/content row, plus preference-profile provider, global chat provider, Pool provider, sidebar provider, and tooltip provider

### 2. Shared UI components

Generic reusable primitives live in `src/components/ui`.

These components should remain product-agnostic and focused on rendering and interaction primitives rather than Tidal-specific meaning.

Examples:

- buttons
- inputs
- cards
- dropdown menus
- sidebar primitives

### 3. Tidal design components

Reusable branded product-facing building blocks live in `src/components/tidal`.

These components encode recurring Tidal interface patterns without owning feature data.

Current examples:

- `PromptComposer`
- `PreferenceContextPanel`
- `SuggestionAction`
- `SectionLabel`
- `ChatMessage`
- `ThreadOwnershipBanner`
- `PromotionSummaryPanel`
- `WorkspacePromotionCard`
- `WorkspaceButton`
- `SurfaceCard`
- `Badge`
- `CompactSelect`

### 4. Mock-data layer

Mocked data and lightweight types live under `src/mock-data`.

Current feature modules:

- `src/mock-data/shell`
- `src/mock-data/home`
- `src/mock-data/pool`
- `src/mock-data/amplify`

These modules currently provide:

- typed mock navigation data for the shared shell
- typed hybrid chat foundations for global chats, chat links, mention targets, promoted workspace thread seeds, and shared preferences
- typed mock home screen suggestions
- typed mock Pool workspace state, threads, panel tabs, positions, recommendations, discovery items, activity, and health data
- typed mock Amplify chat content and graph data

### 5. Feature modules

`src/features` is now the product-area layer.

This layer is intended for:

- screen-level composition by product area
- feature-owned components
- product-specific UI that is not generic enough for `src/components/tidal`

Planned feature areas:

- `src/features/shell`
- `src/features/home`
- `src/features/pool`
- `src/features/swap`
- `src/features/amplify`

## Data Flow

The intended prototype data flow is:

Current:

`mock-data/*/mocks` -> `features/*/screens` -> `features/*/components` and `components/tidal`

Styling system:

`src/app/globals.css` -> semantic typography/layout classes -> `components/tidal` and `features/*`

That means:

- mock content should not live directly inside UI component files
- components should receive content via props where practical
- route files should compose screens using feature data instead of embedding it

Examples in the current repo:

- sidebar navigation is sourced from `src/mock-data/shell/mocks/navigation.ts`
- hybrid chat foundations are sourced from `src/mock-data/shell/mocks/hybrid-chat.ts`
- home suggestions are sourced from `src/mock-data/home/mocks/home-screen.ts`
- Amplify messages, suggestions, nodes, and edges are sourced from `src/mock-data/amplify/mocks/workspace.ts`

## Current Feature Breakdown

### Shell

`src/mock-data/shell` contains app-wide prototype definitions that support the shared frame of the application.

Current responsibilities:

- app mode types
- sidebar navigation types
- mocked sidebar navigation content
- global chat, chat-link, mention-target, preference-profile, and workspace-thread typing for the hybrid chat-first model
- mocked global chats, mention targets, promoted workspace thread seeds, and shared preference state

### Home

`src/mock-data/home` currently holds the mocked content for the Home global chat surface.

Current responsibilities:

- home screen content types
- mocked suggestion content

`src/features/home` now owns the global chat-first surface used on `/`.

Current responsibilities:

- client-side global chat workspace state shared by Home and the sidebar
- route-backed active general-chat selection and recent-chat derivation
- Home screen composition for the active global chat
- linked-context rendering for referenced Pools, Amplify workspaces, and nested items
- mention-aware composer state and `@` target selection for Pools, Amplify workspaces, and nested items
- chat submission flow that turns selected mentions into structured `ChatLink` entries on the active global chat
- heuristic inline recommendation cards that suggest creating or opening Pool and Amplify workspaces inside the chat stream
- create/open recommendation actions that add linked workspace context without creating dedicated threads
- explicit promotion controls that turn a general chat with Pool context into a dedicated Pool thread
- explicit promotion controls that turn a general chat with Amplify context into a dedicated Amplify thread
- shared ownership banners on general chats and summary-seed panels on promoted workspace threads
- reusable preference context panel rendering behind the shared global header dialog
- chat-level suggestion and metadata panels around the shared composer

### Pool

`src/mock-data/pool` currently holds the seeded mock content and types for the Pool workspace prototype.

Current responsibilities:

- Pool workspace typing
- Pool thread and thread-context typing
- Pool panel tab typing
- mocked positions, recommendations, discovery items, and activity
- mocked pending actions and Pool health state
- mocked performance chart data

### Pool

`src/features/pool` now owns the first full Pool workspace surface.

Current responsibilities:

- Pool route-level screen composition
- Pool overview as the default `/pool` landing state
- Pool workspace header with an overview tab and chat tabs
- left-side conversation and overview panes
- right-side tabbed Pool panel with holdings, recommendations, discovery, and activity surfaces
- shared client-side Pool workspace state used by both the workspace and the sidebar, including active thread, active panel tab, and pending actions
- promoted Pool thread creation from the global chat system, including source metadata and summary-seeded context
- shared global preference panel mounted on both Pool overview and focused Pool thread surfaces
- sidebar Pool navigation that treats the Pool as a named workspace section with an overview item and flat thread items beneath it

### Amplify Feature

`src/features/amplify` continues to own the strategy workspace and chat surface.

Current responsibilities:

- Amplify route-level workspace composition
- strategy graph and thread-capable chat layout
- promoted Amplify thread creation from the global chat system, including source metadata and summary-seeded context
- sidebar Amplify navigation that treats each strategy workspace as its own section, each with an overview item, while the primary workspace also lists flat thread items
- shared global preference panel mounted on the Amplify chat surface

### Amplify Mock Data

`src/mock-data/amplify` currently holds the mock content and types for the Amplify prototype.

Current responsibilities:

- chat message typing
- Amplify workspace and thread typing
- strategy node typing
- split node typing
- mocked Amplify workspace and thread content
- mocked React Flow nodes and edges

## Component Boundary Rules

These are the current architectural rules for this repo:

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

These components now cover:

- prompt/composer styling
- suggestion row and chip styling
- chat message treatments
- ownership banners for general chat and promotion summary panels for promoted workspace threads
- small workspace actions
- node/panel shells
- small badges and pills
- compact dropdown fields

### Shared product components

Files such as `src/features/shell/components/app-sidebar.tsx` should:

- accept data and state via props where practical
- stay reusable across multiple routes
- avoid owning embedded mock content

### Feature modules

Files under `src/features/*` should:

- group code by product area
- own screen composition for that area
- contain feature-specific components that do not belong in `components/tidal`
- keep the route layer thin
- stay separate from the `mock-data` layer
- keep raw visual values light, and promote repeated styling into `components/tidal` or `src/app/globals.css`

## Styling Conventions

The styling system now lives in `src/app/globals.css`.

That file should own:

- theme tokens and brand colours
- semantic typography classes
- shared layout and spacing helpers
- small shared interaction treatments
- React Flow theme overrides used across the Amplify workspace

The styling split should be:

- `src/app/globals.css`: design tokens and semantic utility classes such as `tidal-text-*`, `tidal-page`, `tidal-workspace`, and sidebar helpers
- `src/components/tidal`: reusable branded components and variants built on those semantic classes
- `src/features/*`: screen composition and light feature-specific layout only

Rules for future work:

- prefer semantic classes from `globals.css` over introducing new arbitrary `text-[...]`, `px-[...]`, and `gap-[...]` values
- if the same visual treatment appears in more than one place, move it into `components/tidal` or a shared semantic class
- keep new screens responsive by default, starting from narrow/mobile layouts and widening deliberately
- avoid creating a separate `src/styles` layer unless the current `globals.css` approach becomes a proven bottleneck
- when Pool and Swap screens are added, build them on the same `globals.css` and `components/tidal` system rather than introducing a parallel styling pattern

Pool now uses this semantic styling layer directly for repeated workspace treatments such as:

- tab buttons and workspace tabs
- primary, secondary, and danger action buttons
- metric/value readouts and change labels
- meta pills and static chips
- contextual panels and subtle inset panels

### Mock-data modules

Files under `src/mock-data/*` should:

- define lightweight frontend-facing types
- provide mocked content for the prototype
- be easy to replace later with integration adapters or real data sources

## Integration Guidance

When this prototype is later integrated into the real app, the intended replacement pattern is:

1. Keep presentational and shared components where they are if they remain useful.
2. Replace `mock-data/*/mocks` with real data adapters, view-model builders, or application state.
3. Preserve the prop boundaries rather than moving business logic back into UI files.
4. Continue to keep generic UI primitives separate from product-specific components.

The main integration goal is to swap data sources and state wiring, not to rewrite the visual layer from scratch.

## Planned Evolution

The architecture is expected to move further in this direction as `docs/codex-plan.md` progresses:

- continue expanding `src/components/tidal` for reusable branded product components
- introduce `src/features` as the product-area structure for Shell, Pool, Swap, and Amplify
- expand `src/mock-data` to include clearer Pool and Swap mock content
- continue centralising semantic typography and layout rules in `src/app/globals.css`
- continue replacing raw feature-level styling values with semantic classes from `globals.css`
- keep `src/app` route files thin
- continue reducing screen-specific Tailwind duplication

## Maintenance Rule

Whenever structural frontend changes are made:

- update this file to reflect the new repo shape
- update `docs/codex-plan.md` to reflect progress against the cleanup plan
