# Workspace Refactor Plan

## Context

The product focus has narrowed. The node-based strategy builder that today lives under `/amplify` is becoming the entire application. Pool, Swap, and the Home / Global Chat surfaces will be removed from the live product. A user now opens the app directly into a **workspace** — a canvas of connected nodes representing one investment group — and can switch between workspaces from the header the way you switch browser tabs.

The sidebar becomes a mode switcher rather than a list of chats. Each entry opens a context panel next to the canvas; selecting nothing hides the panel and gives the canvas the full screen.

This plan follows the conventions in [docs/codex-refactor.md](codex-refactor.md) and [docs/architecture.md](architecture.md): thin routes, product-area component folders, shared branded components in `components/tidal`, mock content in `src/mock-data`, styling tokens centralised in `globals.css`. A future developer should be able to drop real integrations in behind the mocked data without re-plumbing the UI.

## Terminology

- **Workspace** — one canvas + its chat history + its investment context. Equivalent to what the code already calls `AmplifyWorkspace`. Referred to in the UI as a *workspace* (not "workflow", not "pool").
- **Canvas** — the XYFlow graph of nodes/edges inside a workspace.
- **Side panel** — the left-hand content strip next to the canvas. One of five modes: Nodes, Investments, Discover, Chat, Templates. Closeable.
- **Workspace tabs** — the tab strip in the header that lets the user switch between workspaces.

The word "pool" must not appear in user-facing copy, component names, providers, hooks, types, or file paths in the live product tree. It may remain inside `_archive/` untouched.

## Target shape

```
src/
  app/
    layout.tsx                  # providers + shell
    page.tsx                    # "/" → opens/creates default workspace
    workspace/
      [workspaceId]/page.tsx    # workspace route (thin)
  components/
    ui/                         # unchanged primitives
    tidal/                      # shared branded components (extend)
    shell/
      app-header.tsx            # + workspace tabs
      app-sidebar.tsx           # rebuilt as 5-mode rail
      workspace-tabs.tsx        # new
    workspace/                  # renamed from components/amplify
      workspace-screen.tsx
      canvas/                   # existing node components move here
      panels/
        nodes-panel.tsx
        investments-panel.tsx
        discover-panel.tsx
        chat-panel.tsx
        templates-panel.tsx
  providers/
    workspace-provider.tsx      # renamed from amplify-workspace-provider
    side-panel-provider.tsx     # new, per-workspace panel selection
    preference-profile-provider.tsx   # unchanged
  hooks/
    workspace/                  # renamed from hooks/amplify
  lib/
    workspace/                  # renamed from lib/amplify
    routes/workspace.ts         # replaces lib/routes/amplify.ts
  mock-data/
    workspace/                  # renamed from mock-data/amplify
      investments.ts            # NEW — moved from mock-data/pool (positions only)
      discover.ts               # NEW — recommendations + discovery items
      templates.ts              # NEW — placeholder list for templates UI
_archive/
  pool/                         # whole pool feature, verbatim
  swap/                         # stub + any related types
  home/                         # home-screen.tsx + related chat pieces
  global-chat/                  # provider + chat routes + related mocks
  README.md                     # one-line note: "frozen reference code"
```

## Top-level shell

### Root route `/`
Replaces the current home/global-chat page.

- On load, read the last active workspace id from the workspace provider (localStorage-backed).
- If none exists, call `createWorkspace()` to seed a blank one, then redirect to `/workspace/<id>`.
- No standalone UI lives at `/` — it is a redirect/bootstrap route.

Reference files to adapt: [src/app/page.tsx](../src/app/page.tsx), [src/app/layout.tsx](../src/app/layout.tsx).

### Header — [src/components/shell/app-header.tsx](../src/components/shell/app-header.tsx)

Layout, left to right:
1. Tidal logo (unchanged).
2. **Workspace tabs** — new component `components/shell/workspace-tabs.tsx`. Renders each workspace as a tab: short name, close (×) on hover, trailing `+` button to call `createWorkspace()`. Active tab styled with the existing `--color-tidal-sidebar-active`. Tabs scroll horizontally on overflow.
3. Flex spacer.
4. Risk appetite trigger and Investment interests trigger — **unchanged**, keep the existing `PreferenceContextPanel` dialogs wired via `usePreferenceProfile()`.

Closing the last tab falls back to creating a new blank workspace (never an empty app).

### Sidebar — [src/components/shell/app-sidebar.tsx](../src/components/shell/app-sidebar.tsx) (rebuild)

