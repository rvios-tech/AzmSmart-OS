"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { ImageDropzone } from "@/components/image-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { updateStore, type Store } from "@/lib/api/shop";
import { COUNTRIES, PAY_METHOD_LABEL, SECTORS } from "@/lib/shop/constants";
import { useStore } from "@/lib/shop/store-context";
import { TemplatePicker } from "@/components/shop/template-picker";
import { DomainCard } from "@/components/shop/domain-card";

function SettingsView({ store }: { store: Store }) {
  const { reload } = useStore();
  const [f, setF] = useState({
    name: store.name, tagline: store.tagline, about: store.about, city: store.city,
    address: store.address, hours: store.hours, sector: store.sector, country: store.country,
    whatsapp: store.whatsapp, slug: store.slug, color: store.color, logo: store.logo,
    banner: store.banner, payNote: store.payNote,
  });
  const [pay, setPay] = useState<string[]>(store.payMethods.split(",").filter(Boolean));
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStore(store.id, { ...f, colorDeep: f.color, payMethods: pay.length ? pay : ["cod"] });
      await reload();
      toast.success("حُفظت إعدادات المتجر");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  const togglePay = (m: string, on: boolean) =>
    setPay((p) => (on ? [...new Set([...p, m])] : p.filter((x) => x !== m)));

  return (
    <div className="space-y-6">
      <PageHeader title="إعدادات المتجر" description="هوية متجرك وما يراه عميلك." />
      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>الهوية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>اسم المتجر</Label><Input required value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={60} /></div>
              <div className="space-y-2">
                <Label>الرابط</Label>
                <Input dir="ltr" value={f.slug} onChange={(e) => set("slug", e.target.value)} />
                <p className="text-xs text-muted-foreground">الرابط القديم يبقى يعمل ويحوّل للجديد.</p>
              </div>
            </div>
            <div className="space-y-2"><Label>وصف مختصر</Label><Input value={f.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={120} /></div>
            <div className="space-y-2"><Label>عن المتجر</Label><Textarea rows={4} value={f.about} onChange={(e) => set("about", e.target.value)} maxLength={600} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>النشاط</Label>
                <Select value={f.sector} onValueChange={(v) => set("sector", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTORS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الدولة</Label>
                <Select value={f.country} onValueChange={(v) => set("country", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">العملة تتبع الدولة: {store.currency}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>واتساب</Label><Input dir="ltr" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
              <div className="space-y-2"><Label>المدينة</Label><Input value={f.city} onChange={(e) => set("city", e.target.value)} maxLength={40} /></div>
              <div className="space-y-2"><Label>ساعات العمل</Label><Input value={f.hours} onChange={(e) => set("hours", e.target.value)} maxLength={120} /></div>
            </div>
            <div className="space-y-2"><Label>العنوان</Label><Input value={f.address} onChange={(e) => set("address", e.target.value)} maxLength={120} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المظهر</CardTitle>
            <CardDescription>اللون الواحد تُشتقّ منه واجهة المتجر كلها.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="color" aria-label="لون المتجر" value={f.color} onChange={(e) => set("color", e.target.value)} className="h-10 w-14 cursor-pointer rounded border bg-transparent" />
              <Input dir="ltr" className="w-32" value={f.color} onChange={(e) => set("color", e.target.value)} maxLength={7} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>الشعار</Label>
                <div className="flex items-start gap-3">
                  <ImageDropzone storeId={store.id} value={f.logo} onChange={(url) => set("logo", url)} aspect="aspect-square" className="size-20 shrink-0" />
                  <Input dir="ltr" className="flex-1" value={f.logo} onChange={(e) => set("logo", e.target.value)} placeholder="https://… أو ارفع صورة" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الغلاف</Label>
                <div className="flex items-start gap-3">
                  <ImageDropzone storeId={store.id} value={f.banner} onChange={(url) => set("banner", url)} aspect="aspect-video" className="w-32 shrink-0" />
                  <Input dir="ltr" className="flex-1" value={f.banner} onChange={(e) => set("banner", e.target.value)} placeholder="https://… أو ارفع صورة" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TemplatePicker store={store} />

        <Card>
          <CardHeader>
            <CardTitle>الدفع</CardTitle>
            <CardDescription>لا بوابة ولا عمولة — التحويل يؤكّده أنت بعد رؤية الإيصال.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6">
              {(["cod", "wallet", "bank"] as const).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={pay.includes(m)} disabled={m === "cod"} onCheckedChange={(c) => togglePay(m, c === true)} />
                  {PAY_METHOD_LABEL[m]}{m === "cod" && <span className="text-xs text-muted-foreground">(دائمًا)</span>}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <Label>تعليمات التحويل</Label>
              <Textarea rows={3} maxLength={400} value={f.payNote} onChange={(e) => set("payNote", e.target.value)} placeholder="حوّل إلى الكريمي رقم ١٢٣٤ باسم …" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving && <IconLoader2 className="size-4 animate-spin" />} حفظ الإعدادات</Button>
        </div>
      </form>
      {/* خارج النموذج: يُحفظ وحده، و Enter فيه لا يحفظ بقية الإعدادات */}
      <DomainCard store={store} />
    </div>
  );
}

export default function StoreSettingsPage() {
  return <RequireStore>{(store) => <SettingsView key={store.id} store={store} />}</RequireStore>;
}
