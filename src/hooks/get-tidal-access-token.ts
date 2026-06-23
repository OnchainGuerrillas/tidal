import { getAccessToken } from "@privy-io/react-auth";

import { isDesignMode } from "@/lib/app-mode";

const DESIGN_MODE_ACCESS_TOKEN = "design-mode-token";

export async function getTidalAccessToken(): Promise<string | null> {
  if (isDesignMode) {
    return DESIGN_MODE_ACCESS_TOKEN;
  }

  return getAccessToken();
}
