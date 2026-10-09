"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconSearch, IconUsers } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { listStoreCustomers, type Store, type StoreCustomer } from "@/lib/api/shop";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";

function StoreCustomersView({ store }: { store: Store }) {
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
                  <TableHead className="pe-6">آخر نشاط</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!rows && <TableRow><TableCell colSpan={5} className="py-10 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
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
                    <TableCell className="pe-6 text-muted-foreground">{formatDateShort(c.lastAt)}</TableCell>
                  </TableRow>
                ))}
                {rows && filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground"><IconUsers className="mx-auto mb-2 size-6 opacity-50" />لا عملاء بعد.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StoreCustomersPage() {
  return <RequireStore allowSuspended>{(store) => <StoreCustomersView store={store} />}</RequireStore>;
}
