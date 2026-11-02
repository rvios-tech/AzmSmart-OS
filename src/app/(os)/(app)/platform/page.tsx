"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconAlertTriangle, IconArrowUpLeft, IconBuildingSkyscraper, IconCalendarDollar, IconFileInvoice, IconInbox,
  IconLoader2, IconSettings, IconShoppingBag, IconUserShield,
} from "@tabler/icons-react";

import { SeriesChart } from "@/components/charts/series-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api/client";
import { SHOP_PLAN_LABELS } from "@/lib/api/platform";
import { getPlatformOverview, type PlatformOverview } from "@/lib/api/workspace";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/format";
import { templateName } from "@/lib/shop/constants";
import { useWorkspace } from "@/lib/workspace/workspace-context";
import { cn } from "@/lib/utils";

const STATUS = [
  { label: "نشط", tone: "bg-emerald-500/10 text-emerald-600" },
  { label: "معلَّق", tone: "bg-rose-500/10 text-rose-600" },
  { label: "بانتظار التفعيل", tone: "bg-amber-500/10 text-amber-600" },
];

/**
 * لوحة فريق المنصة: مركز تحكم واحد بكل ما يجري عبر الشركات — ما ينتظر قرارًا أولًا، ثم الأرقام،
 * ثم كل أقسام الإدارة بأعدادها، ثم آخر ما أُنشئ.
 */
