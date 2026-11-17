"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconAlertTriangle, IconArrowRight, IconBrandWhatsapp, IconCheck, IconLoader2, IconPrinter, IconReceipt, IconX,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { printInvoice } from "@/lib/shop/print-invoice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  advanceOrder, createReturn, getOrder, setOrderPayment, type Order, type Store,
} from "@/lib/api/shop";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { ORDER_FLOW, ORDER_NEXT, PAY_METHOD_LABEL, PAY_STATUS, orderStatus } from "@/lib/shop/constants";

function OrderView({ store }: { store: Store }) {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const o = await getOrder(store.id, params.id);
        if (!cancelled) setOrder(o);
      } catch {
        if (!cancelled) setError("لم يتم العثور على هذا الطلب.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id, params.id]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      setOrder(await getOrder(store.id, params.id));
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تنفيذ الإجراء.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return <Card><CardContent className="py-16 text-center"><IconAlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" /><p className="text-lg font-medium">{error}</p></CardContent></Card>;
  }
  if (!order) {
    return <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…</div>;
  }

  const money = (n: number) => formatMoney(n, store.currency);
  const st = orderStatus(order.status);
  const isBank = order.payMethod !== "cod";

  return (
    <div className="space-y-6">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى الطلبات
      </Link>

      <PageHeader title={`الطلب ${order.ref}`} description={formatDateTime(order.createdAt)}>
        <Badge variant="secondary" className={st.tone}>{st.label}</Badge>
        {(ORDER_NEXT[order.status] ?? []).map((n, i) => (
          <Button key={n.to} size="sm" variant={i === 0 ? "default" : "outline"} disabled={busy}
            onClick={() => void run(() => advanceOrder(store.id, order.id, n.to), n.done)}>
            {i === 0 && <IconCheck className="size-4" />} {n.label}
          </Button>
        ))}
        {(order.status === 2 || order.status === 5) && (
          <Button size="sm" variant="outline" disabled={busy}
            onClick={() => { if (window.confirm(`تسجيل مرتجع للطلب وإتمامه الآن؟ يُعاد ${money(order.total)} وتعود الكميات للمخزون، ويصير الطلب «مُرجَعًا».`)) void run(() => createReturn(store.id, { orderId: order.id, complete: true, restock: true }), "سُجّل المرتجع وعادت الكميات للمخزون"); }}>
            تسجيل مرتجع
          </Button>
        )}
        {order.status !== 2 && order.status !== 3 && order.status !== 6 && (
          <Button size="sm" variant="outline" className="text-destructive" disabled={busy} onClick={() => { setReason(""); setCancelOpen(true); }}>
            <IconX className="size-4" /> إلغاء
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline"><IconPrinter className="size-4" /> طباعة</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => { if (!printInvoice(order, store, "a4")) toast.error("اسمح للمتصفح بفتح النوافذ المنبثقة للطباعة."); }}>
              <IconReceipt className="size-4" /> فاتورة A4
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => { if (!printInvoice(order, store, "80mm")) toast.error("اسمح للمتصفح بفتح النوافذ المنبثقة للطباعة."); }}>
              <IconPrinter className="size-4" /> إيصال حراري ٨٠ مم
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      {order.status === 6 ? (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3 text-sm"><b className="text-orange-600">أُرجع الطلب</b> <Link href="/returns" className="text-muted-foreground underline">تفاصيل المرتجع</Link></div>
      ) : order.status === 3 ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-sm">
          <b className="text-rose-600 dark:text-rose-400">أُلغي الطلب</b>
          {order.cancelReason ? <span className="text-muted-foreground"> — {order.cancelReason}</span> : null}
        </div>
      ) : (
        <ol className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-card px-3 py-3 text-xs" aria-label="مراحل الطلب">
          {ORDER_FLOW.map((s, i) => {
            const at = ORDER_FLOW.indexOf(order.status as (typeof ORDER_FLOW)[number]);
            const reached = i <= at;
            return (
              <li key={s} className="flex shrink-0 items-center gap-1">
                <span className={cn("flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                  reached ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {reached ? <IconCheck className="size-3.5" /> : formatNumber(i + 1)}
                </span>
                <span className={cn("whitespace-nowrap", reached ? "font-medium" : "text-muted-foreground")}>{orderStatus(s).label}</span>
                {i < ORDER_FLOW.length - 1 && <span className={cn("mx-1 h-px w-6 sm:w-10", i < at ? "bg-primary" : "bg-border")} />}
              </li>
            );
          })}
        </ol>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>إلغاء الطلب {order.ref}</DialogTitle>
            <DialogDescription>يعيد الإلغاء المخزون ويعيد استخدام قسيمة الخصم إن وُجدت. السبب يظهر للعميل في صفحة تتبّع طلبه.</DialogDescription>
          </DialogHeader>
          <Input value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="مثال: نفد المنتج، أو لم نتمكن من التواصل مع العميل" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>تراجع</Button>
            <Button variant="destructive" disabled={busy}
              onClick={() => { setCancelOpen(false); void run(() => advanceOrder(store.id, order.id, 3, reason.trim()), "أُلغي الطلب وأُعيد المخزون"); }}>
              تأكيد الإلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>المنتجات</CardTitle></CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">المنتج</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>الكمية</TableHead>
                  <TableHead className="pe-6 text-start">المجموع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="ps-6">
                      <p className="font-medium">{i.name}</p>
                      {i.variant && <p className="text-xs text-muted-foreground">{i.variant}</p>}
                    </TableCell>
                    <TableCell className="tabular-nums">{money(i.price)}</TableCell>
                    <TableCell className="tabular-nums">{formatNumber(i.qty)}</TableCell>
                    <TableCell className="pe-6 text-start tabular-nums">{money(i.price * i.qty)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <dl className="space-y-2 border-t px-6 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">المجموع</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">التوصيل{order.zoneName ? ` (${order.zoneName})` : ""}</dt><dd className="tabular-nums">{order.deliveryFee ? money(order.deliveryFee) : "مجاني"}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-emerald-600 dark:text-emerald-400"><dt>الخصم{order.couponCode ? <> (<span dir="ltr" className="font-mono">{order.couponCode}</span>)</> : ""}</dt><dd className="tabular-nums">−{money(order.discount)}</dd></div>}
              <div className="flex justify-between text-base font-semibold"><dt>الإجمالي</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>العميل</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.custName || "—"}</p>
              <p className="text-muted-foreground" dir="ltr">{order.custPhone || "—"}</p>
              {order.custAddress && <p className="text-muted-foreground">{order.custAddress}</p>}
              {order.note && <p className="rounded-md bg-muted p-2 text-muted-foreground">{order.note}</p>}
              <Button variant="outline" size="sm" asChild className="mt-2">
                <a href={order.wa} target="_blank" rel="noopener"><IconBrandWhatsapp className="size-4" /> فتح واتساب</a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الدفع</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{PAY_METHOD_LABEL[order.payMethod] ?? order.payMethod} — <b>{PAY_STATUS[order.payStatus]?.label}</b></p>
              {isBank && order.payProof && (
                <a href={order.payProof} target="_blank" rel="noopener" className="block overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={order.payProof} alt="إيصال التحويل" className="max-h-64 w-full object-contain" />
                </a>
              )}
              {isBank && order.payStatus !== 3 && (
                <Button size="sm" disabled={busy} onClick={() => void run(() => setOrderPayment(store.id, order.id, true), "أُكّد الدفع")}>
                  <IconCheck className="size-4" /> تأكيد استلام الدفع
                </Button>
              )}
              {isBank && order.payStatus === 3 && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => setOrderPayment(store.id, order.id, false), "أُعيد الطلب لبانتظار التحويل")}>
                  رفض الإيصال
                </Button>
              )}
              <p className="text-xs text-muted-foreground">المنصة لا تتحقق من الإيصال ولا تضمنه — التأكيد قرارك.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return <RequireStore allowSuspended>{(store) => <OrderView store={store} />}</RequireStore>;
}
