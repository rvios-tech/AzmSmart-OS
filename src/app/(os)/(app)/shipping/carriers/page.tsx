"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconEdit, IconLoader2, IconPlus, IconTrash, IconTruck } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { createCarrier, deleteCarrier, listCarriers, updateCarrier, type Carrier, type Store } from "@/lib/api/shop";
import { formatNumber } from "@/lib/format";
import { PlanGate } from "@/components/shop/plan-gate";

type Draft = { id?: string; name: string; trackUrl: string; phone: string; active: boolean };
const EMPTY: Draft = { name: "", trackUrl: "", phone: "", active: true };

function CarriersView({ store }: { store: Store }) {
  const [rows, setRows] = useState<Carrier[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => listCarriers(store.id).then((r) => setRows(r.carriers), (e) => toast.error(e instanceof ApiError ? e.message : "تعذّر التحميل.")), [store.id]);
  useEffect(() => { void listCarriers(store.id).then((r) => setRows(r.carriers), () => setRows([])); }, [store.id]);

  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      const input = { name: draft.name.trim(), trackUrl: draft.trackUrl.trim(), phone: draft.phone.trim(), active: draft.active };
      if (draft.id) await updateCarrier(store.id, draft.id, input); else await createCarrier(store.id, input);
      toast.success(draft.id ? "حُفظت الشركة" : "أُضيفت الشركة");
      setDraft(null);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="شركات الشحن" description="الشركات التي تشحن معها. اختر الشركة واكتب رقم الشحنة في صفحة الطلب، فيرى العميل زر «تتبّع الشحنة».">
        <Button onClick={() => setDraft(EMPTY)}><IconPlus className="size-4" /> إضافة شركة</Button>
      </PageHeader>

      {!rows && <div className="flex h-40 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      {rows?.length === 0 && (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <IconTruck className="mx-auto mb-2 size-7 opacity-50" />
          لا شركات شحن بعد — التوصيل بمندوبك يكفيه «مناطق التوصيل».
        </CardContent></Card>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {rows?.map((c) => (
          <Card key={c.id} className={c.active ? "" : "opacity-60"}>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <IconTruck className="size-4 text-muted-foreground" />
                <b>{c.name}</b>
                {!c.active && <Badge variant="secondary">متوقفة</Badge>}
                <span className="ms-auto text-xs text-muted-foreground">{formatNumber(c.orders)} شحنة</span>
              </div>
              {c.trackUrl ? <p className="truncate text-xs text-muted-foreground" dir="ltr" title={c.trackUrl}>{c.trackUrl}</p>
                : <p className="text-xs text-muted-foreground">بلا رابط تتبّع — يرى العميل اسم الشركة ورقم الشحنة.</p>}
              {c.phone && <p className="text-xs text-muted-foreground" dir="ltr">{c.phone}</p>}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setDraft({ id: c.id, name: c.name, trackUrl: c.trackUrl, phone: c.phone, active: c.active })}><IconEdit className="size-4" /> تعديل</Button>
                <Button size="sm" variant="ghost" className="text-destructive"
                  onClick={() => { if (window.confirm(`حذف «${c.name}»؟ الطلبات المشحونة معها تحتفظ باسمها ورقم شحنتها.`)) void deleteCarrier(store.id, c.id).then(load, () => toast.error("تعذّر الحذف.")); }}>
                  <IconTrash className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "تعديل شركة الشحن" : "إضافة شركة شحن"}</DialogTitle>
            <DialogDescription>رابط التتبّع من موقع الشركة، واكتب {"{n}"} مكان رقم الشحنة.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="cn">اسم الشركة</Label><Input id="cn" maxLength={60} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
              <div className="space-y-2">
                <Label htmlFor="cu">رابط التتبّع (اختياري)</Label>
                <Input id="cu" dir="ltr" maxLength={300} placeholder="https://example.com/track?no={n}" value={draft.trackUrl} onChange={(e) => setDraft({ ...draft, trackUrl: e.target.value })} />
              </div>
              <div className="space-y-2"><Label htmlFor="cp">هاتف الشركة (اختياري)</Label><Input id="cp" dir="ltr" inputMode="tel" maxLength={20} value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
              <label className="flex items-center justify-between gap-3 text-sm"><span>تظهر في قائمة الشحن</span><Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /></label>
            </div>
          )}
          <DialogFooter>
            <Button disabled={busy || !draft || draft.name.trim().length < 2} onClick={() => void save()}>{busy && <IconLoader2 className="size-4 animate-spin" />} حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CarriersPage() {
  return <RequireStore allowSuspended>{(store) => <PlanGate store={store} feature="carriers"><CarriersView store={store} /></PlanGate>}</RequireStore>;
}
