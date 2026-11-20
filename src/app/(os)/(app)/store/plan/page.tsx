"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconCrown, IconGift, IconLoader2, IconMinus, IconSparkles, IconWallet } from "@tabler/icons-react";
import Link from "next/link";
import { InvoiceCard } from "@/components/shop/invoice-card";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  createShopInvoice, getMerchantWallet, getPricing, getSubscription, listShopInvoices, startStoreTrial,
  type MerchantWallet, type Pricing, type ShopInvoice, type Store, type Subscription,
} from "@/lib/api/shop";
import { formatBilling, formatDate, formatNumber } from "@/lib/format";
import { PLAN_ORDER, loadPlans, periodLabel, periodWords, type PlanCode, type PlansCatalog } from "@/lib/shop/plans";
import { useStore } from "@/lib/shop/store-context";
import { cn } from "@/lib/utils";

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
  const [pick, setPick] = useState<Partial<Record<PlanCode, number>>>({});
  const [busy, setBusy] = useState(false);
  const [wallet, setWallet] = useState<MerchantWallet | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, p, i, c, w] = await Promise.all([getSubscription(store.id), getPricing(), listShopInvoices(store.id), loadPlans(true), getMerchantWallet().catch(() => null)]);
      setSub(s); setPricing(p); setInvoices(i); setCat(c); setWallet(w);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل بيانات الاشتراك.");
    }
  }, [store.id]);
  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  async function upgrade(plan: PlanCode, months: number) {
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

  async function startTrial() {
    setBusy(true);
    try {
      await startStoreTrial(store.id);
      toast.success("بدأت فترتك التجريبية — كل مزايا الباقة مفتوحة لمتجرك الآن");
      await Promise.all([load(), reload()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر بدء الفترة التجريبية.");
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
      <PageHeader title="الباقة والاشتراك" description="اختر الباقة المناسبة لعملك — تُفعَّل فورًا عند الدفع من المحفظة أو بإرفاق إيصال التحويل." />

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
          {sub.trial && current !== "basic" && <Badge className="bg-violet-500/10 text-violet-600">فترة تجريبية</Badge>}
          {wallet && <Link href="/store/wallet" className="ms-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><IconWallet className="size-4 text-primary" /> رصيد المحفظة: <b className="tabular-nums">{formatBilling(wallet.balance, wallet.currency)}</b></Link>}
          {sub.effectivePlan !== sub.plan && <p className="w-full text-sm text-amber-600">انتهى اشتراكك — متجرك يعمل الآن بحدود الباقة المجانية، وبياناتك محفوظة كلها. جدّد لتعود مزاياك.</p>}
        </CardContent>
      </Card>

      {wallet?.trial.available && current === "basic" && (
        <Card className="overflow-hidden border-violet-500/30 bg-gradient-to-l from-violet-500/10 to-transparent">
          <CardContent className="flex flex-wrap items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-violet-600 text-white"><IconGift className="size-6" /></span>
            <div className="flex-1">
              <p className="text-lg font-bold">جرّب باقة {wallet.trial.planName} مجانًا {formatNumber(wallet.trial.days)} يومًا</p>
              <p className="text-sm text-muted-foreground">كل مزاياها مفتوحة لمتجرك بلا دفع ولا بطاقة — مرة واحدة لكل حساب، وتعود بعدها للمجانية تلقائيًا إن لم تشترك، دون أن تفقد شيئًا.</p>
            </div>
            <Button className="bg-violet-600 hover:bg-violet-700" disabled={busy} onClick={() => void startTrial()}>{busy && <IconLoader2 className="size-4 animate-spin" />} ابدأ التجربة المجانية</Button>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <p className="text-sm font-semibold text-primary">خطط RVIOS</p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">اختر الباقة المناسبة لعملك</h2>
      </div>
      <div className="grid gap-5 pt-2 sm:grid-cols-2 xl:grid-cols-4">
        {PLAN_ORDER.map((code) => {
          const p = cat.plans[code];
          const terms = Object.keys(p.prices).map(Number).sort((x, y) => x - y);
          const m = pick[code] ?? terms[0];
          const price = m ? p.prices[m] : undefined;
          const isCurrent = current === code;
          const lower = rank(code) < rank(current);
          const prev = rank(code) > 1 ? cat.plans[PLAN_ORDER[rank(code) - 1]] : null;
          return (
            <Card key={code} className={cn("relative flex flex-col overflow-visible transition-shadow hover:shadow-xl", p.highlight && "border-primary shadow-lg shadow-primary/15 xl:-translate-y-2", isCurrent && "ring-2 ring-primary/40")}>
              {p.highlight && (
                <span className="absolute -top-3 inset-x-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                  <IconSparkles className="me-1 inline size-3.5" />الأكثر طلبًا
                </span>
              )}
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl">{p.name}</CardTitle>
                  {isCurrent && <Badge variant="secondary">باقتك</Badge>}
                </div>
                <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">{p.tagline}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5">
                <div className="rounded-xl bg-muted/50 p-4">
                  {code === "basic" ? (
                    <><p className="text-3xl font-extrabold">مجانية</p><p className="text-xs text-muted-foreground">للأبد، بلا بطاقة</p></>
                  ) : price && m ? (
                    <>
                      <p className="flex items-baseline gap-1.5"><span className="text-3xl font-extrabold tabular-nums">{formatBilling(price, cat.currency)}</span><span className="text-sm text-muted-foreground">/ {periodWords(m)}</span></p>
                      <p className="mt-1 text-xs text-muted-foreground">أي نحو {formatBilling(Math.round(price / m), cat.currency)} شهريًا</p>
                      {terms.length > 1 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {terms.map((t) => <button key={t} type="button" onClick={() => setPick((x) => ({ ...x, [code]: t }))} className={cn("rounded-md border px-2.5 py-1 text-xs", t === m ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")}>{periodLabel(t)}</button>)}
                        </div>
                      )}
                    </>
                  ) : <p className="text-sm text-muted-foreground">السعر لم يُعلن بعد</p>}
                </div>
                {prev && <p className="-mb-2 text-sm font-semibold">كل مزايا {prev.name}، بالإضافة إلى:</p>}
                <ul className="flex-1 space-y-2.5 text-sm">
                  {(p.bullets?.length ? p.bullets : highlights(cat, code)).map((h) => (
                    <li key={h} className="flex items-start gap-2.5 leading-relaxed">
                      <span className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", p.highlight ? "bg-primary text-primary-foreground" : "bg-emerald-500/15 text-emerald-600")}><IconCheck className="size-3.5" /></span>{h}
                    </li>
                  ))}
                </ul>
                {code !== "basic" && (
                  <Button size="lg" className="w-full" variant={p.highlight ? "default" : "outline"} disabled={busy || lower || !price || (isCurrent && !sub.trial && sub.status === 0 && sub.daysLeft !== null && sub.daysLeft > 30)} onClick={() => m && void upgrade(code, m)}>
                    {busy && <IconLoader2 className="size-4 animate-spin" />}
                    {isCurrent && !sub.trial ? "جدّد الباقة" : lower ? "أقل من باقتك" : `اختر ${p.name}`}
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
          {invoices.map((inv) => <InvoiceCard key={inv.id} inv={inv} pricing={pricing} cat={cat} storeId={store.id} walletBalance={wallet?.balance} onChanged={async () => { await Promise.all([load(), reload()]); }} />)}
        </CardContent>
      </Card>
    </div>
  );
}

export default function StorePlanPage() {
  return <RequireStore allowSuspended>{(store) => <PlanView key={store.id} store={store} />}</RequireStore>;
}
