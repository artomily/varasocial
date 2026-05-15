import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack/webpack from trying to bundle 0G Storage SDK and its
  // dependencies (ethers, @0gfoundation/0g-storage-ts-sdk). These are only
  // used at runtime when OG_PRIVATE_KEY is set, via a dynamic import.
  serverExternalPackages: [
    "@0gfoundation/0g-storage-ts-sdk",
    "ethers",
  ],
};

export default nextConfig;
