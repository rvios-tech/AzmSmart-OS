import Link from "next/link";
import { trafficSources } from "@/data";
import { formatCompact } from "@/lib/format";
import { BrandMark } from "@/components/brand-mark";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <BrandMark />
          عزم سمارت
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-zinc-950 lg:block">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(120% 120% at 100% 0%, var(--chart-1) 0%, transparent 45%), radial-gradient(120% 120% at 0% 100%, var(--chart-5) 0%, transparent 45%)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div />
          <blockquote className="space-y-4">
            <p className="text-2xl font-medium leading-snug tracking-tight">
              «غيّر عزم سمارت طريقة عمل فريقنا بالكامل. التحليلات وحدها وفّرت
              علينا تكاليف الاشتراك في الشهر الأول.»
            </p>
            <footer className="text-sm text-white/70">
              سارة الراشدي — مديرة النمو، دار الخليج للتقنية
            </footer>
          </blockquote>
          <div className="flex gap-8 border-t border-white/15 pt-6 text-sm text-white/70">
            {trafficSources.slice(0, 3).map((t) => (
              <div key={t.source}>
                <div className="text-2xl font-semibold text-white tabular-nums">
                  {formatCompact(t.value)}
                </div>
                {t.source}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