export default function PlatformOverviewPage() {
  const { ctx, roleLabel } = useWorkspace();
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const d = await getPlatformOverview();
        if (!cancelled) setData(d);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل لوحة المنصة.");
      }
    })();
    return () => {
      cancelled = true;
    };
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
    return <div className="flex h-64 items-center justify-center"><IconLoader2 className="size-5 animate-spin" /></div>;
  }

  const t = data.totals;
  const planTotal = Math.max(1, data.plans.reduce((a, p) => a + p.count, 0));
  const chart = data.series.map((s) => ({ ...s, day: `${s.month}-01` }));
  const actions = [
    { href: "/platform/requests", label: "طلبات متاجر بانتظار التفعيل", value: t.pendingRequests, urgent: true },
    { href: "/platform/invoices", label: "فواتير بانتظار الدفع أو المراجعة", value: t.pendingInvoices, urgent: true },
    { href: "/platform/subscriptions", label: "اشتراكات في مهلة السداد", value: t.graceSubscriptions, urgent: true },
    { href: "/platform/subscriptions", label: "اشتراكات تنتهي خلال ٧ أيام", value: t.expiringSoon, urgent: false },
    { href: "/platform/stores", label: "متاجر معلَّقة", value: t.suspendedStores, urgent: false },
  ];
  const waiting = actions.filter((a) => a.urgent).reduce((n, a) => n + a.value, 0);
  const modules = [
    { href: "/platform/requests", icon: IconInbox, title: "طلبات المتاجر", hint: `${formatNumber(t.pendingRequests)} بانتظار التفعيل` },
    { href: "/platform/stores", icon: IconShoppingBag, title: "المتاجر", hint: `${formatNumber(t.stores)} متجر · ${formatNumber(t.products)} منتج` },
    { href: "/platform/subscriptions", icon: IconCalendarDollar, title: "اشتراكات المتاجر", hint: `${formatNumber(t.paidSubscriptions)} مدفوع نشط` },
    { href: "/platform/invoices", icon: IconFileInvoice, title: "الفواتير", hint: `${formatCurrency(t.openInvoicesAmount)} مفتوحة` },
    { href: "/platform/companies", icon: IconBuildingSkyscraper, title: "الشركات", hint: `${formatNumber(t.companies)} شركة` },
    { href: "/platform/users", icon: IconUserShield, title: "الحسابات", hint: `${formatNumber(t.users)} حساب · ${formatNumber(t.staff)} من الفريق` },
    { href: "/platform/settings", icon: IconSettings, title: "إعدادات المنصة", hint: "الأسعار والقوالب والدفع" },
  ];

  return (
    <div className="space-y-6">
      {/* رأس اللوحة: من أنا، وكم ينتظر قراري */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-l from-primary/15 via-primary/5 to-transparent p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="font-normal">{roleLabel}</Badge>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">إدارة منصة RVIOS</h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {ctx?.user?.displayName ? `مرحبًا ${ctx.user.displayName}. ` : ""}
              {waiting > 0 ? `${formatNumber(waiting)} أمر ينتظر قرار الفريق الآن.` : "لا شيء ينتظر قرارًا الآن."}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-10 gap-y-3 sm:grid-cols-4">
            {[
              ["إيراد هذا الشهر", formatCurrency(t.revenueMonth)],
              ["المتاجر", formatNumber(t.stores)],
              ["الحسابات", formatNumber(t.users)],
              ["حسابات جديدة · ٧ أيام", formatNumber(t.newUsers7d)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="text-2xl font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>ينتظر قرارك</CardTitle>
            <CardDescription>كل ما يحتاج تدخل الفريق.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {actions.map((a) => (
              <Link key={a.label} href={a.href} className="flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted">
                <span>{a.label}</span>
                <span className={cn("min-w-8 rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums",
                  a.value > 0 ? (a.urgent ? "bg-amber-500/15 text-amber-600" : "bg-muted") : "text-muted-foreground")}>
                  {formatNumber(a.value)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle>أحدث طلبات المتاجر</CardTitle>
              <CardDescription>متاجر بباقات مدفوعة تنتظر الدفع والتفعيل.</CardDescription>
            </div>
            <Link href="/platform/requests" className="flex items-center gap-1 text-sm text-primary">الكل <IconArrowUpLeft className="size-4" /></Link>
          </CardHeader>
          <CardContent>
            {data.recentRequests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">لا طلبات بانتظار التفعيل.</p>
            ) : (
              <ul className="divide-y">
                {data.recentRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.organization.name} · قالب {templateName(r.template)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* كل أقسام الإدارة بأعدادها */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5">
            <m.icon className="mb-3 size-6 text-primary" />
            <p className="font-medium">{m.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الإيراد الشهري</CardTitle>
            <CardDescription>فواتير مدفوعة — آخر ٦ أشهر.</CardDescription>
          </CardHeader>
          <CardContent>
            <SeriesChart type="bar" data={chart} series={[{ key: "revenue", label: "الإيراد", color: "var(--chart-1)" }]} valueFormatter={(v) => formatCurrency(v)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>توزيع الباقات</CardTitle>
            <CardDescription>اشتراكات المتاجر الحالية.</CardDescription>
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
            <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <div><p className="text-xs text-muted-foreground">طلبات الشراء في المتاجر</p><p className="text-lg font-semibold tabular-nums">{formatNumber(t.orders)}</p></div>
              <div><p className="text-xs text-muted-foreground">الشركات</p><p className="text-lg font-semibold tabular-nums">{formatNumber(t.companies)}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>النمو</CardTitle>
          <CardDescription>شركات ومتاجر جديدة كل شهر.</CardDescription>
        </CardHeader>
        <CardContent>
          <SeriesChart data={chart} series={[
            { key: "companies", label: "شركات جديدة", color: "var(--chart-1)" },
            { key: "stores", label: "متاجر جديدة", color: "var(--chart-2)" },
          ]} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>أحدث المتاجر</CardTitle>
            <Link href="/platform/stores" className="flex items-center gap-1 text-sm text-primary">الكل <IconArrowUpLeft className="size-4" /></Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {data.recentStores.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.organization.name} · {formatNumber(s.products)} منتج · {formatNumber(s.orders)} طلب</p>
                  </div>
                  <Badge variant="secondary" className={cn("shrink-0", STATUS[s.status]?.tone)}>{STATUS[s.status]?.label}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>أحدث الحسابات</CardTitle>
            <Link href="/platform/users" className="flex items-center gap-1 text-sm text-primary">الكل <IconArrowUpLeft className="size-4" /></Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.displayName}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">{u.email}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{u.isPlatformStaff ? "فريق المنصة · " : ""}{formatRelativeTime(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
