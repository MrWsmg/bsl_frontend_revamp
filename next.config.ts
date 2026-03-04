import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://bsl-api.fyatua.online/api/:path*",
      },
    ];
  },
};

export default nextConfig;
