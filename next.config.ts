import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "*": ["./_archive/**/*"],
  },
};

export default nextConfig;
