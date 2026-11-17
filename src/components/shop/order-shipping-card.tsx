"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconExternalLink, IconLoader2, IconTruck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { listCarriers, setOrderShipping, type Carrier, type Order } from "@/lib/api/shop";

/** شركة الشحن ورقم الشحنة — يراهما العميل مع زر «تتبّع الشحنة» في صفحة طلبه بعد الشحن */
export function OrderShippingCard({ storeId, order, onSaved }: { storeId: string; order: Order; onSaved: () => void }) {
  const [carriers, setCarriers] = useState<Carrier[] | null>(null);
  const [carrierId, setCarrierId] = useState<string>("");
  const [no, setNo] = useState(order.trackingNo ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void listCarriers(storeId).then((r) => {
      setCarriers(r.carriers);
      setCarrierId(r.carriers.find((c) => c.name === order.carrierName)?.id ?? "");
    }, () => setCarriers([]));
  }, [storeId, order.carrierName]);

  if (order.status === 0 || order.status === 3) return null;
  const changed = no.trim() !== (order.trackingNo ?? "") || (carriers?.find((c) => c.id === carrierId)?.name ?? "") !== (order.carrierName ?? "");

  async function save() {
    setBusy(true);
    try {
      await setOrderShipping(storeId, order.id, { carrierId: carrierId || null, trackingNo: no.trim() });
      toast.success(order.status === 5 || order.status === 2 ? "حُفظ — يراه العميل في صفحة طلبه" : "حُفظ — يظهر للعميل حين تجعل الطلب «تم الشحن»");
      onSaved();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><IconTruck className="size-4" /> الشحن</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {carriers?.length === 0 ? (
          <p className="text-muted-foreground">أضف شركات الشحن التي تتعامل معها مرة واحدة من <Link href="/shipping/carriers" className="text-primary hover:underline">شركات الشحن</Link>.</p>
        ) : (
          <div className="space-y-1.5">
            <Label>شركة الشحن</Label>
            <Select value={carrierId || "none"} onValueChange={(v) => setCarrierId(v === "none" ? "" : v)} disabled={!carriers}>
              <SelectTrigger className="w-full"><SelectValue placeholder="اختر الشركة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">بلا شركة (توصيل المتجر)</SelectItem>
                {carriers?.filter((c) => c.active || c.id === carrierId).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="trk">رقم الشحنة (بوليصة)</Label>
          <Input id="trk" dir="ltr" maxLength={60} value={no} onChange={(e) => setNo(e.target.value)} placeholder="اختياري" />
        </div>
        {order.trackUrl && (
          <a href={order.trackUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
            <IconExternalLink className="size-3.5" /> رابط التتبّع كما يراه العميل
          </a>
        )}
        <Button size="sm" variant="outline" disabled={busy || !changed} onClick={() => void save()}>
          {busy && <IconLoader2 className="size-4 animate-spin" />} حفظ الشحن
        </Button>
      </CardContent>
    </Card>
  );
}
