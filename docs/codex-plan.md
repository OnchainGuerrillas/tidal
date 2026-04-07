# Codex Plan

## Objective

Restructure the frontend so that:

- visual styling is reusable and consistent
- mocked state and view logic are separated from presentational components
- feature experimentation can continue without turning page files into one-off UI builds
- another developer can later connect the real app logic without having to untangle styling and screen composition first

This repo remains a prototype repo. No external integrations, wallet logic, blockchain calls, or real data plumbing should be introduced here.

## Current Assessment

The repo is in a workable prototype state, but the frontend is still organised more like a design spike than a clean handoff layer.

What is already good:

- a small codebase that is still easy to refactor
- a shared primitive UI layer under `src/components/ui`
- a theme and brand token base in `src/app/globals.css`
- early separation between generic UI and Amplify-specific UI

What currently needs work:

- page files own too much UI composition, mock content, and styling
- feature data is embedded directly in components
- branded Tidal patterns are not yet captured as reusable design components
- screen styling relies heavily on long inline Tailwind strings
- visual consistency exists at the color level more than at the component/system level
- some basic hygiene issues remain, such as lint failures and default scaffold docs

## Target Shape

The frontend should be structured in three layers:

### 1. Generic UI primitives

Reusable low-level building blocks with no product meaning.

Examples:

- `Button`
- `Input`
- `Card`
- `DropdownMenu`
- `Sidebar`

Location:

- `src/components/ui`

### 2. Tidal design components

Reusable branded product-facing building blocks built on top of the primitives.

Examples:

- `PromptComposer`
- `SuggestionChip`
- `SectionHeader`
- `WorkspaceButton`
- `ProtocolBadge`
- `StrategyNodeCard`
- `ChatMessageBubble`
- `ModeSelect`

Location:

- `src/components/tidal`

### 3. Feature containers

Feature-specific composition, mocked data wiring, local experimentation state, and view-model shaping.

Examples:

- Pool screen composition
- Swap screen composition
- Amplify graph screen composition
- mocked recommendations
- mocked chat transcripts
- mocked strategy graph data

Location:

- `src/features/pool`
- `src/features/swap`
- `src/features/amplify`

## Recommended Folder Structure

```text
src/
  app/
  components/
    ui/
    tidal/
  features/
    pool/
      components/
      mocks/
      types/
      view-models/
    swap/
      components/
      mocks/
      types/
      view-models/
    amplify/
      components/
      mocks/
      types/
      view-models/
  hooks/
  lib/
  styles/
```

Notes:

- `ui/` stays generic and reusable across any app
- `tidal/` holds shared branded patterns that represent the design system of this product
- `features/` owns mocked feature content and screen-level assembly
- `styles/` can hold future token definitions, component recipes, or layout utilities if needed

## Component Boundary Rules

These rules should guide the cleanup:

### Presentational components

Presentational components should:

- receive data via props
- render UI only
- avoid owning feature-specific mock data
- avoid direct knowledge of routes, data sources, or execution logic
- encapsulate repeated styling patterns

Examples:

- a chat composer
- a protocol card
- a strategy node shell
- a suggestion chip row

### Container components

Container components should:

- assemble screens
- import mock data
- hold temporary prototype state
- translate feature data into presentational props
- remain easy to replace later when real integration happens

Examples:

- home screen container
- amplify workspace container
- pool recommendation screen container

### Mock data modules

Mock data should:

- live outside UI component files
- be typed
- be grouped by feature
- be easy to swap out later with real app data

## Styling Direction

The styling work should focus on systemising the current look rather than redesigning the product from scratch.

### Keep

- current Tidal palette and dark visual direction
- Tailwind + token approach
- existing generic primitive layer

### Improve

- define semantic typography styles
- define consistent spacing and panel rules
- define reusable component variants with `cva`
- reduce long one-off class strings in page files
- make branded patterns reusable instead of copy-pasted
- improve responsive behaviour on the main layouts

