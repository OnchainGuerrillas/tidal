import type { PreferenceProfile, ShellUser } from "./types";

export const shellUser: ShellUser = {
  name: "Alex Thompson",
  wallet: {
    addressLabel: "7X4P...9KLM",
    solBalanceLabel: "182.43 SOL",
    usdBalanceLabel: "$31,284.19",
  },
};

export const defaultPreferenceProfile: PreferenceProfile = {
  id: "default-preference-profile",
  title: "Tidal preferences",
  riskOptions: [
    { label: "Low Risk", checked: false },
    { label: "Medium Risk", checked: true },
    { label: "High Risk", checked: false },
    { label: "Show me options for all", checked: false },
  ],
  interestOptions: [
    { label: "Lending / Borrowing", checked: true },
    { label: "Yield Farming", checked: true },
    { label: "Liquidity Provision", checked: false },
    { label: "Memecoins", checked: false },
    { label: "RWAs", checked: false },
  ],
};
