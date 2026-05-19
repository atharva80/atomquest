/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Don't fail the build on ESLint warnings (img, font, etc.)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Don't fail the build on TS errors (belt-and-suspenders for deploy)
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
