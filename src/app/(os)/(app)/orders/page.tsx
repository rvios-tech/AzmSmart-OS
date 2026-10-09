"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconLoader2, IconShoppingCart } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { listOrders, type OrdersResponse, type Store } from "@/lib/api/shop";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { ORDER_STATUS, PAY_STATUS, orderStatus } from "@/lib/shop/constants";

function OrdersView({ store }: { store: Store }) {
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const res = await listOrders(store.id, {
          status: status === "all" ? undefined : Number(status),
          page,
        });
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل الطلبات.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id, status, page]);

  const count = (v: number) => data?.counts?.[String(v)] ?? 0;
  const total = ORDER_STATUS.reduce((a, s) => a + count(s.value), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="الطلبات" description="طلبات عملائك — تُسجَّل هنا قبل أن يفتح العميل واتساب." />

      <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">الكل ({formatNumber(total)})</TabsTrigger>
          {ORDER_STATUS.map((s) => (
            <TabsTrigger key={s.value} value={String(s.value)}>{s.label} ({formatNumber(count(s.value))})</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الدفع</TableHead>
                  <TableHead className="pe-6 text-start">الإجمالي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data && !error && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground"><IconLoader2 className="mx-auto mb-2 size-6 animate-spin" />جارٍ التحميل…</TableCell></TableRow>
                )}
                {error && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-destructive"><IconAlertTriangle className="mx-auto mb-2 size-6" />{error}</TableCell></TableRow>
                )}
                {data?.orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="ps-6">
                      <Link href={`/orders/${o.id}`} className="font-medium hover:underline" dir="ltr">{o.ref}</Link>
                      <p className="text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{o.custName || "—"}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{o.custPhone}</p>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className={orderStatus(o.status).tone}>{orderStatus(o.status).label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {PAY_STATUS[o.payStatus]?.label}
                      {o.payStatus === 2 && <Badge className="ms-2 bg-amber-500 text-white">تحتاج مراجعة</Badge>}
                    </TableCell>
                    <TableCell className="pe-6 text-start font-medium tabular-nums">{formatMoney(o.total, store.currency)}</TableCell>
                  </TableRow>
                ))}
                {data && data.orders.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    <IconShoppingCart className="mx-auto mb-2 size-6 opacity-50" />لا طلبات في هذه الحالة.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-6 pt-4 text-sm text-muted-foreground">
              <span>صفحة {formatNumber(data.page)} من {formatNumber(data.pages)}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>السابقة</Button>
                <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>التالية</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrdersPage() {
  return <RequireStore allowSuspended>{(store) => <OrdersView store={store} />}</RequireStore>;
}
