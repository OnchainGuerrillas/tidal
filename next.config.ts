import type { NextConfig } from "next";

// Tripwire: design mode (mocked auth/wallet/data for frontend work) must
// never reach the live site. Preview deployments and local builds are
// allowed to opt in; only the production deployment is fenced off.
// VERCEL_ENV is "production" solely on prod deploys — previews report
// "preview" and local builds leave it undefined.
if (
  process.env.VERCEL_ENV === "production" &&
  process.env.NEXT_PUBLIC_TIDAL_APP_MODE === "design"
) {
  throw new Error(
    "NEXT_PUBLIC_TIDAL_APP_MODE=design is set on a production deployment. " +
      "Design mode disables live auth, wallets, and data — remove the env var " +
      "from the production environment before deploying.",
  );
}

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": ["./_archive/**/*"],
  },
  // Kamino's klend-sdk transitively pulls WASM bindings from Orca
  // (@orca-so/whirlpools-core) that Turbopack can't inline into an
  // API-route bundle. Marking these as external keeps them as runtime
  // Node resolutions instead of build-time bundling.
  serverExternalPackages: [
    "@kamino-finance/klend-sdk",
    "@orca-so/whirlpools-core",
    "@orca-so/whirlpools-client",
  ],
};

export default nextConfig;
