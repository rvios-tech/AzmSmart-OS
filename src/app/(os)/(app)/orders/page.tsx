"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconAlertTriangle, IconDownload, IconLoader2, IconSearch, IconShoppingCart } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { exportOrders, listOrders, type Order, type OrdersResponse, type Store } from "@/lib/api/shop";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { downloadCsv } from "@/lib/shop/csv";
import { ORDER_STATUS, PAY_METHOD_LABEL, PAY_STATUS, orderStatus } from "@/lib/shop/constants";
import { useWorkspace } from "@/lib/workspace/workspace-context";

/** المدير فأعلى يصدّر بيانات العملاء — كما يقرر الخادم */
const EXPORT_ROLE = 6;

function OrdersView({ store }: { store: Store }) {
  const { ctx } = useWorkspace();
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [data, setData] = useState<OrdersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // البحث يُرسَل بعد أن يتوقف التاجر عن الكتابة، لا مع كل حرف
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setError(null);
      try {
        const res = await listOrders(store.id, {
          status: status === "all" ? undefined : Number(status),
          page,
          q,
        });
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل الطلبات.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id, status, page, q]);

  const count = (v: number) => data?.counts?.[String(v)] ?? 0;
  const total = ORDER_STATUS.reduce((a, s) => a + count(s.value), 0);

  async function onExport() {
    setExporting(true);
    try {
      const res = await exportOrders(store.id, { status: status === "all" ? undefined : Number(status), q });
      if (!res.orders.length) {
        toast.info("لا طلبات لتصديرها بهذا المرشّح.");
        return;
      }
      downloadCsv(`${store.slug}-orders.csv`,
        ["رقم الطلب", "التاريخ", "الحالة", "الدفع", "طريقة الدفع", "العميل", "الجوال", "العنوان", "المنطقة", "المنتجات", "ملاحظة",
          `المجموع (${store.currency})`, `التوصيل (${store.currency})`, `الإجمالي (${store.currency})`],
        res.orders.map((o) => [
          o.ref, formatDateTime(o.createdAt), orderStatus(o.status).label, PAY_STATUS[o.payStatus]?.label ?? "",
          PAY_METHOD_LABEL[o.payMethod] ?? o.payMethod, o.custName, o.custPhone, o.custAddress, o.zoneName,
          o.items.map((i) => `${i.name} × ${i.qty}`).join(" · "), o.note, o.subtotal, o.deliveryFee, o.total,
        ]));
      if (res.truncated) toast.warning(`صُدّر أحدث ${formatNumber(res.orders.length)} طلب — ضيّق المرشّح لتصدير الباقي.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التصدير.");
    } finally {
      setExporting(false);
    }
  }

  const empty = q ? "لا طلبات تطابق البحث." : "لا طلبات في هذه الحالة.";

  return (
    <div className="space-y-6">
      <PageHeader title="الطلبات" description="طلبات عملائك — تُسجَّل هنا قبل أن يفتح العميل واتساب.">
        {(ctx?.role ?? 9) <= EXPORT_ROLE && (
          <Button variant="outline" onClick={onExport} disabled={exporting}>
            {exporting ? <IconLoader2 className="size-4 animate-spin" /> : <IconDownload className="size-4" />} تصدير CSV
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="all">الكل ({formatNumber(total)})</TabsTrigger>
            {ORDER_STATUS.map((s) => (
              <TabsTrigger key={s.value} value={String(s.value)}>{s.label} ({formatNumber(count(s.value))})</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative lg:w-72">
          <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="رقم الطلب أو اسم العميل أو جواله"
            className="ps-9"
            aria-label="بحث في الطلبات"
          />
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {!data && !error && (
            <div className="py-12 text-center text-muted-foreground"><IconLoader2 className="mx-auto mb-2 size-6 animate-spin" />جارٍ التحميل…</div>
          )}
          {error && (
            <div className="py-12 text-center text-destructive"><IconAlertTriangle className="mx-auto mb-2 size-6" />{error}</div>
          )}
          {data && data.orders.length === 0 && (
            <div className="py-12 text-center text-muted-foreground"><IconShoppingCart className="mx-auto mb-2 size-6 opacity-50" />{empty}</div>
          )}

          {data && data.orders.length > 0 && (
            <>
              {/* الجوال: بطاقات تُقرأ دون تمرير جانبي */}
              <ul className="divide-y md:hidden">
                {data.orders.map((o) => <OrderCard key={o.id} o={o} currency={store.currency} />)}
              </ul>

              <div className="hidden overflow-x-auto md:block">
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
                    {data.orders.map((o) => (
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
                  </TableBody>
                </Table>
              </div>
            </>
          )}

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

function OrderCard({ o, currency }: { o: Order; currency: string }) {
  const st = orderStatus(o.status);
  return (
    <li>
      <Link href={`/orders/${o.id}`} className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-muted/50">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium" dir="ltr">{o.ref}</span>
          <span className="font-medium tabular-nums">{formatMoney(o.total, currency)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate">{o.custName || "—"} <span className="text-xs text-muted-foreground" dir="ltr">{o.custPhone}</span></span>
          <Badge variant="secondary" className={st.tone}>{st.label}</Badge>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{formatDateTime(o.createdAt)}</span>
          <span>
            {PAY_STATUS[o.payStatus]?.label}
            {o.payStatus === 2 && <Badge className="ms-2 bg-amber-500 text-white">تحتاج مراجعة</Badge>}
          </span>
        </div>
      </Link>
    </li>
  );
}

export default function OrdersPage() {
  return <RequireStore allowSuspended>{(store) => <OrdersView store={store} />}</RequireStore>;
}
