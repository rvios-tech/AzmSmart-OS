"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { getPlatformSettings, updatePlatformSettings, type PlatformSettings } from "@/lib/api/platform";
import { STORE_TEMPLATES, TEMPLATE_TIER_LABEL } from "@/lib/shop/constants";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PRICE_FIELDS = [
  { key: "price.plus", label: "الباقة الاحترافية (شهريًا)" },
  { key: "price.pro", label: "باقة الأعمال (شهريًا)" },
  { key: "price.store_build", label: "بناء متجر" },
  { key: "price.domain", label: "دومين" },
  { key: "price.extra_store", label: "متجر إضافي" },
  { key: "billing.yearlyMonthsFree", label: "أشهر مجانية عند الاشتراك السنوي" },
];

function flatten(s: PlatformSettings): Record<string, string> {
  const out: Record<string, string> = {
    "price.plus": s.prices.plus?.toString() ?? "",
    "price.pro": s.prices.pro?.toString() ?? "",
    "price.store_build": s.addons.store_build?.toString() ?? "",
    "price.domain": s.addons.domain?.toString() ?? "",
    "price.extra_store": s.addons.extra_store?.toString() ?? "",
    "billing.yearlyMonthsFree": String(s.yearlyMonthsFree),
    "billing.currency": s.currency,
    "app.minVersion": s.app.minVersion === "0.0.0" ? "" : s.app.minVersion,
    "app.latestVersion": s.app.latestVersion ?? "",
    "app.maintenance": s.app.maintenance ? "1" : "0",
    "app.maintenanceMessage": s.app.maintenanceMessage ?? "",
    "app.storeUrl": s.app.storeUrl ?? "",
  };
  for (const [id, price] of Object.entries(s.templates)) out[`tpl.${id}`] = String(price);
  for (const m of s.methods) out[`pay.${m.id}`] = m.instructions;
  return out;
}

export default function PlatformSettingsPage() {
  const [snap, setSnap] = useState<PlatformSettings | null>(null);
  const [v, setV] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const s = await getPlatformSettings();
        setSnap(s);
        setV(flatten(s));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل الإعدادات.");
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const s = await updatePlatformSettings(v);
      setSnap(s);
      setV(flatten(s));
      toast.success("حُفظت إعدادات المنصة");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  if (!snap) return <div className="py-20 text-center"><IconLoader2 className="mx-auto size-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="إعدادات المنصة" description="أسعار الباقات والقوالب، وتعليمات الدفع، وإعدادات تطبيق AZM." />
      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>الأسعار</CardTitle>
            <CardDescription>اتركها فارغة لإخفاء السعر — لا يستطيع التاجر الترقية قبل إعلانه.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRICE_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                <Input type="number" min={0} className="tabular-nums" value={v[f.key] ?? ""}
                  onChange={(e) => setV((p) => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div className="space-y-2">
              <Label>عملة الفوترة</Label>
              <Select value={v["billing.currency"] ?? "USD"} onValueChange={(c) => setV((p) => ({ ...p, "billing.currency": c }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">دولار أمريكي ($)</SelectItem>
                  <SelectItem value="YER">ريال يمني (ر.ي)</SelectItem>
                  <SelectItem value="SAR">ريال سعودي (ر.س)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أسعار القوالب</CardTitle>
            <CardDescription>
              تُشترى دفعة واحدة في الباقة الاحترافية. في باقة الأعمال القياسية مجانًا والتوقيع بخصم ٤٠٪. امسح السعر للعودة إلى الافتراضي.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_TEMPLATES.filter((t) => t.tier !== "free").map((t) => (
              <div key={t.id} className="space-y-2">
                <Label>{t.name} <span className="text-xs text-muted-foreground">· {TEMPLATE_TIER_LABEL[t.tier]}</span></Label>
                <Input type="number" min={0} step="0.01" className="tabular-nums" value={v[`tpl.${t.id}`] ?? ""}
                  onChange={(e) => setV((p) => ({ ...p, [`tpl.${t.id}`]: e.target.value }))} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تطبيق AZM</CardTitle>
            <CardDescription>يقرؤها التطبيق عند الإقلاع: أدنى إصدار مسموح (وإلا طلب التحديث)، ووضع الصيانة.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>أدنى إصدار مسموح</Label>
              <Input dir="ltr" placeholder="1.0.0" value={v["app.minVersion"] ?? ""} onChange={(e) => setV((p) => ({ ...p, "app.minVersion": e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>أحدث إصدار</Label>
              <Input dir="ltr" placeholder="1.2.0" value={v["app.latestVersion"] ?? ""} onChange={(e) => setV((p) => ({ ...p, "app.latestVersion": e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>رابط التطبيق في المتجر</Label>
              <Input dir="ltr" placeholder="https://play.google.com/store/apps/details?id=…" value={v["app.storeUrl"] ?? ""} onChange={(e) => setV((p) => ({ ...p, "app.storeUrl": e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <Checkbox checked={v["app.maintenance"] === "1"} onCheckedChange={(c) => setV((p) => ({ ...p, "app.maintenance": c ? "1" : "0" }))} />
              وضع الصيانة — يمنع استخدام التطبيق ويعرض الرسالة أدناه
            </label>
            <div className="space-y-2 sm:col-span-2">
              <Label>رسالة الصيانة</Label>
              <Textarea rows={2} maxLength={600} value={v["app.maintenanceMessage"] ?? ""} onChange={(e) => setV((p) => ({ ...p, "app.maintenanceMessage": e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وسائل الدفع</CardTitle>
            <CardDescription>تظهر للتاجر في فاتورته: رقم الحساب أو المحفظة والاسم.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {snap.methods.map((m) => (
              <div key={m.id} className="space-y-2">
                <Label>{m.name}</Label>
                <Textarea rows={2} maxLength={600} value={v[`pay.${m.id}`] ?? ""}
                  onChange={(e) => setV((p) => ({ ...p, [`pay.${m.id}`]: e.target.value }))} />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>{saving && <IconLoader2 className="size-4 animate-spin" />} حفظ</Button>
        </div>
      </form>
    </div>
  );
}
