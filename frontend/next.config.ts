import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Import the active route validator via next-env instead of both dev/build globals.
  experimental: { strictRouteTypes: true },
};
export default config;
