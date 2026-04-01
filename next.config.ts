import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://bsl-238481219614.europe-west1.run.app/api/:path*", // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
