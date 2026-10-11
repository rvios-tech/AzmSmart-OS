import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./welcome.css";
import { Stage } from "@/welcome/components/stage/Stage";
import { SmoothScroll } from "@/welcome/components/layout/SmoothScroll";
import { Header } from "@/welcome/components/layout/Header";
import { Preloader } from "@/welcome/components/layout/Preloader";
import { LangProvider } from "@/welcome/components/i18n/LangProvider";
import { SITE_URL } from "@/lib/site-url";
import { Analytics } from "@/components/analytics";

/**
 * الصفحة الترحيبية لعزم سمارت — تخطيط جذري مستقل عن النظام (`(os)`).
 *
 * التصميم من موقع RVIOS الرئيسي (`F:\rvios-web`، صفحة AzmSmart) بمسرحه
 * ثلاثي الأبعاد وخطوطه وأنماطه. ولأن أنماطه عامة (`body`، `:root`،
 * `html[data-theme]`) فلا تُحمَّل مع النظام: لكل تخطيط جذري حزمة CSS خاصة،
 * والانتقال بينهما تحميل صفحة كامل.
 */

/** العناوين العربية الكبيرة — متغيّر بمحور «long» لامتداد الكشائد */
const zain = localFont({ src: "../../welcome/fonts/ZainMobileSwashes-VF.woff2", variable: "--font-zain", display: "swap", weight: "400", fallback: [], adjustFontFallback: false });
/** العناوين اللاتينية */
const yapari = localFont({ src: "../../welcome/fonts/YapariTrial-Bold.woff2", variable: "--font-yapari", display: "swap", weight: "700", fallback: ["system-ui", "sans-serif"] });
/** النصوص */
const thm = localFont({
  src: [
    { path: "../../welcome/fonts/ThmanyahSerifText-Medium.woff2", weight: "500" },
    { path: "../../welcome/fonts/ThmanyahSerifText-Bold.woff2", weight: "700" },
  ],
  variable: "--font-thm", display: "swap", fallback: ["Georgia", "serif"],
});

const DESCRIPTION =
  "AzmSmart من RVIOS: نظام ذكي يجمع المبيعات والمخزون والعملاء والمالية والموارد البشرية والتجارة الإلكترونية في منصة واحدة مترابطة.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { absolute: "AzmSmart عزم سمارت — نظام إدارة الأعمال والمتاجر الإلكترونية | ERP سحابي" },
  description: DESCRIPTION,
  applicationName: "AzmSmart",
  keywords: [
    "عزم سمارت", "AzmSmart", "نظام إدارة أعمال", "نظام ERP", "نظام ERP سحابي", "برنامج إدارة شركات", "نظام إدارة متجر إلكتروني",
    "نظام مخزون", "برنامج مخزون", "نظام فواتير", "برنامج فواتير إلكترونية", "نظام محاسبة", "نظام CRM", "إدارة العملاء",
    "إدارة المشاريع والمهام", "نظام موارد بشرية", "لوحة تحكم للمتجر", "تقارير المبيعات", "نظام SaaS عربي",
    "برنامج إدارة أعمال في السعودية", "برنامج إدارة أعمال في اليمن", "ريفيوس", "RVIOS",
    "business management system", "cloud ERP", "inventory management", "invoicing software", "CRM", "project management",
    "online store management", "Arabic business software",
  ],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", siteName: "AzmSmart", title: "AzmSmart — نظام ذكي لإدارة الأعمال", description: DESCRIPTION, locale: "ar" },
  twitter: { card: "summary_large_image", title: "AzmSmart — نظام ذكي لإدارة الأعمال", description: DESCRIPTION },
};

/** بيانات منظّمة: تطبيق أعمال على الويب من RVIOS */
const appJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AzmSmart",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, Android",
  url: `${SITE_URL}/`,
  description: DESCRIPTION,
  publisher: { "@type": "Organization", name: "RVIOS Technologies", url: "https://rvios.com" },
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0E0D0D" },
    { media: "(prefers-color-scheme: light)", color: "#EFEBE0" },
  ],
};

/** يضبط الثيم قبل الرسم الأول لمنع الوميض */
const themeScript = `try{var t=localStorage.getItem('rv-theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark'}catch(e){document.documentElement.dataset.theme='dark'}`;

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" data-theme="dark" suppressHydrationWarning className={`${zain.variable} ${yapari.variable} ${thm.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: appJsonLd }} />
      </head>
      <body id="top">
        <Analytics />
        <LangProvider lang="ar">
          <Stage />
          <SmoothScroll />
          <Preloader />
          <Header />
          <main>{children}</main>
        </LangProvider>
      </body>
    </html>
  );
}
