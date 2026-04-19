import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server through common local hosts without losing hydration.
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*"],
  async redirects() {
    return [
      {
        source: "/sports",
        destination: "/sports/live",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "polymarket-upload.s3.us-east-2.amazonaws.com",
        port: "",
        pathname: "/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
