# Design Mode

## Outcome

This branch adds an opt-in design mode for frontend work without requiring live service credentials.

Implemented so far:

- Added `NEXT_PUBLIC_TIDAL_APP_MODE=design` support via `src/lib/app-mode.ts`.
- Added a visible top-of-app banner: `Tidal is in design mode`.
- Added frontend auth/wallet/token facades:
  - `src/hooks/use-tidal-auth.ts`
  - `src/hooks/use-tidal-wallets.ts`
  - `src/hooks/get-tidal-access-token.ts`
- Updated frontend UI and data hooks to use those facades instead of importing Privy directly where practical.
- Made `src/components/providers/privy-provider.tsx` skip mounting Privy in design mode.
- Added design-mode mock data under `src/mock-data/design-mode/` for profile, wallet balances, positions, rates, and chat composition.
- Made `useMe()`, `useWalletBalances()`, `useAllPositions()`, and `useAdapterRate()` return design-mode data without calling live API routes.
- Added a safe design-mode adapter runner so the workspace can load without Privy signing hooks.
- Extracted graph composition templates into `src/lib/workspace/compose-strategy-template.ts` so live AI and design-mode chat share one graph builder.
- Made design-mode chat compose graph mutations locally without calling `/api/chat` or requiring `ANTHROPIC_API_KEY`.

Validated in browser:

- Design-mode banner appears above the nav.
- Mock profile/sidebar state renders.
- Wallet node shows mocked SOL and USDC balances.
- Investments panel shows mocked positions.
- Adapter APY values render without live rate calls.
- Chat starter prompts create editable graph nodes without `ANTHROPIC_API_KEY`.

Known remaining work:

- Full design-mode Run UX simulation is still Phase 5. Clicking Run is safe from Privy signing, but the complete pending/running/succeeded design flow is not finalized.
- Live AI behavior still needs validation in live mode with real `ANTHROPIC_API_KEY`.
- Documentation/guardrails in README and architecture docs are still Phase 6.

## Goal

Create an opt-in design-only mode that lets frontend/design work happen without requiring live service credentials.

Design mode should let the workspace, canvas, panels, mocked wallet state, mocked positions, strategy composition, and run-state UI remain usable while disabling or mocking Privy, Anthropic, Neon, Helius, Solana RPC, signing, and transaction submission.

Live mode must remain the default. If no design-mode flag is set, the app should continue to behave exactly as it does today for backend/live integration work.

## Non-Goals

- Do not remove live backend integrations.
- Do not weaken live-mode auth, wallet, RPC, AI, or database behavior.
- Do not add real product data to design mode.
- Do not add blockchain, RPC, Solana program, or wallet-adapter calls to workspace UI components.
- Do not make chat the source of truth. The graph remains the product surface; chat is only an input modality.

## Mode Flag

Use a single public mode flag:

```bash
NEXT_PUBLIC_TIDAL_APP_MODE=design
```

Expected usage for frontend/design work:

```bash
# .env.local
NEXT_PUBLIC_TIDAL_APP_MODE=design
```

`.env.local` is gitignored, so this opt-in should stay local unless explicitly configured for a preview deployment.

## Phase 1: App Mode Helper

Goal: create one source of truth for app mode.

- [x] Add an app-mode helper, likely `src/lib/app-mode.ts`.
- [x] Export an `isDesignMode` boolean.
- [x] Ensure live mode is the default when `NEXT_PUBLIC_TIDAL_APP_MODE` is not set.
- [ ] Avoid scattering raw `process.env.NEXT_PUBLIC_TIDAL_APP_MODE` reads throughout components.
- [ ] Validate that the app still builds and runs in live mode without changing current behavior.

Success criteria:

- [x] `bun run lint` passes.
- [ ] No design-mode behavior is active unless the flag is set.

## Phase 2: Auth And Wallet Facade

Goal: stop product UI from depending directly on Privy hooks when design mode is enabled.

- [x] Create local frontend auth/wallet facades, for example:
  - `useTidalAuth()`
  - `useTidalWallets()`
  - `getTidalAccessToken()`
- [x] In live mode, delegate to Privy.
- [x] In design mode, return a mocked ready/authenticated state.
- [x] In design mode, return a mocked Solana wallet address.
- [x] Update components and hooks that currently import Privy directly to use the local facade where practical.
- [x] Keep any Privy-specific code inside the auth/wallet boundary.

Likely files to review:

- `src/components/providers/privy-provider.tsx`
- `src/components/tidal/app-sidebar.tsx`
- `src/components/tidal/profile-sheet.tsx`
- `src/components/workspace/panels/chat-panel.tsx`
- `src/hooks/use-me.ts`
- `src/hooks/workspace/use-wallet-balances.ts`
- `src/hooks/workspace/use-all-positions.ts`
- `src/hooks/workspace/use-adapter-node-runner.ts`

Notes:

