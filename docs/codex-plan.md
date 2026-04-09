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

The frontend should be structured in four layers:

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

### 3. Mock data containers

Prototype data grouped by product area, plus the lightweight types that describe it.

Examples:

- Pool screen composition
- Swap screen composition
- Amplify graph screen composition
- mocked recommendations
- mocked chat transcripts
- mocked strategy graph data

Location:

- `src/mock-data/pool`
- `src/mock-data/swap`
- `src/mock-data/amplify`

### 4. Feature modules

Product-area-owned UI, screen assembly, and feature-specific composition.

Examples:

- Pool screens and Pool-specific components
- Swap screens and Swap-specific components
- Amplify screens and Amplify-specific components
- Shell-level app frame components

Location:

- `src/features/shell`
- `src/features/home`
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
    shell/
      components/
      screens/
      types/
    home/
      components/
      screens/
      types/
    pool/
      components/
      screens/
      types/
    swap/
      components/
      screens/
      types/
    amplify/
      components/
      screens/
      types/
  mock-data/
    shell/
      mocks/
      types/
    home/
      mocks/
      types/
    pool/
      mocks/
      types/
    swap/
      mocks/
      types/
    amplify/
      mocks/
      types/
  hooks/
  lib/
```

Notes:

- `ui/` stays generic and reusable across any app
- `tidal/` holds shared branded patterns that represent the design system of this product
- `mock-data/` owns prototype content grouped by product area
- `features/` owns product-area UI, screens, and feature-specific composition
- `src/app/globals.css` is the central home for theme tokens, semantic typography, layout helpers, and shared React Flow styling

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
- translate mock data into presentational props
- remain easy to replace later when real integration happens

Examples:

- home screen container
- amplify workspace container
- pool recommendation screen container

### Feature modules

Feature modules should:

- group UI by product area
- own screen-level composition for that area
- contain feature-specific components that are not generic enough for `components/tidal`
- keep product-area responsibilities easy to find

Examples:

- `features/amplify/screens/AmplifyWorkspace`
- `features/amplify/components/*`
- `features/shell/components/AppSidebar`

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

- keep the styling system centred in `src/app/globals.css`
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

- [x] `src/components/tidal/prompt-composer.tsx`
- [x] `src/features/shell/components/app-sidebar.tsx`
- [x] `src/features/amplify/components/amplify-chat.tsx`
- [x] `src/features/amplify/components/strategy-node.tsx`
- [x] `src/features/amplify/components/split-node.tsx`

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

Status: Complete

#### Goal

Create a reusable branded design component layer.

#### Tasks

- [x] add `src/components/tidal`
- [x] extract repeated patterns from screens into branded components
- [x] unify repeated elements such as composer shells, suggestion rows, panel headers, badges, and message treatments
- [x] use `cva` for variants where repeated combinations exist

#### Deliverables

- [x] pages compose branded components instead of raw Tailwind blocks
- [x] the visual language becomes explicit and reusable

### Phase 3: Feature Module Refactor

Status: Complete

#### Goal

Move from page-centric implementation to a real product-area feature structure.

#### Tasks

- [x] create `features/shell`, `features/home`, `features/pool`, `features/swap`, and `features/amplify`
- [x] move product-specific screens and feature-owned components into those folders
- [x] keep `mock-data/*` as the separate prototype content layer
- [x] define clear ownership between `components/tidal` and `features/*/components`
- [x] keep `app/` routes very thin
- [x] isolate product-area composition from visual rendering

#### Deliverables

- [x] each product area has a clear home in the repo
- [x] another developer can find Pool, Swap, Amplify, Home, and Shell code without hunting across unrelated folders
- [x] routes mostly render feature screens rather than building UI inline

### Phase 4: Styling System Cleanup

Status: Complete for current prototype surfaces

#### Goal

Turn the current visual direction into a defined system.

#### Tasks

- [x] formalise typography classes or reusable recipes
- [x] standardise layout shells and panel spacing
- [x] reduce arbitrary widths and page-specific measurements where possible
- [x] improve mobile and narrow viewport behaviour
- [x] document component usage conventions

#### Deliverables

- [x] consistent styling patterns across Home and Amplify have improved materially
- [x] a documented styling baseline now exists for future Pool and Swap screens
- [x] less visual drift as more screens are added

### Suggested Next Moves

- [x] Introduce `src/components/tidal` and move shared branded patterns there.
- [x] Start extracting repeated layout and message patterns from the home and Amplify screens.
- [x] Introduce `src/features/shell`, `src/features/home`, and `src/features/amplify` as the first real feature modules.
- [x] Move the current home screen and Amplify workspace composition into those feature folders.
- [x] Move feature-owned components out of `src/components/amplify` into `src/features/amplify/components`.
- [x] Keep thinning `app/` routes so they mostly render feature screens.
- [x] Add initial `features/pool` and `features/swap` folders so the repo shape reflects the intended product.
- [x] Seed the shared shell mock-data layer with hybrid chat foundations for global chats, links, mention targets, promoted workspace threads, and global preference state.
- [x] Turn Home into a real global chat workspace and wire the shared sidebar to active global chat state and linked-context metadata.
- [x] Extend the shared global chat flow with a mention-aware composer and route-backed chat updates that resolve `@` selections into structured links.
- [x] Lift risk appetite and investment interests into a shared preference-profile provider and reusable context panel used across Home, Pool, and Amplify.
- [x] Add inline AI recommendation cards that steer general chat into Pool or Amplify context without silently creating dedicated threads.
- [x] Add explicit promotion from general chat into dedicated Pool threads using summary-seeded mock state rather than transcript copies.
- [x] Extend Amplify into a thread-capable workspace and add explicit promotion from general chat into dedicated Amplify threads.
- [x] Standardise ownership and promotion UI across Home, Pool, and Amplify with shared banners, summary panels, and promotion cards.
- [ ] Decide the first real Pool and Swap screens to add under the new feature structure.
- [x] Continue replacing raw text sizes and page spacing values with the new semantic classes in `globals.css`.
- [x] Decide the intentional mobile layout behaviour for Amplify.
- [x] Document the semantic styling conventions now living in `globals.css`.

### Success Criteria

- [x] page files are thin and mostly declarative
- [x] mock data is not embedded in UI component files
- [x] shared branded components exist for repeated Tidal patterns
- [x] product-area UI lives in `features/*` rather than in mixed top-level component folders
- [x] styling decisions are encoded in reusable components and variants
- [x] another developer can connect real logic without rewriting the visual layer
- [x] the repo remains lightweight and prototype-friendly

### Non-Goals

- [ ] build real backend or blockchain integrations
- [ ] add production-grade business logic
- [ ] over-engineer a full enterprise design system
- [ ] eliminate all local prototype state

The target is a clean, handoff-friendly prototype frontend, not a production app.
