import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server through common local hosts without losing hydration.
  allowedDevOrigins: [
    "127.0.0.1",
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.20.*.*",
    "172.21.*.*",
    "172.22.*.*",
    "172.23.*.*",
    "172.24.*.*",
    "172.25.*.*",
    "172.26.*.*",
    "172.27.*.*",
    "172.28.*.*",
    "172.29.*.*",
    "172.30.*.*",
    "172.31.*.*",
    "192.168.*.*",
  ],
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