- `src/hooks/workspace/use-adapter-node-runner.ts` still imports Privy signing directly because it is the live transaction path. Design-mode run simulation is handled in Phase 5.
- `src/app/privy-smoke/page.tsx`, `src/components/providers/privy-provider.tsx`, `src/lib/auth/privy-server.ts`, and the local facade hooks are allowed Privy boundaries.

Success criteria:

- [x] The app can boot in design mode without `NEXT_PUBLIC_PRIVY_APP_ID`.
- [x] Sign-in/profile UI has stable mocked behavior in design mode.
- [x] Live mode still uses Privy.

## Phase 3: Mock Live Data Hooks

Goal: prevent frontend design work from requiring Helius, Neon, or live Solana routes.

- [x] In design mode, make `useMe()` return a mocked profile.
- [x] In design mode, make `useWalletBalances()` return mocked SOL and USDC balances.
- [x] In design mode, make `useAllPositions()` return mocked position data.
- [x] In design mode, make `useAdapterRate()` return mocked/catalog APY data instead of calling `/api/solana/rates`.
- [x] Preserve useful loading, empty, error, and ready states where designers need to inspect those UI states.
- [x] Keep mocked content in `src/mock-data` where practical.

Notes:

- Browser validation confirmed the design-mode banner, mocked profile/sidebar, mocked wallet balances, mocked investment positions, and mocked APY values render correctly.
- `use-adapter-node-runner.ts` now has a safe design-mode runner so loading the workspace no longer calls Privy signing. Full run UX simulation remains Phase 5.

Success criteria:

- [x] The workspace loads in design mode without `HELIUS_RPC_URL`.
- [x] The workspace loads in design mode without `DATABASE_URL`.
- [x] Panels and wallet nodes continue to look populated and useful.

## Phase 4: Design-Safe Chat Composition

Goal: preserve the product thesis that the agent composes graphs without requiring `ANTHROPIC_API_KEY`.

- [x] In design mode, bypass live `/api/chat` calls.
- [x] Map starter prompts and common demo prompts to mocked graph mutations.
- [x] Reuse existing graph mutation helpers instead of creating a separate chat state model.
- [x] Keep composed output visible on the canvas.
- [x] Make sure chat remains an input modality, not the source of truth.
- [x] In live mode, keep the existing Vercel AI SDK + Claude route behavior.

Notes:

- Strategy composition templates now live in `src/lib/workspace/compose-strategy-template.ts` so live AI and design-mode chat share one graph builder.
- In design mode, `ChatPanel` maps prompts locally and applies the same graph mutations the live AI tool would return.

Success criteria:

- [x] A designer can click a starter prompt and see nodes appear on the canvas without `ANTHROPIC_API_KEY`.
- [x] The graph remains editable after mocked composition.
- [ ] Live AI behavior is unchanged when design mode is off.

## Phase 5: Simulated Runs

Goal: let frontend/design work cover run states without signing or submitting transactions.

- [ ] In design mode, bypass transaction build, sign, submit, and polling.
- [ ] Simulate graph/node execution status transitions.
- [ ] Provide a deterministic success path for normal design work.
- [ ] Consider a controlled way to preview failure states.
- [ ] Keep run status updates flowing through the existing providers/hooks.

Success criteria:

- [ ] A designer can click Run and inspect pending/running/succeeded UI states.
- [ ] No Solana RPC, signing, or transaction submission happens in design mode.
- [ ] Live-mode execution behavior is unchanged.

## Phase 6: Documentation And Guardrails

Goal: make design mode safe and obvious for the team.

- [ ] Update `README.md` with design-mode setup instructions.
- [ ] Update `docs/architecture.md` if provider/data-flow boundaries change.
- [ ] Mention design mode as an opt-in frontend workflow, not a production data path.
- [ ] Document which env vars are not required in design mode.
- [ ] Document which workflows still require live mode.
- [ ] Confirm `.env.local` remains gitignored.

Success criteria:

- [ ] A frontend contributor can start the app in design mode from README instructions alone.
- [ ] A backend contributor can continue using live mode without changing their setup.

## Validation Checklist

- [ ] `bun run lint`
- [ ] `bun run build`
- [ ] Start the app with no live service secrets and `NEXT_PUBLIC_TIDAL_APP_MODE=design`.
- [ ] Confirm the workspace route loads.
- [ ] Confirm workspace tabs, side panels, and canvas interactions work.
- [ ] Confirm wallet/profile UI has stable mocked behavior.
- [ ] Confirm mocked balances and mocked positions render.
- [ ] Confirm mocked chat composition can place graph nodes.
- [ ] Confirm Run can be simulated without wallet signing.
- [ ] Confirm live mode still expects and uses real integrations.

## PR Review Notes

Review should focus on whether the design-mode boundary is clean:

- The mode switch should live near provider/hook boundaries.
- Product UI should not be littered with one-off env checks.
- Live mode should be the default and should preserve current behavior.
- Design mode should use mocked data only.
- The typed graph should remain the source of truth.
