"use client";

import { usePrivy } from "@privy-io/react-auth";

import { isDesignMode } from "@/lib/app-mode";

export type TidalAuth = {
  ready: boolean;
  authenticated: boolean;
  login: () => void | Promise<void>;
  logout: () => void | Promise<void>;
};

const designModeAuth: TidalAuth = {
  ready: true,
  authenticated: true,
  login: () => {},
  logout: () => {},
};

function useDesignModeTidalAuth(): TidalAuth {
  return designModeAuth;
}

function useLiveTidalAuth(): TidalAuth {
  const { ready, authenticated, login, logout } = usePrivy();

  return {
    ready,
    authenticated,
    login: () => {
      login();
    },
    logout: () => logout(),
  };
}

export const useTidalAuth = isDesignMode
  ? useDesignModeTidalAuth
  : useLiveTidalAuth;
