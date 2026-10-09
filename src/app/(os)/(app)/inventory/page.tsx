"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconLoader2, IconPackage } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { listProducts, updateProduct, type Product, type Store } from "@/lib/api/shop";
import { formatMoney, formatNumber } from "@/lib/format";

function InventoryView({ store }: { store: Store }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listProducts(store.id);
        if (!cancelled) setProducts(res.products);
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المخزون.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const stats = useMemo(() => {
    const list = products ?? [];
    return {
      units: list.reduce((a, p) => a + p.qty, 0),
      value: list.reduce((a, p) => a + p.qty * p.price, 0),
      out: list.filter((p) => p.qty <= 0).length,
      low: list.filter((p) => p.qty > 0 && p.qty <= (p.lowStock > 0 ? p.lowStock : 5)).length,
    };
  }, [products]);

  async function save(p: Product) {
    const raw = edits[p.id];
    if (raw === undefined) return;
    const qty = Math.max(0, Math.trunc(Number(raw) || 0));
    setSaving(p.id);
    try {
      const u = await updateProduct(store.id, p.id, { qty });
      setProducts((prev) => prev?.map((x) => (x.id === p.id ? u : x)) ?? prev);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[p.id];
        return next;
      });
      toast.success("حُدّث المخزون");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحديث المخزون.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="المخزون" description="الكميات المتوفرة — تُخصم عند الطلب وتُعاد عند الإلغاء." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="إجمالي القطع" value={formatNumber(stats.units)} />
        <MetricCard label="قيمة المخزون" value={formatMoney(stats.value, store.currency)} hint="بسعر البيع" />
        <MetricCard label="نفدت" value={formatNumber(stats.out)} tone={stats.out ? "warn" : undefined} />
        <MetricCard label="على وشك النفاد" value={formatNumber(stats.low)} tone={stats.low ? "warn" : undefined} />
      </div>

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">المنتج</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead className="pe-6 text-start" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products && <TableRow><TableCell colSpan={4} className="py-10 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
              {products?.map((p) => {
                const low = p.qty <= (p.lowStock > 0 ? p.lowStock : 5);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="ps-6">
                      <Link href={`/products/${p.id}/edit`} className="font-medium hover:underline">{p.name}</Link>
                      {p.hasVariants && <p className="text-xs text-muted-foreground">الكمية مجموع الخيارات — عدّلها من المنتج</p>}
                    </TableCell>
                    <TableCell>
                      {p.qty <= 0 ? <Badge variant="secondary" className="bg-rose-500/10 text-rose-600">نفد</Badge>
                        : low ? <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">منخفض</Badge>
                        : <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">متوفر</Badge>}
                    </TableCell>
                    <TableCell>
                      <Input type="number" min={0} className="w-28" disabled={p.hasVariants}
                        value={edits[p.id] ?? String(p.qty)}
                        onChange={(e) => setEdits((prev) => ({ ...prev, [p.id]: e.target.value }))} />
                    </TableCell>
                    <TableCell className="pe-6 text-start">
                      {edits[p.id] !== undefined && (
                        <Button size="sm" disabled={saving === p.id} onClick={() => void save(p)}>
                          {saving === p.id && <IconLoader2 className="size-4 animate-spin" />} حفظ
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {products && products.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground"><IconPackage className="mx-auto mb-2 size-6 opacity-50" />لا منتجات بعد.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InventoryPage() {
  return <RequireStore>{(store) => <InventoryView store={store} />}</RequireStore>;
}
