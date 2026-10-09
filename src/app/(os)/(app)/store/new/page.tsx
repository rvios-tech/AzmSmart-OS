"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { checkSlug, createStore, type SlugCheck } from "@/lib/api/shop";
import { COUNTRIES, SECTORS } from "@/lib/shop/constants";
import { useStore } from "@/lib/shop/store-context";

const COLORS = ["#9E2226", "#2F5D50", "#1F4E79", "#7A4B1E", "#5B2A6E", "#A8641B", "#2C2C2C", "#0F766E"];

export default function NewStorePage() {
  const router = useRouter();
  const { reload, setActive, slots } = useStore();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sector, setSector] = useState("other");
  const [country, setCountry] = useState("YE");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [tagline, setTagline] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [check, setCheck] = useState<SlugCheck | null>(null);
  const [checking, setChecking] = useState(false);

  // فحص الرابط مؤجَّلًا: من الاسم ما لم يكتب التاجر رابطًا صريحًا
  const source = slug || name;
  useEffect(() => {
    const t = window.setTimeout(() => {
      void (async () => {
        if (!source.trim()) {
          setCheck(null);
          return;
        }
        setChecking(true);
        try {
          setCheck(await checkSlug(source));
        } catch {
          setCheck(null);
        } finally {
          setChecking(false);
        }
      })();
    }, 350);
    return () => window.clearTimeout(t);
  }, [source]);

  const noSlot = slots !== null && slots.free === 0 && slots.owned > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { store } = await createStore({
        name: name.trim(),
        slug: slug.trim() || undefined,
        sector,
        country,
        whatsapp: whatsapp.trim(),
        city: city.trim() || undefined,
        tagline: tagline.trim() || undefined,
        color,
        colorDeep: color,
      });
      await reload();
      setActive(store.id);
      toast.success("أُنشئ متجرك", { description: `/${store.slug}` });
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء المتجر.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="متجر جديد" description="اسم ورابط ورقم واتساب — والباقي تكمله لاحقًا من إعدادات المتجر." />

      {noSlot && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            بلغتَ عدد المتاجر المتاح في حسابك ({slots.slots}). لإنشاء متجر إضافي اشترِ
            خانة من صفحة الاشتراك (تتطلب باقة برو).
          </CardContent>
        </Card>
      )}

      <form onSubmit={submit}>
        <Card>
          <CardHeader>
            <CardTitle>بيانات المتجر</CardTitle>
            <CardDescription>تظهر لعملائك في واجهة المتجر.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المتجر</Label>
              <Input id="name" required minLength={2} maxLength={60} value={name}
                onChange={(e) => setName(e.target.value)} placeholder="مثال: متجر ذو يزن للعطور" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">رابط المتجر</Label>
              <div dir="ltr" className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">rviosstore.com/</span>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)}
                  placeholder={check?.slug || "yazan"} spellCheck={false} />
              </div>
              <p className="flex items-center gap-1.5 text-xs">
                {checking ? (
                  <><IconLoader2 className="size-3.5 animate-spin" /> جارٍ الفحص…</>
                ) : check ? (
                  check.ok ? (
                    <span className="flex items-center gap-1 text-emerald-600"><IconCheck className="size-3.5" /> الرابط متاح: {check.slug}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive">
                      <IconX className="size-3.5" /> {check.reason}
                      {check.suggestion && (
                        <button type="button" className="underline" onClick={() => setSlug(check.suggestion!)}>
                          جرّب «{check.suggestion}»
                        </button>
                      )}
                    </span>
                  )
                ) : (
                  <span className="text-muted-foreground">حروف لاتينية وأرقام وشرطات.</span>
                )}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>النشاط</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الدولة</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name} (+{c.dial})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="wa">رقم واتساب المتجر</Label>
                <Input id="wa" required dir="ltr" inputMode="tel" value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)} placeholder="777123456" />
                <p className="text-xs text-muted-foreground">تصله طلبات عملائك.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">المدينة</Label>
                <Input id="city" maxLength={40} value={city} onChange={(e) => setCity(e.target.value)} placeholder="صنعاء" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">وصف مختصر</Label>
              <Input id="tagline" maxLength={120} value={tagline} onChange={(e) => setTagline(e.target.value)}
                placeholder="عطور شرقية وفرنسية أصلية" />
            </div>

            <div className="space-y-2">
              <Label>لون المتجر</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button key={c} type="button" aria-label={c} aria-pressed={color === c}
                    onClick={() => setColor(c)} style={{ background: c }}
                    className={`size-8 rounded-full ring-offset-2 ring-offset-background ${color === c ? "ring-2 ring-foreground" : ""}`} />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>إلغاء</Button>
              <Button type="submit" disabled={saving || noSlot || (check !== null && !check.ok)}>
                {saving && <IconLoader2 className="size-4 animate-spin" />} إنشاء المتجر
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
