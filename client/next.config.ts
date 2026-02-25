import type { NextConfig } from "next";

function getApiImagePattern(): {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
} {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiUrl) {
    return { protocol: "http", hostname: "localhost", port: "4000" };
  }
  try {
    const url = new URL(apiUrl);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    };
  } catch {
    return { protocol: "http", hostname: "localhost", port: "4000" };
  }
}

const apiPattern = getApiImagePattern();

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      apiPattern,
    ],
  },
};

export default nextConfig;
