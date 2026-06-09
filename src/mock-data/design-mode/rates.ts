const fetchedAt = Date.parse("2026-06-09T12:00:00.000Z");

const designModeRates = new Map([
  ["jito-sol-stake", { apy: 0.059, apyBreakdown: { staking: 0.045, mev: 0.014 }, fetchedAt }],
  ["blaze-sol-stake", { apy: 0.065, fetchedAt }],
  ["kamino-usdc-supply", { apy: 0.073, apyBreakdown: { supply: 0.061, rewards: 0.012 }, fetchedAt }],
  ["kamino-supply-and-borrow", { apy: -0.041, apyBreakdown: { borrowCost: -0.041 }, fetchedAt }],
  ["kamino-leverage-loop", { apy: 0.118, apyBreakdown: { stakingExposure: 0.082, borrowCost: -0.031, rewards: 0.067 }, fetchedAt }],
]);

export function getDesignModeAdapterRate(catalogItemId: string | undefined) {
  if (!catalogItemId) {
    return null;
  }

  return designModeRates.get(catalogItemId) ?? null;
}
