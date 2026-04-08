# Codex Refactor Plan

## Purpose

This document is a reusable frontend refactor playbook.

It is designed to be copied into another project and used as a phased checklist for cleaning up a prototype or fast-moving frontend codebase before deeper feature work continues.

The goal is to move a repo from:

- page-heavy UI assembly
- embedded mock content
- one-off styling
- weak component boundaries

to:

- thin route files
- feature-owned screen composition
- reusable branded design components
- separated mock data
- a central styling system
- a handoff-friendly structure for a later integration developer

## When To Use This

Use this plan when a frontend repo has some or all of these problems:

- route or page files are doing too much
- mock data is embedded directly in components
- visual patterns are repeated inline instead of extracted
- the styling is mostly long one-off class strings
- feature code is spread across unrelated folders
- another developer will later connect real app logic to the UI

Do not use this as a rigid rulebook. Use it as a practical cleanup sequence.

## Outcome

By the end of this refactor, the codebase should:

- be easier to read by feature area
- separate mock content from rendered UI
- have reusable design components for repeated product patterns
- keep styling decisions in a small number of obvious places
- make it easy to replace mocked data with real integrations later

## Target Shape

The ideal frontend structure is usually five layers:

### 1. App routes

Thin route entrypoints only.

These should mainly:

- define URLs
- render feature screens
- avoid large inline UI or embedded mock content

Common location:

- `src/app`

### 2. Generic UI primitives

Low-level reusable building blocks with no product meaning.

Examples:

- `Button`
- `Input`
- `Card`
- `DropdownMenu`
- `Sidebar`

Common location:

- `src/components/ui`

### 3. Shared branded design components

Reusable product-facing components built on top of the primitives.

Examples:

- `PromptComposer`
- `SuggestionAction`
- `SectionLabel`
- `MessageBubble`
- `PanelShell`
- `Badge`

Common location:

- `src/components/<brand>`
- or `src/components/system`

### 4. Feature modules

Product-area-owned UI and screen composition.

Examples:

- `features/home`
- `features/pool`
- `features/swap`
- `features/amplify`
- `features/shell`

Common responsibilities:

- screen composition
- feature-specific components
- feature-local state
- feature-only layout pieces

### 5. Mock-data layer

Mocked content and lightweight frontend-facing types.

This should hold:

- seeded screen content
- fake thread or entity data
- feature-specific mocked scenarios
- lightweight types used to describe that mocked data

Common location:

- `src/mock-data/*`

## Recommended Folder Structure

Adapt this to the target repo as needed:

```text
src/
  app/
  components/
    ui/
    brand/
  features/
    shell/
      components/
      screens/
      providers/
      types/
    home/
      components/
      screens/
      providers/
      types/
    feature-a/
      components/
      screens/
      providers/
      types/
    feature-b/
      components/
      screens/
      providers/
      types/
  mock-data/
    shell/
      mocks/
      types/
    home/
      mocks/
      types/
    feature-a/
      mocks/
      types/
    feature-b/
      mocks/
      types/
  hooks/
  lib/
```

Notes:

- `ui/` stays generic
- `brand/` or equivalent holds shared branded product components
- `features/` owns product-area UI
- `mock-data/` owns fake content
- `lib/` should stay for generic helpers, not feature mock content

## Boundary Rules

### Route files

Route files should:

- stay thin
- render feature screens
- avoid owning lots of layout or mock content

### Feature screens

Feature screens should:

- assemble the page
- connect mock data to presentational components
- own light feature state where needed
- remain readable as composition files

### Feature-specific components

Feature components should:

- only exist if they belong to one product area
- avoid embedded mock data
- avoid pretending to be globally reusable if they are not

### Shared branded components

Shared branded components should:

- encode repeated visual patterns
- accept data via props
- stay reusable across multiple features
- reduce repeated styling in feature files

### Mock data

Mock data should:

- live outside UI files
- be typed
- be grouped by feature
- be easy to replace later with real data sources

### Generic helpers

`lib/` should contain:

- formatters
- utility functions
- generic helpers

It should not become a dumping ground for product-specific mock content.

## Styling Direction

The styling cleanup should focus on systemising the current UI, not redesigning the whole product by default.

### Good default direction

- keep one obvious styling-system home
- define semantic text styles
- define shared layout helpers
- define repeated surface and action treatments
- reduce arbitrary one-off values in feature files
- keep component-specific structure with components, not in one giant stylesheet

### If the repo already has a global stylesheet

Use that as the styling-system home.

It should own:

- tokens
- semantic typography
- semantic spacing/layout helpers
- shared interaction treatments
- small reusable utility classes

