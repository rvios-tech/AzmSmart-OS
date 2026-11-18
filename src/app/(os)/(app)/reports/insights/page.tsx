"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconArrowDownRight, IconArrowUpRight, IconDownload, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { SeriesChart } from "@/components/charts/series-chart";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { getReport, type Store, type StoreReport } from "@/lib/api/shop";
import { formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { downloadCsv } from "@/lib/shop/csv";
import { ORDER_STATUS, PAY_METHOD_LABEL } from "@/lib/shop/constants";
import { cn } from "@/lib/utils";
import { PlanGate } from "@/components/shop/plan-gate";

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => ymd(new Date(Date.now() - n * 86_400_000));
const PRESETS = [
  { label: "٧ أيام", from: () => daysAgo(6), to: () => daysAgo(0) },
  { label: "٣٠ يومًا", from: () => daysAgo(29), to: () => daysAgo(0) },
  { label: "هذا الشهر", from: () => `${daysAgo(0).slice(0, 8)}01`, to: () => daysAgo(0) },
  { label: "٩٠ يومًا", from: () => daysAgo(89), to: () => daysAgo(0) },
  { label: "هذا العام", from: () => `${daysAgo(0).slice(0, 4)}-01-01`, to: () => daysAgo(0) },
];
const WEEKDAYS = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const SOURCE: Record<string, string> = { store: "من المتجر", manual: "طلب يدوي" };

function Change({ v }: { v: number | null }) {
  if (v === null) return <span className="text-xs text-muted-foreground">لا فترة سابقة للمقارنة</span>;
  const up = v >= 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-emerald-600" : "text-rose-600")}>
      {up ? <IconArrowUpRight className="size-3.5" /> : <IconArrowDownRight className="size-3.5" />}{formatPercent(Math.abs(v))} عن الفترة السابقة
    </span>
  );
}

