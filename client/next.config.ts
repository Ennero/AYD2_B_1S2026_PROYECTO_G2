import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET || "https://logitrans-api.onrender.com";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    // Same-origin proxy avoids CORS failures when Render free tier cold-starts
    // and briefly answers 404 without Access-Control-* headers.
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