### Avoid

- creating a parallel styling system unless clearly needed
- moving every component’s full styling into one giant CSS file
- allowing feature files to accumulate large blocks of repeated one-off styles

## Phased Tracker

### Phase 0: Assessment

Status: Not started

#### Goal

Understand how the current repo actually works before moving files around.

#### Tasks

- [ ] inspect the current route structure
- [ ] identify where mock data currently lives
- [ ] identify repeated branded UI patterns
- [ ] identify the current styling-system entrypoint
- [ ] identify lint, typecheck, or build hygiene issues

#### Deliverable

- [ ] a clear repo assessment exists before the refactor begins

### Phase 1: Hygiene And Boundaries

Status: Not started

#### Goal

Fix the basic issues that make deeper refactoring harder.

#### Tasks

- [ ] fix lint failures
- [ ] fix obvious route or import problems
- [ ] replace broken or ad hoc navigation patterns
- [ ] replace default scaffold docs with project-specific docs if needed
- [ ] document the intended architecture at a high level

#### Deliverable

- [ ] the repo has a clean baseline for structural work

### Phase 2: Shared Design Component Layer

Status: Not started

#### Goal

Extract repeated branded UI patterns into reusable shared components.

#### Tasks

- [ ] identify repeated branded visual patterns
- [ ] create a shared branded component layer
- [ ] move repeated prompt, badge, chip, panel, or message treatments into that layer
- [ ] replace repeated inline UI blocks with those shared components
- [ ] keep generic primitives separate from branded design components

#### Deliverable

- [ ] repeated visual language is encoded as shared components instead of copied inline

### Phase 3: Feature Module Refactor

Status: Not started

#### Goal

Group UI by product area and keep routes thin.

#### Tasks

- [ ] create a `features/*` structure or equivalent product-area grouping
- [ ] move screen composition into feature screens
- [ ] move feature-specific components under their owning feature
- [ ] leave only route entrypoints in `app/`
- [ ] make product ownership obvious from the folder structure

#### Deliverable

- [ ] the codebase is organised by feature area rather than by historical accident

### Phase 4: Mock-Data Separation

Status: Not started

#### Goal

Move mocked content out of UI files and into a dedicated mock-data layer.

#### Tasks

- [ ] create `mock-data/*` or an equivalent layer
- [ ] move inline mock content out of pages and components
- [ ] add lightweight types for important mocked entities
- [ ] make screens consume mocked content through imports and props
- [ ] keep generic helpers separate from feature mock content

#### Deliverable

- [ ] mock content is separated cleanly from UI rendering

### Phase 5: Styling System Cleanup

Status: Not started

#### Goal

Make the styling consistent, reusable, and easier to extend.

#### Tasks

- [ ] centralise styling decisions in one clear styling-system home
- [ ] define semantic typography and layout helpers
- [ ] extract repeated tab, button, panel, card, and pill treatments
- [ ] reduce arbitrary one-off values in feature files
- [ ] improve responsiveness on key screens
- [ ] document the styling conventions

#### Deliverable

- [ ] the product feels visually consistent and future work has a clear styling baseline

### Phase 6: Feature-Specific Execution Plans

Status: Not started

#### Goal

Use the cleaned-up structure to implement features with focused plans.

#### Tasks

- [ ] create feature-specific plans where needed
- [ ] define feature-owned types and mocked state
- [ ] build new features on top of the established structure
- [ ] keep architecture docs updated as features expand

#### Deliverable

- [ ] new feature work uses the cleaned-up structure instead of bypassing it

## Suggested Docs To Add

For most repos, this cleanup is easier to sustain if these docs exist:

- `docs/architecture.md`
  A high-level explanation of how the repo is structured.
- `docs/codex-plan.md`
  A repo-wide cleanup tracker.
- `docs/codex-<feature>-plan.md`
  A focused implementation tracker for a substantial feature.

## Success Criteria

Mark this refactor complete when:

- [ ] route files are thin
- [ ] product-area code is grouped clearly
- [ ] mocked content is not embedded directly in UI components
- [ ] shared branded patterns exist as reusable components
- [ ] styling decisions live in one obvious place
- [ ] major screens are readable as composition, not class-string soup
- [ ] architecture docs reflect the current structure
- [ ] another developer could integrate the real app logic without first untangling the frontend

## Notes For Reuse

When moving this file into another project:

- rename folders and product areas to match that repo
- update the recommended structure to fit the existing framework
- remove phases that are not relevant
- add project-specific constraints at the top

This file is meant to be adapted, not followed blindly.