Replace the entire body. New structure is a vertical rail of five icon + label buttons plus a user block at the bottom:

| Item | Phosphor icon | Label |
| --- | --- | --- |
| Nodes | `GraphIcon` (or `TreeStructureIcon`) | Nodes |
| Investments | `Coins` | Investments |
| Discover | `Compass` | Discover |
| Chat | `ChatCircle` | Chat |
| Templates | `SquaresFour` | Templates |
| — spacer — | | |
| User | `User` | wallet short label |

Rules:
- Each button shows the icon stacked above the label (vertical icon-rail pattern). Label is always visible, never a hover-only tooltip.
- Selecting an active item again deselects it → panel closes → canvas goes full width. This is the "focus the canvas" affordance.
- Selected state is **per workspace** (two workspaces can be on different panels). Persisted to localStorage alongside other workspace state.
- The user icon at the bottom remains purely visual for the prototype — no dialog behind it yet.

### Workspace route `/workspace/[workspaceId]`

Thin server component that renders `<WorkspaceScreen />`. Replaces `/amplify/[workspaceId]`.

## Side panel model

The container for the side panel is the existing 35%-wide column currently occupied by `AmplifyChat` ([globals.css](../src/app/globals.css) `.tidal-workspace-panel` lines 335–366). Keep the container and swap its contents based on the selected sidebar item.

Panel components live under `components/workspace/panels/`:

### Nodes panel — `nodes-panel.tsx`
Reuses data from [src/mock-data/amplify/catalog.ts](../src/mock-data/amplify/catalog.ts) (`amplifyNodeCatalog`, `amplifySuggestions`). Renders grouped, searchable node cards. Clicking a card adds that node to the centre of the canvas via the existing `use-amplify-canvas-state.ts` `addNodeAtPosition` helper. This replaces the right-click / drag-from-output node picker as the primary discovery surface (the picker overlay can stay as a power-user shortcut).

### Investments panel — `investments-panel.tsx`
Shows **only active investments** for the current workspace. Reuses the existing [PoolPositionCard](../src/components/pool/pool-position-card.tsx) after renaming it to `InvestmentCard` and moving it into `components/workspace/investments/`. Reuses [PoolPerformanceChart](../src/components/pool/pool-performance-chart.tsx) (renamed `InvestmentPerformanceChart`) at the top of the panel showing aggregate workspace value. Data source: a new `mock-data/workspace/investments.ts` that exposes a `workspaceInvestments` map keyed by workspace id, seeded from the current pool mock positions.

No "pool" terminology in class names, types, props, mock keys, or copy.

### Discover panel — `discover-panel.tsx`
Shows recommendations + discovery items. Reuses [PoolRecommendationCard](../src/components/pool/pool-recommendation-card.tsx) → `RecommendationCard` and [PoolDiscoveryCard](../src/components/pool/pool-discovery-card.tsx) → `DiscoveryCard`, moved under `components/workspace/discover/`. Data seeded into `mock-data/workspace/discover.ts`. Card actions that referenced Pool threads should now trigger `chat` (opens Chat panel seeded with that opportunity) or a no-op stub.

