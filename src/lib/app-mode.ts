export type TidalAppMode = "live" | "design";

const rawAppMode = process.env.NEXT_PUBLIC_TIDAL_APP_MODE;

export const TIDAL_APP_MODE: TidalAppMode =
  rawAppMode === "design" ? "design" : "live";

export const isDesignMode = TIDAL_APP_MODE === "design";
