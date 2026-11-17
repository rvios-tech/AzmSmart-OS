"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconArrowBackUp, IconCheck, IconLoader2, IconX } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { listReturns, updateReturn, type ReturnRow, type ReturnsResponse, type Store } from "@/lib/api/shop";
import { formatMoney, formatNumber, formatRelativeTime } from "@/lib/format";

const RETURN_STATUS = [
  { value: 0, label: "طلبات جديدة", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { value: 1, label: "مقبولة", tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { value: 3, label: "مكتملة", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { value: 2, label: "مرفوضة", tone: "bg-slate-500/10 text-slate-500" },
] as const;

function ReturnCard({ r, store, onChange }: { r: ReturnRow; store: Store; onChange: () => void }) {
  const [refund, setRefund] = useState(String(r.refund));
  const [restock, setRestock] = useState(r.restock);
  const [toWallet, setToWallet] = useState(false);
  const [note, setNote] = useState(r.note);
  const [busy, setBusy] = useState(false);
  const st = RETURN_STATUS.find((s) => s.value === r.status) ?? RETURN_STATUS[0];
  const open = r.status === 0 || r.status === 1;
  const money = (n: number) => formatMoney(n, store.currency);

  async function set(status: 1 | 2 | 3, ok: string) {
    setBusy(true);
    try {
      await updateReturn(store.id, r.id, { status, refund: Math.max(0, Math.trunc(Number(refund) || 0)), restock, note: note.trim(), ...(status === 3 && toWallet ? { toWallet: true } : {}) });
      toast.success(ok);
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/orders/${r.order.id}`} className="font-mono font-semibold hover:underline" dir="ltr">{r.order.ref}</Link>
          <Badge variant="secondary" className={st.tone}>{st.label}</Badge>
          <span className="text-muted-foreground">{r.order.custName || "عميل"} · {money(r.order.total)}</span>
          <span className="ms-auto text-xs text-muted-foreground">{r.source === "merchant" ? "سجّلته أنت" : "من العميل"} · {formatRelativeTime(r.createdAt)}</span>
        </div>
        {r.reason && <p className="rounded-md bg-muted p-2 text-sm">{r.reason}</p>}
        <p className="text-xs text-muted-foreground">{r.order.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} × ${formatNumber(i.qty)}`).join(" · ")}</p>
        {open ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1"><Label className="text-xs">المبلغ المُعاد ({store.currency})</Label><Input type="number" min={0} max={r.order.total} value={refund} onChange={(e) => setRefund(e.target.value)} /></div>
            <div className="space-y-1 sm:col-span-2"><Label className="text-xs">ملاحظة يراها العميل</Label><Input maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثال: أُعيد المبلغ إلى الكريمي" /></div>
            <label className="flex items-center gap-2 text-sm sm:col-span-3"><Switch checked={restock} onCheckedChange={setRestock} /> أعد الكميات إلى المخزون عند الإتمام</label>
            <label className="flex items-center gap-2 text-sm sm:col-span-3"><Switch checked={toWallet} onCheckedChange={setToWallet} /> أعد المبلغ إلى محفظة العميل في متجرك (بدل التحويل) — يصله إشعار</label>
          </div>
        ) : (
          <p className="text-sm">{r.status === 3 ? <>أُعيد <b>{money(r.refund)}</b>{r.restock ? " وأُعيدت الكميات للمخزون" : ""}</> : null}{r.note ? <span className="text-muted-foreground"> — {r.note}</span> : null}</p>
        )}
        {open && (
          <div className="flex flex-wrap gap-2">
            {r.status === 0 && <Button size="sm" variant="outline" disabled={busy} onClick={() => void set(1, "قُبل الطلب — العميل يرى ذلك في تتبّع طلبه")}><IconCheck className="size-4" /> قبول</Button>}
            <Button size="sm" disabled={busy} onClick={() => void set(3, "اكتمل المرتجع — الطلب صار «مُرجَعًا»")}>
              {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconArrowBackUp className="size-4" />} إتمام الاسترجاع
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => void set(2, "رُفض الطلب")}><IconX className="size-4" /> رفض</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReturnsView({ store }: { store: Store }) {
  const [status, setStatus] = useState("0");
  const [data, setData] = useState<ReturnsResponse | null>(null);
  const load = useCallback(async () => {
    try {
      setData(await listReturns(store.id, status === "all" ? undefined : Number(status)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المرتجعات.");
    }
  }, [store.id, status]);
  useEffect(() => {
    let on = true;
    listReturns(store.id, status === "all" ? undefined : Number(status)).then((r) => { if (on) setData(r); }, (err) => toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المرتجعات."));
    return () => { on = false; };
  }, [store.id, status]);

  return (
    <div className="space-y-6">
      <PageHeader title="المرتجعات" description="طلبات الاسترجاع من عملائك، وما تسجّله بنفسك لأي طلب مكتمل." />
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="h-auto flex-wrap">
          {RETURN_STATUS.map((s) => <TabsTrigger key={s.value} value={String(s.value)}>{s.label} ({formatNumber(data?.counts?.[s.value] ?? 0)})</TabsTrigger>)}
          <TabsTrigger value="all">الكل</TabsTrigger>
        </TabsList>
      </Tabs>
      {!data && <div className="flex h-40 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      {data && data.returns.length === 0 && (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <IconArrowBackUp className="mx-auto mb-2 size-7 opacity-50" />
          لا مرتجعات هنا. يطلبها العميل من صفحة تتبّع طلب مكتمل خلال ١٤ يومًا، أو تسجّلها أنت من صفحة الطلب.
        </CardContent></Card>
      )}
      <div className="grid gap-4">
        {data?.returns.map((r) => <ReturnCard key={r.id + r.status} r={r} store={store} onChange={() => void load()} />)}
      </div>
    </div>
  );
}

export default function ReturnsPage() {
  return <RequireStore allowSuspended>{(store) => <ReturnsView store={store} />}</RequireStore>;
}
