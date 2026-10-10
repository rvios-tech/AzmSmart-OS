import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * متغيّرات `NEXT_PUBLIC_*` تُخبز في الحزمة وقت البناء — فبناء إنتاج بلا عنوان
 * الباكند ينتج تطبيقًا يطلب localhost بصمت. نوقفه هنا بدل اكتشافه بعد النشر.
 * `ALLOW_LOCAL_API=1` يسمح ببناء محلي للتجربة.
 */
function assertBuildEnv() {
  const api = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (process.env.ALLOW_LOCAL_API === "1") return;
  if (!api || /localhost|127\.0\.0\.1/.test(api)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL يجب أن يشير إلى الباكند المنشور (مثل https://api.rvios.com/api/v1) — القيمة الآن: "${api}". ` +
        "للبناء المحلي: ALLOW_LOCAL_API=1",
    );
  }
}

/**
 * Security headers for every page. CSP: scripts/styles from this origin (Next's inline bootstrap
 * needs 'unsafe-inline'); network calls only to this origin and the backend — so even injected
 * script can't post a session token to a foreign server via fetch; no plugins, no foreign framing.
 * Images allow any https (merchant/product URLs). Dev adds eval + HMR websockets.
 */
const originOf = (u?: string) => { try { return u ? new URL(u).origin : ""; } catch { return ""; } };
function securityHeaders(connect: string[], framing: "none" | "self") {
  const prod = process.env.NODE_ENV === "production";
  const self = framing === "self" ? "'self'" : "'none'";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com${prod ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "media-src 'self' blob: https:",
    "worker-src 'self' blob:",
    `connect-src 'self' https://cloudflareinsights.com ${connect.filter(Boolean).join(" ")}${prod ? "" : " ws: wss: http://localhost:*"}`,
    `frame-src ${self}`,
    `frame-ancestors ${self}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(prod ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: framing === "self" ? "SAMEORIGIN" : "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    ...(prod ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }] : []),
  ];
}

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders([originOf(process.env.NEXT_PUBLIC_API_URL)], "none") }];
  },
  // NEXT_DIST_DIR: بناء إنتاج بجانب خادم تطوير دون مشاركة .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
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

export default function config(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) assertBuildEnv();
  return nextConfig;
}
