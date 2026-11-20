"use client";

/* فاتورة التاجر لدى RVIOS: حالتها، والدفع بإيصال تحويل أو من المحفظة فورًا.
   مشتركة بين «الباقة والاشتراك» و«المحفظة والمكافآت». */
import { useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconWallet } from "@tabler/icons-react";

import { PayAccounts } from "@/components/pay-accounts";
import { ImageUploadButton } from "@/components/image-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PayAccount } from "@/lib/api/platform-ops";
import { ApiError } from "@/lib/api/client";
import { payInvoiceFromWallet, submitInvoiceProof, type Pricing, type ShopInvoice } from "@/lib/api/shop";
import { formatBilling } from "@/lib/format";
import { templateName } from "@/lib/shop/constants";
import { PLAN_ORDER, periodLabel, type PlansCatalog } from "@/lib/shop/plans";

export const INVOICE_KIND = ["اشتراك", "بناء متجر", "دومين", "متجر إضافي", "قالب", "شحن المحفظة"];
export const INVOICE_STATUS = [
  { label: "بانتظار الدفع", tone: "bg-amber-500/10 text-amber-600" },
  { label: "قيد المراجعة", tone: "bg-sky-500/10 text-sky-600" },
  { label: "مدفوعة", tone: "bg-emerald-500/10 text-emerald-600" },
  { label: "ملغاة", tone: "bg-rose-500/10 text-rose-600" },
];

/** وسائل الإيصال: مزوّدو الحسابات المعلنة بلا تكرار، وإلا الوسائل القديمة */
function payMethodsOf(pricing: { accounts?: PayAccount[]; methods: { id: string; name: string }[] } | null | undefined) {
  if (!pricing) return [];
  if (!pricing.accounts?.length) return pricing.methods;
  const seen = new Map<string, string>();
  for (const a of pricing.accounts) if (!seen.has(a.provider)) seen.set(a.provider, a.providerName ?? a.provider);
  return [...seen].map(([id, name]) => ({ id, name }));
}

export function InvoiceCard({ inv, pricing, cat, storeId, walletBalance, onChanged }: {
  inv: ShopInvoice;
  pricing: Pricing | null;
  cat?: PlansCatalog | null;
  storeId: string;
  /** رصيد المحفظة — يظهر «ادفع من المحفظة» حين يكفي */
  walletBalance?: number;
  onChanged: () => void | Promise<void>;
}) {
  const [method, setMethod] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const st = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS[0];
  const amount = Number(inv.amount);
  const canWallet = inv.status === 0 && inv.kind !== 5 && walletBalance !== undefined && walletBalance >= amount;

  async function run(f: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await f();
      toast.success(ok);
      await onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إتمام العملية.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium" dir="ltr">{inv.invoiceNumber}</span>
        <Badge variant="secondary" className={st.tone}>{st.label}</Badge>
        <span className="text-sm text-muted-foreground">
          {INVOICE_KIND[inv.kind]}{inv.plan && cat ? ` — ${cat.plans[PLAN_ORDER[inv.plan]]?.name ?? ""}` : ""}{inv.months ? ` · ${periodLabel(inv.months)}` : ""}{inv.item ? ` — ${templateName(inv.item)}` : ""}
          {inv.status === 2 && inv.method === "wallet" ? " · من المحفظة" : ""}
        </span>
        <span className="ms-auto font-semibold tabular-nums">{formatBilling(amount, inv.currency)}</span>
      </div>
      {inv.status === 0 && (
        <div className="space-y-3 text-sm">
          {canWallet && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-500/10 p-3">
              <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><IconWallet className="size-4" /> رصيد محفظتك يكفي — ادفع فورًا بلا تحويل ولا إيصال.</span>
              <Button size="sm" disabled={busy} onClick={() => void run(() => payInvoiceFromWallet(inv.id), "دُفعت الفاتورة من محفظتك وفُعّلت فورًا")}>
                {busy && <IconLoader2 className="size-4 animate-spin" />} ادفع من المحفظة
              </Button>
            </div>
          )}
          <p className="text-muted-foreground">اكتب رقم الفاتورة <b dir="ltr">{inv.invoiceNumber}</b> في ملاحظات التحويل.</p>
          <PayAccounts accounts={pricing?.accounts} />
          {pricing && !pricing.accounts?.length && pricing.methods.map((m) => (
            <div key={m.id} className="rounded-md bg-muted p-3"><b>{m.name}:</b> {m.instructions}</div>
          ))}
          {pricing && !pricing.accounts?.length && pricing.methods.length === 0 && <p className="text-amber-600">لم تُضبط وسائل الدفع بعد — تواصل مع الدعم.</p>}
          <div className="grid gap-2 sm:grid-cols-4">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-full"><SelectValue placeholder="وسيلة الدفع" /></SelectTrigger>
              <SelectContent>{payMethodsOf(pricing).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2 sm:col-span-2">
              <Input className="flex-1" dir="ltr" placeholder="رابط صورة الإيصال" value={key} onChange={(e) => setKey(e.target.value)} />
              <ImageUploadButton label="رفع" storeId={storeId} onUploaded={setKey} />
            </div>
            <Button disabled={busy} onClick={() => {
              if (!key.trim()) return void toast.error("ارفع صورة الإيصال");
              void run(() => submitInvoiceProof(inv.id, { method: method || undefined, proofKey: key.trim() }),
                inv.kind === 5 ? "وصل إيصالك — يُضاف المبلغ لمحفظتك بعد تأكيد الفريق" : "وصل إيصالك وفُعّل طلبك فورًا. سنراجعه خلال يوم عمل.");
            }}>إرسال الإيصال</Button>
          </div>
        </div>
      )}
      {inv.status === 3 && inv.voidReason && <p className="text-sm text-muted-foreground">السبب: {inv.voidReason}</p>}
    </div>
  );
}
