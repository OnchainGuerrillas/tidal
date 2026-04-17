"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { defaultPreferenceProfile } from "@/mock-data/shell/navigation";
import type {
  InvestmentInterestLabel,
  PreferenceProfile,
  RiskAppetiteLabel,
} from "@/mock-data/shell/types";

type PreferenceProfileContextValue = {
  profile: PreferenceProfile;
  toggleRiskOption: (label: RiskAppetiteLabel) => void;
  toggleInterestOption: (label: InvestmentInterestLabel) => void;
};

const PreferenceProfileContext =
  createContext<PreferenceProfileContextValue | null>(null);

function cloneProfile(profile: PreferenceProfile): PreferenceProfile {
  return {
    ...profile,
    riskOptions: profile.riskOptions.map((option) => ({ ...option })),
    interestOptions: profile.interestOptions.map((option) => ({ ...option })),
  };
}

export function PreferenceProfileProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<PreferenceProfile>(() =>
    cloneProfile(defaultPreferenceProfile)
  );

  const toggleRiskOption = useCallback((label: RiskAppetiteLabel) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      riskOptions: currentProfile.riskOptions.map((option) =>
        option.label === label
          ? { ...option, checked: true }
          : { ...option, checked: false }
      ),
    }));
  }, []);

  const toggleInterestOption = useCallback((label: InvestmentInterestLabel) => {
    setProfile((currentProfile) => ({
      ...currentProfile,
      interestOptions: currentProfile.interestOptions.map((option) =>
        option.label === label
          ? { ...option, checked: !option.checked }
          : option
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      profile,
      toggleRiskOption,
      toggleInterestOption,
    }),
    [profile, toggleInterestOption, toggleRiskOption]
  );

  return (
    <PreferenceProfileContext.Provider value={value}>
      {children}
    </PreferenceProfileContext.Provider>
  );
}

export function usePreferenceProfile() {
  const context = useContext(PreferenceProfileContext);

  if (!context) {
    throw new Error(
      "usePreferenceProfile must be used within PreferenceProfileProvider."
    );
  }

  return context;
}
