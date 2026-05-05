/**
 * Pure yield-math helpers used by adapter strategy nodes to display
 * forward-looking projections. No React, no fetch — feed in numbers,
 * get numbers back. Easy to unit-test, easy to reason about.
 */

/**
 * Continuously compounded return. apy is a fraction (0.05 = 5%).
 * Returns the multiplier on principal after `years`.
 *
 *   compoundedReturn(0.05, 1) -> 1.0512710...   (5% APY -> 5.13% APR after compounding)
 *   compoundedReturn(0.05, 0.5) -> 1.025315...  (half a year)
 *
 * We use continuous compounding (e^(r·t)) because lending protocols
 * accrue interest per slot, not at fixed intervals — continuous is the
 * closest mathematical fit and the small-precision difference vs. daily
 * compounding (~0.001% per percent over a year) is meaningless for the
 * UI display.
 */
export function compoundedReturn(apy: number, years: number): number {
  if (!Number.isFinite(apy) || !Number.isFinite(years)) return 1;
  if (apy <= 0 || years <= 0) return 1;
  return Math.exp(apy * years);
}

/**
 * Project a principal forward by `years` at `apy`, returning the
 * principal + accrued interest in the same units as `principal`.
 *
 *   projectCompoundedValue(100, 0.05, 1) -> 105.127...
 */
export function projectCompoundedValue(
  principal: number,
  apy: number,
  years: number,
): number {
  return principal * compoundedReturn(apy, years);
}

/**
 * Geometric series sum: 1 + ltv + ltv² + ... + ltv^(loopCount-1).
 * Tells you how many times your initial collateral expands across N
 * recursive supply-and-borrow loops at a given target LTV.
 *
 * Examples:
 *   leverageFactor(2, 0.5)  -> 1.5     (1 + 0.5)
 *   leverageFactor(3, 0.5)  -> 1.75    (1 + 0.5 + 0.25)
 *   leverageFactor(5, 0.5)  -> 1.9375  (1 + 0.5 + 0.25 + 0.125 + 0.0625)
 *   leverageFactor(10, 0.7) -> 3.327...
 *   leverageFactor(Infinity, 0.7) -> 3.333... (1/(1-0.7))
 *
 * The series converges to 1/(1-ltv) as loopCount → ∞.
 */
export function leverageFactor(loopCount: number, ltv: number): number {
  if (!Number.isFinite(loopCount) || !Number.isFinite(ltv)) return 1;
  if (loopCount <= 0) return 1;
  if (ltv <= 0) return 1;
  // ltv >= 1 is theoretically infinite; clamp to a sane bound. Kamino
  // and similar protocols cap LTV at ~0.85 anyway.
  if (ltv >= 1) return 1 / (1 - 0.99);

  // Closed-form geometric sum: (1 - ltv^N) / (1 - ltv)
  return (1 - Math.pow(ltv, loopCount)) / (1 - ltv);
}

/**
 * Effective net yield on a leveraged supply position.
 *
 *   net = (leverageFactor × supplyApy) − ((leverageFactor − 1) × borrowApy)
 *
 * Intuition: every dollar of original principal earns `leverageFactor ×
 * supplyApy` in supply yield, but every dollar of *borrowed* principal
 * (which is `leverageFactor − 1` dollars per dollar of original
 * principal) costs `borrowApy`. Net them out.
 *
 * Returns a fraction (0.09 = 9% effective net APY). Negative values
 * mean the leverage is unprofitable at current rates.
 */
export function effectiveLeveragedYield(
  supplyApy: number,
  borrowApy: number,
  leverageFactor_: number,
): number {
  if (
    !Number.isFinite(supplyApy) ||
    !Number.isFinite(borrowApy) ||
    !Number.isFinite(leverageFactor_)
  ) {
    return 0;
  }
  return leverageFactor_ * supplyApy - (leverageFactor_ - 1) * borrowApy;
}

/**
 * Format a fractional APY (0.0521) as a percentage string ("5.21%").
 * Mirrors the formatApy helper in use-adapter-rate.ts but lives here
 * so the math module is self-contained.
 */
export function formatPercent(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/**
 * Format a USD amount with sane defaults: "$1.23" for small numbers,
 * "$1,234.56" for larger ones, "—" for non-finite.
 */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) < 0.01) return `$${value.toFixed(4)}`;
  if (Math.abs(value) >= 1000) {
    return `$${value.toLocaleString("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  }
  return `$${value.toFixed(2)}`;
}
