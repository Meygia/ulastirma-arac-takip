import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-libsql",
    "@prisma/adapter-libsql/web",
    "@libsql/client",
    "@libsql/client/web",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
