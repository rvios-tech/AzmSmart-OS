import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // تخطيطان جذريان — (welcome) و(os) — فصفحة ٤٠٤ عامة واحدة (`app/global-not-found.tsx`)
  experimental: { globalNotFound: true },
  async redirects() {
    return [
      { source: "/admin", destination: "/platform", permanent: false },
      { source: "/admin/organizations/:id", destination: "/platform/companies/:id", permanent: false },
      { source: "/admin/:path*", destination: "/platform/:path*", permanent: false },
      // الصفحة الترحيبية صارت الجذر — بتصميم موقع RVIOS الرئيسي
      { source: "/landing", destination: "/", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      // DiceBear — algorithmically generated, MIT-licensed avatars & shapes
      // (no real people, safe for commercial & open-source use).
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
};

export default nextConfig;
