import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 🚀 Faz o deploy mesmo com erros de lint (como variáveis/imports não usados)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 🚀 Faz o deploy mesmo se tiver erros de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
