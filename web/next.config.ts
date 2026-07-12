import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@coral-xyz/anchor", "@solana/web3.js"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
