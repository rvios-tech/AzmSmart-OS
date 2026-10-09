"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconPlus, IconTrash, IconTruck } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  createZone, deleteZone, listZones, updateStore, updateZone, type Store, type Zone,
} from "@/lib/api/shop";
import { useStore } from "@/lib/shop/store-context";

function ShippingView({ store }: { store: Store }) {
  const { reload } = useStore();
  const [zones, setZones] = useState<Zone[] | null>(null);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [freeOver, setFreeOver] = useState("");
  const [baseFee, setBaseFee] = useState(String(store.deliveryFee));
  const [baseFree, setBaseFree] = useState(String(store.deliveryFreeOver));
  const [note, setNote] = useState(store.deliveryNote);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listZones(store.id);
        if (!cancelled) setZones(res.zones);
      } catch (err) {
        if (!cancelled) {
          setZones([]);
          toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المناطق.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const int = (v: string) => Math.max(0, Math.trunc(Number(v) || 0));

  async function saveBase() {
    setSaving(true);
    try {
      await updateStore(store.id, { deliveryFee: int(baseFee), deliveryFreeOver: int(baseFree), deliveryNote: note });
      await reload();
      toast.success("حُفظ رسم التوصيل العام");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      const z = await createZone(store.id, { name: name.trim(), fee: int(fee), freeOver: int(freeOver) });
      setZones((p) => [...(p ?? []), z]);
      setName(""); setFee(""); setFreeOver("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إضافة المنطقة.");
    }
  }

  async function patch(z: Zone, field: "fee" | "freeOver", value: string) {
    try {
      const u = await updateZone(store.id, z.id, { [field]: int(value) });
      setZones((p) => p?.map((x) => (x.id === z.id ? u : x)) ?? p);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التعديل.");
    }
  }

  async function remove(z: Zone) {
    if (!window.confirm(`حذف منطقة «${z.name}»؟ الطلبات القديمة تحتفظ باسمها.`)) return;
    try {
      await deleteZone(store.id, z.id);
      setZones((p) => p?.filter((x) => x.id !== z.id) ?? p);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف.");
    }
  }

  const cur = store.currency;

  return (
    <div className="space-y-6">
      <PageHeader title="الشحن والتوصيل" description="رسم واحد لكل مدينة غير عملي — عرّف مناطقك ورسم كل منها." />

      <Card>
        <CardHeader>
          <CardTitle>مناطق التوصيل</CardTitle>
          <CardDescription>لكل منطقة رسمها وحدّ التوصيل المجاني.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">المنطقة</TableHead>
                  <TableHead>الرسم ({cur})</TableHead>
                  <TableHead>مجاني فوق ({cur})</TableHead>
                  <TableHead className="pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!zones && <TableRow><TableCell colSpan={4} className="py-8 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
                {zones?.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell className="ps-6 font-medium">{z.name}</TableCell>
                    <TableCell><Input type="number" min={0} className="w-28" defaultValue={z.fee} onBlur={(e) => { if (int(e.target.value) !== z.fee) void patch(z, "fee", e.target.value); }} /></TableCell>
                    <TableCell><Input type="number" min={0} className="w-28" defaultValue={z.freeOver} onBlur={(e) => { if (int(e.target.value) !== z.freeOver) void patch(z, "freeOver", e.target.value); }} /></TableCell>
                    <TableCell className="pe-6 text-start"><Button variant="ghost" size="icon" aria-label="حذف" onClick={() => void remove(z)}><IconTrash className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {zones && zones.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground"><IconTruck className="mx-auto mb-2 size-6 opacity-50" />لا مناطق — يُطبَّق الرسم العام أدناه.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <form onSubmit={add} className="flex flex-col gap-3 px-6 sm:flex-row sm:items-end">
            <div className="space-y-1.5"><Label>المنطقة</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="صنعاء" maxLength={60} /></div>
            <div className="space-y-1.5"><Label>الرسم</Label><Input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} className="sm:w-28" /></div>
            <div className="space-y-1.5"><Label>مجاني فوق</Label><Input type="number" min={0} value={freeOver} onChange={(e) => setFreeOver(e.target.value)} className="sm:w-28" /></div>
            <Button type="submit" disabled={!name.trim()}><IconPlus className="size-4" /> إضافة منطقة</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الرسم العام</CardTitle>
          <CardDescription>يُطبَّق حين لا يختار العميل منطقة أو لا توجد مناطق.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>الرسم ({cur})</Label><Input type="number" min={0} value={baseFee} onChange={(e) => setBaseFee(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>مجاني فوق ({cur})</Label><Input type="number" min={0} value={baseFree} onChange={(e) => setBaseFree(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>ملاحظة للعميل</Label><Input maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} placeholder="التوصيل خلال ٢٤ ساعة داخل صنعاء" /></div>
          <Button onClick={() => void saveBase()} disabled={saving}>{saving && <IconLoader2 className="size-4 animate-spin" />} حفظ</Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ShippingPage() {
  return <RequireStore>{(store) => <ShippingView store={store} />}</RequireStore>;
}
