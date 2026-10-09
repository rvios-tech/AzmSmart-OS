"use client";

import { useEffect, useState } from "react";
import { IconAlertTriangle, IconDownload, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listStoreCustomers, type Store, type StoreCustomer } from "@/lib/api/shop";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { PAY_METHOD_LABEL } from "@/lib/shop/constants";
import { downloadCsv } from "@/lib/shop/csv";
import { useAnalytics } from "@/lib/shop/use-analytics";

const RANGES = [
  { days: 7, label: "٧ أيام" },
  { days: 30, label: "٣٠ يومًا" },
  { days: 90, label: "٩٠ يومًا" },
  { days: 365, label: "سنة" },
];

function ReportTable({
  headers,
  rows,
  empty = "لا بيانات في هذه الفترة.",
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
  empty?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h, i) => (
              <TableHead key={h} className={i === 0 ? "ps-6" : i === headers.length - 1 ? "pe-6 text-start" : ""}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (
                <TableCell key={j} className={`${j === 0 ? "ps-6 font-medium" : ""} ${j === r.length - 1 ? "pe-6 text-start tabular-nums" : "text-muted-foreground"}`}>{c}</TableCell>
              ))}
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={headers.length} className="py-10 text-center text-muted-foreground">{empty}</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ReportsView({ store }: { store: Store }) {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useAnalytics(store.id, days);
  const [customers, setCustomers] = useState<StoreCustomer[] | null>(null);
  const money = (n: number) => formatMoney(n, store.currency);
  const cur = store.currency;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listStoreCustomers(store.id);
        if (!cancelled) setCustomers(res.customers);
      } catch {
        if (!cancelled) setCustomers([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const file = (name: string) => `${store.slug}-${name}-${days}d.csv`;

  return (
    <div className="space-y-6">
      <PageHeader title="التقارير" description="أرقام قابلة للتصدير إلى Excel لمحاسبك أو لقرارك القادم.">
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <TabsList>
            {RANGES.map((r) => <TabsTrigger key={r.days} value={String(r.days)}>{r.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </PageHeader>

      {error && <Card><CardContent className="py-10 text-center text-destructive"><IconAlertTriangle className="mx-auto mb-2 size-6" />{error}</CardContent></Card>}
      {loading && <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…</div>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="إجمالي الطلبات" value={formatNumber(data.totals.orders)} />
            <MetricCard label="المبيعات" value={money(data.totals.revenue)} tone="good" />
            <MetricCard label="متوسط الطلب" value={money(data.totals.averageOrder)} />
            <MetricCard label="معدّل الإلغاء" value={formatPercent(data.totals.cancelRate)} tone={data.totals.cancelRate > 20 ? "warn" : undefined} />
          </div>

          <Tabs defaultValue="sales">
            <TabsList>
              <TabsTrigger value="sales">المبيعات اليومية</TabsTrigger>
              <TabsTrigger value="products">المنتجات</TabsTrigger>
              <TabsTrigger value="payments">الدفع والتوصيل</TabsTrigger>
              <TabsTrigger value="customers">العملاء</TabsTrigger>
              <TabsTrigger value="stock">المخزون</TabsTrigger>
            </TabsList>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>المبيعات اليومية</CardTitle>
                  <CardDescription>{formatDate(data.range.from)} — {formatDate(data.range.to)}</CardDescription>
                  <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                    <Button variant="outline" size="sm" onClick={() => downloadCsv(file("sales"), ["اليوم", "الطلبات", `المبيعات (${cur})`, "الزيارات"],
                      data.series.map((s) => [s.day, s.orders, s.revenue, s.visits]))}>
                      <IconDownload className="size-4" /> CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  <ReportTable headers={["اليوم", "الطلبات", "الزيارات", "المبيعات"]}
                    rows={[...data.series].reverse().filter((s) => s.orders || s.visits).map((s) => [formatDate(s.day), formatNumber(s.orders), formatNumber(s.visits), money(s.revenue)])} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>أفضل المنتجات</CardTitle>
                  <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                    <Button variant="outline" size="sm" onClick={() => downloadCsv(file("top-products"), ["المنتج", "القطع", `الإيراد (${cur})`],
                      data.topProducts.map((p) => [p.name, p.qty, p.revenue]))}>
                      <IconDownload className="size-4" /> CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  <ReportTable headers={["المنتج", "القطع", "الإيراد"]} empty="لا مبيعات مؤكدة في هذه الفترة."
                    rows={data.topProducts.map((p) => [p.name, formatNumber(p.qty), money(p.revenue)])} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>طرق الدفع</CardTitle></CardHeader>
                  <CardContent className="px-0">
                    <ReportTable headers={["الطريقة", "الطلبات", "المبيعات"]}
                      rows={Object.entries(data.byPayMethod).map(([k, v]) => [PAY_METHOD_LABEL[k] ?? k, formatNumber(v.orders), money(v.revenue)])} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>مناطق التوصيل</CardTitle></CardHeader>
                  <CardContent className="px-0">
                    <ReportTable headers={["المنطقة", "الطلبات", "المبيعات"]}
                      rows={Object.entries(data.byZone).map(([k, v]) => [k, formatNumber(v.orders), money(v.revenue)])} />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>عملاء المتجر</CardTitle>
                  <CardDescription>كل العملاء منذ بداية المتجر — الإنفاق من الطلبات المؤكدة والمكتملة</CardDescription>
                  <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
                    <Button variant="outline" size="sm" disabled={!customers?.length} onClick={() => downloadCsv(`${store.slug}-customers.csv`,
                      ["الاسم", "الجوال", "الطلبات", `الإنفاق (${cur})`, "آخر طلب"],
                      (customers ?? []).map((c) => [c.name, c.phone, c.ordersCount, c.spent, c.lastOrder ?? ""]))}>
                      <IconDownload className="size-4" /> CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-0">
                  <ReportTable headers={["العميل", "الجوال", "الطلبات", "الإنفاق"]} empty="لا عملاء بعد."
                    rows={(customers ?? []).map((c) => [c.name || "—", c.phone, formatNumber(c.ordersCount), money(c.spent)])} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock">
              <Card>
                <CardHeader><CardTitle>منتجات تحتاج إعادة تخزين</CardTitle></CardHeader>
                <CardContent className="px-0">
                  <ReportTable headers={["المنتج", "الحدّ الأدنى", "المتوفر"]} empty="مخزونك بخير."
                    rows={data.lowStock.map((p) => [p.name, formatNumber(p.lowStock || 5), p.qty <= 0 ? "نفد" : formatNumber(p.qty)])} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return <RequireStore allowSuspended>{(store) => <ReportsView store={store} />}</RequireStore>;
}
