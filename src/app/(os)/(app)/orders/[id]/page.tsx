"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconAlertTriangle, IconArrowRight, IconBrandWhatsapp, IconCheck, IconLoader2, IconX,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  advanceOrder, getOrder, setOrderPayment, type Order, type Store,
} from "@/lib/api/shop";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { PAY_METHOD_LABEL, PAY_STATUS, orderStatus } from "@/lib/shop/constants";

function OrderView({ store }: { store: Store }) {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
        {order.status === 0 && (
          <Button size="sm" disabled={busy} onClick={() => void run(() => advanceOrder(store.id, order.id, 1), "أُكّد الطلب")}>
            <IconCheck className="size-4" /> تأكيد
          </Button>
        )}
        {order.status === 1 && (
          <Button size="sm" disabled={busy} onClick={() => void run(() => advanceOrder(store.id, order.id, 2), "اكتمل الطلب")}>
            <IconCheck className="size-4" /> إكمال
          </Button>
        )}
        {(order.status === 0 || order.status === 1) && (
          <Button size="sm" variant="outline" className="text-destructive" disabled={busy}
            onClick={() => { if (window.confirm("إلغاء الطلب يعيد المخزون. متأكد؟")) void run(() => advanceOrder(store.id, order.id, 3), "أُلغي الطلب وأُعيد المخزون"); }}>
            <IconX className="size-4" /> إلغاء
          </Button>
        )}
      </PageHeader>

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
