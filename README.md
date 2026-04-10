# Tidal Prototype

Frontend and design experimentation repo for Tidal, a Solana DeFi product concept.

This repo is intentionally prototype-only. It is used to explore interface patterns, screen flows, and visual structure before another developer connects the work into the real application.

## Constraints

- No external API calls
- No blockchain connections
- No real wallet integrations
- All data must be mocked

## Product Surfaces

- Tidal Pool: conversational investing and pool-building flows
- Tidal Amplify: node-based strategy composition flows
- Tidal Swap: planned, but not currently being built out in this prototype phase

## What This Repo Is

This is not the production app.

The current goal of the repo is to:

- prototype the frontend and interaction model
- keep all data mocked
- separate feature UI from mock content
- make the work easy for another developer to integrate into the real application later

That means the codebase is intentionally structured around:

- thin route files
- feature-owned screens and components
- shared Tidal design components
- a separate mock-data layer
- a central styling system in `src/app/globals.css`

## Runtime

This repo uses Bun.

Common commands:

```bash
bun install
bun run dev
bun run lint
bun run build
```

## High-Level Structure

The repo is organised around a few clear layers:

### `src/app`

Thin Next.js route entrypoints only.

Routes should mostly render feature screens rather than contain large amounts of inline UI or mocked content.

Current routes:

- `src/app/page.tsx`: Home global chat workspace
- `src/app/chat/[chatId]/page.tsx`: route-backed global chat pages
- `src/app/pool/page.tsx`: Pool workspace prototype
- `src/app/amplify/page.tsx`: redirector to the active Amplify workspace URL
- `src/app/amplify/[workspaceId]/page.tsx`: addressable Amplify workspace route
- `src/app/layout.tsx`: shared shell and providers

### `src/features`

Product-area UI and screen composition.

This is where feature-owned code should live when it only makes sense for one part of the product.

Current feature areas:

- `src/features/shell`: shared app frame and sidebar behavior
- `src/features/home`: global chat-first Home screen composition and state
- `src/features/pool`: Pool workspace screens, components, and state
- `src/features/amplify`: Amplify workspace screens, components, canvas hooks, and feature-local helpers
- `src/features/swap`: reserved for future Swap work, not currently included

### `src/mock-data`

Mocked content and lightweight frontend-facing types.

This layer exists so mocked state does not get embedded directly into UI components.

Current mock-data areas:

- `src/mock-data/shell`
- `src/mock-data/home`
- `src/mock-data/pool`
- `src/mock-data/amplify`

Amplify mock data is now split further into:

- `src/mock-data/amplify/mocks/catalog.ts`: picker catalog definitions and compatibility-facing catalog metadata
- `src/mock-data/amplify/mocks/node-factories.ts`: node creation helpers for builder flows
- `src/mock-data/amplify/mocks/builder-workspace.ts`: blank builder workspace seeding
- `src/mock-data/amplify/mocks/example-workspace.ts`: seeded example strategy workspace
- `src/mock-data/amplify/mocks/workspace.ts`: small re-export surface for the rest of the app

### `src/components/ui`

Generic reusable primitives.

These should stay product-agnostic. If a component is just a button, input, card, dropdown, or similar primitive, it belongs here.

### `src/components/tidal`

Shared branded Tidal components.

This layer sits between generic primitives and feature-specific UI.

Examples:

- `PromptComposer`
- `SuggestionAction`
- `SectionLabel`
- `ChatMessage`
- `SurfaceCard`
- `Badge`

### `src/app/globals.css`

The styling system home.

This file owns:

- theme tokens
- semantic typography classes
- shared layout helpers
- shared button/tab/pill treatments
- small reusable interface patterns

The intention is to avoid scattering arbitrary one-off Tailwind values across feature files when a shared semantic class would do.

## Data And UI Flow

The intended frontend flow is:

`src/mock-data/*` -> `src/features/*/screens` -> `src/features/*/components` and `src/components/tidal`

In practice that means:

- mocked content should live in `src/mock-data`, not directly inside UI files
- routes in `src/app` should stay thin
- feature screens should assemble the page
- shared Tidal components should own repeated visual patterns

## Current Prototype Capabilities

The prototype currently focuses on the shared shell plus Home, Pool, and Amplify.

- Home: global chat-first entry flow with route-backed chats, linked context, `@` mentions, inline recommendation cards, and a direct CTA to create a new blank Amplify workspace
- Pool: overview state, dedicated Pool threads, promoted threads from global chat, and a right-hand workspace panel for positions, recommendations, discovery, and activity
- Amplify: multi-workspace strategy surface with addressable workspace URLs, a blank builder workspace, a seeded example loop, structured node creation, inline node editing, mocked run states, and fullscreen canvas focus mode
- Shared shell: global top header with risk and investment-type controls, plus sidebar navigation across Home, Pool, and Amplify

Swap is intentionally not included in the current implementation pass. The repo still preserves space for it structurally, but the active prototype work is centered on Home, Pool, and Amplify.

## Current Pool Example

The Pool workspace is the clearest example of how the repo is intended to work.

- `src/app/pool/page.tsx` is just the route
- `src/features/pool/screens` owns Pool screen composition
- `src/features/pool/components` owns Pool-only UI
- `src/features/pool/providers` owns shared client-side Pool workspace state
- `src/mock-data/pool` owns seeded Pool content and types

So if another developer needs to integrate Pool into the real app later, the main job should be replacing the mocked Pool state and data sources rather than untangling the UI structure first.

## Current Amplify Example

Amplify is now structured in the same spirit:

- `src/app/amplify/[workspaceId]/page.tsx` is the addressable route
- `src/features/amplify/screens` owns workspace-level composition
- `src/features/amplify/hooks` owns the main canvas graph state and interaction logic
- `src/features/amplify/components` owns node cards, picker UI, and Amplify-only presentational pieces
- `src/mock-data/amplify` owns the seeded builder/example workspaces, node catalog, and node factory helpers

That means future integration work can replace mocked Amplify state and execution behavior without first unpicking the UI and route structure.

## Docs

- `docs/product-vision.md`
- `docs/product-strategy.md`
- `docs/codex-plan.md`
- `docs/architecture.md`
- `docs/codex-pool-plan.md`
- `docs/amplify-nodes.md`

## Working Rules

- All data remains mocked in this repo
- No external API calls
- No wallet integration
- No Solana execution
- Use Bun for all commands
- Keep `docs/architecture.md` updated when structural frontend changes are made

## Frontend Direction

- business logic and mock data stay separate from visual components
- shared UI primitives remain generic
- Tidal-specific design patterns become reusable
- feature code is grouped by product area
- styling decisions are centralised in `globals.css`
- the prototype stays easy to hand off for later integration
