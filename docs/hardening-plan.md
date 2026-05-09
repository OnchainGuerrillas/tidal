# Tidal — On-chain hardening plan

Post-hackathon audit and bug-hunt across the adapter, runner, and submission pipeline. Goal: identify every bug class that would surface for a real user running real money, fix the high-severity ones, and put test infrastructure in place so regressions get caught automatically.

## Known bugs (carry-over from hackathon)

These were observed during the demo polish phase; they're the seed for the bug registry and deserve early attention.

| # | Bug | Severity | Location |
|---|-----|----------|----------|
| 1 | Leverage-loop builds all txs speculatively before any execute, so Jupiter Ultra `/order` rejects when wallet has no input asset yet | **High** | `kamino-leverage-loop.ts` |
| 2 | Kamino `RefreshObligation` ix needs ALL reserves the obligation references in `remaining_accounts`; SDK only passes the current op's reserves, so dirty obligations fail with `0x1776` | **High** | `kamino-borrow.ts`, `kamino-leverage-loop.ts`, `kamino-withdraw.ts`, `kamino-repay-withdraw.ts` |
| 3 | Privy embedded-wallet iframe can drop session mid-multi-tx, surfacing as "Failed to connect to wallet" | **Medium** | `use-adapter-node-runner.ts` (Privy boundary) |
| 4 | Single blockhash for all txs in a multi-tx sequence — risky on slow networks once sequence > ~60s | **Medium** | `kamino-borrow.ts:241`, all multi-tx adapters |
| 5 | Hardcoded priority fee (5000 lamports) — too low for congested mainnet | **Medium** | All adapters that set `fees.networkLamports` |
| 6 | Jito `readRate` returns hardcoded 0.059 stub, not on-chain stake rate | **Low** | `jito.ts` |
| 7 | `kamino-leverage-loop.readPosition` returns null instead of composite summary | **Low** | `kamino-leverage-loop.ts` |
| 8 | `accruedYield` not populated on Kamino positions despite SDK exposing it | **Low** | `kamino.ts`, `kamino-borrow.ts` |
| 9 | Ad-hoc casts at SDK boundary (`as unknown as`) — kit v2/v6 mismatch papered over but not validated | **Medium** | All Kamino adapters |
| 10 | No retry logic for transient RPC failures during submission | **Medium** | `submit-transaction/route.ts` |

---

## Phase 0 — Test infrastructure & instrumentation (1–2 days)

Ground rule: nothing in this plan is reliable without a way to reproduce bugs deterministically. Phase 0 sets up the rails.

### Deliverables
- **LiteSVM/Mollusk test harness** for adapter unit tests — fast in-process testing of transaction construction without hitting mainnet
- **Surfpool integration test setup** — local validator forked from mainnet so we can rehearse Kamino + Jupiter against realistic state
- **Structured logging** across the full adapter pipeline — every `buildTransaction`, sign, submit, confirm gets a structured log entry with tx index + node id + timing
- **Bug registry** at `docs/internal/bug-registry.md` (gitignored) — every issue gets an entry with: location, repro, severity, root cause, fix path
- **Test wallet management** — automate creating fresh Privy accounts for clean-state runs, fund from a paymaster wallet

### Why first
- Audit findings will surface dozens of small issues; a registry keeps them tracked
- LiteSVM tests catch ix-construction bugs in milliseconds vs minutes of mainnet wait
- Surfpool gives us realistic state without burning real capital

### Skills to lean on
- `solana-dev` skill — has detailed setup guides for LiteSVM, Mollusk, Surfpool
- Reference: `userSettings:solana-dev/references/testing.md`, `userSettings:solana-dev/references/surfpool/overview.md`

---

## Phase 1 — Adapter-by-adapter deep audit (4–6 days)

Walk every adapter line-by-line. For each, produce: assumptions list, edge-case matrix, test coverage, registry entries.

### Per-adapter audit checklist

