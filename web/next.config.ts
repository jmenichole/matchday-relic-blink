import type { NextConfig } from "next";
import path from "path";

const emptyMobile = path.join(__dirname, "vendor", "empty-mobile-adapter");

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana-mobile/wallet-adapter-mobile": emptyMobile,
      "@solana-mobile/mobile-wallet-adapter-protocol": emptyMobile,
      "@solana-mobile/mobile-wallet-adapter-protocol-web3js": emptyMobile,
    };
    return config;
  },
};

export default nextConfig;