function Bars({ values, labels, every = 1 }: { values: number[]; labels: string[]; every?: number }) {
  const max = Math.max(1, ...values);
  const top = values.indexOf(Math.max(...values));
  return (
    <div className="flex h-36 items-end gap-1">
      {values.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${labels[i]}: ${formatNumber(v)}`}>
          <div className={cn("w-full rounded-t-sm", v && i === top ? "bg-primary" : "bg-primary/30")} style={{ height: `${Math.max(v ? 4 : 1, (v / max) * 100)}%` }} />
          <span className="h-4 text-[10px] text-muted-foreground tabular-nums">{i % every === 0 ? labels[i] : ""}</span>
        </div>
      ))}
    </div>
  );
}

function Rows({ rows, money }: { rows: { label: string; value: number; sub?: string }[]; money?: boolean | ((n: number) => string) }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fmt = typeof money === "function" ? money : (n: number) => formatNumber(n);
  if (!rows.length) return <p className="py-4 text-center text-sm text-muted-foreground">لا بيانات في هذه الفترة.</p>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="space-y-1">
          <div className="flex justify-between gap-2 text-sm"><span className="truncate">{r.label}</span><span className="shrink-0 text-muted-foreground tabular-nums">{fmt(r.value)}{r.sub ? ` · ${r.sub}` : ""}</span></div>
          <Progress value={(r.value / max) * 100} />
        </div>
      ))}
    </div>
  );
}

function InsightsView({ store }: { store: Store }) {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(daysAgo(0));
  const [data, setData] = useState<StoreReport | null>(null);
  const money = (n: number) => formatMoney(n, store.currency);
  const cur = store.currency;
  const file = (name: string) => `${store.slug}-${name}-${from}_${to}.csv`;

  useEffect(() => {
    let on = true;
    void getReport(store.id, from, to).then((r) => on && setData(r), (e) => { if (on) toast.error(e instanceof ApiError ? e.message : "تعذّر تحميل التقرير."); });
    return () => { on = false; };
  }, [store.id, from, to]);

  const csvBtn = (onClick: () => void) => <Button variant="outline" size="sm" onClick={onClick}><IconDownload className="size-4" /> CSV</Button>;

  return (
    <div className="space-y-6">
      <PageHeader title="التقارير المفصّلة" description="اختر الفترة، وانتقل بين التقارير — كل جدول يُصدَّر إلى Excel." />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1"><span className="text-xs text-muted-foreground">من</span><Input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className="w-40" /></div>
          <div className="space-y-1"><span className="text-xs text-muted-foreground">إلى</span><Input type="date" value={to} min={from} max={daysAgo(0)} onChange={(e) => e.target.value && setTo(e.target.value)} className="w-40" /></div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const on = p.from() === from && p.to() === to;
              return <Button key={p.label} size="sm" variant={on ? "default" : "outline"} onClick={() => { setFrom(p.from()); setTo(p.to()); }}>{p.label}</Button>;
            })}
          </div>
          {data && <span className="ms-auto text-xs text-muted-foreground">{formatNumber(data.range.days)} يومًا · تُقارن بالفترة السابقة بالطول نفسه</span>}
        </CardContent>
      </Card>

      {!data ? (
        <div className="flex h-48 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="customers">العملاء</TabsTrigger>
            <TabsTrigger value="coupons">القسائم</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="space-y-1"><p className="text-sm text-muted-foreground">المبيعات</p><p className="text-2xl font-semibold tabular-nums">{money(data.sales.revenue)}</p><Change v={data.sales.change.revenue} /></CardContent></Card>
              <Card><CardContent className="space-y-1"><p className="text-sm text-muted-foreground">الطلبات المؤكدة</p><p className="text-2xl font-semibold tabular-nums">{formatNumber(data.sales.orders)}</p><Change v={data.sales.change.orders} /></CardContent></Card>
              <MetricCard label="متوسط الطلب" value={money(data.sales.averageOrder)} />
              <MetricCard label="نسبة التحويل" value={formatPercent(data.sales.conversion)} hint={`من ${formatNumber(data.sales.visitors)} زائر`} />
            </div>
            <Card>
              <CardHeader><div><CardTitle>المبيعات اليومية</CardTitle><CardDescription>الطلبات المؤكدة وما بعدها</CardDescription></div>
                <CardAction>{csvBtn(() => downloadCsv(file("sales"), ["اليوم", "الطلبات", `المبيعات (${cur})`], data.sales.series.map((s) => [s.day, s.orders, s.revenue])))}</CardAction></CardHeader>
              <CardContent><SeriesChart data={data.sales.series} type="bar" series={[{ key: "revenue", label: "المبيعات", color: "var(--chart-1)" }]} valueFormatter={money} /></CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>تفصيل الإيراد</CardTitle></CardHeader><CardContent>
                <dl className="space-y-2 text-sm">
                  {[["المنتجات", data.sales.products], ["التوصيل", data.sales.delivery], ["الخصومات والمكافآت", -data.sales.discounts], ["منها دُفع من محافظ العملاء", data.sales.walletPaid]].map(([l, v]) => (
                    <div key={l as string} className="flex justify-between"><dt className="text-muted-foreground">{l}</dt><dd className="tabular-nums">{money(v as number)}</dd></div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold"><dt>الإجمالي</dt><dd className="tabular-nums">{money(data.sales.revenue)}</dd></div>
                </dl>
              </CardContent></Card>
              <Card><CardHeader><CardTitle>طرق الدفع</CardTitle></CardHeader><CardContent>
                <Rows money={money} rows={Object.entries(data.sales.byPayMethod).map(([k, v]) => ({ label: PAY_METHOD_LABEL[k] ?? k, value: v.revenue, sub: `${formatNumber(v.orders)} طلب` }))} />
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="كل الطلبات" value={formatNumber(data.orders.total)} />
              <MetricCard label="بانتظار التأكيد" value={formatNumber(data.orders.pending)} tone={data.orders.pending ? "warn" : undefined} />
              <MetricCard label="نسبة الإلغاء" value={formatPercent(data.orders.cancelRate)} tone={data.orders.cancelRate > 15 ? "warn" : undefined} />
              <MetricCard label="نسبة الإرجاع" value={formatPercent(data.orders.returnRate)} />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card><CardHeader><CardTitle>الحالات</CardTitle></CardHeader><CardContent>
                <Rows rows={ORDER_STATUS.filter((s) => data.orders.byStatus[s.value]).map((s) => ({ label: s.label, value: data.orders.byStatus[s.value] }))} />
              </CardContent></Card>
              <Card className="lg:col-span-2"><CardHeader><CardTitle>ساعات الطلب</CardTitle><CardDescription>متى يطلب عملاؤك — بتوقيت بلد المتجر</CardDescription></CardHeader>
                <CardContent><Bars values={data.orders.hours} labels={data.orders.hours.map((_, h) => String(h))} every={3} /></CardContent></Card>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>أيام الطلب</CardTitle></CardHeader><CardContent><Bars values={data.orders.weekdays} labels={WEEKDAYS} /></CardContent></Card>
              <Card><CardHeader><CardTitle>مصدر الطلب</CardTitle></CardHeader><CardContent>
                <Rows rows={Object.entries(data.orders.bySource).map(([k, v]) => ({ label: SOURCE[k] ?? k, value: v }))} />
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader><div><CardTitle>الأكثر مبيعًا</CardTitle><CardDescription>{formatNumber(data.products.unitsSold)} قطعة مباعة</CardDescription></div>
                <CardAction>{csvBtn(() => downloadCsv(file("products"), ["المنتج", "القطع", `الإيراد (${cur})`, `الربح (${cur})`], data.products.top.map((p) => [p.name, p.qty, p.revenue, p.profit ?? ""])))}</CardAction></CardHeader>
              <CardContent className="overflow-x-auto px-0">
                <Table className="min-w-[520px]">
                  <TableHeader><TableRow><TableHead className="ps-6">المنتج</TableHead><TableHead>القطع</TableHead><TableHead>الإيراد</TableHead><TableHead className="pe-6">الربح</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.products.top.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">لا مبيعات في هذه الفترة.</TableCell></TableRow>}
                    {data.products.top.map((p) => (
                      <TableRow key={p.productId ?? p.name}>
                        <TableCell className="ps-6 font-medium">{p.productId ? <Link className="hover:underline" href={`/products/${p.productId}`}>{p.name}</Link> : p.name}</TableCell>
                        <TableCell className="tabular-nums">{formatNumber(p.qty)}</TableCell>
                        <TableCell className="tabular-nums">{money(p.revenue)}</TableCell>
                        <TableCell className="pe-6 tabular-nums">{p.profit == null ? <span className="text-muted-foreground">—</span> : money(p.profit)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card><CardHeader><CardTitle>التصنيفات</CardTitle></CardHeader><CardContent>
                <Rows money={money} rows={data.products.byCategory.map((c) => ({ label: c.name, value: c.revenue, sub: `${formatNumber(c.qty)} قطعة` }))} />
              </CardContent></Card>
              <Card><CardHeader><CardTitle>لم تُبع في هذه الفترة</CardTitle><CardDescription>منتجات معروضة تحتاج عرضًا أو صورة أفضل أو سعرًا آخر</CardDescription></CardHeader><CardContent className="space-y-2">
                {data.products.unsold.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">كل منتجاتك باعت شيئًا 👏</p>}
                {data.products.unsold.map((p) => (
                  <Link key={p.id} href={`/products/${p.id}`} className="flex justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <span className="truncate">{p.name}</span><span className="shrink-0 text-muted-foreground tabular-nums">{money(p.price)} · متوفر {formatNumber(p.qty)}</span>
                  </Link>
                ))}
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="اشتروا في الفترة" value={formatNumber(data.customers.buyers)} hint={`السابقة: ${formatNumber(data.customers.previousBuyers)}`} />
              <MetricCard label="عملاء جدد" value={formatNumber(data.customers.newBuyers)} tone="good" hint="أول شراء لهم في هذه الفترة" />
              <MetricCard label="عملاء عائدون" value={formatNumber(data.customers.returningBuyers)} hint="اشتروا قبلها أيضًا" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>الأعلى إنفاقًا</CardTitle>
                  <CardAction>{csvBtn(() => downloadCsv(file("top-customers"), ["العميل", "الجوال", "الطلبات", `الإنفاق (${cur})`], data.customers.top.map((c) => [c.name, c.phone, c.orders, c.spent])))}</CardAction></CardHeader>
                <CardContent className="space-y-2">
                  {data.customers.top.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا مشترين في هذه الفترة.</p>}
                  {data.customers.top.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-xs text-muted-foreground tabular-nums">{formatNumber(i + 1)}</span>
                      <span className="min-w-0 flex-1 truncate">{c.name || "بلا اسم"} <span className="text-xs text-muted-foreground" dir="ltr">{c.phone}</span></span>
                      <span className="text-muted-foreground tabular-nums">{formatNumber(c.orders)} طلب</span>
                      <b className="tabular-nums">{money(c.spent)}</b>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card><CardHeader><CardTitle>المناطق</CardTitle></CardHeader><CardContent>
                <Rows money={money} rows={Object.entries(data.customers.byZone).map(([k, v]) => ({ label: k, value: v.revenue, sub: `${formatNumber(v.orders)} طلب` }))} />
              </CardContent></Card>
            </div>
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <MetricCard label="طلبات بقسيمة" value={formatPercent(data.coupons.ordersWithCoupon)} hint="من الطلبات المؤكدة" />
            <Card>
              <CardHeader><CardTitle>أداء القسائم</CardTitle>
                <CardAction>{csvBtn(() => downloadCsv(file("coupons"), ["الرمز", "الاستخدامات", `الخصم (${cur})`, `المبيعات (${cur})`], data.coupons.rows.map((c) => [c.code, c.uses, c.discount, c.revenue])))}</CardAction></CardHeader>
              <CardContent className="overflow-x-auto px-0">
                <Table className="min-w-[480px]">
                  <TableHeader><TableRow><TableHead className="ps-6">الرمز</TableHead><TableHead>الاستخدامات</TableHead><TableHead>الخصم الممنوح</TableHead><TableHead className="pe-6">المبيعات بها</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.coupons.rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">لم تُستعمل قسيمة في هذه الفترة.</TableCell></TableRow>}
                    {data.coupons.rows.map((c) => (
                      <TableRow key={c.code}>
                        <TableCell className="ps-6 font-mono" dir="ltr">{c.code}</TableCell>
                        <TableCell className="tabular-nums">{formatNumber(c.uses)}</TableCell>
                        <TableCell className="tabular-nums">{money(c.discount)}</TableCell>
                        <TableCell className="pe-6 tabular-nums">{money(c.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <p className="text-sm text-muted-foreground">المخزون الآن — لا يتغيّر بالفترة.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="المنتجات المعروضة" value={formatNumber(data.inventory.live)} hint={`من ${formatNumber(data.inventory.products)}`} />
              <MetricCard label="نفدت" value={formatNumber(data.inventory.outOfStock)} tone={data.inventory.outOfStock ? "warn" : undefined} />
              <MetricCard label="قيمة المخزون بسعر البيع" value={money(data.inventory.value)} hint={`${formatNumber(data.inventory.units)} قطعة`} />
              {data.inventory.costValue !== undefined && <MetricCard label="قيمته بسعر التكلفة" value={money(data.inventory.costValue)} hint={`تكلفة معروفة لـ ${formatPercent(data.inventory.costCoverage)} من المنتجات`} />}
            </div>
            <Card><CardHeader><CardTitle>قاربت على النفاد</CardTitle><CardDescription>٣ قطع أو أقل</CardDescription></CardHeader><CardContent className="space-y-2">
              {data.inventory.low.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا منتجات قاربت على النفاد.</p>}
              {data.inventory.low.map((p) => (
                <Link key={p.id} href={`/products/${p.id}`} className="flex justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted"><span>{p.name}</span><b className="text-amber-600 tabular-nums">{formatNumber(p.qty)}</b></Link>
              ))}
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function InsightsPage() {
  return <RequireStore allowSuspended>{(store) => <PlanGate store={store} feature="advancedReports"><InsightsView store={store} /></PlanGate>}</RequireStore>;
}