### Suggested design tokens to formalise

- typography: `display`, `heading`, `title`, `body`, `caption`, `label`
- surfaces: `page`, `panel`, `card`, `elevated-card`, `interactive-card`
- spacing: shared section gaps and panel paddings
- borders: panel, muted, active, emphasis
- radii: input, card, pill, modal
- motion: standard transitions for hover, menu open, panel collapse

## Tracker

### Immediate Refactor Targets

#### Route files

- [x] `src/app/page.tsx`
- [x] `src/app/amplify/page.tsx`
- [x] `src/app/layout.tsx`

#### Shared product components

- [x] `src/components/chat-input.tsx`
- [x] `src/components/app-sidebar.tsx`
- [x] `src/components/amplify/amplify-chat.tsx`
- [x] `src/components/amplify/strategy-node.tsx`
- [x] `src/components/amplify/split-node.tsx`

#### Styling foundation

- [ ] `src/app/globals.css`

### Phase 1: Hygiene And Boundaries

Status: Complete

#### Goal

Stabilise the repo and reduce obvious coupling.

#### Tasks

- [x] fix lint issues
- [x] replace raw anchor navigation with Next `Link`
- [x] replace the default `README.md` with repo-specific instructions
- [x] move hardcoded mock arrays out of route/component files
- [x] define initial feature `types` and `mocks` modules
- [x] make existing interactive components prop-driven where practical

#### Deliverables

- [x] the repo is clean, lintable, and easier to read
- [x] mock content is no longer embedded throughout UI files

### Phase 2: Tidal Component Layer

Status: Not started

#### Goal

Create a reusable branded design component layer.

#### Tasks

- [ ] add `src/components/tidal`
- [ ] extract repeated patterns from screens into branded components
- [ ] unify repeated elements such as composer shells, suggestion rows, panel headers, badges, and message treatments
- [ ] use `cva` for variants where repeated combinations exist

#### Deliverables

- [ ] pages compose branded components instead of raw Tailwind blocks
- [ ] the visual language becomes explicit and reusable

### Phase 3: Feature Module Refactor

Status: In progress

#### Goal

Move from page-centric implementation to feature-centric composition.

#### Tasks

- [ ] create `features/pool`, `features/swap`, and `features/amplify`
- [ ] move feature-specific components, mocks, and types into those folders
- [ ] keep `app/` routes very thin
- [ ] isolate feature view-model shaping from visual rendering

#### Deliverables

- [ ] feature code is easier to hand off and easier to replace with real integration later

### Phase 4: Styling System Cleanup

Status: Not started

#### Goal

Turn the current visual direction into a defined system.

#### Tasks

- [ ] formalise typography classes or reusable recipes
- [ ] standardise layout shells and panel spacing
- [ ] reduce arbitrary widths and page-specific measurements where possible
- [ ] improve mobile and narrow viewport behaviour
- [ ] document component usage conventions

#### Deliverables

- [ ] consistent styling patterns across Pool, Swap, and Amplify
- [ ] less visual drift as more screens are added

### Suggested Next Moves

- [ ] Introduce `src/components/tidal` and move shared branded patterns there.
- [ ] Start extracting repeated layout and message patterns from the home and Amplify screens.
- [ ] Keep thinning `app/` routes so they mostly render feature containers.
- [ ] Expand the feature structure to cover Pool and Swap explicitly.

### Success Criteria

- [ ] page files are thin and mostly declarative
- [ ] mock data is not embedded in UI component files
- [ ] shared branded components exist for repeated Tidal patterns
- [ ] styling decisions are encoded in reusable components and variants
- [ ] another developer can connect real logic without rewriting the visual layer
- [ ] the repo remains lightweight and prototype-friendly

### Non-Goals

- [ ] build real backend or blockchain integrations
- [ ] add production-grade business logic
- [ ] over-engineer a full enterprise design system
- [ ] eliminate all local prototype state

The target is a clean, handoff-friendly prototype frontend, not a production app.