For each adapter in `src/lib/solana/`:

- [ ] **Account derivation correctness** — verify every `findProgramAddressSync`, `getAssociatedTokenAddressSync`, and SDK-derived account matches the program's expected layout
- [ ] **Signer set** — confirm exactly the wallet signer is required; no superfluous signers; no missing signers
- [ ] **Writable flags** — every account that mutates is marked writable; no over-marking
- [ ] **Token program variant** — SPL Token vs Token-2022; verify the right program ID for each mint
- [ ] **Compute budget** — does the tx need an explicit `ComputeBudgetProgram.setComputeUnitLimit`? (Kamino borrow + leverage especially)
- [ ] **Priority fee** — `setComputeUnitPrice` tuned to current mainnet congestion, not hardcoded
- [ ] **Address Lookup Tables** — do we use ALTs where they'd help (Kamino ix-heavy txs)?
- [ ] **Slippage handling** — defaults reasonable for the asset volatility; surfaced to user; clamped to safe bounds
- [ ] **Numeric correctness** — every decimal-to-base-units conversion verified against the asset's actual decimals; bigint arithmetic vs number arithmetic boundaries audited
- [ ] **Error surfacing** — failures produce actionable messages naming which step / reserve / amount tripped
- [ ] **State preconditions** — does the adapter assume a clean obligation, no debt, no leftover positions? Document and either validate or remove the assumption
- [ ] **Idempotency** — calling `buildTransaction` twice with same inputs produces the same tx (within blockhash freshness)
- [ ] **Tx-size headroom** — measured serialized size vs 1232-byte ceiling with a safety margin

### Adapters to audit (priority order)

1. **`kamino-leverage-loop.ts`** — most complex, highest blast radius, known speculative-build bug. Decision: refactor to lazy build (see Phase 3) or rip out from v1 and rebuild
2. **`kamino-borrow.ts`** — multi-tx, scope-refresh-dependent, dirty-obligation-vulnerable. Heart of the leverage story
3. **`kamino-repay-withdraw.ts`** — same multi-tx pattern; the unwind path is critical for users to actually get out of positions
4. **`kamino-withdraw.ts`** — single-tx but obligation-state-aware
5. **`kamino.ts` (kamino-usdc-supply)** — simplest Kamino adapter, audit as the reference implementation
6. **`jito.ts` / `jito-unstake.ts`** — SPL stake-pool quirks (`depositSol` lamports vs `withdrawSol` decimals already burned us once)
7. **`jupiter-swap.ts`** — Jupiter Ultra API contract; consider switching to `/quote` + `/swap` to avoid the taker-balance pre-validation
8. **Address-lookup-table program** if/when ALTs are added

### Per-adapter deliverables
- LiteSVM test suite covering happy path + edge cases
- One Surfpool integration test against forked mainnet
- Bug registry entries for everything found
- Updated adapter-level docstrings naming preconditions and known limitations

---

## Phase 2 — Runner + plan derivation hardening (3 days)

The runner orchestrates the adapters; bugs here surface as "graph failed" with no actionable detail.

### `graph-exec.ts` audit
- [ ] **Topo sort correctness** — Kahn's algorithm respecting cycles, returning `null` cleanly
- [ ] **Multi-output handle dispatch** — Split outputs route to correct downstream consumers
- [ ] **Failed-parent propagation** — `node-skipped` events fire correctly; no orphans
- [ ] **Cancellation semantics** — `AbortSignal` cuts cleanly between txs, not mid-tx
- [ ] **Compute-only nodes** — Split + Amount math correctness with bigint arithmetic, rounding edge cases
- [ ] **Output Map invariants** — every successful node populates `outputs`, no missing handles, no extra keys

