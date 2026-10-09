import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./welcome.css";
import { Stage } from "@/welcome/components/stage/Stage";
import { SmoothScroll } from "@/welcome/components/layout/SmoothScroll";
import { Header } from "@/welcome/components/layout/Header";
import { Preloader } from "@/welcome/components/layout/Preloader";
import { LangProvider } from "@/welcome/components/i18n/LangProvider";

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

export const metadata: Metadata = {
  title: { absolute: "AzmSmart — نظام ذكي لإدارة الأعمال" },
  description:
    "AzmSmart من RVIOS: نظام ذكي يجمع المبيعات والمخزون والعملاء والمالية والموارد البشرية والتجارة الإلكترونية في منصة واحدة مترابطة.",
};

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
      </head>
      <body id="top">
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
