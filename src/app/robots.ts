import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

/**
 * الصفحة الترحيبية وحدها للفهرسة. لوحة التحكم خلف الدخول، وصفحات العرض
 * التجريبية (تذاكر، تقارير…) بيانات تمثيلية لا يصحّ أن تظهر في نتائج البحث.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/$", disallow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