### Chat panel — `chat-panel.tsx`
Reuses the existing [AmplifyChat](../src/components/amplify/amplify-chat.tsx) with minor additions:
- A top bar inside the panel with two controls: a **chat history** disclosure (list of this workspace's past `threads`, clickable to switch) and a **new chat** button (`createBlankThread(workspaceId)`).
- Thread data structure is preserved — the existing `AmplifyWorkspace.threads[]` model already scopes chats to a workspace and supports switching + promotion. Renaming only.
- The promotion-summary panel stays; no global-chat promotions happen any more, so only workspace-native threads render.

### Templates panel — `templates-panel.tsx`
New, empty-for-now. Renders a header row ("Templates", search input, filter pills placeholder), a left sub-nav of categories (All, Popular, Use Cases, Getting Started, Node Basics), and a responsive card grid — matching the layout in [docs/comfy-template.png](comfy-template.png). Cards come from `mock-data/workspace/templates.ts` as a small array of `{ id, title, thumbnailUrl, tags, author }`; seed with 6–8 placeholder entries using any existing public-domain/solid-color thumbnails so the grid renders. No click behaviour beyond a toast-style stub.

## State management

### Workspace provider
Rename `providers/amplify-workspace-provider.tsx` → `providers/workspace-provider.tsx`. Rename the exported hook `useAmplifyWorkspace` → `useWorkspace` and the context type accordingly. The underlying data model (`workspaces`, `workspace`, `activeThread`, `threads`, `createWorkspace`, `createBlankThread`, `updateWorkspaceGraph`, …) is preserved — only identifiers and the `kind` discriminator need tidying.

Remove all code paths that handle "promote from global chat" (`promoteGlobalChatToThread`, `source` fields on threads originating outside the workspace). Those belong to the archived global-chat feature.

### Side-panel provider (new)
`providers/side-panel-provider.tsx` — lightweight context exposing:
```ts
type SidePanel = "nodes" | "investments" | "discover" | "chat" | "templates" | null;

interface SidePanelState {
  activePanel: Record<string /* workspaceId */, SidePanel>;
  setActivePanel(workspaceId: string, panel: SidePanel): void;
}
```
Persist to localStorage. Default for newly created workspaces: `"chat"` (so the initial experience on `/` is canvas + chat, matching today).

### Canvas full-screen
Replace the local `isCanvasFullscreen` state in `amplify-workspace.tsx` with `activePanel === null` from the side-panel provider. Close the panel by clicking the active sidebar item a second time, or via the existing fullscreen toggle button (kept, relabelled "Hide panel").

## Archive move

Move, don't delete, the following into `_archive/` preserving relative internal structure:

- `src/components/pool/**` → `_archive/pool/components/`
- `src/components/swap/**` → `_archive/swap/components/`
- `src/components/home/**` → `_archive/home/components/`
- `src/providers/pool-workspace-provider.tsx` → `_archive/pool/providers/`
- `src/providers/global-chat-workspace-provider.tsx` → `_archive/global-chat/providers/`
- `src/mock-data/pool/**` → `_archive/pool/mock-data/`
- `src/mock-data/home/**` → `_archive/home/mock-data/`
- `src/mock-data/shell/hybrid-chat.ts` → `_archive/global-chat/mock-data/`
- `src/app/pool/**`, `src/app/chat/**` → `_archive/global-chat/app-routes/`
- `src/lib/routes/amplify.ts` stays in `src/lib/routes/` but is renamed `workspace.ts`

Add `_archive/README.md` stating the folder is frozen reference material not built or typechecked. Exclude from compilation by adding `"_archive"` to `tsconfig.json` `exclude` and `next.config.ts` so it never imports back into live code.

Before each move, any living import that still points at these paths must be either (a) rewritten to the new workspace path, or (b) deleted. Grep for `pool`, `global-chat`, `home-screen`, `swap` imports and clean them up as the last step before lint + typecheck.

## Styling

Extend [src/app/globals.css](../src/app/globals.css) rather than introducing a new file:

- Add a `.tidal-sidebar-rail` block for the new icon+label vertical rail (fixed width ~88px, vertical stack, 12px gap).
- Add `.tidal-sidebar-rail-item` for each button (icon centred, label 11px under it, active state uses `--color-tidal-sidebar-active` and `--color-tidal-accent`).
- Add `.tidal-workspace-tab` for header tabs (reuse `.tidal-tab-button` base where it fits; close-× appears on hover only).
- Add `.tidal-template-grid` for the template card grid (responsive 2 → 3 → 4 cols via existing breakpoints).

Keep arbitrary Tailwind strings out of the new components — prefer semantic classes so another developer adjusting the look edits one file.

## Critical files

Files that change in this refactor:

- [src/app/layout.tsx](../src/app/layout.tsx) — drop Pool + GlobalChat providers, add `SidePanelProvider`.
- [src/app/page.tsx](../src/app/page.tsx) — rewrite as workspace bootstrap/redirect.
- [src/components/shell/app-header.tsx](../src/components/shell/app-header.tsx) — add workspace tabs.
- [src/components/shell/app-sidebar.tsx](../src/components/shell/app-sidebar.tsx) — full rewrite as 5-mode rail.
- [src/components/shell/workspace-tabs.tsx](../src/components/shell/workspace-tabs.tsx) — new.
- [src/components/amplify/amplify-workspace.tsx](../src/components/amplify/amplify-workspace.tsx) → `components/workspace/workspace-screen.tsx` — panel switching.
- [src/components/amplify/amplify-chat.tsx](../src/components/amplify/amplify-chat.tsx) → `components/workspace/panels/chat-panel.tsx` — add history disclosure + new-chat button.
- [src/providers/amplify-workspace-provider.tsx](../src/providers/amplify-workspace-provider.tsx) → `providers/workspace-provider.tsx` — rename + drop promotion code.
- [src/providers/side-panel-provider.tsx](../src/providers/side-panel-provider.tsx) — new.
- [src/hooks/amplify/use-amplify-canvas-state.ts](../src/hooks/amplify/use-amplify-canvas-state.ts) → `hooks/workspace/use-canvas-state.ts`.
- [src/mock-data/amplify/*](../src/mock-data/amplify/) → `src/mock-data/workspace/*`, plus new `investments.ts`, `discover.ts`, `templates.ts`.
- [src/lib/amplify/*](../src/lib/amplify/) → `src/lib/workspace/*`.
- [tsconfig.json](../tsconfig.json) + [next.config.ts](../next.config.ts) — exclude `_archive`.
- [src/app/globals.css](../src/app/globals.css) — new semantic classes listed above.
- [docs/architecture.md](architecture.md) — update to reflect the new layout when the refactor lands.

Files to reuse (rename + move, do not rewrite):

- `PoolPositionCard` → `InvestmentCard`
- `PoolRecommendationCard` → `RecommendationCard`
- `PoolDiscoveryCard` → `DiscoveryCard`
- `PoolPerformanceChart` → `InvestmentPerformanceChart`
- `SurfaceCard`, `Badge`, `SectionLabel`, `PromptComposer`, `ChatMessage`, `PreferenceContextPanel` — unchanged.

## Suggested execution order

Land in roughly this order so the app stays runnable after each step:

1. Create `_archive/` with README; wire tsconfig/next exclude.
2. Rename `amplify/*` → `workspace/*` across components, providers, hooks, lib, mock-data, routes. Keep behaviour identical; app still works at `/amplify/<id>` via the renamed route, then add `/workspace/<id>` and redirect the old URL.
3. Rewrite `/` to bootstrap/redirect into a workspace.
4. Archive Home, Swap, Global Chat, Chat routes, and their providers. Fix resulting import errors.
5. Rebuild `app-sidebar.tsx` as the 5-mode rail. Introduce `SidePanelProvider`. Canvas full-screen now driven by `activePanel === null`.
6. Add workspace tabs to `app-header.tsx`.
7. Build `NodesPanel` (wraps existing catalog).
8. Port Pool position card + performance chart → `InvestmentsPanel`. Archive remaining pool UI.
9. Port Pool recommendation + discovery cards → `DiscoverPanel`.
10. Build `TemplatesPanel` shell + placeholder data.
11. Styling pass on `globals.css`; audit for leftover `pool` references.
12. Update [docs/architecture.md](architecture.md) and mark relevant items in [docs/codex-plan.md](codex-plan.md).

## Verification

End-to-end manual test via `bun run dev`:

- Visit `/` — lands on a workspace route with canvas + chat panel open by default.
- Header shows one tab for the default workspace. Click `+` → second tab appears, switches canvas, remembers its own panel selection.
- Close a tab with `×` — switches to the neighbouring tab. Close the last tab — a new blank workspace is created.
- Sidebar: click **Nodes** → panel shows catalog, clicking a card drops it on the canvas. Click **Nodes** again → panel closes, canvas goes full-width.
- Click **Investments** → active-position cards render with performance chart above. No "pool" text anywhere in the UI.
- Click **Discover** → recommendation + discovery cards render.
- Click **Chat** → existing chat panel renders. "New chat" creates a thread scoped to this workspace. "Chat history" reveals past threads for this workspace only; selecting one switches the transcript.
- Click **Templates** → grid renders with placeholder cards matching [docs/comfy-template.png](comfy-template.png) layout.
- Risk appetite + Investment interests triggers in the header still open their existing dialogs and persist selection.
- Switch workspaces — each workspace remembers its panel selection and its canvas contents independently.

Automated gates:

- `bun run lint` — clean, no references to `pool`, `swap`, `home`, `global-chat` from live code paths.
- `bun run typecheck` (or `bun run build`) — passes, `_archive` is excluded.
- `bun run build` — Next.js build succeeds, `_archive` is not emitted.

## Open items to revisit after landing

- Templates actions (clicking a template card should eventually seed a workspace from a saved graph).
- Whether workspace tabs need a right-click context menu (rename, duplicate, close others).
- Whether Investments should show cross-workspace totals in the header later.
- User-block behaviour in the sidebar footer (settings dialog, wallet switch).
