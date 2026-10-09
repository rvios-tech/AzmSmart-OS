"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { ImageUploadButton } from "@/components/image-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  createShopInvoice, getPricing, getSubscription, listShopInvoices, submitInvoiceProof,
  type Pricing, type ShopInvoice, type Store, type Subscription,
} from "@/lib/api/shop";
import { formatBilling, formatDate, formatNumber } from "@/lib/format";
import { PLAN_LABEL, templateName } from "@/lib/shop/constants";
import { useStore } from "@/lib/shop/store-context";

/** كما في صفحة أسعار منصة المتاجر (RVIOS StoreOS) */
const PLANS = [
  { id: "basic", features: ["١٠ منتجات و٣ تصنيفات", "رابط متجر خاص", "القالب الأساسي بهويتك", "سلة وطلبات محفوظة"] },
  { id: "plus", features: ["٥٠٠ منتج وتصنيفات بلا حد", "كل القوالب — المدفوع منها دفعة واحدة", "إزالة عبارة المنصة", "شارة متجر موثّق"] },
  { id: "pro", features: ["منتجات بلا حد", "القوالب القياسية مجانًا، والتوقيع بخصم ٤٠٪", "فريق ومخزون", "متاجر إضافية"] },
] as const;

const KIND = ["اشتراك", "بناء متجر", "دومين", "متجر إضافي", "قالب"];
const INVOICE_STATUS = [
  { label: "بانتظار الدفع", tone: "bg-amber-500/10 text-amber-600" },
  { label: "قيد المراجعة", tone: "bg-sky-500/10 text-sky-600" },
  { label: "مدفوعة", tone: "bg-emerald-500/10 text-emerald-600" },
  { label: "ملغاة", tone: "bg-rose-500/10 text-rose-600" },
];
const SUB_STATUS = ["نشط", "في المهلة", "منتهٍ"];

function PlanView({ store }: { store: Store }) {
  const { reload } = useStore();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [invoices, setInvoices] = useState<ShopInvoice[]>([]);
  const [months, setMonths] = useState("1");
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState<Record<string, { method: string; key: string }>>({});

  const load = useCallback(async () => {
    try {
      const [s, p, i] = await Promise.all([getSubscription(store.id), getPricing(), listShopInvoices(store.id)]);
      setSub(s);
      setPricing(p);
      setInvoices(i);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل بيانات الاشتراك.");
    }
  }, [store.id]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function upgrade(plan: "plus" | "pro") {
    setBusy(true);
    try {
      await createShopInvoice({ storeRef: store.id, kind: 0, plan, months: Number(months) });
      toast.success("أُنشئت الفاتورة — أتمم التحويل ثم أرفق الإيصال");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء الفاتورة.");
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

  async function sendProof(inv: ShopInvoice) {
    const p = proof[inv.id];
    if (!p?.key.trim()) return toast.error("ألصق رابط صورة الإيصال");
    setBusy(true);
    try {
      await submitInvoiceProof(inv.id, { method: (p.method || undefined) as "kuraimi" | "jaib" | "paypal" | undefined, proofKey: p.key.trim() });
      toast.success("وصل إيصالك وفُعّلت باقتك فورًا. سنراجعه خلال يوم عمل.");
      await Promise.all([load(), reload()]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إرسال الإيصال.");
    } finally {
      setBusy(false);
    }
  }

  const price = (plan: string) => {
    if (plan === "basic") return "مجانية";
    const v = pricing?.prices[plan as "plus" | "pro"];
    return v ? `${formatBilling(v, pricing?.currency ?? "USD")} / شهر` : "السعر لم يُعلن بعد";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="الاشتراك" description="باقة متجرك وفواتيرها." />

      {sub && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">باقتك الحالية</p>
              <p className="text-2xl font-semibold">{PLAN_LABEL[sub.plan]}</p>
            </div>
            <Badge variant="secondary">{SUB_STATUS[sub.status]}</Badge>
            {sub.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                تنتهي {formatDate(sub.currentPeriodEnd)} ({sub.daysLeft !== null ? `${formatNumber(Math.max(0, sub.daysLeft))} يومًا` : ""})
              </p>
            )}
            {sub.effectivePlan !== sub.plan && (
              <p className="text-sm text-amber-600">اشتراكك منتهٍ — متجرك يعمل الآن بحدود الباقة المجانية. بياناتك محفوظة كلها.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Label>مدة الاشتراك</Label>
        <Select value={months} onValueChange={setMonths}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">شهر</SelectItem>
            <SelectItem value="3">٣ أشهر</SelectItem>
            <SelectItem value="12">سنة{pricing ? ` (${formatNumber(pricing.yearlyMonthsFree)} شهران مجانًا)` : ""}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => (
          <Card key={p.id} className={sub?.plan === p.id ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>{PLAN_LABEL[p.id]}</CardTitle>
              <CardDescription>{price(p.id)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-center gap-2"><IconCheck className="size-4 text-emerald-600" />{f}</li>)}
              </ul>
              {p.id !== "basic" && (
                <Button className="w-full" disabled={busy || sub?.plan === p.id || !pricing?.prices[p.id]} onClick={() => void upgrade(p.id)}>
                  {busy && <IconLoader2 className="size-4 animate-spin" />}
                  {sub?.plan === p.id ? "باقتك الحالية" : `الترقية إلى ${PLAN_LABEL[p.id]}`}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sub?.effectivePlan === "pro" && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">متجر إضافي</p>
              <p className="text-sm text-muted-foreground">لمن لديه أكثر من نشاط تجاري تحت الحساب نفسه (حتى ٥).</p>
            </div>
            <Button variant="outline" disabled={busy || !pricing?.addons.extra_store} onClick={() => void buyStore()}>
              {pricing?.addons.extra_store ? `اشترِ خانة (${formatBilling(pricing.addons.extra_store, pricing.currency ?? "USD")})` : "السعر لم يُعلن بعد"}
            </Button>
          </CardContent>
        </Card>
      )}

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
                  <span className="text-sm text-muted-foreground">{KIND[inv.kind]}{inv.plan ? ` — ${PLAN_LABEL[inv.plan === 1 ? "plus" : "pro"]}` : ""}{inv.item ? ` — ${templateName(inv.item)}` : ""}</span>
                  <span className="ms-auto font-semibold tabular-nums">{formatBilling(Number(inv.amount), inv.currency)}</span>
                </div>
                {inv.status === 0 && (
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">اكتب رقم الفاتورة <b dir="ltr">{inv.invoiceNumber}</b> في ملاحظات التحويل.</p>
                    {pricing?.methods.map((m) => (
                      <div key={m.id} className="rounded-md bg-muted p-3"><b>{m.name}:</b> {m.instructions}</div>
                    ))}
                    {pricing && pricing.methods.length === 0 && <p className="text-amber-600">لم تُضبط وسائل الدفع بعد — تواصل مع الدعم.</p>}
                    <div className="grid gap-2 sm:grid-cols-4">
                      <Select value={proof[inv.id]?.method ?? ""} onValueChange={(v) => setProof((p) => ({ ...p, [inv.id]: { key: p[inv.id]?.key ?? "", method: v } }))}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="وسيلة الدفع" /></SelectTrigger>
                        <SelectContent>
                          {pricing?.methods.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
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

export default function StorePlanPage() {
  return <RequireStore allowSuspended>{(store) => <PlanView key={store.id} store={store} />}</RequireStore>;
}
