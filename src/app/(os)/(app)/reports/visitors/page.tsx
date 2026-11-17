"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconBrandFacebook, IconBrandGoogle, IconBrandInstagram, IconBrandSnapchat, IconBrandTelegram, IconBrandTiktok,
  IconBrandWhatsapp, IconBrandX, IconBrandYoutube, IconDeviceDesktop, IconDeviceMobile, IconDeviceTablet, IconLink,
  IconLoader2, IconPointer, type Icon,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { SeriesChart } from "@/components/charts/series-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { getVisitors, type Store, type VisitorsReport } from "@/lib/api/shop";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { days: 1, label: "اليوم" },
  { days: 7, label: "٧ أيام" },
  { days: 30, label: "٣٠ يومًا" },
  { days: 90, label: "٩٠ يومًا" },
];

const DEVICES: { key: string; label: string; icon: Icon }[] = [
  { key: "mobile", label: "جوال", icon: IconDeviceMobile },
  { key: "desktop", label: "حاسوب", icon: IconDeviceDesktop },
  { key: "tablet", label: "جهاز لوحي", icon: IconDeviceTablet },
];

const SOURCES: Record<string, { label: string; icon: Icon }> = {
  direct: { label: "مباشر", icon: IconPointer },
  google: { label: "بحث Google", icon: IconBrandGoogle },
  instagram: { label: "إنستغرام", icon: IconBrandInstagram },
  facebook: { label: "فيسبوك", icon: IconBrandFacebook },
  whatsapp: { label: "واتساب", icon: IconBrandWhatsapp },
  tiktok: { label: "تيك توك", icon: IconBrandTiktok },
  snapchat: { label: "سناب شات", icon: IconBrandSnapchat },
  x: { label: "X (تويتر)", icon: IconBrandX },
  telegram: { label: "تيليجرام", icon: IconBrandTelegram },
  youtube: { label: "يوتيوب", icon: IconBrandYoutube },
};

const PAGES: Record<string, string> = {
  "/": "الصفحة الرئيسية", "/shop": "كل المنتجات", "/cart": "السلة", "/checkout": "إتمام الطلب",
  "/wishlist": "المفضلة", "/order": "تتبّع طلب", "/policies": "السياسات",
};
const pageLabel = (p: { path: string; name: string | null }) =>
  p.name ?? PAGES[p.path] ?? (p.path.startsWith("/p/") ? "صفحة منتج" : p.path.startsWith("/c/") ? "تصنيف" : p.path);

const WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

