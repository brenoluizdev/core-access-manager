import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um servidor autocontido para a imagem Docker (sem node_modules completo).
  output: "standalone",

  async rewrites() {
    const api = process.env.API_URL ?? "http://localhost:3333";

    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
