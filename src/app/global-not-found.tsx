import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { IconLifebuoy, IconMapPinQuestion } from "@tabler/icons-react";

import "./globals.css";
import { ErrorState } from "@/components/error-state";

/**
 * صفحة ٤٠٤ لكل المسارات غير الموجودة. لازمة لأن للتطبيق تخطيطَين جذريَّين
 * — `(welcome)` للصفحة الترحيبية و`(os)` للنظام — فلا تخطيط واحد تُبنى منه.
 * تُصيَّر بلا تخطيط، فتستورد الأنماط والخط بنفسها.
 */
const tajawal = Tajawal({ variable: "--font-sans", subsets: ["arabic", "latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = { title: "الصفحة غير موجودة · عزم سمارت" };

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ErrorState
          code="404"
          title="الصفحة غير موجودة"
          description="الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها. تحقق من العنوان، أو عد إلى لوحة التحكم للمتابعة."
          icon={IconMapPinQuestion}
          secondaryHref="/help"
          secondaryLabel="تواصل مع الدعم"
          secondaryIcon={IconLifebuoy}
        />
      </body>
    </html>
  );
}
