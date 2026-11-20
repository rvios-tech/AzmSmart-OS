"use client";

/* «المحفظة والمكافآت»: رصيد التاجر لدى RVIOS (يُشحن بتحويل ويدفع منه اشتراكاته وقوالبه فورًا)،
   ودعوة التجار برابط إحالة — نسبة من أول اشتراك يدفعه المدعوّ تُضاف لمحفظته. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconArrowDownLeft, IconArrowUpRight, IconBrandWhatsapp, IconCopy, IconGift, IconLoader2, IconUsers, IconWallet,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { InvoiceCard } from "@/components/shop/invoice-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import {
  createShopInvoice, getMerchantWallet, getPricing, listShopInvoices,
  type MerchantWallet, type Pricing, type ShopInvoice, type Store,
} from "@/lib/api/shop";
import { formatBilling, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const KIND: Record<string, string> = { topup: "شحن", pay: "دفع فاتورة", referral: "مكافأة إحالة", refund: "استرداد", adjust: "تعديل من المنصة" };
const QUICK = [10_000, 30_000, 60_000, 120_000];
type Filter = "all" | "in" | "out" | "referral";

function WalletView({ store }: { store: Store }) {
  const [w, setW] = useState<MerchantWallet | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [invoices, setInvoices] = useState<ShopInvoice[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      const [ww, p, i] = await Promise.all([getMerchantWallet(), getPricing(), listShopInvoices(store.id)]);
      setW(ww); setPricing(p); setInvoices(i.filter((x) => x.kind === 5 && x.status !== 2));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المحفظة.");
    }
  }, [store.id]);
  useEffect(() => { void (async () => { await load(); })(); }, [load]);

  const txs = useMemo(() => (w?.txs ?? []).filter((t) => filter === "all" || (filter === "in" ? t.amount > 0 && t.kind !== "referral" : filter === "out" ? t.amount < 0 : t.kind === "referral")), [w, filter]);

  async function topup() {
    const v = Math.round(Number(amount));
    if (!v || v < 1000) return toast.error("أقل مبلغ للشحن ١٬٠٠٠");
    setBusy(true);
    try {
      await createShopInvoice({ storeRef: store.id, kind: 5, amount: v });
      toast.success("أُنشئت فاتورة الشحن — حوّل المبلغ وأرفق الإيصال");
      setAmount("");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء فاتورة الشحن.");
    } finally {
      setBusy(false);
    }
  }

  const copy = (text: string) => { void navigator.clipboard?.writeText(text).then(() => toast.success("نُسخ")); };

  if (!w) return <div className="flex h-60 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  const share = `https://wa.me/?text=${encodeURIComponent(`أنشئ متجرك الإلكتروني على RVIOS مجانًا وابدأ البيع اليوم: ${w.referral.link}`)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="المحفظة والمكافآت" description="اشحن رصيدك مرة وادفع منه اشتراكاتك وقوالبك فورًا بلا إيصال، واكسب من دعوة التجار." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="space-y-1">
            <p className="flex items-center gap-2 text-sm opacity-80"><IconWallet className="size-4" /> الرصيد الحالي</p>
            <p className="text-3xl font-bold tabular-nums">{formatBilling(w.balance, w.currency)}</p>
            {w.balance <= 0 && <p className="text-xs opacity-80">رصيدك فارغ — اشحنه لتدفع فواتيرك فورًا.</p>}
          </CardContent>
        </Card>
        <Stat icon={<IconGift className="size-4" />} label="أرباح الإحالة" value={formatBilling(w.referral.earned, w.currency)} />
        <Stat icon={<IconUsers className="size-4" />} label="إحالات ناجحة" value={formatNumber(w.referral.rewarded)} sub={`من ${formatNumber(w.referral.invited)} مسجَّل`} />
        <Stat icon={<IconLoader2 className="size-4" />} label="بانتظار أول اشتراك" value={formatNumber(w.referral.pending)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>شحن المحفظة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button key={q} type="button" onClick={() => setAmount(String(q))} className={cn("rounded-lg border px-3 py-2 text-sm tabular-nums transition-colors hover:border-primary", Number(amount) === q && "border-primary bg-primary/5 text-primary")}>
                  {formatBilling(q, w.currency)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input type="number" inputMode="numeric" min={1000} dir="ltr" placeholder="مبلغ آخر" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Button disabled={busy} onClick={() => void topup()}>{busy && <IconLoader2 className="size-4 animate-spin" />} أنشئ فاتورة الشحن</Button>
            </div>
            <p className="text-xs text-muted-foreground">تحوّل المبلغ لأحد حساباتنا وترفق الإيصال، فيُضاف لرصيدك بعد تأكيد الفريق. بعدها تُدفع فواتير الباقة والقوالب من الرصيد بضغطة.</p>
            {invoices.map((inv) => <InvoiceCard key={inv.id} inv={inv} pricing={pricing} storeId={store.id} onChanged={load} />)}
          </CardContent>
        </Card>

        <Card className="border-violet-500/25">
          <CardHeader><CardTitle className="flex items-center gap-2"><IconGift className="size-5 text-violet-600" /> ادعُ التجار واكسب</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              شارك رابطك الخاص. حين يسجّل تاجر من خلاله ثم يشترك في أي باقة، تُضاف إلى محفظتك
              <b className="text-foreground"> {formatNumber(w.referral.percent)}٪ </b>
              من قيمة اشتراكه الأول — تستعملها في تجديد باقتك.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">رمز الإحالة</p>
              <div className="flex gap-2"><Input readOnly dir="ltr" value={w.referral.code} className="font-mono text-lg font-bold tracking-widest" /><Button variant="outline" size="icon" onClick={() => copy(w.referral.code)} aria-label="نسخ الرمز"><IconCopy className="size-4" /></Button></div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">رابط الدعوة</p>
              <div className="flex gap-2"><Input readOnly dir="ltr" value={w.referral.link} /><Button variant="outline" size="icon" onClick={() => copy(w.referral.link)} aria-label="نسخ الرابط"><IconCopy className="size-4" /></Button></div>
            </div>
            <Button asChild className="w-full bg-[#25D366] text-white hover:bg-[#1ebe57]"><a href={share} target="_blank" rel="noopener noreferrer"><IconBrandWhatsapp className="size-4" /> شارك الدعوة على واتساب</a></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>سجل الحركات</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
            <TabsList><TabsTrigger value="all">الكل</TabsTrigger><TabsTrigger value="in">الإيداعات</TabsTrigger><TabsTrigger value="out">المدفوعات</TabsTrigger><TabsTrigger value="referral">الإحالات</TabsTrigger></TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          {txs.length === 0 ? <p className="px-6 py-8 text-center text-sm text-muted-foreground">لا حركات بعد.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead className="ps-6">الحركة</TableHead><TableHead>التفاصيل</TableHead><TableHead>التاريخ</TableHead><TableHead className="text-end">المبلغ</TableHead><TableHead className="pe-6 text-end">الرصيد بعدها</TableHead></TableRow></TableHeader>
              <TableBody>
                {txs.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="ps-6"><span className="flex items-center gap-2">{t.amount > 0 ? <IconArrowDownLeft className="size-4 text-emerald-600" /> : <IconArrowUpRight className="size-4 text-rose-600" />}<Badge variant="secondary">{KIND[t.kind] ?? t.kind}</Badge></span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.note ?? "—"}</TableCell>
                    <TableCell className="text-sm">{formatDate(t.createdAt)}</TableCell>
                    <TableCell className={cn("text-end font-semibold tabular-nums", t.amount > 0 ? "text-emerald-600" : "text-rose-600")}>{t.amount > 0 ? "+" : "−"}{formatBilling(Math.abs(t.amount), w.currency)}</TableCell>
                    <TableCell className="pe-6 text-end tabular-nums text-muted-foreground">{formatBilling(t.balance, w.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">{icon} {label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function StoreWalletPage() {
  return <RequireStore allowSuspended>{(store) => <WalletView key={store.id} store={store} />}</RequireStore>;
}
