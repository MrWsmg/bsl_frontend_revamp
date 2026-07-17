import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    '@fullcalendar/react',
    '@fullcalendar/daygrid',
    '@fullcalendar/timegrid',
    '@fullcalendar/list',
    '@fullcalendar/interaction',
    '@fullcalendar/core',
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        //destination: "https://bsl-238481219614.europe-west1.run.app/api/:path*", // Proxy to Backend on 
        destination: "http://localhost:8000/api/:path*", // Proxy to local backend
      },
    ];
  },
};

export default nextConfig;


