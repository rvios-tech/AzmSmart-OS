"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconBrandWhatsapp, IconLoader2, IconShoppingCartX, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { deleteCart, listCarts, markCartReminded, type CartsResponse, type Store } from "@/lib/api/shop";
import { formatMoney, formatNumber, formatRelativeTime } from "@/lib/format";

function CartsView({ store }: { store: Store }) {
  const [tab, setTab] = useState("0");
  const [data, setData] = useState<CartsResponse | null>(null);
  const load = useCallback(async () => {
    try { setData(await listCarts(store.id, tab === "1")); } catch (err) { toast.error(err instanceof ApiError ? err.message : "تعذّر التحميل."); }
  }, [store.id, tab]);
  useEffect(() => { setData(null); void load(); }, [load]);
  const money = (n: number) => formatMoney(n, store.currency);

  async function remind(id: string, wa: string) {
    window.open(wa, "_blank", "noopener");
    try { await markCartReminded(store.id, id); void load(); } catch { /* الفتح نجح — التسجيل ثانوي */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="السلات المتروكة" description="عملاء كتبوا جوالهم في صفحة الإتمام ولم يُكملوا — ذكّرهم برسالة واتساب جاهزة. تظهر السلة بعد ٣٠ دقيقة من آخر تعديل." />
      {data && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="متروكة الآن" value={formatNumber(data.stats.open)} hint={`قيمتها ${money(data.stats.openValue)}`} tone={data.stats.open ? "warn" : undefined} />
          <MetricCard label="أُكملت بطلب" value={formatNumber(data.stats.recovered)} tone="good" />
          <MetricCard label="نسبة الاستعادة" value={`${formatNumber(data.stats.rate)}٪`} hint="من كل السلات المسجّلة" />
        </div>
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="0">متروكة</TabsTrigger><TabsTrigger value="1">أُكملت بطلب</TabsTrigger></TabsList>
      </Tabs>
      {!data && <div className="flex h-40 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      {data?.carts.length === 0 && (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <IconShoppingCartX className="mx-auto mb-2 size-7 opacity-50" />
          {tab === "0" ? "لا سلات متروكة الآن." : "لا سلات مستعادة بعد."}
        </CardContent></Card>
      )}
      <div className="grid gap-3">
        {data?.carts.map((c) => (
          <Card key={c.id}>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <b>{c.name || "عميل"}</b>
                <span dir="ltr" className="text-muted-foreground">+{c.phone}</span>
                <span className="font-medium">{money(c.subtotal)}</span>
                {c.remindedAt && <Badge variant="secondary">ذُكّر {formatRelativeTime(c.remindedAt)}</Badge>}
                <span className="ms-auto text-xs text-muted-foreground">{formatRelativeTime(c.updatedAt)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{c.items.map((i) => `${i.name} × ${formatNumber(i.qty)}`).join(" · ")}</p>
              {tab === "0" && (
                <div className="flex gap-2">
                  <Button size="sm" className="bg-[#16a34a] hover:bg-[#15803d]" onClick={() => void remind(c.id, c.wa)}><IconBrandWhatsapp className="size-4" /> {c.remindedAt ? "تذكير مرة أخرى" : "ذكّره على واتساب"}</Button>
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={() => { if (window.confirm("حذف هذه السلة؟")) void deleteCart(store.id, c.id).then(load).catch(() => toast.error("تعذّر الحذف.")); }}>
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function CartsPage() {
  return <RequireStore allowSuspended>{(store) => <CartsView store={store} />}</RequireStore>;
}
