"use client";

import { useState } from "react";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { SeriesChart } from "@/components/charts/series-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Store } from "@/lib/api/shop";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { ORDER_STATUS, PAY_METHOD_LABEL } from "@/lib/shop/constants";
import { useAnalytics } from "@/lib/shop/use-analytics";

const RANGES = [
  { days: 7, label: "٧ أيام" },
  { days: 30, label: "٣٠ يومًا" },
  { days: 90, label: "٩٠ يومًا" },
];

function Breakdown({
  title,
  rows,
  money,
}: {
  title: string;
  rows: Array<{ label: string; orders: number; revenue?: number }>;
  money: (n: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.orders));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا بيانات في هذه الفترة.</p>}
        {rows.map((r) => (
          <div key={r.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{r.label}</span>
              <span className="text-muted-foreground tabular-nums">
                {formatNumber(r.orders)} طلب{r.revenue !== undefined && ` · ${money(r.revenue)}`}
              </span>
            </div>
            <Progress value={(r.orders / max) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AnalyticsView({ store }: { store: Store }) {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useAnalytics(store.id, days);
  const money = (n: number) => formatMoney(n, store.currency);

  return (
    <div className="space-y-6">
      <PageHeader title="التحليلات" description="أداء متجرك: المبيعات والزيارات والتحويل.">
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <TabsList>
            {RANGES.map((r) => <TabsTrigger key={r.days} value={String(r.days)}>{r.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </PageHeader>

      {error && (
        <Card><CardContent className="py-10 text-center text-destructive">
          <IconAlertTriangle className="mx-auto mb-2 size-6" />{error}
        </CardContent></Card>
      )}
      {loading && (
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="المبيعات" value={money(data.totals.revenue)} hint={`${formatNumber(data.totals.soldOrders)} طلب مؤكد/مكتمل`} tone="good" />
            <MetricCard label="متوسط الطلب" value={money(data.totals.averageOrder)} />
            <MetricCard label="الزوّار الفريدون" value={formatNumber(data.totals.visits)} />
            <MetricCard label="نسبة التحويل" value={formatPercent(data.totals.conversion)} hint="طلبات ÷ زوّار" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>المبيعات اليومية</CardTitle>
                <CardDescription>من الطلبات المؤكدة والمكتملة فقط</CardDescription>
              </CardHeader>
              <CardContent>
                <SeriesChart data={data.series} type="bar"
                  series={[{ key: "revenue", label: "المبيعات", color: "var(--chart-1)" }]}
                  valueFormatter={(v) => money(v)} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>الزيارات والطلبات</CardTitle>
                <CardDescription>كم زائرًا صار طلبًا</CardDescription>
              </CardHeader>
              <CardContent>
                <SeriesChart data={data.series}
                  series={[
                    { key: "visits", label: "الزيارات", color: "var(--chart-2)" },
                    { key: "orders", label: "الطلبات", color: "var(--chart-1)" },
                  ]} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Breakdown title="حالات الطلبات" money={money}
              rows={ORDER_STATUS.map((s) => ({ label: s.label, orders: data.byStatus[s.value] ?? 0 }))
                .filter((r) => r.orders > 0)} />
            <Breakdown title="طرق الدفع" money={money}
              rows={Object.entries(data.byPayMethod).map(([k, v]) => ({ label: PAY_METHOD_LABEL[k] ?? k, ...v }))} />
            <Breakdown title="مناطق التوصيل" money={money}
              rows={Object.entries(data.byZone).map(([k, v]) => ({ label: k, ...v }))} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>أفضل المنتجات</CardTitle>
                <CardDescription>حسب الإيراد في الفترة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.topProducts.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا مبيعات مؤكدة بعد.</p>}
                {data.topProducts.map((p, i) => (
                  <div key={(p.productId ?? p.name) + i} className="flex items-center gap-3">
                    <span className="w-5 text-center text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(p.qty)} قطعة</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{money(p.revenue)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>العملاء</CardTitle>
                <CardDescription>مشترو هذه الفترة</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-3xl font-semibold tabular-nums">{formatNumber(data.customers.buyers)}</p><p className="text-xs text-muted-foreground">مشترٍ</p></div>
                <div><p className="text-3xl font-semibold tabular-nums">{formatNumber(data.customers.newBuyers)}</p><p className="text-xs text-muted-foreground">جدد</p></div>
                <div><p className="text-3xl font-semibold tabular-nums text-emerald-600">{formatNumber(data.customers.returning)}</p><p className="text-xs text-muted-foreground">عائدون</p></div>
                <p className="col-span-3 text-xs text-muted-foreground">
                  معدّل الإلغاء {formatPercent(data.totals.cancelRate)} — العائدون هم حجّتك البيعية الحقيقية.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return <RequireStore allowSuspended>{(store) => <AnalyticsView store={store} />}</RequireStore>;
}
