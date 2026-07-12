import type { NextConfig } from "next";
import path from "path";

const emptyMobileAdapter = path.join(
  __dirname,
  "vendor",
  "empty-mobile-adapter",
);

const nextConfig: NextConfig = {
  serverExternalPackages: ["@coral-xyz/anchor", "@solana/web3.js"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@solana-mobile/wallet-adapter-mobile": emptyMobileAdapter,
      "@solana-mobile/mobile-wallet-adapter-protocol": emptyMobileAdapter,
      "@solana-mobile/mobile-wallet-adapter-protocol-web3js": emptyMobileAdapter,
    };
    return config;
  },
};

export default nextConfig;
