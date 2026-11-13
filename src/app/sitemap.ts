import type { MetadataRoute } from "next";

/** اللوحة تطبيق خلف الدخول — لا صفحات عامة تُفهرس */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
