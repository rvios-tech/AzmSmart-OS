"use client";

import { PayAccounts } from "@/components/pay-accounts";
import type { PayAccount } from "@/lib/api/platform-ops";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconCrown, IconLoader2, IconMinus, IconSparkles } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { ImageUploadButton } from "@/components/image-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import {
  createShopInvoice, getPricing, getSubscription, listShopInvoices, submitInvoiceProof,
  type Pricing, type ShopInvoice, type Store, type Subscription,
} from "@/lib/api/shop";
import { formatBilling, formatDate, formatNumber } from "@/lib/format";
import { templateName } from "@/lib/shop/constants";
import { PLAN_ORDER, loadPlans, periodLabel, type PlanCode, type PlansCatalog } from "@/lib/shop/plans";
import { useStore } from "@/lib/shop/store-context";
import { cn } from "@/lib/utils";

const KIND = ["اشتراك", "بناء متجر", "دومين", "متجر إضافي", "قالب"];
const INVOICE_STATUS = [
  { label: "بانتظار الدفع", tone: "bg-amber-500/10 text-amber-600" },
  { label: "قيد المراجعة", tone: "bg-sky-500/10 text-sky-600" },
  { label: "مدفوعة", tone: "bg-emerald-500/10 text-emerald-600" },
  { label: "ملغاة", tone: "bg-rose-500/10 text-rose-600" },
];
const SUB_STATUS = ["نشط", "في المهلة", "منتهٍ"];
const rank = (p: string) => PLAN_ORDER.indexOf(p as PlanCode);
const lim = (v: number | null, unit: string) => (v === null ? `${unit} بلا حد` : `${formatNumber(v)} ${unit}`);

/** أبرز ما في الباقة — الحدود ثم ما تضيفه على التي قبلها */
function highlights(cat: PlansCatalog, code: PlanCode): string[] {
  const p = cat.plans[code];
  const prev = rank(code) > 0 ? cat.plans[PLAN_ORDER[rank(code) - 1]] : null;
  const added = Object.keys(cat.features).filter((k) => p.features[k] && !prev?.features[k]).map((k) => cat.features[k].label);
  return [lim(p.limits.products, "منتج"), `${formatNumber(p.limits.imagesPerProduct)} صور لكل منتج`, ...(prev ? [`كل ما في ${prev.name}، و:`] : []), ...added].slice(0, 9);
}

