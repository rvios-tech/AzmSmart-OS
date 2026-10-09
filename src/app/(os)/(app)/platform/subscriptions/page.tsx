"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  listStoreSubscriptions, updateStoreSubscription, SHOP_PLAN_LABELS, SHOP_SUB_STATUS_LABELS,
  type PlatformSubscriptionList, type SubscriptionFilter,
} from "@/lib/api/platform";
import { formatDateShort, formatNumber } from "@/lib/format";

const TABS: { id: SubscriptionFilter; label: string }[] = [
  { id: "all", label: "الكل" },
  { id: "soon", label: "تنتهي خلال ٧ أيام" },
  { id: "grace", label: "في المهلة" },
  { id: "expired", label: "منتهية" },
  { id: "paid", label: "مدفوعة" },
];
const STATUS_TONE = ["bg-emerald-500/10 text-emerald-600", "bg-amber-500/10 text-amber-600", "bg-rose-500/10 text-rose-600"];

export default function PlatformSubscriptionsPage() {
  const [filter, setFilter] = useState<SubscriptionFilter>("all");
  const [data, setData] = useState<PlatformSubscriptionList | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (f: SubscriptionFilter) => {
    try {
      setData(await listStoreSubscriptions(f));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل الاشتراكات.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load(filter);
    })();
  }, [filter, load]);

  async function patch(id: string, input: { plan?: number; status?: number; extendDays?: number }, ok: string) {
    setBusy(id);
    try {
      await updateStoreSubscription(id, input);
      toast.success(ok);
      await load(filter);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    } finally {
      setBusy(null);
    }
  }

  const c = data?.counts;

  return (
    <div className="space-y-6">
      <PageHeader title="اشتراكات المتاجر" description="من ينتهي قريبًا؟ ومن في المهلة؟ وتعديل يدوي عند الحاجة." />

      {c && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[["الإجمالي", c.all], ["نشطة", c.active], ["في المهلة", c.grace], ["منتهية", c.expired]].map(([l, v]) => (
            <Card key={l as string}><CardContent className="py-3">
              <p className="text-sm text-muted-foreground">{l}</p>
              <p className="text-2xl font-semibold tabular-nums">{formatNumber(v as number)}</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as SubscriptionFilter)}>
        <TabsList className="flex-wrap">{TABS.map((t) => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}</TabsList>
      </Tabs>

      <Card>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">الشركة</TableHead>
                <TableHead>الباقة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تنتهي</TableHead>
                <TableHead className="pe-6">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!data && <TableRow><TableCell colSpan={5} className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
              {data?.subscriptions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="ps-6">
                    <div className="font-medium">{s.organization.name}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{s.storeRef.slice(0, 8)}</div>
                  </TableCell>
                  <TableCell>
                    <Select value={String(s.plan)} disabled={busy === s.id}
                      onValueChange={(v) => void patch(s.id, { plan: Number(v) }, "غُيّرت الباقة")}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>{SHOP_PLAN_LABELS.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className={STATUS_TONE[s.status]}>{SHOP_SUB_STATUS_LABELS[s.status]}</Badge></TableCell>
                  <TableCell className="tabular-nums">{s.currentPeriodEnd ? formatDateShort(s.currentPeriodEnd) : "—"}</TableCell>
                  <TableCell className="pe-6">
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" disabled={busy === s.id}
                        onClick={() => void patch(s.id, { extendDays: 30, status: 0 }, "مُدّد ٣٠ يومًا")}>
                        تمديد ٣٠ يومًا
                      </Button>
                      {s.status !== 0 && (
                        <Button size="sm" variant="outline" disabled={busy === s.id}
                          onClick={() => void patch(s.id, { status: 0 }, "أُعيد تفعيله")}>تفعيل</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data && data.subscriptions.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">لا اشتراكات في هذا التصنيف.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
