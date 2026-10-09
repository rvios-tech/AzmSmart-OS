import Link from "next/link";
import type { Metadata } from "next";
import {
  IconTool,
  IconClock,
  IconArrowLeft,
  IconPointFilled,
  IconBrandGithub,
  IconBrandX,
  IconBrandDiscord,
  IconMail,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export const metadata: Metadata = {
  title: "سنعود بعد قليل",
  description:
    "يخضع نظام عزم سمارت لصيانة مجدولة وسيعود للعمل خلال وقت قصير.",
};

const social = [
  { icon: IconBrandGithub, label: "GitHub", href: "#" },
  { icon: IconBrandX, label: "X", href: "#" },
  { icon: IconBrandDiscord, label: "Discord", href: "#" },
  { icon: IconMail, label: "البريد الإلكتروني", href: "#" },
];

export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      {/* الخلفية */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
        <div
          className="absolute left-1/2 top-1/3 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, var(--chart-1), transparent), radial-gradient(closest-side at 65% 55%, var(--chart-5), transparent)",
          }}
        />
      </div>

      {/* الشريط العلوي */}
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <BrandMark />
          <span className="tracking-tight">عزم سمارت</span>
        </Link>
        <Badge
          variant="secondary"
          className="gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        >
          <IconPointFilled className="size-3 animate-pulse" />
          الصيانة جارية
        </Badge>
      </header>

      {/* المحتوى */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-card shadow-sm">
            <IconTool className="size-8 text-primary" />
          </div>

          <Badge
            variant="secondary"
            className="mt-8 gap-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400"
          >
            <IconClock className="size-3.5" />
            المدة المتوقعة للتوقف — نحو 45 دقيقة
          </Badge>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            سنعود بعد قليل
          </h1>
          <p className="mx-auto mt-4 max-w-md text-balance text-lg text-muted-foreground">
            نجري تحسينات سريعة على عزم سمارت، وسنعود للعمل خلال وقت قصير.
            شكراً لسعة صدركم.
          </p>

          {/* الاشتراك بالتنبيه */}
          <form className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              placeholder="ahmed@azmsmart.sa"
              aria-label="البريد الإلكتروني"
              dir="ltr"
              defaultValue=""
              className="h-11 flex-1"
            />
            <Button type="submit" size="lg" className="h-11 gap-2 px-5 text-sm">
              نبّهني <IconArrowLeft className="size-4" />
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            سنراسلك فور عودتنا. بلا رسائل مزعجة، إطلاقاً.
          </p>

          {/* حالة النظام وروابط التواصل */}
          <div className="mx-auto mt-10 flex flex-col items-center gap-5">
            <Link
              href="#"
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm shadow-sm transition-colors hover:bg-muted"
            >
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              حالة جميع الأنظمة
              <IconArrowLeft className="size-3.5 text-muted-foreground" />
            </Link>

            <div className="flex items-center gap-2">
              {social.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex size-10 items-center justify-center rounded-lg border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                >
                  <s.icon className="size-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* التذييل */}
      <footer className="px-6 py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} عزم سمارت. جميع الحقوق محفوظة.
      </footer>
    </div>
  );
}
