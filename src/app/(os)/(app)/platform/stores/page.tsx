"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconBuildingStore, IconLoader2, IconRosetteDiscountCheck, IconSearch } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  listPlatformStores, setPlatformStoreStatus, setPlatformStoreVerified, type PlatformShopStore,
} from "@/lib/api/platform";
import { formatDateShort, formatNumber } from "@/lib/format";
import { storeUrl } from "@/lib/shop/constants";

export default function PlatformStoresPage() {
  const [rows, setRows] = useState<PlatformShopStore[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const list = await listPlatformStores(q.trim() || undefined);
          if (!cancelled) setRows(list);
        } catch (err) {
          if (!cancelled) {
            setRows([]);
            toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المتاجر.");
          }
        }
      })();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  async function act(id: string, fn: () => Promise<PlatformShopStore>, ok: string) {
    setBusy(id);
    try {
      const u = await fn();
      setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status: u.status, verified: u.verified } : r)) ?? prev);
      toast.success(ok);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تنفيذ الإجراء.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="المتاجر" description="كل متاجر المنصة عبر الشركات — تعليق وتوثيق." />

      <div className="relative max-w-sm">
        <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="ps-9" placeholder="ابحث بالاسم أو الرابط" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">المتجر</TableHead>
                <TableHead>الشركة</TableHead>
                <TableHead>المنتجات</TableHead>
                <TableHead>الطلبات</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="pe-6">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rows && <TableRow><TableCell colSpan={6} className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
              {rows?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="ps-6">
                    <div className="flex items-center gap-1.5 font-medium">
                      {s.name}
                      {s.verified && <IconRosetteDiscountCheck className="size-4 text-sky-600" aria-label="موثَّق" />}
                    </div>
                    <div className="text-xs text-muted-foreground" dir="ltr"><a href={storeUrl(s.slug)} target="_blank" rel="noopener" className="hover:underline">/{s.slug}</a> · {formatDateShort(s.createdAt)}</div>
                  </TableCell>
                  <TableCell>{s.organization.name}</TableCell>
                  <TableCell className="tabular-nums">{formatNumber(s._count.products)}</TableCell>
                  <TableCell className="tabular-nums">{formatNumber(s._count.orders)}</TableCell>
                  <TableCell>
                    {s.status === 1
                      ? <Badge variant="secondary" className="bg-rose-500/10 text-rose-600">معلَّق</Badge>
                      : <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">نشط</Badge>}
                  </TableCell>
                  <TableCell className="pe-6">
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" disabled={busy === s.id}
                        onClick={() => void act(s.id, () => setPlatformStoreStatus(s.id, s.status !== 1), s.status === 1 ? "أُعيد تفعيل المتجر" : "عُلّق المتجر")}>
                        {s.status === 1 ? "تفعيل" : "تعليق"}
                      </Button>
                      <Button size="sm" variant="outline" disabled={busy === s.id}
                        onClick={() => void act(s.id, () => setPlatformStoreVerified(s.id, !s.verified), s.verified ? "أُزيل التوثيق" : "وُثّق المتجر")}>
                        {s.verified ? "إلغاء التوثيق" : "توثيق"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows && rows.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground"><IconBuildingStore className="mx-auto mb-2 size-6 opacity-50" />لا متاجر.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
