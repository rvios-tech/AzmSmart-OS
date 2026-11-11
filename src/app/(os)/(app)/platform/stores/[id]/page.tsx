"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconBox, IconBrandWhatsapp, IconBuildingStore, IconCategory, IconCheck, IconExternalLink, IconHeadset, IconLoader2,
  IconPalette, IconReceipt, IconRosetteDiscountCheck, IconSettings, IconShoppingCart, IconUsers,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  INVOICE_KIND_LABELS, PLATFORM_INVOICE_STATUS_LABELS, SHOP_PLAN_LABELS, SHOP_SUB_STATUS_LABELS,
  setPlatformStoreStatus, setPlatformStoreVerified, updateStoreSubscription,
} from "@/lib/api/platform";
import { getStoreOverview, openStoreSupport, setStoreTemplate, type PlatformStoreOverview } from "@/lib/api/platform-ops";
import { startSupport } from "@/lib/auth/support";
import { formatBilling, formatDate, formatDateShort, formatNumber } from "@/lib/format";
import { STORE_TEMPLATES, TEMPLATE_TIER_LABEL, storeUrl, templateName } from "@/lib/shop/constants";
import { cn } from "@/lib/utils";

/** 0=مفعّل · 1=موقوف · 2=طلب بانتظار التفعيل */
const STATUS = [
  { label: "يعمل", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  { label: "موقوف", tone: "bg-destructive/10 text-destructive" },
  { label: "بانتظار التفعيل", tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
];

/** أدوات التاجر نفسها تُفتح بجلسة دعم — كل ما يفعله صاحب المتجر يفعله الفريق من هنا */
const MANAGE = [
  { label: "لوحة المتجر", href: "/dashboard", icon: IconBuildingStore },
  { label: "إعدادات المتجر", href: "/store/settings", icon: IconSettings },
  { label: "محرر شكل المتجر", href: "/store/appearance", icon: IconPalette },
  { label: "المنتجات", href: "/products", icon: IconBox },
  { label: "التصنيفات", href: "/categories", icon: IconCategory },
  { label: "الطلبات", href: "/orders", icon: IconShoppingCart },
  { label: "العملاء", href: "/store/customers", icon: IconUsers },
  { label: "الباقة والفواتير", href: "/store/plan", icon: IconReceipt },
];

export default function PlatformStorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [o, setO] = useState<PlatformStoreOverview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [plan, setPlan] = useState("0");
  const [extend, setExtend] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await getStoreOverview(id);
      setO(r);
      setPlan(String(r.subscription?.plan ?? 0));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المتجر.");
    }
  }, [id]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التنفيذ.");
    } finally {
      setBusy(null);
    }
  }

  async function manage(dest: string) {
    setBusy(`go:${dest}`);
    try {
      const s = await openStoreSupport(id);
      startSupport(s, dest, `/platform/stores/${id}`);
    } catch (err) {
      setBusy(null);
      toast.error(err instanceof ApiError ? err.message : "تعذّر فتح جلسة الدعم.");
    }
  }

  if (!o) return <div className="py-20 text-center"><IconLoader2 className="mx-auto size-6 animate-spin" /></div>;
  const s = o.store;
  const st = STATUS[s.status] ?? STATUS[0];
  const wa = o.owner?.phone || (s.whatsapp as string | undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title={s.name}
        description={`${o.company.name} · أُنشئ ${formatDateShort(s.createdAt)}`}
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href={storeUrl(s.slug)} target="_blank" rel="noopener"><IconExternalLink className="size-4" /> فتح المتجر</a>
          </Button>
          <Button onClick={() => void manage("/dashboard")} disabled={!!busy}>
            {busy === "go:/dashboard" ? <IconLoader2 className="size-4 animate-spin" /> : <IconHeadset className="size-4" />} أدِر هذا المتجر
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary" className={st.tone}>{st.label}</Badge>
        {s.verified && <Badge variant="secondary" className="bg-sky-500/10 text-sky-700"><IconRosetteDiscountCheck className="size-3.5" /> موثَّق</Badge>}
        <Badge variant="outline">{templateName(s.template)}</Badge>
        <Badge variant="outline">الباقة: {SHOP_PLAN_LABELS[o.subscription?.plan ?? 0]}</Badge>
        <span dir="ltr" className="text-muted-foreground">/{s.slug}{s.customDomain ? ` · ${s.customDomain}` : ""}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          ["المنتجات", formatNumber(o.counts.products)],
          ["الطلبات", formatNumber(o.counts.orders)],
          ["العملاء", formatNumber(o.counts.customers)],
          ["التصنيفات", formatNumber(o.counts.categories)],
          ["المبيعات", formatNumber(o.counts.sales)],
        ].map(([k, v]) => (
          <Card key={k} className="py-4"><CardContent className="space-y-1 px-4"><div className="text-xs text-muted-foreground">{k}</div><div className="text-2xl font-bold tabular-nums">{v}</div></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إدارة المتجر بأدوات صاحبه</CardTitle>
          <CardDescription>تفتح لوحة المتجر نفسها بجلسة دعم مدتها ساعتان، تُسجَّل في سجل نشاط الشركة. شريط أعلى الصفحة يعيدك إلى هنا.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {MANAGE.map((m) => (
            <Button key={m.href} variant="outline" className="h-auto justify-start py-3" disabled={!!busy} onClick={() => void manage(m.href)}>
              {busy === `go:${m.href}` ? <IconLoader2 className="size-4 animate-spin" /> : <m.icon className="size-4" />} {m.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>صاحب المتجر</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {o.owner ? (
              <>
                <div className="font-medium">{o.owner.displayName}</div>
                <div dir="ltr" className="text-muted-foreground">{o.owner.email}</div>
                {o.owner.lastLoginAt && <div className="text-muted-foreground">آخر دخول: {formatDate(o.owner.lastLoginAt)}</div>}
              </>
            ) : <p className="text-muted-foreground">لا مالك فعّال.</p>}
            {wa && (
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/${String(wa).replace(/\D/g, "")}`} target="_blank" rel="noopener"><IconBrandWhatsapp className="size-4" /> واتساب {String(wa)}</a>
              </Button>
            )}
            <div className="pt-2 text-xs text-muted-foreground">الشركة: {o.company.name} · <span dir="ltr">{o.company.companyCode}</span> · <Link className="underline" href={`/platform/companies/${o.company.id}`}>صفحة الشركة</Link></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الباقة والاشتراك</CardTitle>
            <CardDescription>
              {o.subscription
                ? `${SHOP_SUB_STATUS_LABELS[o.subscription.status] ?? ""}${o.subscription.currentPeriodEnd ? ` · ينتهي ${formatDateShort(o.subscription.currentPeriodEnd)}` : ""}`
                : "لا اشتراك مسجّل — المتجر على الباقة المجانية."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">الباقة</Label>
              <Select value={plan} onValueChange={setPlan} disabled={!o.subscription}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{SHOP_PLAN_LABELS.map((l, i) => <SelectItem key={i} value={String(i)}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">تمديد (أيام)</Label>
              <Input type="number" className="tabular-nums" placeholder="30" value={extend} onChange={(e) => setExtend(e.target.value)} disabled={!o.subscription} />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                disabled={!o.subscription || busy === "plan"}
                onClick={() =>
                  void run("plan", () => updateStoreSubscription(o.subscription!.id, {
                    plan: Number(plan),
                    ...(Number(extend) ? { extendDays: Number(extend), status: 0 } : {}),
                  }), "حُدّثت الباقة")
                }
              >
                {busy === "plan" ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />} تطبيق
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قالب المتجر</CardTitle>
          <CardDescription>التغيير فوري على الواجهة. القالب المدفوع يُمنح للمتجر (هدية أو بعد دفع خارج المنصة) فيبقى له إن عاد إليه.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STORE_TEMPLATES.map((t) => {
            const on = s.template === t.id;
            const owned = s.ownedTemplates.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                disabled={on || !!busy}
                onClick={() => void run(`tpl:${t.id}`, () => setStoreTemplate(id, t.id), `صار القالب «${t.name}»`)}
                className={cn("rounded-xl border p-3 text-start text-sm transition hover:border-primary disabled:cursor-default", on && "border-primary bg-primary/5")}
              >
                <div className="flex items-center justify-between font-medium">
                  {t.name}
                  {busy === `tpl:${t.id}` ? <IconLoader2 className="size-4 animate-spin" /> : on && <IconCheck className="size-4 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground">{TEMPLATE_TIER_LABEL[t.tier]}{owned && t.tier !== "free" ? " · مملوك" : ""}</div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>الحالة والتوثيق</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {s.status !== 2 && (
              <Button
                variant={s.status === 1 ? "default" : "outline"}
                className={s.status === 1 ? "" : "text-destructive"}
                disabled={busy === "status"}
                onClick={() => void run("status", () => setPlatformStoreStatus(id, s.status !== 1), s.status === 1 ? "أُعيد تشغيل المتجر" : "أُوقف المتجر")}
              >
                {s.status === 1 ? "إعادة تشغيل المتجر" : "إيقاف المتجر"}
              </Button>
            )}
            {s.status === 2 && <Button variant="outline" asChild><Link href="/platform/requests">مراجعة الطلب وتفعيله</Link></Button>}
            <Button variant="outline" disabled={busy === "verified"} onClick={() => void run("verified", () => setPlatformStoreVerified(id, !s.verified), s.verified ? "أُزيلت الشارة" : "مُنحت شارة التوثيق")}>
              <IconRosetteDiscountCheck className="size-4" /> {s.verified ? "إزالة التوثيق" : "منح شارة التوثيق"}
            </Button>
            <Button variant="outline" asChild><Link href={`/platform/stores/${id}/appearance`}><IconPalette className="size-4" /> محرر الشكل (بلا قفل)</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>آخر الفواتير</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {o.invoices.length === 0 && <p className="text-muted-foreground">لا فواتير.</p>}
            {o.invoices.map((inv) => (
              <div key={inv.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
                <span dir="ltr" className="font-medium">{inv.invoiceNumber}</span>
                <span className="text-muted-foreground">{INVOICE_KIND_LABELS[inv.kind] ?? ""}{inv.item ? ` — ${templateName(inv.item)}` : ""}</span>
                <Badge variant="secondary">{PLATFORM_INVOICE_STATUS_LABELS[inv.status] ?? ""}</Badge>
                <span className="ms-auto tabular-nums">{formatBilling(Number(inv.amount), inv.currency)}</span>
              </div>
            ))}
            <Button size="sm" variant="ghost" asChild><Link href="/platform/invoices">كل الفواتير</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
