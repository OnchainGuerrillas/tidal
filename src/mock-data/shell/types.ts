export const riskAppetiteLabels = [
  "Low Risk",
  "Medium Risk",
  "High Risk",
  "Show me options for all",
] as const;

export type RiskAppetiteLabel = (typeof riskAppetiteLabels)[number];

export const investmentInterestLabels = [
  "Lending / Borrowing",
  "Yield Farming",
  "Liquidity Provision",
  "Memecoins",
  "RWAs",
] as const;

export type InvestmentInterestLabel = (typeof investmentInterestLabels)[number];

export type PreferenceOption<TLabel extends string> = {
  label: TLabel;
  checked: boolean;
};

export type PreferenceProfile = {
  id: string;
  title: string;
  riskOptions: PreferenceOption<RiskAppetiteLabel>[];
  interestOptions: PreferenceOption<InvestmentInterestLabel>[];
};

export type WalletSummary = {
  addressLabel: string;
  solBalanceLabel: string;
  usdBalanceLabel: string;
};

export type ShellUser = {
  name: string;
  wallet: WalletSummary;
};
