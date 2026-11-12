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
}

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

      <Button className="w-full" disabled={readOnly || saving} onClick={() => void save()}>
        {saving && <IconLoader2 className="size-4 animate-spin" />} حفظ الإضافات
      </Button>
      <p className="text-center text-xs text-muted-foreground">لا تقفل المحرر — تُعدَّل في أي وقت.</p>
    </div>
  );
}
