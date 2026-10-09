"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { SeriesChart } from "@/components/charts/series-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api/client";
import { SHOP_PLAN_LABELS } from "@/lib/api/platform";
import { getPlatformOverview, type PlatformOverview } from "@/lib/api/workspace";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function PlatformOverviewPage() {
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setData(await getPlatformOverview());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "تعذّر تحميل نظرة المنصة.");
      }
    })();
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <IconAlertTriangle className="mx-auto mb-2 size-6 text-destructive" />
          {error}
        </CardContent>
      </Card>
    );
  }
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const t = data.totals;
  const planTotal = Math.max(1, data.plans.reduce((a, p) => a + p.count, 0));
  const chart = data.series.map((s) => ({ ...s, day: `${s.month}-01` }));
  const attention = t.pendingInvoices + t.graceSubscriptions + t.expiringSoon;

  return (
    <div className="space-y-6">
      <PageHeader title="نظرة على المنصة" description="الشركات والمتاجر والاشتراكات والإيرادات عبر كل المستأجرين." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="الشركات" value={formatNumber(t.companies)} hint={`${formatNumber(t.users)} مستخدم`} />
        <MetricCard
          label="المتاجر"
          value={formatNumber(t.stores)}
          hint={t.suspendedStores ? `${formatNumber(t.suspendedStores)} معلَّق` : "كلها نشطة"}
          tone={t.suspendedStores ? "warn" : undefined}
        />
        <MetricCard label="اشتراكات مدفوعة نشطة" value={formatNumber(t.paidSubscriptions)} tone="good" />
        <MetricCard label="طلبات المتاجر" value={formatNumber(t.orders)} hint={`${formatNumber(t.products)} منتج`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الإيراد الشهري</CardTitle>
            <CardDescription>فواتير الاشتراك المدفوعة — آخر ٦ أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart
              type="bar"
              data={chart}
              series={[{ key: "revenue", label: "الإيراد", color: "var(--chart-1)" }]}
              valueFormatter={(v) => formatCurrency(v)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>يحتاج انتباهك</CardTitle>
            <CardDescription>أمور تنتظر فريق المنصة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row href="/platform/invoices" label="فواتير بانتظار المراجعة" value={t.pendingInvoices} />
            <Row href="/platform/subscriptions" label="اشتراكات في المهلة" value={t.graceSubscriptions} />
            <Row href="/platform/subscriptions" label="تنتهي خلال ٧ أيام" value={t.expiringSoon} />
            {attention === 0 && <p className="pt-2 text-muted-foreground">لا شيء يحتاج تدخلًا الآن.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>النمو</CardTitle>
            <CardDescription>شركات ومتاجر جديدة كل شهر.</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart
              data={chart}
              series={[
                { key: "companies", label: "شركات جديدة", color: "var(--chart-1)" },
                { key: "stores", label: "متاجر جديدة", color: "var(--chart-2)" },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الباقات</CardTitle>
            <CardDescription>اشتراكات المتاجر.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[0, 1, 2].map((p) => {
              const n = data.plans.find((x) => x.plan === p)?.count ?? 0;
              return (
                <div key={p} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{SHOP_PLAN_LABELS[p]}</span>
                    <span className="tabular-nums text-muted-foreground">{formatNumber(n)}</span>
                  </div>
                  <Progress value={(n / planTotal) * 100} />
                </div>
              );
            })}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/platform/subscriptions">إدارة الاشتراكات</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted">
      <span>{label}</span>
      <span className={`font-semibold tabular-nums ${value > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
        {formatNumber(value)}
      </span>
    </Link>
  );
}
