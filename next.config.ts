import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The sidebar's "Log out" button lives bottom-left, so keep the dev badge out of its way.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