/** أعمدة بسيطة لساعات الذروة وأيامها — الأعلى بلون المتجر */
function Bars({ values, labels, every = 1 }: { values: number[]; labels: string[]; every?: number }) {
  const max = Math.max(1, ...values);
  const top = values.indexOf(Math.max(...values));
  return (
    <div className="flex h-40 items-end gap-1">
      {values.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${labels[i]}: ${formatNumber(v)}`}>
          <div className={cn("w-full rounded-t-sm transition-all", v && i === top ? "bg-primary" : "bg-primary/30")} style={{ height: `${Math.max(v ? 4 : 1, (v / max) * 100)}%` }} />
          <span className="h-4 text-[10px] text-muted-foreground tabular-nums">{i % every === 0 ? labels[i] : ""}</span>
        </div>
      ))}
    </div>
  );
}

function VisitorsView({ store }: { store: Store }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<VisitorsReport | null>(null);
  useEffect(() => {
    let on = true;
    void getVisitors(store.id, days).then(
      (r) => on && setData(r),
      (e) => { if (on) { setData(null); toast.error(e instanceof ApiError ? e.message : "تعذّر تحميل التقرير."); } },
    );
    return () => { on = false; };
  }, [store.id, days]);

  const totalDevices = data ? Object.values(data.devices).reduce((a, b) => a + b, 0) : 0;
  const totalSources = data ? data.sources.reduce((a, s) => a + s.visitors, 0) : 0;
  const peakHour = data && Math.max(...data.hours) > 0 ? data.hours.indexOf(Math.max(...data.hours)) : null;

  return (
    <div className="space-y-6">
      <PageHeader title="الزوار" description="من يزور متجرك، ومن أين يأتي، ومتى — أعداد مجمّعة فقط، بلا تتبّع لأشخاص.">
        <Tabs value={String(days)} onValueChange={(v) => { setData(null); setDays(Number(v)); }}>
          <TabsList>{RANGES.map((r) => <TabsTrigger key={r.days} value={String(r.days)}>{r.label}</TabsTrigger>)}</TabsList>
        </Tabs>
      </PageHeader>

      {!data ? (
        <div className="flex h-48 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="الزوار الفريدون" value={formatNumber(data.totals.visitors)} tone="good" />
            <MetricCard label="الصفحات المعروضة" value={formatNumber(data.totals.views)} hint={`${formatNumber(data.totals.pagesPerVisit)} صفحة لكل زائر`} />
            <MetricCard label="المتوسط اليومي" value={formatNumber(data.totals.avgDaily)} hint="زائر في اليوم" />
            <MetricCard label="ساعة الذروة" value={peakHour === null ? "—" : `${String(peakHour).padStart(2, "0")}:00`} hint="بتوقيت بلد المتجر" />
          </div>

          {data.range.days > 1 && (
            <Card>
              <CardHeader><CardTitle>الزيارات اليومية</CardTitle><CardDescription>الزوار الفريدون والصفحات التي تصفّحوها</CardDescription></CardHeader>
              <CardContent>
                <SeriesChart data={data.series} series={[
                  { key: "visitors", label: "الزوار", color: "var(--chart-1)" },
                  { key: "views", label: "الصفحات", color: "var(--chart-2)" },
                ]} />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>الأجهزة</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {totalDevices === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا زيارات في هذه الفترة.</p>}
                {totalDevices > 0 && DEVICES.filter((d) => data.devices[d.key]).map((d) => (
                  <div key={d.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2"><d.icon className="size-4 text-muted-foreground" />{d.label}</span>
                      <span className="text-muted-foreground tabular-nums">{formatPercent((data.devices[d.key] / totalDevices) * 100)}</span>
                    </div>
                    <Progress value={(data.devices[d.key] / totalDevices) * 100} />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>ساعات الذروة</CardTitle><CardDescription>متى يصل زوارك — انشر إعلاناتك قبلها بقليل</CardDescription></CardHeader>
              <CardContent><Bars values={data.hours} labels={data.hours.map((_, h) => String(h))} every={3} /></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle>أيام الذروة</CardTitle></CardHeader>
              <CardContent><Bars values={data.weekdays} labels={WEEKDAYS} /></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>مصادر الزيارات</CardTitle><CardDescription>من أين جاء الزائر أول مرة في يومه</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {data.sources.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا بيانات بعد.</p>}
                {data.sources.map((s) => {
                  const meta = SOURCES[s.source] ?? { label: s.source, icon: IconLink };
                  return (
                    <div key={s.source} className="flex items-center gap-3 text-sm">
                      <meta.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate" dir={SOURCES[s.source] ? undefined : "ltr"}>{meta.label}</span>
                      <span className="text-muted-foreground tabular-nums">{formatNumber(s.visitors)}</span>
                      <span className="w-12 text-end text-xs text-muted-foreground tabular-nums">{formatPercent((s.visitors / Math.max(1, totalSources)) * 100)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>أكثر الصفحات زيارة</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.pages.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا بيانات بعد.</p>}
                {data.pages.map((p, i) => (
                  <div key={p.path} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-xs text-muted-foreground tabular-nums">{formatNumber(i + 1)}</span>
                    <span className="min-w-0 flex-1 truncate" title={p.path}>{pageLabel(p)}</span>
                    <span className="text-muted-foreground tabular-nums">{formatNumber(p.views)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function VisitorsPage() {
  return <RequireStore allowSuspended>{(store) => <VisitorsView store={store} />}</RequireStore>;
}
