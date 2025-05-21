import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Provide mock objects or disable modules for browser APIs during server-side rendering
      config.resolve.fallback = {
        ...config.resolve.fallback,
        navigator: false, // This tells webpack to effectively ignore 'navigator' on the server
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.braze.eu',
      },
    ],
  },
};

export default nextConfig;