function PlanView({ store }: { store: Store }) {
  const { reload } = useStore();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [cat, setCat] = useState<PlansCatalog | null>(null);
  const [invoices, setInvoices] = useState<ShopInvoice[]>([]);
  const [months, setMonths] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState<Record<string, { method: string; key: string }>>({});

  const load = useCallback(async () => {
    try {
      const [s, p, i, c] = await Promise.all([getSubscription(store.id), getPricing(), listShopInvoices(store.id), loadPlans(true)]);
      setSub(s); setPricing(p); setInvoices(i); setCat(c);
      setMonths((m) => m ?? c.periods[c.periods.length - 1] ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل بيانات الاشتراك.");
    }
  }, [store.id]);
  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  /** التوفير مقارنةً بتكرار أقصر فترة */
  const saving = useMemo(() => {
    if (!cat || !months) return 0;
    const base = cat.periods[0];
    const ref = cat.plans.pro.prices[base];
    const cur = cat.plans.pro.prices[months];
    if (!ref || !cur || months === base) return 0;
    return Math.round((1 - cur / (ref * (months / base))) * 100);
  }, [cat, months]);

  async function upgrade(plan: PlanCode) {
    if (!months) return;
    setBusy(true);
    try {
      await createShopInvoice({ storeRef: store.id, kind: 0, plan: plan as "plus" | "pro" | "max", months });
      toast.success("أُنشئت الفاتورة — حوّل المبلغ ثم أرفق الإيصال فتُفعَّل باقتك فورًا");
      await load();
      document.getElementById("invoices")?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء الفاتورة.");
    } finally {
      setBusy(false);
    }
  }

  async function sendProof(inv: ShopInvoice) {
    const p = proof[inv.id];
    if (!p?.key.trim()) return toast.error("ارفع صورة الإيصال");
    setBusy(true);
    try {
      await submitInvoiceProof(inv.id, { method: (p.method || undefined) as string | undefined, proofKey: p.key.trim() });
      toast.success("وصل إيصالك وفُعّلت باقتك فورًا. سنراجعه خلال يوم عمل.");
      await Promise.all([load(), reload()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إرسال الإيصال.");
    } finally {
      setBusy(false);
    }
  }

  async function buyStore() {
    setBusy(true);
    try {
      await createShopInvoice({ storeRef: store.id, kind: 3 });
      toast.success("أُنشئت فاتورة المتجر الإضافي");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء الفاتورة.");
    } finally {
      setBusy(false);
    }
  }

  if (!cat || !sub) return <div className="flex h-60 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  const current = sub.effectivePlan as PlanCode;
  const groups = [...new Set(Object.values(cat.features).map((f) => f.group))];
  const LIMIT_ROWS: [string, (c: PlanCode) => string][] = [
    ["المنتجات", (c) => (cat.plans[c].limits.products === null ? "بلا حد" : formatNumber(cat.plans[c].limits.products!))],
    ["صور المنتج", (c) => formatNumber(cat.plans[c].limits.imagesPerProduct)],
    ["قسائم الخصم المفعّلة", (c) => (cat.plans[c].limits.coupons === null ? "بلا حد" : formatNumber(cat.plans[c].limits.coupons!))],
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="الباقة والاشتراك" description="قارن الباقات واختر ما يناسب متجرك — الترقية تُفعَّل فور إرفاق إيصال الدفع." />

      <Card className="overflow-hidden">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><IconCrown className="size-6" /></span>
          <div>
            <p className="text-sm text-muted-foreground">باقتك الحالية</p>
            <p className="text-2xl font-bold">{cat.plans[current]?.name ?? current}</p>
          </div>
          <Badge variant="secondary">{SUB_STATUS[sub.status]}</Badge>
          {sub.currentPeriodEnd && current !== "basic" && (
            <p className="text-sm text-muted-foreground">تنتهي {formatDate(sub.currentPeriodEnd)}{sub.daysLeft !== null ? ` · بعد ${formatNumber(Math.max(0, sub.daysLeft))} يومًا` : ""}</p>
          )}
          {sub.effectivePlan !== sub.plan && <p className="w-full text-sm text-amber-600">انتهى اشتراكك — متجرك يعمل الآن بحدود الباقة المجانية، وبياناتك محفوظة كلها. جدّد لتعود مزاياك.</p>}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-2">
        <Tabs value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
          <TabsList className="h-11">
            {cat.periods.map((m) => <TabsTrigger key={m} value={String(m)} className="px-5">{periodLabel(m)}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        {saving > 0 && <p className="text-sm font-medium text-emerald-600">وفّر {formatNumber(saving)}٪ مع اشتراك {periodLabel(months!)}</p>}
      </div>

      <div className="grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((code) => {
          const p = cat.plans[code];
          const price = months ? p.prices[months] : undefined;
          const isCurrent = current === code;
          const lower = rank(code) < rank(current);
          return (
            <Card key={code} className={cn("relative flex flex-col overflow-visible", p.highlight && "border-primary shadow-lg shadow-primary/10", isCurrent && "ring-2 ring-primary/40")}>
              {p.highlight && (
                <span className="absolute -top-3 inset-x-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  <IconSparkles className="me-1 inline size-3.5" />الأكثر اختيارًا
                </span>
              )}
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <div>
                  {code === "basic" ? <p className="text-3xl font-bold">مجانية</p> : price ? (
                    <>
                      <p className="text-3xl font-bold tabular-nums">{formatBilling(price, cat.currency)}</p>
                      <p className="text-xs text-muted-foreground">لمدة {periodLabel(months!)} · {formatBilling(Math.round(price / months!), cat.currency)} شهريًا</p>
                    </>
                  ) : <p className="text-sm text-muted-foreground">غير متاحة لهذه المدة</p>}
                </div>
                <ul className="flex-1 space-y-2 text-sm">
                  {highlights(cat, code).map((h) => (
                    <li key={h} className={cn("flex items-start gap-2", h.startsWith("كل ما في") && "font-medium text-muted-foreground")}>
                      {!h.startsWith("كل ما في") && <IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />}{h}
                    </li>
                  ))}
                </ul>
                {code !== "basic" && (
                  <Button className="w-full" variant={p.highlight ? "default" : "outline"} disabled={busy || lower || !price || (isCurrent && sub.status === 0 && sub.daysLeft !== null && sub.daysLeft > 30)} onClick={() => void upgrade(code)}>
                    {busy && <IconLoader2 className="size-4 animate-spin" />}
                    {isCurrent ? "جدّد الباقة" : lower ? "أقل من باقتك" : `اشترك في ${p.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>مقارنة الباقات</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">الميزة</TableHead>
                {PLAN_ORDER.map((c) => <TableHead key={c} className={cn("text-center", c === current && "text-primary")}>{cat.plans[c].name}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {LIMIT_ROWS.map(([l, f]) => (
                <TableRow key={l}>
                  <TableCell className="ps-6">{l}</TableCell>
                  {PLAN_ORDER.map((c) => <TableCell key={c} className={cn("text-center tabular-nums", c === current && "bg-primary/[0.04]")}>{f(c)}</TableCell>)}
                </TableRow>
              ))}
              {groups.map((g) => (
                <Fragment key={g}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40"><TableCell colSpan={5} className="ps-6 text-xs font-semibold text-muted-foreground">{g}</TableCell></TableRow>
                  {Object.entries(cat.features).filter(([, f]) => f.group === g).map(([k, f]) => (
                    <TableRow key={k}>
                      <TableCell className="ps-6"><p>{f.label}</p><p className="text-xs text-muted-foreground">{f.hint}</p></TableCell>
                      {PLAN_ORDER.map((c) => (
                        <TableCell key={c} className={cn("text-center", c === current && "bg-primary/[0.04]")}>
                          {cat.plans[c].features[k] ? <IconCheck className="mx-auto size-4 text-emerald-600" aria-label="متاحة" /> : <IconMinus className="mx-auto size-4 text-muted-foreground/40" aria-label="غير متاحة" />}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {rank(current) >= rank("pro") && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-medium">متجر إضافي</p><p className="text-sm text-muted-foreground">لمن لديه أكثر من نشاط تجاري تحت الحساب نفسه (حتى ٥).</p></div>
            <Button variant="outline" disabled={busy || !pricing?.addons.extra_store} onClick={() => void buyStore()}>
              {pricing?.addons.extra_store ? `اشترِ خانة (${formatBilling(pricing.addons.extra_store, pricing.currency ?? "USD")})` : "السعر لم يُعلن بعد"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div id="invoices" />
      <Card>
        <CardHeader><CardTitle>الفواتير</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {invoices.length === 0 && <p className="text-sm text-muted-foreground">لا فواتير بعد.</p>}
          {invoices.map((inv) => {
            const st = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS[0];
            return (
              <div key={inv.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium" dir="ltr">{inv.invoiceNumber}</span>
                  <Badge variant="secondary" className={st.tone}>{st.label}</Badge>
                  <span className="text-sm text-muted-foreground">{KIND[inv.kind]}{inv.plan && cat ? ` — ${cat.plans[PLAN_ORDER[inv.plan]]?.name ?? ""}` : ""}{inv.months ? ` · ${periodLabel(inv.months)}` : ""}{inv.item ? ` — ${templateName(inv.item)}` : ""}</span>
                  <span className="ms-auto font-semibold tabular-nums">{formatBilling(Number(inv.amount), inv.currency)}</span>
                </div>
                {inv.status === 0 && (
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">اكتب رقم الفاتورة <b dir="ltr">{inv.invoiceNumber}</b> في ملاحظات التحويل.</p>
                    <PayAccounts accounts={pricing?.accounts} />
                    {pricing && !pricing.accounts?.length && pricing.methods.map((m) => (
                      <div key={m.id} className="rounded-md bg-muted p-3"><b>{m.name}:</b> {m.instructions}</div>
                    ))}
                    {pricing && !pricing.accounts?.length && pricing.methods.length === 0 && <p className="text-amber-600">لم تُضبط وسائل الدفع بعد — تواصل مع الدعم.</p>}
                    <div className="grid gap-2 sm:grid-cols-4">
                      <Select value={proof[inv.id]?.method ?? ""} onValueChange={(v) => setProof((p) => ({ ...p, [inv.id]: { key: p[inv.id]?.key ?? "", method: v } }))}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="وسيلة الدفع" /></SelectTrigger>
                        <SelectContent>
                          {payMethodsOf(pricing).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2 sm:col-span-2">
                        <Input className="flex-1" dir="ltr" placeholder="رابط صورة الإيصال" value={proof[inv.id]?.key ?? ""}
                          onChange={(e) => setProof((p) => ({ ...p, [inv.id]: { method: p[inv.id]?.method ?? "", key: e.target.value } }))} />
                        <ImageUploadButton label="رفع" storeId={store.id} onUploaded={(url) => setProof((p) => ({ ...p, [inv.id]: { method: p[inv.id]?.method ?? "", key: url } }))} />
                      </div>
                      <Button disabled={busy} onClick={() => void sendProof(inv)}>إرسال الإيصال</Button>
                    </div>
                  </div>
                )}
                {inv.status === 3 && inv.voidReason && <p className="text-sm text-muted-foreground">السبب: {inv.voidReason}</p>}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

/** وسائل الإيصال: مزوّدو الحسابات المعلنة بلا تكرار، وإلا الوسائل القديمة */
function payMethodsOf(pricing: { accounts?: PayAccount[]; methods: { id: string; name: string }[] } | null | undefined) {
  if (!pricing) return [];
  if (!pricing.accounts?.length) return pricing.methods;
  const seen = new Map<string, string>();
  for (const a of pricing.accounts) if (!seen.has(a.provider)) seen.set(a.provider, a.providerName ?? a.provider);
  return [...seen].map(([id, name]) => ({ id, name }));
}

export default function StorePlanPage() {
  return <RequireStore allowSuspended>{(store) => <PlanView key={store.id} store={store} />}</RequireStore>;
}
