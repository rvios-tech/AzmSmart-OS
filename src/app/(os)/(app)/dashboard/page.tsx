"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconAlertTriangle,
  IconArrowUpRight,
  IconExternalLink,
  IconLoader2,
  IconPackage,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { SeriesChart } from "@/components/charts/series-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { getOverview, type Overview, type Store } from "@/lib/api/shop";
import { formatMoney, formatNumber, formatRelativeTime } from "@/lib/format";
import { PLAN_LABEL, orderStatus } from "@/lib/shop/constants";
import { useWorkspace } from "@/lib/workspace/workspace-context";

/** عنوان واجهة المتجر العامة — يضبطه النشر؛ افتراضيًا مسار نسبي للنسخ. */
const STOREFRONT = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "";

function OverviewView({ store }: { store: Store }) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setData(null);
      setError(null);
      try {
        const res = await getOverview(store.id);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل النظرة العامة.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const money = (n: number) => formatMoney(n, store.currency);

  return (
    <div className="space-y-6">
      <PageHeader title={store.name} description="ما يحدث في متجرك اليوم.">
        <Button variant="outline" asChild>
          <a href={`${STOREFRONT}/${store.slug}`} target="_blank" rel="noopener">
            <IconExternalLink className="size-4" /> زيارة المتجر
          </a>
        </Button>
        <Button asChild>
          <Link href="/products/new">إضافة منتج</Link>
        </Button>
      </PageHeader>

      {error && (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            <IconAlertTriangle className="mx-auto mb-2 size-6" />
            {error}
          </CardContent>
        </Card>
      )}

      {!error && !data && (
        <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
          <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="طلبات بانتظار التأكيد"
              value={formatNumber(data.kpis.pending)}
              hint="ابدأ بها — سرعة ردّك تصنع البيع"
              tone={data.kpis.pending > 0 ? "warn" : undefined}
            />
            <MetricCard label="مبيعات هذا الشهر" value={money(data.kpis.confirmed)} hint="طلبات مؤكدة أو مكتملة" tone="good" />
            <MetricCard label="زوّار آخر ٧ أيام" value={formatNumber(data.kpis.visits)} hint="زوّار فريدون" />
            <MetricCard label="منتجات معروضة" value={formatNumber(data.kpis.products)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>الزيارات والطلبات</CardTitle>
                <CardDescription>آخر ٧ أيام</CardDescription>
              </CardHeader>
              <CardContent>
                <SeriesChart
                  data={data.chart}
                  series={[
                    { key: "visits", label: "الزيارات", color: "var(--chart-1)" },
                    { key: "orders", label: "الطلبات", color: "var(--chart-2)" },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سعة الباقة</CardTitle>
                <CardDescription>{data.capacity.plan === "basic" ? "الباقة" : "باقة"} {PLAN_LABEL[data.capacity.plan]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-semibold tabular-nums">
                  {formatNumber(data.capacity.used)}
                  <span className="text-base font-normal text-muted-foreground">
                    {data.capacity.max === null ? " منتج · غير محدود" : ` من ${formatNumber(data.capacity.max)} منتجًا`}
                  </span>
                </p>
                {data.capacity.max !== null && <Progress value={data.capacity.pct} />}
                {data.capacity.plan !== "pro" && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/store/plan">ترقية الباقة</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>آخر الطلبات</CardTitle>
                <CardAction>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/orders">عرض الكل <IconArrowUpRight className="size-4" /></Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="ps-6">الرقم</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="pe-6 text-start">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="ps-6 font-medium">
                          <Link href={`/orders/${o.id}`} className="hover:underline" dir="ltr">{o.ref}</Link>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(o.createdAt)}</p>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{o.custName || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={orderStatus(o.status).tone}>{orderStatus(o.status).label}</Badge>
                        </TableCell>
                        <TableCell className="pe-6 text-start font-medium tabular-nums">{money(o.total)}</TableCell>
                      </TableRow>
                    ))}
                    {data.recent.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                          لا طلبات بعد — شارك رابط متجرك لتصلك أولى الطلبات.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>مخزون منخفض</CardTitle>
                <CardDescription>منتجات تحتاج إعادة تخزين</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.lowStock.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">مخزونك بخير.</p>
                )}
                {data.lowStock.slice(0, 6).map((p) => (
                  <Link key={p.id} href={`/products/${p.id}/edit`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted/50">
                    <IconPackage className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                    <Badge variant="secondary" className={p.qty <= 0 ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"}>
                      {p.qty <= 0 ? "نفد" : `بقي ${formatNumber(p.qty)}`}
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { status, isPlatform, isSite, ctx } = useWorkspace();
  const elsewhere = status === "ready" ? (isSite ? "/site" : isPlatform && (ctx?.storeCount ?? 0) === 0 ? "/platform" : null) : null;

  useEffect(() => {
    if (elsewhere) router.replace(elsewhere);
  }, [elsewhere, router]);

  if (status === "loading" || elsewhere) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-5 animate-spin" />
      </div>
    );
  }
  return <RequireStore allowSuspended>{(store) => <OverviewView store={store} />}</RequireStore>;
}
