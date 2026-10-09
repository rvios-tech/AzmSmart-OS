"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconAlertTriangle, IconDotsVertical, IconLoader2, IconPackage, IconPencil, IconPlus, IconSearch, IconTrash,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { DeleteDialog } from "@/components/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiError } from "@/lib/api/client";
import {
  deleteProduct, listProducts, updateProduct, type Product, type ProductsResponse, type Store,
} from "@/lib/api/shop";
import { formatMoney, formatNumber } from "@/lib/format";

function ProductsView({ store }: { store: Store }) {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setData(null);
      setError(null);
      try {
        const res = await listProducts(store.id);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل المنتجات.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = data?.products ?? [];
    return q ? all.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.categoryName.includes(q)) : all;
  }, [data, search]);

  const replace = (p: Product) =>
    setData((d) => (d ? { ...d, products: d.products.map((x) => (x.id === p.id ? p : x)) } : d));

  async function toggleLive(p: Product, live: boolean) {
    replace({ ...p, live });
    try {
      replace(await updateProduct(store.id, p.id, { live }));
    } catch (err) {
      replace(p);
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحديث المنتج.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(store.id, id);
      setData((d) => d && { ...d, products: d.products.filter((p) => p.id !== id), capacity: { ...d.capacity, used: d.capacity.used - 1, canAdd: true } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف المنتج.");
    }
  }

  const cap = data?.capacity;
  const deleting = data?.products.find((p) => p.id === deleteId);

  return (
    <div className="space-y-6">
      <PageHeader title="المنتجات" description="كتالوج متجرك.">
        <Button size="sm" asChild disabled={cap ? !cap.canAdd : false}>
          <Link href="/products/new"><IconPlus className="size-4" /> إضافة منتج</Link>
        </Button>
      </PageHeader>

      {cap && cap.max !== null && (
        <Card>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-1.5">
              <p className="text-sm">
                {formatNumber(cap.used)} من {formatNumber(cap.max)} منتجًا في باقتك
              </p>
              <Progress value={Math.min(100, (cap.used / cap.max) * 100)} />
            </div>
            {!cap.canAdd && (
              <Button variant="outline" size="sm" asChild><Link href="/store/plan">رقِّ باقتك</Link></Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="px-6">
            <div className="relative w-full sm:max-w-xs">
              <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في المنتجات…" className="ps-9" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">المنتج</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المخزون</TableHead>
                  <TableHead>معروض</TableHead>
                  <TableHead className="w-10 pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data && !error && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" />جارٍ التحميل…
                  </TableCell></TableRow>
                )}
                {error && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-destructive">
                    <IconAlertTriangle className="mx-auto mb-2 size-6" />{error}
                  </TableCell></TableRow>
                )}
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="ps-6">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="size-10 rounded-md border object-cover" />
                        ) : (
                          <div className="flex size-10 items-center justify-center rounded-md border bg-muted"><IconPackage className="size-4 text-muted-foreground" /></div>
                        )}
                        <div className="min-w-0">
                          <Link href={`/products/${p.id}/edit`} className="font-medium hover:underline">{p.name}</Link>
                          {p.hasVariants && <p className="text-xs text-muted-foreground">{formatNumber(p.variants.length)} خيارات</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.categoryName || "—"}</TableCell>
                    <TableCell className="tabular-nums">
                      {formatMoney(p.price, store.currency)}
                      {p.oldPrice ? <span className="ms-2 text-xs text-muted-foreground line-through">{formatNumber(p.oldPrice)}</span> : null}
                    </TableCell>
                    <TableCell>
                      {p.qty <= 0 ? <Badge variant="secondary" className="bg-rose-500/10 text-rose-600">نفد</Badge>
                        : <span className="tabular-nums">{formatNumber(p.qty)}</span>}
                    </TableCell>
                    <TableCell><Switch checked={p.live} onCheckedChange={(c) => void toggleLive(p, c)} aria-label="معروض" /></TableCell>
                    <TableCell className="pe-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8"><IconDotsVertical className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/products/${p.id}/edit`}><IconPencil className="size-4" /> تعديل</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteId(p.id)}><IconTrash className="size-4" /> حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {data && rows.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    <IconPackage className="mx-auto mb-2 size-6 opacity-50" />
                    {data.products.length === 0 ? "لا منتجات بعد — أضف أولها." : "لا منتجات تطابق البحث."}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)} name={deleting?.name ?? "منتج"}
        onConfirm={() => { if (deleteId) void handleDelete(deleteId); setDeleteId(null); }} />
    </div>
  );
}

export default function ProductsPage() {
  return <RequireStore allowSuspended>{(store) => <ProductsView store={store} />}</RequireStore>;
}
