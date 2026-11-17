"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconMinus, IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { adjustCustomerWallet, getCustomerWallet, type PointsTx, type Store, type StoreCustomer } from "@/lib/api/shop";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";

const KIND: Record<string, string> = { credit: "إضافة منك", debit: "خصم منك", refund: "استرداد مرتجع", pay: "دفع طلب", cancel: "طلب ملغى أُعيد" };

/** محفظة العميل: الرصيد وسجله، وإضافة (تعويض، استرداد) أو خصم */
export function WalletDialog({ store, customer, onClose, onChanged }: { store: Store; customer: StoreCustomer; onClose: () => void; onChanged: (wallet: number) => void }) {
  const [history, setHistory] = useState<PointsTx[] | null>(null);
  const [balance, setBalance] = useState(customer.wallet ?? 0);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const money = (v: number) => formatMoney(v, store.currency);
  const fetchIt = () => getCustomerWallet(store.id, customer.id).then((r) => { setHistory(r.history); setBalance(r.customer.wallet); }, () => setHistory([]));
  useEffect(() => { void getCustomerWallet(store.id, customer.id).then((r) => { setHistory(r.history); setBalance(r.customer.wallet); }, () => setHistory([])); }, [store.id, customer.id]);

  async function apply(sign: 1 | -1) {
    const v = Math.trunc(Number(amount) || 0);
    if (v <= 0) return toast.error("اكتب مبلغًا أكبر من صفر.");
    setBusy(true);
    try {
      const r = await adjustCustomerWallet(store.id, customer.id, sign * v, note.trim() || undefined);
      setBalance(r.wallet);
      onChanged(r.wallet);
      setAmount(""); setNote("");
      void fetchIt();
      toast.success(sign > 0 ? "أُضيف للمحفظة — وصل العميل إشعار" : "خُصم من المحفظة");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر التعديل.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>محفظة {customer.name || "العميل"}</DialogTitle>
          <DialogDescription>الرصيد <b className="text-foreground">{money(balance)}</b> — يدفع منه العميل في طلبه القادم وهو مسجّل الدخول في متجرك.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
          <Input type="number" min={1} placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder="السبب — تعويض، استرداد، هدية…" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={() => void apply(1)}>{busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlus className="size-4" />} إضافة</Button>
          <Button size="sm" variant="outline" disabled={busy || balance <= 0} onClick={() => void apply(-1)}><IconMinus className="size-4" /> خصم</Button>
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {!history && <div className="flex h-20 items-center justify-center"><IconLoader2 className="size-4 animate-spin" /></div>}
          {history?.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">لا حركات بعد.</p>}
          <ul className="divide-y text-sm">
            {history?.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1">{KIND[t.kind] ?? t.kind}{t.note ? <span className="text-muted-foreground"> · {t.note}</span> : null}</span>
                <span className="text-xs text-muted-foreground">{formatDateShort(t.createdAt)}</span>
                <b className={`w-24 text-end tabular-nums ${t.amount >= 0 ? "text-emerald-600" : "text-destructive"}`} dir="ltr">{t.amount >= 0 ? "+" : ""}{formatNumber(t.amount)}</b>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
