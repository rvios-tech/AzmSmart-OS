"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconGift, IconLoader2, IconMinus, IconPlus, IconSearch, IconUsers } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  adjustCustomerPoints, getCustomerPoints, listStoreCustomers, updateStore, type PointsTx, type Store, type StoreCustomer,
} from "@/lib/api/shop";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";

const KIND_LABEL: Record<string, string> = { earn: "مكافأة طلب", redeem: "صُرف في طلب", revoke: "سُحب (طلب مُرجَع)", adjust: "تعديل يدوي" };

/** نسبة المكافأة: تُحفظ في إعداد المتجر */
function LoyaltyCard({ store, onSaved }: { store: Store; onSaved: (rate: number) => void }) {
  const [rate, setRate] = useState(String(store.loyaltyRate ?? 0));
  const [saving, setSaving] = useState(false);
  const n = Math.min(30, Math.max(0, Math.trunc(Number(rate) || 0)));
  async function save() {
    setSaving(true);
    try {
      await updateStore(store.id, { loyaltyRate: n });
      onSaved(n);
      toast.success(n ? `يكسب العميل ${formatNumber(n)}٪ من كل طلب مكتمل` : "أُوقف برنامج المكافآت");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card>
      <CardContent className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-60 flex-1 items-start gap-3">
          <IconGift className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-medium">برنامج المكافآت</p>
            <p className="text-sm text-muted-foreground">
              نسبة من إجمالي كل طلب <b>مكتمل</b> تُضاف رصيدًا للعميل بعملة المتجر، تُصرف خصمًا في طلبه القادم من «طلب جديد»، وتُسحب إن أُرجع الطلب. يرى العميل رصيده في صفحة تتبّع طلبه.
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lr">النسبة ٪ (0 يوقفه)</Label>
          <Input id="lr" type="number" min={0} max={30} className="w-28" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <Button onClick={() => void save()} disabled={saving || n === (store.loyaltyRate ?? 0)}>
          {saving && <IconLoader2 className="size-4 animate-spin" />} حفظ
        </Button>
      </CardContent>
    </Card>
  );
}

/** رصيد العميل وسجل حركاته وتعديله */
function PointsDialog({ store, customer, onClose, onChanged }: { store: Store; customer: StoreCustomer; onClose: () => void; onChanged: (points: number) => void }) {
  const [history, setHistory] = useState<PointsTx[] | null>(null);
  const [points, setPoints] = useState(customer.points);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const money = (v: number) => formatMoney(v, store.currency);

  const load = useCallback(
    () => getCustomerPoints(store.id, customer.id).then((r) => { setHistory(r.history); setPoints(r.customer.points); }, () => setHistory([])),
    [store.id, customer.id],
  );
  useEffect(() => { void getCustomerPoints(store.id, customer.id).then((r) => { setHistory(r.history); setPoints(r.customer.points); }, () => setHistory([])); }, [store.id, customer.id]);

  async function apply(sign: 1 | -1) {
    const v = Math.trunc(Number(amount) || 0);
    if (v <= 0) return toast.error("اكتب مبلغًا أكبر من صفر.");
    setBusy(true);
    try {
      const r = await adjustCustomerPoints(store.id, customer.id, sign * v, note.trim() || undefined);
      setPoints(r.points);
      onChanged(r.points);
      setAmount("");
      setNote("");
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التعديل.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>رصيد {customer.name || "العميل"}</DialogTitle>
          <DialogDescription>الرصيد الحالي <b className="text-foreground">{money(points)}</b> — يُصرف خصمًا في طلب يدوي برقم جواله.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
          <Input type="number" min={1} placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder="سبب (اختياري) — هدية، تعويض…" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={() => void apply(1)}><IconPlus className="size-4" /> إضافة</Button>
          <Button size="sm" variant="outline" disabled={busy || points <= 0} onClick={() => void apply(-1)}><IconMinus className="size-4" /> خصم</Button>
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {!history && <div className="flex h-20 items-center justify-center"><IconLoader2 className="size-4 animate-spin" /></div>}
          {history?.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">لا حركات بعد.</p>}
          <ul className="divide-y text-sm">
            {history?.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1">{KIND_LABEL[t.kind] ?? t.kind}{t.note ? <span className="text-muted-foreground"> · {t.note}</span> : null}</span>
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

function StoreCustomersView({ store }: { store: Store }) {
  const [rate, setRate] = useState(store.loyaltyRate ?? 0);
  const [open, setOpen] = useState<StoreCustomer | null>(null);
  const [rows, setRows] = useState<StoreCustomer[] | null>(null);
  const [returning, setReturning] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listStoreCustomers(store.id);
        if (!cancelled) {
          setRows(res.customers);
          setReturning(res.returning);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل العملاء.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = rows ?? [];
    return q ? all.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)) : all;
  }, [rows, search]);

  const spent = (rows ?? []).reduce((a, c) => a + c.spent, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="عملاء المتجر" description="من اشترى منك — يُبنى تلقائيًا من الطلبات، الجوال هو هوية العميل." />

      <LoyaltyCard store={store} onSaved={setRate} />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="إجمالي العملاء" value={formatNumber(rows?.length ?? 0)} />
        <MetricCard label="عملاء عائدون" value={formatNumber(returning)} tone="good" hint="اشتروا أكثر من مرة" />
        <MetricCard label="إجمالي الإنفاق" value={formatMoney(spent, store.currency)} />
      </div>

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="px-6">
            <div className="relative w-full sm:max-w-xs">
              <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالاسم أو الجوال…" className="ps-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">العميل</TableHead>
                  <TableHead>الجوال</TableHead>
                  <TableHead>الطلبات</TableHead>
                  <TableHead>الإنفاق</TableHead>
                  <TableHead>رصيد المكافآت</TableHead>
                  <TableHead className="pe-6">آخر نشاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!rows && <TableRow><TableCell colSpan={6} className="py-10 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="ps-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8"><AvatarFallback>{(c.name || "؟").slice(0, 2)}</AvatarFallback></Avatar>
                        <span className="font-medium">{c.name || "بلا اسم"}</span>
                        {c.ordersCount > 1 && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">عائد</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground" dir="ltr">{c.phone}</TableCell>
                    <TableCell className="tabular-nums">{formatNumber(c.ordersCount)}</TableCell>
                    <TableCell className="tabular-nums">{formatMoney(c.spent, store.currency)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 tabular-nums" onClick={() => setOpen(c)} title="السجل والتعديل">
                        <IconGift className="size-3.5 text-primary" /> {formatMoney(c.points ?? 0, store.currency)}
                      </Button>
                    </TableCell>
                    <TableCell className="pe-6 text-muted-foreground">{formatDateShort(c.lastAt)}</TableCell>
                  </TableRow>
                ))}
                {rows && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground"><IconUsers className="mx-auto mb-2 size-6 opacity-50" />لا عملاء بعد.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {rate === 0 && rows?.some((c) => c.points > 0) && <p className="text-xs text-muted-foreground">البرنامج متوقف — الأرصدة الموجودة باقية ويمكن صرفها.</p>}
      {open && (
        <PointsDialog store={store} customer={open} onClose={() => setOpen(null)}
          onChanged={(points) => setRows((rs) => rs?.map((x) => (x.id === open.id ? { ...x, points } : x)) ?? null)} />
      )}
    </div>
  );
}

export default function StoreCustomersPage() {
  return <RequireStore allowSuspended>{(store) => <StoreCustomersView store={store} />}</RequireStore>;
}
