/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during builds
  },
  images: {
    unoptimized: true, // Disable image optimization
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during builds
  },
  experimental: {
    appDir: true, // Ensure experimental app directory features are handled
  },
};

module.exports = nextConfig;