### `derive-executable-plan.ts` audit
- [ ] **Validation completeness** — every required widget checked; non-entry nodes correctly skipped (just landed)
- [ ] **Asset compatibility** — edges checked for input/output asset match (currently in UI only? verify)
- [ ] **Source amount derivation** — entry-node `sourceAmount` correctly computed from `amount` widget × decimals
- [ ] **Cycle detection** — graphs with cycles caught here, not just at runtime
- [ ] **Empty-graph handling** — clear errors when no adapter nodes present

### `use-adapter-node-runner.ts` audit
- [ ] **Sign-then-submit ordering** — no double-sign, no submit-before-sign
- [ ] **Privy session refresh** — detect stale wallet handle, refresh before sign
- [ ] **Submit retry** — transient RPC failures retried; permanent failures fail fast
- [ ] **Confirmation polling** — `confirmed` vs `finalized` semantics; timeout behavior
- [ ] **Tx-index reporting** — failures name the index in human terms ("init tx", "deposit tx") not just `tx 3/5`

### Test strategy
- Mock `runNode` for graph-exec unit tests covering all event sequences
- Property-based tests for topo sort (random DAGs of various shapes)
- Surfpool integration tests for the full runner pipeline against forked mainnet

---

## Phase 3 — Cross-cutting concerns & refactors (4–7 days)

Larger structural fixes that span multiple adapters.

### 3.1 Lazy-build refactor for multi-step adapters (high effort, high value)

The leverage-loop adapter speculatively builds all swap txs before any borrow lands — root cause of the Jupiter Ultra `/order` rejection. The proper fix is to change the runner contract from "buildTransaction returns N txs upfront" to "buildTransaction returns an iterator that yields txs one at a time, with each subsequent yield observing the prior tx's confirmation."

**Design questions:**
- New `BuildTransactionResult` shape: `transactions: AsyncIterable<TransactionRequest>` instead of `transactionsBase64: string[]`
- How does the runner pass per-step confirmation back to the iterator?
- Backward compat: keep the array shape for single-tx adapters, opt into iterator for multi-tx?

**Risk:** non-trivial refactor across the runner, all multi-tx adapters, and the AI compose flow.

**Alternative:** keep the array contract but introduce a "build context" where the leverage-loop adapter calls into the runner mid-build to query wallet state. Smaller change but couples adapters to runner internals.

### 3.2 Kamino dirty-obligation handling (high effort, high value)

Two paths:
- **Patch SDK calls** — fetch existing obligation, enumerate every reserve it touches, append to RefreshObligation's remaining_accounts. Affects every Kamino adapter that hits RefreshObligation.
- **Use scoped obligations** — instead of always `VanillaObligation(PROGRAM_ID)`, use different obligation seeds per strategy type so leverage and supply don't share state. Bigger change but cleaner long-term separation.

Recommend: try (a) first; (b) if (a) doesn't generalize.

### 3.3 Blockhash strategy for long sequences

Multi-tx adapters reuse one blockhash for all sub-txs. With ~6 txs at ~5s each on a slow day, the sequence can exceed the ~60s blockhash validity window. Refactor to fetch a fresh blockhash per tx (or every N txs).

### 3.4 Priority fee policy

Hardcoded 5000 lamports priority fee is fine in calm conditions, fails under congestion. Implement a priority-fee oracle (Helius `getPriorityFeeEstimate` or similar) and inject the right value at build time.

### 3.5 Compute budget per adapter

Kamino borrow + leverage txs are ix-heavy and can exceed default 200k CU limit. Audit measured CU usage (visible in tx logs) and add explicit `ComputeBudgetProgram.setComputeUnitLimit` ixs where needed.

### 3.6 Address Lookup Tables for ix-heavy txs

Kamino's combined deposit+borrow tx exceeded the 1232-byte ceiling and we split it. ALTs would let us bundle more ixs per tx by deduplicating account references. Investigate where the SDK supports ALTs and where we'd construct them ourselves.

### 3.7 Privy session lifecycle

