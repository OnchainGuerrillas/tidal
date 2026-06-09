"use client";

import { useWallets } from "@privy-io/react-auth/solana";

import { isDesignMode } from "@/lib/app-mode";

export type TidalWallet = {
  address: string;
};

export type TidalWallets = {
  wallets: TidalWallet[];
};

const designModeWallets: TidalWallets = {
  wallets: [
    {
      address: "DesignMode111111111111111111111111111111111",
    },
  ],
};

function useDesignModeTidalWallets(): TidalWallets {
  return designModeWallets;
}

function useLiveTidalWallets(): TidalWallets {
  const { wallets } = useWallets();

  return { wallets };
}

export const useTidalWallets = isDesignMode
  ? useDesignModeTidalWallets
  : useLiveTidalWallets;
