# Hybrid Chat Feature

## Purpose

This document is the implementation tracker for bringing the hybrid chat-first model into the Tidal prototype.

It should be used as a checklist that can be updated over time as work lands across Home, Pool, Amplify, the shared sidebar, and the shared chat system.

Important framing:

- this is a frontend prototype tracker, not a backend architecture spec
- all data remains mocked
- no external APIs, wallet connections, or blockchain execution should be introduced
- [chat-functionality-plan.md](./chat-functionality-plan.md) remains the source of truth for the product model

## Locked Product Decisions

These decisions are assumed and should not be re-opened unless the product direction changes materially.

- [x] users start from a global chat-first system
- [x] general chats exist independently from Pool and Amplify workspaces
- [x] dedicated workspace threads belong to exactly one Pool or one Amplify workspace
- [x] general chats can reference multiple linked entities over time
- [x] v1 supports `@` mentions only, not `/`
- [x] `@` supports both top-level workspaces and nested investment items
- [x] risk appetite and investment interests are global user preferences in v1
- [x] preferences appear in a reusable chat context panel
- [x] AI can insert an inline recommendation card when Pool or Amplify intent is detected but no workspace exists yet
- [x] promotion from a general chat into a workspace thread uses an AI-generated summary, not a transcript copy

## Shared Vocabulary

These concepts should guide implementation naming and ownership.

- [x] `GlobalChat` means a general chat entry shown in the global sidebar list
- [x] `WorkspaceThread` means a focused thread owned by one Pool or one Amplify workspace
- [x] `ChatLink` means a lightweight reference from a global chat to a workspace or nested investment item
- [x] `MentionTarget` means a mentionable entity returned by the `@` picker
- [x] `PreferenceProfile` means global user preference state for risk appetite and investment interests
- [x] `CreateWorkspaceActionCard` means an inline in-chat action card for creating or opening a Pool or Amplify
- [x] `PromotionSource` means source metadata and summary used when creating a dedicated workspace thread from a global chat
- [x] global chat links are references, not ownership
- [x] nested item mentions can exist inside a global chat without creating a workspace thread
- [x] dedicated workspace threads remain single-workspace
- [x] promotion creates a single-workspace thread and records the summary source

## Phase Tracker

### Phase 1: Shared Data Model And Mock State

Status: Complete

#### Goal

Create the shared mock-data and type foundation for the hybrid chat system.

#### Tasks

- [x] introduce mock-data concepts for general chats, chat links, mention targets, global preference profile, inline action cards, and promotion metadata
- [x] expand shell or home mock data so the app can render a real global chat list instead of only static sidebar chat items
- [x] add typed mention target definitions across Pool and Amplify, including nested investment items
- [x] keep Pool and Amplify workspaces independent from the chat model

#### Deliverable

- [x] mocked data can describe a general chat with zero, one, or many links
- [x] mocked data can describe a dedicated workspace thread with promotion metadata
- [x] mocked data can describe a reusable global preference profile
- [x] mocked data can describe mention targets for both workspace-level and nested-item references

### Phase 2: Global Chat Workspace And Sidebar

Status: Complete

#### Goal

Make the global chat-first system a real visible product surface.

#### Tasks

- [x] turn Home into a real global chat workspace rather than only a landing prompt
- [x] update the sidebar to show a global Chats section
- [x] render general chat entries with visible linked tags or metadata
- [x] keep Pool and Amplify workspaces as independent sidebar sections
- [x] keep dedicated workspace threads nested under their owning Pool or Amplify
- [x] avoid duplicating promoted workspace threads into the global chat list in v1

#### Deliverable

- [x] the app can switch between global chats, Pools, and Amplify workspaces
- [x] general chats visibly show linked Pool / Amplify / item tags
- [x] Pool and Amplify remain separate navigation systems rather than being collapsed into chat

### Phase 3: Composer Mentions And Context Resolution

Status: Complete

#### Goal

Extend the composer to support structured `@` mentions.

#### Tasks

- [x] extend `PromptComposer` into a mention-aware composer
- [x] detect `@` and open a searchable mention picker
- [x] support Pools as mention targets
- [x] support Amplify workspaces as mention targets
- [x] support Pool positions as mention targets
- [x] support Pool recommendations as mention targets
- [x] support Pool discovery items as mention targets
- [x] support Amplify strategy items or nodes as mention targets
- [x] insert selected mentions as structured references in composer state
- [x] resolve selected mentions into `ChatLink` data when the message is sent
- [x] explicitly keep `/` commands out of v1

#### Deliverable

- [x] typing `@` opens a searchable picker
- [x] the picker returns both workspaces and nested items
- [x] selected mentions resolve into structured chat links, not only inline text labels

### Phase 4: Global Preference Context Panel

Status: Complete

#### Goal

Bring risk appetite and investment interests into the hybrid chat model as reusable context.

#### Tasks

- [x] extract the risk appetite controls from the Pool overview pattern into a reusable chat context panel
- [x] extract the investment interest controls from the Pool overview pattern into the same reusable panel
- [x] mount that panel on global chat surfaces
- [x] mount that panel on dedicated workspace thread surfaces where appropriate
- [x] treat the values as global user preferences in v1
- [x] keep the panel visually distinct from linked entity context
- [x] make it clear that these are standing user preferences, not chat ownership or workspace links