Multi-tx flows lose the iframe session. Investigate:
- Pre-warm the session at the start of `executeGraph` so the first sign is fast
- Add a wallet-handle refresh between txs (re-call `useWallets()` to get fresh state)
- Detect "session lost" specifically and surface a recoverable error with retry button instead of failing the whole graph

### 3.8 Slippage policy review

Default 50 bps for Jupiter is reasonable for SOL/USDC on a quiet day; can be too tight on volatility. Implement asset-pair-aware default slippage (volatile pairs → higher) and surface clamp warnings when user picks something dangerous.

### 3.9 Adapter SDK-boundary type safety

Audit every `as unknown as` cast across the Kamino adapters. These exist because of the kit v2/v6 type-shape divergence. For each:
- Document why the cast is needed
- Add a runtime assertion guarding the cast (if the shape changes, fail loud, not silently)
- Where possible, use a typed adapter helper instead of inline casts

---

## Phase 4 — Real-fix sprint (variable, scope by registry)

After Phases 0–3, the bug registry has dozens of entries. This phase fixes them in priority order.

### Prioritization
1. **Critical** — bugs that cause data loss, fund loss, or unrecoverable state
2. **High** — bugs that fail user-visible workflows (the speculative-build, dirty-obligation issues)
3. **Medium** — bugs that fail under specific conditions (congested network, slow RPC, edge-case widget values)
4. **Low** — cosmetic / display issues, performance optimizations

Fix Critical + High exhaustively before recording any new demo. Medium + Low get prioritized against new features.

### Process per fix
- Write a failing test in LiteSVM/Surfpool that reproduces the bug
- Fix the code
- Confirm test passes
- Run regression suite
- Update bug registry with status

---

## Phase 5 — Production readiness (2 days)

Once Phase 4 is done, sweep for production hygiene.

- [ ] **Mainnet smoke suite** — automated end-to-end runs of every strategy template against a real wallet, ~$10 capital, run nightly
- [ ] **Monitoring hooks** — log every adapter execution to a structured store; alert on error-rate spikes
- [ ] **Architecture decision records (ADRs)** for the big calls: lazy-build vs eager-build, vanilla vs scoped obligations, Privy embedded vs external wallet
- [ ] **Adapter author's guide** — once the audit is done, codify the patterns into a "how to write a new adapter" doc so future protocol additions don't re-introduce the same bugs
- [ ] **Security review pass** — input validation at API boundaries, RPC endpoint validation, replay protection on submit-transaction route, secret rotation

---

## Skills + tools to leverage

- **`solana-dev` skill** — testing, security, multi-tx orchestration, common errors. Read before each phase
- **Solana MCP server** — for live docs lookups during the audit (instructions, RPCs, error codes)
- **`integrating-jupiter` skill** — Jupiter Ultra deep-dive when refactoring `jupiter-swap.ts`
- **Surfpool cheatcodes** — for setting up specific obligation states deterministically
- **Anchor expert MCP** — when staring at Kamino's klend errors

---

## Estimated total effort

| Phase | Days |
|---|---|
| 0 — infrastructure | 1–2 |
| 1 — adapter audit | 4–6 |
| 2 — runner audit | 3 |
| 3 — cross-cutting refactors | 4–7 |
| 4 — fix sprint | variable (3–10) |
| 5 — production readiness | 2 |
| **Total** | **17–30 days** |

Realistic with one dedicated engineer working full-time. Compresses to ~half that with two engineers parallelizing Phase 1 and Phase 3.

---

## Out of scope (intentional)

These are tempting but should NOT be folded into this hardening pass:

- New protocol adapters (Marinade, Sanctum, Jupiter Lend) — feature work, not hardening
- New AI compose intents — feature work
- UI polish on the canvas — separate concern
- Cross-chain (parked from v1)
- Anything requiring a Solana program of our own (we consume programs, we don't author them)

If something here turns up as a "we need our own program to fix this," that's a v2 conversation, not this audit.
