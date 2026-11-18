"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight, IconLoader2, IconMinus, IconPlus, IconSearch, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { createManualOrder, listProducts, listStoreCustomers, listZones, type Product, type Store, type StoreCustomer, type Zone } from "@/lib/api/shop";
import { formatMoney, formatNumber } from "@/lib/format";
import { PAY_METHOD_LABEL } from "@/lib/shop/constants";
import { PlanGate } from "@/components/shop/plan-gate";

type Line = { key: string; product: Product; variantId: string | null; qty: number };

const variantLabel = (p: Product, id: string | null) => {
  const v = p.variants.find((x) => x.id === id);
  return v ? [v.v1, v.v2].filter(Boolean).join(" / ") : "";
};
const unitPrice = (p: Product, id: string | null) => p.variants.find((x) => x.id === id)?.price ?? p.price;
const stockOf = (p: Product, id: string | null) => (p.hasVariants ? p.variants.find((x) => x.id === id)?.qty ?? 0 : p.qty);

/**
 * طلب يدوي — للطلبات الهاتفية ورسائل واتساب والبيع في المحل. يمرّ بمحرك طلب المتجر نفسه:
 * الأسعار من القاعدة، والمخزون يُحجز، والقسيمة تُحسب في الخادم.
 */
function NewOrderView({ store }: { store: Store }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [q, setQ] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [zoneId, setZoneId] = useState<string>("none");
  const [delivery, setDelivery] = useState("");
  const [discount, setDiscount] = useState("");
  const [coupon, setCoupon] = useState("");
  const [payMethod, setPayMethod] = useState("cod");
  const [paid, setPaid] = useState(false);
  const [confirm, setConfirm] = useState(true);
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [usePoints, setUsePoints] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void listProducts(store.id).then((r) => setProducts(r.products)).catch(() => setProducts([]));
    void listZones(store.id).then((r) => setZones(r.zones)).catch(() => {});
    void listStoreCustomers(store.id).then((r) => setCustomers(r.customers)).catch(() => {});
  }, [store.id]);

  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (products ?? []).filter((p) => !s || p.name.toLowerCase().includes(s) || p.brand.toLowerCase().includes(s)).slice(0, 8);
  }, [products, q]);

  const money = (n: number) => formatMoney(n, store.currency);
  const int = (v: string) => Math.max(0, Math.trunc(Number(v) || 0));
  const subtotal = lines.reduce((a, l) => a + unitPrice(l.product, l.variantId) * l.qty, 0);
  const zone = zones.find((z) => z.id === zoneId);
  const autoFee = zone ? (zone.freeOver && subtotal >= zone.freeOver ? 0 : zone.fee) : store.deliveryFreeOver && subtotal >= store.deliveryFreeOver ? 0 : store.deliveryFee;
  const fee = delivery.trim() === "" ? autoFee : int(delivery);
  // صاحب الجوال من عملاء المتجر — آخر ٩ أرقام تكفي للمطابقة مع رقم مكتوب بلا رمز الدولة
  const digits = phone.replace(/\D/g, "");
  const known = digits.length >= 7 ? customers.find((c) => c.phone.replace(/\D/g, "").endsWith(digits.slice(-9))) : undefined;
  const balance = known?.points ?? 0;
  const points = Math.min(balance, int(usePoints), Math.max(0, subtotal + fee - int(discount)));
  const total = Math.max(0, subtotal + fee - int(discount) - points);

  function add(p: Product) {
    const variantId = p.hasVariants ? p.variants.find((v) => v.live && v.qty > 0)?.id ?? p.variants[0]?.id ?? null : null;
    setLines((ls) => {
      const ex = ls.find((l) => l.product.id === p.id && l.variantId === variantId);
      return ex ? ls.map((l) => (l === ex ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { key: `${p.id}-${Date.now()}`, product: p, variantId, qty: 1 }];
    });
    setQ("");
  }

  async function submit() {
    if (!lines.length) return toast.error("أضف منتجًا واحدًا على الأقل.");
    if (!name.trim() && !phone.trim()) return toast.error("اكتب اسم العميل أو جواله.");
    setSaving(true);
    try {
      const o = await createManualOrder(store.id, {
        lines: lines.map((l) => ({ id: l.product.id, ...(l.variantId ? { variantId: l.variantId } : {}), qty: l.qty })),
        name: name.trim(), phone: phone.trim(), address: address.trim(), note: note.trim(),
        ...(zone ? { zoneId: zone.id } : {}),
        ...(delivery.trim() !== "" ? { deliveryFee: int(delivery) } : {}),
        ...(int(discount) ? { extraDiscount: int(discount) } : {}),
        ...(coupon.trim() ? { coupon: coupon.trim() } : {}),
        ...(points > 0 ? { pointsUsed: points } : {}),
        payMethod, paid, confirm,
      });
      toast.success(`سُجّل الطلب ${o.ref}`, { description: `الإجمالي ${money(o.total)}` });
      router.push(`/orders/${o.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء الطلب.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى الطلبات
      </Link>
      <PageHeader title="طلب جديد" description="لطلب وصلك بالهاتف أو واتساب أو في المحل — يحجز المخزون ويظهر مع طلبات المتجر." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>المنتجات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="ps-9" placeholder="ابحث باسم المنتج…" value={q} onChange={(e) => setQ(e.target.value)} />
                {q.trim() && (
                  <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border bg-popover shadow-md">
                    {found.length ? found.map((p) => (
                      <button key={p.id} type="button" onClick={() => add(p)} className="flex w-full items-center gap-3 px-3 py-2 text-start text-sm hover:bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image ? <img src={p.image} alt="" className="size-9 rounded object-cover" /> : <span className="size-9 rounded bg-muted" />}
                        <span className="flex-1"><b className="block font-medium">{p.name}</b><span className="text-xs text-muted-foreground">{money(p.price)} · متوفر {formatNumber(p.qty)}{!p.live ? " · مخفي من المتجر" : ""}</span></span>
                        <IconPlus className="size-4 text-muted-foreground" />
                      </button>
                    )) : <p className="p-3 text-sm text-muted-foreground">لا منتج بهذا الاسم.</p>}
                  </div>
                )}
              </div>
              {!products && <p className="flex items-center gap-2 text-sm text-muted-foreground"><IconLoader2 className="size-4 animate-spin" /> تحميل المنتجات…</p>}
              {lines.length === 0 && products && <p className="py-6 text-center text-sm text-muted-foreground">ابحث عن منتج وأضفه للطلب.</p>}
              <ul className="divide-y">
                {lines.map((l) => {
                  const stock = stockOf(l.product, l.variantId);
                  return (
                    <li key={l.key} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-40 flex-1">
                        <p className="font-medium">{l.product.name}</p>
                        <p className="text-xs text-muted-foreground">{money(unitPrice(l.product, l.variantId))} · متوفر {formatNumber(stock)}</p>
                      </div>
                      {l.product.hasVariants && (
                        <Select value={l.variantId ?? ""} onValueChange={(v) => setLines((ls) => ls.map((x) => (x === l ? { ...x, variantId: v } : x)))}>
                          <SelectTrigger className="w-40"><SelectValue placeholder={l.product.opt1Name || "الخيار"} /></SelectTrigger>
                          <SelectContent>
                            {l.product.variants.filter((v) => v.id).map((v) => (
                              <SelectItem key={v.id} value={v.id!}>{variantLabel(l.product, v.id!)} ({formatNumber(v.qty)})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="size-8" onClick={() => setLines((ls) => ls.map((x) => (x === l ? { ...x, qty: Math.max(1, x.qty - 1) } : x)))}><IconMinus className="size-3.5" /></Button>
                        <span className="w-8 text-center tabular-nums">{formatNumber(l.qty)}</span>
                        <Button size="icon" variant="outline" className="size-8" onClick={() => setLines((ls) => ls.map((x) => (x === l ? { ...x, qty: Math.min(99, x.qty + 1) } : x)))}><IconPlus className="size-3.5" /></Button>
                      </div>
                      <span className="w-28 text-end font-medium tabular-nums">{money(unitPrice(l.product, l.variantId) * l.qty)}</span>
                      <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => setLines((ls) => ls.filter((x) => x !== l))}><IconTrash className="size-4" /></Button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>العميل والتوصيل</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="n">الاسم</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
              <div className="space-y-2">
                <Label htmlFor="p">الجوال</Label><Input id="p" dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
                {known && <p className="text-xs text-muted-foreground">عميل سابق: {known.name || "بلا اسم"} · {formatNumber(known.ordersCount)} طلب{balance > 0 ? ` · رصيد ${money(balance)}` : ""}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="a">العنوان</Label><Input id="a" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} /></div>
              <div className="space-y-2">
                <Label>منطقة التوصيل</Label>
                <Select value={zoneId} onValueChange={setZoneId}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">الرسم العام ({money(store.deliveryFee)})</SelectItem>
                    {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name} ({money(z.fee)})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="d">رسم التوصيل لهذا الطلب</Label><Input id="d" type="number" min={0} placeholder={`تلقائي: ${formatNumber(autoFee)}`} value={delivery} onChange={(e) => setDelivery(e.target.value)} /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="o">ملاحظة</Label><Textarea id="o" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} /></div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader><CardTitle>الدفع والإجمالي</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PAY_METHOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="c">رمز خصم</Label><Input id="c" dir="ltr" className="font-mono uppercase" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="اختياري" /></div>
              <div className="space-y-2"><Label htmlFor="x">خصم يدوي</Label><Input id="x" type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" /></div>
            </div>
            {balance > 0 && (
              <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                <Label htmlFor="pt">من رصيد المكافآت (متاح {money(balance)})</Label>
                <div className="flex gap-2">
                  <Input id="pt" type="number" min={0} max={balance} value={usePoints} onChange={(e) => setUsePoints(e.target.value)} placeholder="0" />
                  <Button type="button" variant="outline" onClick={() => setUsePoints(String(Math.min(balance, Math.max(0, subtotal + fee - int(discount)))))}>الكل</Button>
                </div>
              </div>
            )}
            <label className="flex items-center justify-between gap-3 text-sm"><span>استُلم الدفع</span><Switch checked={paid} onCheckedChange={setPaid} /></label>
            <label className="flex items-center justify-between gap-3 text-sm"><span>الطلب مؤكد</span><Switch checked={confirm} onCheckedChange={setConfirm} /></label>
            <dl className="space-y-1.5 border-t pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">المجموع</dt><dd className="tabular-nums">{money(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">التوصيل</dt><dd className="tabular-nums">{fee ? money(fee) : "مجاني"}</dd></div>
              {int(discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>خصم يدوي</dt><dd className="tabular-nums">−{money(int(discount))}</dd></div>}
              {points > 0 && <div className="flex justify-between text-emerald-600"><dt>من رصيد المكافآت</dt><dd className="tabular-nums">−{money(points)}</dd></div>}
              <div className="flex justify-between text-base font-semibold"><dt>الإجمالي</dt><dd className="tabular-nums">{money(total)}</dd></div>
              {coupon.trim() && <p className="text-xs text-muted-foreground">خصم الرمز يُحسب عند الحفظ.</p>}
            </dl>
            <Button className="w-full" disabled={saving || !lines.length} onClick={() => void submit()}>
              {saving && <IconLoader2 className="size-4 animate-spin" />} تسجيل الطلب
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return <RequireStore>{(store) => <PlanGate store={store} feature="manualOrders"><NewOrderView store={store} /></PlanGate>}</RequireStore>;
}