#### Deliverable

- [x] the same context panel works across Home, Pool-related chat surfaces, and Amplify-related chat surfaces
- [x] selected risk and investment-interest values persist consistently across surfaces
- [x] the panel does not require a Pool to exist

### Phase 5: Inline AI Recommendation Cards For Pool And Amplify

Status: Complete

#### Goal

Give the chat system a clear way to move users into the correct workspace without silently doing work for them.

#### Tasks

- [x] add an inline in-chat action card pattern for AI workspace recommendations
- [x] support a create new Pool card state
- [x] support an open existing Pool card state
- [x] support a create new Amplify card state
- [x] support an open existing Amplify card state
- [x] explain in the card why Tidal thinks Pool or Amplify is the right next surface
- [x] make create/open actions add a link immediately
- [x] avoid automatically promoting a general chat into a dedicated workspace thread unless the user chooses focused follow-up work

#### Deliverable

- [x] a general chat can surface a create/open Pool card
- [x] a general chat can surface a create/open Amplify card
- [x] create/open actions do not silently create dedicated workspace threads

### Phase 6: Promotion Into Dedicated Pool Threads

Status: Complete

#### Goal

Connect the global chat model to the existing Pool workspace model.

#### Tasks

- [x] adapt the existing Pool thread model so it can accept promoted threads from the global chat system
- [x] preserve the Pool overview as non-thread state
- [x] preserve the existing focused research thread behavior inside Pool
- [x] preserve that dedicated Pool threads belong to one Pool
- [x] add a promotion flow from general chat into a Pool thread using a summary seed
- [x] preserve the difference between context-only Pool references and dedicated Pool threads

#### Deliverable

- [x] a user can reference a Pool in a general chat without creating a Pool thread
- [x] a user can promote relevant context into a dedicated Pool thread
- [x] the resulting Pool thread starts from a summary seed, not a transcript copy

### Phase 7: Amplify Threading And Promotion

Status: Complete

#### Goal

Bring Amplify up to the same dedicated-thread model as Pool while preserving its strategy workspace identity.

#### Tasks

- [x] extend Amplify from a single embedded conversation model into a workspace that can support dedicated threads
- [x] add promotion flow from general chat into Amplify threads using the same summary-seeded approach as Pool
- [x] support mention links to Amplify workspaces from global chat
- [x] support mention links to Amplify nested strategy items from global chat
- [x] keep the graph workspace independent from the global chat model while allowing focused thread context to inform the Amplify experience

#### Deliverable

- [x] a user can use Amplify context in general chat without creating an Amplify thread
- [x] a user can promote general chat context into a dedicated Amplify thread
- [x] Amplify supports multiple dedicated workspace threads in the prototype

### Phase 8: UX Coherence And Documentation Pass

Status: Complete

#### Goal

Make the hybrid chat model legible and maintainable.

#### Tasks

- [x] standardize the visual language for linked tags
- [x] standardize the visual language for mention chips
- [x] standardize the visual language for chat context panels
- [x] standardize the visual language for create/open recommendation cards
- [x] ensure users can always tell what the current chat references
- [x] ensure users can always tell what their standing preferences are
- [x] ensure users can always tell whether they are in a general chat or a dedicated workspace thread
- [x] update `docs/architecture.md` after implementation so the prototype structure remains accurate
- [x] keep this doc implementation-oriented as progress is made

#### Deliverable

- [x] navigation, ownership, and promotion behavior are visually understandable
- [x] architecture documentation reflects the resulting structure

## Cross-Phase Acceptance Checklist

These are the feature-level scenarios that should be true by the end of the work.

- [ ] start on Home with a general chat and no links
- [ ] type `@` and link an existing Pool
- [ ] type `@` and link an existing Amplify
- [ ] type `@` and link a nested Pool item
- [ ] type `@` and link a nested Amplify strategy item
- [ ] update global risk appetite and investment interests, then verify they appear consistently across global chat and workspace-thread surfaces
- [x] trigger an inline AI card that recommends creating a Pool
- [x] trigger an inline AI card that recommends creating an Amplify
- [x] use existing Pool context without creating a dedicated thread
- [x] promote a general chat into a dedicated Pool thread
- [x] use existing Amplify context without creating a dedicated thread
- [x] promote a general chat into a dedicated Amplify thread
- [x] confirm one general chat can reference both Pool and Amplify while the promoted dedicated threads remain separate
- [ ] confirm dedicated workspace threads are nested only under their owning workspace in navigation

## Assumptions And Defaults

- [x] this document should remain a build-ready checklist tracker, not a product strategy document
- [x] v1 supports `@` only and intentionally defers `/`
- [x] v1 mention targets include both workspaces and nested items
- [x] preferences are global user defaults in the prototype, even if later versions become chat- or workspace-scoped
- [x] the chat context panel should reuse the Pool overview interaction pattern rather than inventing a separate preference UI
- [x] create/open actions should appear as inline in-chat recommendation cards
- [x] promotion into dedicated workspace threads should always use a summary seed, never a raw transcript copy
- [x] Pool is the more mature workspace model and should be adapted first
- [x] Amplify should adopt the dedicated-thread pattern after the Pool integration path is clear
