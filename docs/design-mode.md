# Design Mode

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

- [ ] Add an app-mode helper, likely `src/lib/app-mode.ts`.
- [ ] Export an `isDesignMode` boolean.
- [ ] Ensure live mode is the default when `NEXT_PUBLIC_TIDAL_APP_MODE` is not set.
- [ ] Avoid scattering raw `process.env.NEXT_PUBLIC_TIDAL_APP_MODE` reads throughout components.
- [ ] Validate that the app still builds and runs in live mode without changing current behavior.

Success criteria:

- [ ] `bun run lint` passes.
- [ ] No design-mode behavior is active unless the flag is set.

## Phase 2: Auth And Wallet Facade

Goal: stop product UI from depending directly on Privy hooks when design mode is enabled.

- [ ] Create local frontend auth/wallet facades, for example:
  - `useTidalAuth()`
  - `useTidalWallets()`
  - `getTidalAccessToken()`
- [ ] In live mode, delegate to Privy.
- [ ] In design mode, return a mocked ready/authenticated state.
- [ ] In design mode, return a mocked Solana wallet address.
- [ ] Update components and hooks that currently import Privy directly to use the local facade where practical.
- [ ] Keep any Privy-specific code inside the auth/wallet boundary.

Likely files to review:

- `src/components/providers/privy-provider.tsx`
- `src/components/tidal/app-sidebar.tsx`
- `src/components/tidal/profile-sheet.tsx`
- `src/components/workspace/panels/chat-panel.tsx`
- `src/hooks/use-me.ts`
- `src/hooks/workspace/use-wallet-balances.ts`
- `src/hooks/workspace/use-all-positions.ts`
- `src/hooks/workspace/use-adapter-node-runner.ts`

Success criteria:

- [ ] The app can boot in design mode without `NEXT_PUBLIC_PRIVY_APP_ID`.
- [ ] Sign-in/profile UI has stable mocked behavior in design mode.
- [ ] Live mode still uses Privy.

## Phase 3: Mock Live Data Hooks

Goal: prevent frontend design work from requiring Helius, Neon, or live Solana routes.

- [ ] In design mode, make `useMe()` return a mocked profile.
- [ ] In design mode, make `useWalletBalances()` return mocked SOL and USDC balances.
- [ ] In design mode, make `useAllPositions()` return mocked position data.
- [ ] In design mode, make `useAdapterRate()` return mocked/catalog APY data instead of calling `/api/solana/rates`.
- [ ] Preserve useful loading, empty, error, and ready states where designers need to inspect those UI states.
- [ ] Keep mocked content in `src/mock-data` where practical.

Success criteria:

- [ ] The workspace loads in design mode without `HELIUS_RPC_URL`.
- [ ] The workspace loads in design mode without `DATABASE_URL`.
- [ ] Panels and wallet nodes continue to look populated and useful.

## Phase 4: Design-Safe Chat Composition

Goal: preserve the product thesis that the agent composes graphs without requiring `ANTHROPIC_API_KEY`.

- [ ] In design mode, bypass live `/api/chat` calls.
- [ ] Map starter prompts and common demo prompts to mocked graph mutations.
- [ ] Reuse existing graph mutation helpers instead of creating a separate chat state model.
- [ ] Keep composed output visible on the canvas.
- [ ] Make sure chat remains an input modality, not the source of truth.
- [ ] In live mode, keep the existing Vercel AI SDK + Claude route behavior.

Success criteria:

- [ ] A designer can click a starter prompt and see nodes appear on the canvas without `ANTHROPIC_API_KEY`.
- [ ] The graph remains editable after mocked composition.
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
