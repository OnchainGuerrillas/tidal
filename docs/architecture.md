# Architecture

## Purpose

This repo is a prototype frontend for Tidal. It exists to explore product flows, visual patterns, and interaction structure before those interfaces are connected to the real application.

It is not the production app and should not contain real data integrations, wallet connections, or blockchain execution.

## Core Constraints

- All data is mocked
- No external API calls
- No Solana or wallet integration
- Frontend structure should stay integration-friendly for a later handoff

## Current Shape

After Phase 1 of the frontend cleanup plan, the repo is organised around three broad layers:

### 1. App routes

Thin route files in `src/app` assemble screens and pass mocked data into components.

Current routes:

- `src/app/page.tsx`: home / landing prompt experience
- `src/app/amplify/page.tsx`: Amplify workspace prototype
- `src/app/layout.tsx`: shared shell, sidebar provider, tooltip provider

### 2. Shared UI components

Generic reusable primitives live in `src/components/ui`.

These components should remain product-agnostic and focused on rendering and interaction primitives rather than Tidal-specific meaning.

Examples:

- buttons
- inputs
- cards
- dropdown menus
- sidebar primitives

### 3. Feature-level mocks and types

Mocked data and lightweight feature types live under `src/features`.

Current feature modules:

- `src/features/shell`
- `src/features/home`
- `src/features/amplify`

These modules currently provide:

- typed mock navigation data for the shared shell
- typed mock home screen suggestions
- typed mock Amplify chat content and graph data

## Data Flow

The intended prototype data flow is:

`features/*/mocks` -> route/container -> presentational component

That means:

- mock content should not live directly inside UI component files
- components should receive content via props where practical
- route files should compose screens using feature data instead of embedding it

Examples in the current repo:

- sidebar navigation is sourced from `src/features/shell/mocks/navigation.ts`
- home suggestions are sourced from `src/features/home/mocks/home-screen.ts`
- Amplify messages, suggestions, nodes, and edges are sourced from `src/features/amplify/mocks/workspace.ts`

## Current Feature Breakdown

### Shell

`src/features/shell` contains app-wide prototype definitions that support the shared frame of the application.

Current responsibilities:

- app mode types
- sidebar navigation types
- mocked sidebar navigation content

### Home

`src/features/home` currently holds the mocked content for the landing prompt screen.

Current responsibilities:

- home screen content types
- mocked suggestion content

### Amplify

`src/features/amplify` currently holds the mock content and types for the Amplify prototype.

Current responsibilities:

- chat message typing
- strategy node typing
- split node typing
- mocked chat content
- mocked React Flow nodes and edges

## Component Boundary Rules

These are the current architectural rules for this repo:

### UI primitives

Files under `src/components/ui` should:

- remain generic
- avoid feature-specific mock content
- avoid Tidal-specific data assumptions

### Shared product components

Files such as `src/components/app-sidebar.tsx` and `src/components/chat-input.tsx` should:

- accept data and state via props where practical
- stay reusable across multiple routes
- avoid owning embedded mock content

### Feature mocks and types

Files under `src/features/*` should:

- define lightweight frontend-facing types
- provide mocked content for the prototype
- be easy to replace later with integration adapters or real data sources

## Integration Guidance

When this prototype is later integrated into the real app, the intended replacement pattern is:

1. Keep presentational and shared components where they are if they remain useful.
2. Replace `features/*/mocks` with real data adapters, view-model builders, or application state.
3. Preserve the prop boundaries rather than moving business logic back into UI files.
4. Continue to keep generic UI primitives separate from product-specific components.

The main integration goal is to swap data sources and state wiring, not to rewrite the visual layer from scratch.

## Planned Evolution

The architecture is expected to move further in this direction as `docs/codex-plan.md` progresses:

- introduce `src/components/tidal` for reusable branded product components
- expand `src/features` to include clearer Pool and Swap modules
- keep `src/app` route files thin
- continue reducing screen-specific Tailwind duplication

## Maintenance Rule

Whenever structural frontend changes are made:

- update this file to reflect the new repo shape
- update `docs/codex-plan.md` to reflect progress against the cleanup plan
