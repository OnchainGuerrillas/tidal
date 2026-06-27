# Adapter Expansion Research — New Protocols & Creative Combinations

**Date:** 2026-06-27
**Method:** Live DeFiLlama TVL (Solana, by category) + Solana MCP doc/source search for integration feasibility (SDKs/APIs). TVL is a relevance/trust proxy, not the only signal — integration path and composer-fit matter as much.
**Purpose:** Decide which protocols to add as adapters (Workstream #6.1) to widen what the composer (#7) can express. Supersedes the thin candidate list in `post-hackathon-roadmap.md` §6.1.

---

## Current vocabulary (10 adapters)

Jito stake/unstake, BlazeStake stake/unstake, Kamino USDC supply/withdraw, Kamino supply-and-borrow, Kamino repay-and-withdraw, Kamino+Jupiter leverage loop (composite), Jupiter Ultra swap (any pair across SOL/USDC/USDT/JitoSOL/mSOL/bSOL).

All fit the **single-input-asset → single-output-asset** adapter shape, which is what `composeGraph` wires by edges.

---

## Live Solana TVL snapshot (2026-06-27, DeFiLlama)

| Category | Leaders (Solana TVL) |
|---|---|
| **Liquid staking** | Sanctum Validator LSTs $1.03B · Jito $708M · Jupiter Staked SOL $386M · Drift Staked SOL $201M · Marinade $182M |
| **Lending** | Kamino Lend $1.07B · **Jupiter Lend $887M** · Loopscale $79M · Save (Solend) $64M · marginfi $32M |
| **DEX / LP** | Raydium $841M · Orca $239M · PumpSwap $219M · Meteora DLMM $194M · **Sanctum Infinity $146M** · Meteora DAMM v2 $32M (+28%/7d) |
| **Derivatives (perps)** | **Jupiter Perps $685M** · BULK $40M · GMTrade $36M · Pacifica $28M · FlashTrade $7.6M · Drift Trade $5.5M |
| **Yield / aggregators** | Huma $182M · Exponent (PT/YT) $81M · Lulo $78M · Meteora vaults $42M |
| **Basis / delta-neutral** | Solstice $505M · Bitwise USCC $48M · JupUSD $43M |
| **RWA** | BlackRock BUIDL $636M · xStocks $581M (+15%/7d) · Ondo $181M |

Takeaways: lending and liquid staking dominate (we're already there). **Jupiter Perps owns Solana perps by ~17×** the next venue. **Jupiter Lend is a $887M lending pool we don't touch.** Drift Trade has collapsed to ~$5.5M (post-hack) — confirms keeping it parked.

---

## 🚩 Headline finding — flash loans are almost free for us

Kamino's `@kamino-finance/klend-sdk` (**already a dependency**) exposes `flash_borrow_reserve_liquidity` + `flash_repay_reserve_liquidity`. The contract: emit a borrow ix, insert arbitrary inner instructions, emit a repay ix — **all in one atomic transaction**. Fee is 0.001%; if repayment fails the whole tx reverts (zero capital risk). Solend/Save and marginfi expose the same primitive, but Kamino needs **no new dependency**.

This is the highest wow-per-effort add we have. It turns our multi-tx leverage loop into a proper **atomic** one (Kamino's own docs: 8–10 txs → 1 tx, no inter-step price/slippage exposure) and unlocks **collateral swaps** and **zero-capital demos**.

**Architectural catch:** a flash loan is atomic — borrow+inner+repay must live in **one** transaction. Our runner's contract is *N sequential transactions wired by asset edges*. So a flash-loan strategy **cannot** be drawn as separate canvas nodes connected by edges; it must be a **composite node** (same pattern as the existing leverage-loop node) that internally assembles the single tx. Note this before scoping.

---

## Candidate adapters — ranked by impact ÷ effort

| Rank | Adapter | Category | Integration path | Effort | Composer-fit | Unlocks |
|---|---|---|---|---|---|---|
| 1 | **Jupiter Lend** USDC supply/withdraw | Lending $887M | Jupiter Lend API (REST, like Ultra) | Low (~1.5h, mirrors Kamino USDC) | ✅ clean single-asset | Lending **rate-shop** (Kamino vs Jupiter Lend) |
| 2 | **Kamino flash loan** (composite) | — | klend-sdk (already in deps) | Med (single atomic tx, careful ix order) | ⚠️ composite node, not edge-wired | **Atomic** leverage loop, **collateral swap**, deleverage |
| 3 | **Sanctum Infinity** LST router | DEX/LST $146M | Sanctum router API | Med | ✅ behaves like a swap (LST→LST) | "AI **rate-shops across LSTs**" (JitoSOL↔bSOL↔mSOL↔INF) |
| 4 | **Jupiter Perps** open/close long+short | Derivatives $685M | On-chain program + keeper fulfillment (2-tx request model) | High | ⚠️ terminal leg (position, not a flow asset) | **Delta-neutral** & leveraged directional — the Deep Water tier |
| 5 | **Marinade** stake (mSOL) | LST $182M | `@marinade.finance/marinade-ts-sdk` (new dep, custom program) | Med | ✅ single-asset (SOL→mSOL) | Third native LST for diversification combos |
| 6 | **Meteora / Orca LP** | DEX/LP $194M/$239M | Meteora DLMM / Orca Whirlpools SDK | High | ❌ dual-asset input — needs new node shape | LP yield + **hedged LP** combos |
| 7 | **Exponent** PT/YT | Yield $81M (+13%/7d) | Exponent SDK | High | ⚠️ splits one asset into two (PT+YT) | Fixed-rate yield, yield leverage (advanced/creative) |

**Skip for now:** Drift (off-roadmap, post-hack, ~$5.5M — see `parked-features`), RWA/xStocks (compelling growth but a different product surface), basis-trading vaults (Solstice etc. — opaque, harder to compose).

---

## Creative combinations these unlock

The point of more adapters is the *combinatorial* surface the agent can compose. The standouts:

1. **Delta-neutral staking yield** *(needs Perps).* Stake SOL→JitoSOL (earn ~6% staking) **+** open a SOL short perp sized to the stake (hedge price). Net: capture staking yield ~market-neutral. The "cash-and-carry for LSTs" pitch — genuinely sophisticated, hard to do by hand.
2. **Atomic leverage loop** *(needs flash).* Flash-borrow SOL → swap → supply as Kamino collateral → borrow → repay flash. One tx, no inter-step price risk. The "correct" version of our current multi-tx loop.
3. **Collateral swap without unwinding** *(needs flash).* Flash-repay a Kamino debt → withdraw collateral → swap collateral asset → re-deposit → re-borrow → repay flash. Change SOL collateral to JitoSOL collateral in one tx.
4. **LST rate rotation** *(needs Sanctum).* Agent routes JitoSOL→bSOL→mSOL→INF chasing the best live staking yield. "Your stake always sits in the top-APY LST."
5. **Lending rate-shop** *(needs Jupiter Lend).* Agent compares Kamino vs Jupiter Lend USDC APY and supplies to the winner — or splits across both.
6. **Hedged LP** *(needs LP + Perps).* Provide SOL/USDC LP on Meteora **+** short SOL perp to neutralize price/IL. Advanced, demo-grade.
7. **Leveraged delta-neutral** *(flash + perps).* Flash-built leveraged JitoSOL position fully hedged by a short — amplified market-neutral yield.

Combos 1–5 are the realistic near-term demos; 6–7 are the "wow, it composed *that*?" stretch.

---

## Architectural fit — how these land in the composer

- **Single-asset adapters (Jupiter Lend, Sanctum, Marinade)** drop straight into the existing `AdapterCatalogEntry` shape and `composeGraph` can wire them by edges with zero engine changes. **Build these first.**
- **Flash-loan & atomic strategies** must be **composite nodes** (one node = one atomic multi-ix tx), like today's leverage-loop. They appear as a single manifest entry the composer can place; they don't expose internal edges.
- **Perps** are a **terminal leg**: a position isn't an asset that flows to a downstream node, and the keeper model means "open" = 1 signed request tx + async fulfillment. Model the perp node as input-collateral, no primary output edge — and teach the composer it's an endpoint. Position reads come from on-chain position accounts (feeds the Investments panel).
- **LP positions** need a **new node shape** (two input assets + a range/price param). This is the one item that touches the graph/runner model itself — relates to the parked dual-input / Split work. Defer until a hedged-LP demo is actually wanted.

---

## Recommended sequencing

**Tier A — cheap, expands rate-shop narrative (do next, ~1 day):**
1. Jupiter Lend USDC supply/withdraw → lending rate-shop.
2. Sanctum Infinity LST router → LST rate-shop.

**Tier B — flagship creative primitive (high wow, reuses our deps):**
3. Kamino flash-loan composite → atomic leverage + collateral swap.

**Tier C — biggest new surface (the Deep Water tier):**
4. Jupiter Perps long/short → delta-neutral staking yield. Fills the parked Drift slot.

**Tier D — defer (needs engine work):**
5. Marinade (nice-to-have third LST), then Meteora/Orca LP (new dual-input node shape), then Exponent PT/YT.

Each Tier A/B/C adapter automatically widens `composeGraph`'s manifest, so the composer gets more creative for free as they land. Pair this with prompt tuning so the agent reaches for delta-neutral / rate-shop framings.

---

## Open questions to resolve at scoping time

- **Perps node modeling** — terminal leg vs. allowing a "close position → asset out" edge. Affects composeGraph manifest semantics.
- **Flash-loan composite scope** — start with atomic leverage loop (replaces the multi-tx version) or collateral swap first?
- **Risk framing** — delta-neutral and perps need clear risk surfacing in the compose card (liquidation price, funding cost). Ties into the Workstream #8 risk primitives.
