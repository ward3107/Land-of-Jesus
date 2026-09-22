/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; let Next transpile them.
  transpilePackages: ['@communitydirect/core', '@communitydirect/i18n'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
