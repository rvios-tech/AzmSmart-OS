import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeConfigProvider } from "@/components/theme-customizer";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/auth-context";

const tajawal = Tajawal({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: {
    default: "عزم سمارت",
    template: "%s · عزم سمارت",
  },
  description:
    "نظام إدارة الأعمال الذكي – منصة متكاملة لإدارة المبيعات والعملاء والمشاريع بكفاءة عالية.",
  // لوحة التحكم وصفحات العرض خارج نتائج البحث — الصفحة الترحيبية وحدها تُفهرَس
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeConfigProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ThemeConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
