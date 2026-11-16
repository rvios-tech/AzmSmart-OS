"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface StoreExtras {
  announce?: { on: boolean; text: string; link: string; color: string };
  policies?: Record<string, string>;
  waFloat?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  /** معرّفات أكواد التتبع — المعرّف وحده، والمتجر يبني كود كل منصة */
  tracking?: Partial<Record<TrackerKey, string>>;
}

export type TrackerKey = "meta" | "tiktok" | "snap" | "x" | "ga4" | "gtm" | "gsc";

const TRACKERS: { key: TrackerKey; label: string; placeholder: string; hint: string }[] = [
  { key: "meta", label: "Meta Pixel (فيسبوك وانستغرام)", placeholder: "123456789012345", hint: "مدير الأحداث ← مصادر البيانات ← معرّف البكسل (أرقام فقط)" },
  { key: "tiktok", label: "TikTok Pixel", placeholder: "C4ABCDEFGH12345678", hint: "TikTok Ads ← Events ← Web Events ← Pixel ID" },
  { key: "snap", label: "Snap Pixel", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", hint: "Snapchat Ads ← Events Manager ← Pixel ID" },
  { key: "x", label: "X (تويتر) Pixel", placeholder: "o1abc", hint: "X Ads ← Events manager ← Pixel ID" },
  { key: "ga4", label: "Google Analytics 4", placeholder: "G-XXXXXXXXXX", hint: "Admin ← Data streams ← Measurement ID" },
  { key: "gtm", label: "Google Tag Manager", placeholder: "GTM-XXXXXXX", hint: "اختياري لمن يدير أكواده من GTM" },
  { key: "gsc", label: "Google Search Console", placeholder: "الصق وسم التحقق كاملًا أو قيمة content", hint: "اختر طريقة «HTML tag» عند إضافة نطاق متجرك" },
];

export const POLICIES: { key: string; label: string; hint: string }[] = [
  { key: "shipping", label: "الشحن والتوصيل", hint: "المدن التي توصلون لها، المدة، الرسوم، ومتى يصبح التوصيل مجانيًا." },
  { key: "returns", label: "الاستبدال والاسترجاع", hint: "خلال كم يومًا، وبأي حالة للمنتج، ومن يتحمّل رسوم الإرجاع." },
  { key: "privacy", label: "الخصوصية", hint: "ما البيانات التي تجمعونها (الاسم، الجوال، العنوان) ولماذا، وأنكم لا تشاركونها." },
  { key: "terms", label: "الشروط والأحكام", hint: "الأسعار والدفع وتأكيد الطلب والإلغاء." },
];

const ANNOUNCE_COLORS = ["", "#111111", "#C1272D", "#0F766E", "#1F4E79", "#A8641B", "#5B2A6E"];

/**
 * «إضافات المتجر» في محرر الشكل: شريط الإعلان، وصفحات السياسات، وزر واتساب العائم، ووصف البحث.
 * تُحفظ وحدها فورًا ولا تقفل المحرر أسبوعًا — العرض يتغيّر كل أسبوع والسياسة تُصحَّح كل يوم.
 */
export function StoreExtrasPanel({
  initial,
  readOnly = false,
  onSave,
}: {
  initial: StoreExtras;
  readOnly?: boolean;
  onSave: (extras: StoreExtras) => Promise<unknown>;
}) {
  const [x, setX] = useState<StoreExtras>({
    announce: { on: false, text: "", link: "", color: "", ...initial.announce },
    policies: { ...initial.policies },
    waFloat: initial.waFloat ?? false,
    seoTitle: initial.seoTitle ?? "",
    seoDescription: initial.seoDescription ?? "",
    tracking: { ...initial.tracking },
  });
  const [policy, setPolicy] = useState("shipping");
  const [saving, setSaving] = useState(false);
  const a = x.announce!;
  const setA = (patch: Partial<NonNullable<StoreExtras["announce"]>>) => setX((v) => ({ ...v, announce: { ...a, ...patch } }));

  async function save() {
    setSaving(true);
    try {
      await onSave(x);
      toast.success("حُفظت إضافات المتجر وظهرت للعملاء");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">شريط الإعلان أعلى المتجر</Label>
          <Switch checked={a.on} disabled={readOnly} onCheckedChange={(on) => setA({ on })} />
        </div>
        <Input placeholder="توصيل مجاني للطلبات فوق ٢٠٠ ريال 🚚" maxLength={140} value={a.text} disabled={readOnly} onChange={(e) => setA({ text: e.target.value })} />
        <Input dir="ltr" placeholder="رابط اختياري: https://… أو /s/متجري/p/…" maxLength={300} value={a.link} disabled={readOnly} onChange={(e) => setA({ link: e.target.value })} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">اللون:</span>
          {ANNOUNCE_COLORS.map((c) => (
            <button
              key={c || "accent"}
              type="button"
              disabled={readOnly}
              title={c ? c : "لون المتجر"}
              onClick={() => setA({ color: c })}
              className={cn("size-7 rounded-full border-2", a.color === c ? "border-primary ring-2 ring-primary/30" : "border-transparent")}
              style={{ background: c || "conic-gradient(#C1272D, #0F766E, #1F4E79, #C1272D)" }}
            />
          ))}
        </div>
        {a.on && a.text && (
          <div className="rounded-md px-3 py-2 text-center text-sm font-semibold" style={{ background: a.color || "var(--primary)", color: "#fff" }}>{a.text}</div>
        )}
      </section>

      <section className="space-y-2">
        <Label className="font-semibold">صفحات السياسات</Label>
        <p className="text-xs text-muted-foreground">تظهر روابطها في أسفل كل صفحات المتجر — تبني ثقة العميل قبل الطلب.</p>
        <div className="flex flex-wrap gap-1.5">
          {POLICIES.map((p) => (
            <Button key={p.key} type="button" size="sm" variant={policy === p.key ? "default" : "outline"} onClick={() => setPolicy(p.key)}>
              {p.label}{x.policies?.[p.key] ? " ✓" : ""}
            </Button>
          ))}
        </div>
        <Textarea
          rows={7}
          maxLength={6000}
          disabled={readOnly}
          placeholder={POLICIES.find((p) => p.key === policy)?.hint}
          value={x.policies?.[policy] ?? ""}
          onChange={(e) => setX((v) => ({ ...v, policies: { ...v.policies, [policy]: e.target.value } }))}
        />
        <p className="text-end text-xs text-muted-foreground">{formatNumber((x.policies?.[policy] ?? "").length)} / {formatNumber(6000)}</p>
      </section>

      <section className="flex items-center justify-between gap-3">
        <div>
          <Label className="font-semibold">زر واتساب عائم</Label>
          <p className="text-xs text-muted-foreground">زر أخضر في زاوية كل صفحة يفتح محادثة مع رقم المتجر.</p>
        </div>
        <Switch checked={!!x.waFloat} disabled={readOnly} onCheckedChange={(waFloat) => setX((v) => ({ ...v, waFloat }))} />
      </section>

      <section className="space-y-2">
        <Label className="font-semibold">الظهور في Google</Label>
        <Input placeholder="عنوان الصفحة في نتائج البحث" maxLength={70} value={x.seoTitle} disabled={readOnly} onChange={(e) => setX((v) => ({ ...v, seoTitle: e.target.value }))} />
        <Textarea rows={3} maxLength={170} placeholder="وصف قصير يظهر تحت العنوان في نتائج البحث (حتى ١٧٠ حرفًا)" value={x.seoDescription} disabled={readOnly} onChange={(e) => setX((v) => ({ ...v, seoDescription: e.target.value }))} />
        {(x.seoTitle || x.seoDescription) && (
          <div className="rounded-md border bg-background p-3 text-start" dir="rtl">
            <div className="truncate text-[15px] text-[#1a0dab]">{x.seoTitle || "اسم المتجر"}</div>
            <div className="line-clamp-2 text-xs text-muted-foreground">{x.seoDescription}</div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <Label className="font-semibold">أكواد التتبع الإعلانية</Label>
        <p className="text-xs text-muted-foreground">
          الصق معرّف البكسل فقط — المتجر يركّب الكود ويرسل أحداث «مشاهدة، إضافة للسلة، بدء الدفع، شراء» تلقائيًا لقياس إعلاناتك.
        </p>
        <div className="grid gap-3">
          {TRACKERS.map((t) => (
            <div key={t.key} className="space-y-1">
              <Label htmlFor={`trk-${t.key}`} className="text-xs">{t.label}</Label>
              <Input
                id={`trk-${t.key}`}
                dir="ltr"
                className="font-mono text-start text-xs"
                placeholder={t.placeholder}
                maxLength={t.key === "gsc" ? 200 : 60}
                value={x.tracking?.[t.key] ?? ""}
                disabled={readOnly}
                onChange={(e) => setX((v) => ({ ...v, tracking: { ...v.tracking, [t.key]: e.target.value } }))}
              />
              <p className="text-[11px] text-muted-foreground">{t.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <Button className="w-full" disabled={readOnly || saving} onClick={() => void save()}>
        {saving && <IconLoader2 className="size-4 animate-spin" />} حفظ الإضافات
      </Button>
      <p className="text-center text-xs text-muted-foreground">لا تقفل المحرر — تُعدَّل في أي وقت.</p>
    </div>
  );
}
