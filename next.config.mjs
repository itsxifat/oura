/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,

  experimental: {
    serverActions: {
      // Config must be here for bodySizeLimit in many Next.js versions
      bodySizeLimit: '50mb',
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;