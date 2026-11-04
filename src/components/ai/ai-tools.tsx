"use client";

import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconCopy, IconLoader2, IconRefresh, IconSparkles, IconWand } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  aiGenerate, type AiLang, type AiMarketingResult, type AiProductResult, type AiSeoResult,
} from "@/lib/api/ai";
import { cn } from "@/lib/utils";

/** نسخ إلى الحافظة برسالة واحدة في كل الأدوات */
export function copyText(text: string) {
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast.success("نُسخ إلى الحافظة"))
    .catch(() => toast.error("تعذّر النسخ"));
}

const errText = (e: unknown) => (e instanceof ApiError ? e.message : "تعذّر الاتصال بالمساعد — حاول مرة أخرى.");

function CopyButton({ text, label = "نسخ" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1 px-2 text-xs text-muted-foreground"
      onClick={() => {
        copyText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />} {label}
    </Button>
  );
}

/** حقل نتيجة قابل للتحرير قبل النسخ — التاجر صاحب القرار في كل كلمة */
function Field({ label, value, onChange, rows = 1, limit }: { label: string; value: string; onChange: (v: string) => void; rows?: number; limit?: number }) {
  const over = limit !== undefined && value.length > limit;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-1">
          {limit !== undefined && <span className={cn("text-[11px] tabular-nums", over ? "text-destructive" : "text-muted-foreground")}>{value.length}/{limit}</span>}
          <CopyButton text={value} />
        </div>
      </div>
      {rows > 1 ? (
        <Textarea dir="auto" rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input dir="auto" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function Chips({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <CopyButton text={items.join("، ")} label="نسخ الكل" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((k) => (
          <Badge key={k} variant="secondary" dir="auto" className="cursor-pointer font-normal" onClick={() => copyText(k)}>{k}</Badge>
        ))}
      </div>
    </div>
  );
}

function LangSelect({ value, onChange }: { value: AiLang; onChange: (v: AiLang) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AiLang)}>
      <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="ar">العربية</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}

function Shell({ title, hint, children, busy, onRun, ready, canRun }: { title: string; hint: string; children: React.ReactNode; busy: boolean; onRun: () => void; ready: boolean; canRun: boolean }) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        // أحداث React تعبر البوابات: داخل نموذج المنتج (نافذة منبثقة) كان «اكتب» يُرسل نموذج
        // المنتج نفسه فيحاول إنشاءه — المساعد لا يحفظ شيئًا أبدًا
        e.stopPropagation();
        if (!busy && canRun) onRun();
      }}
    >
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
      <Button type="submit" disabled={busy || !canRun || !ready} className="gap-2">
        {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
        {busy ? "يكتب RVIOS AI…" : "اكتب بالذكاء الاصطناعي"}
      </Button>
    </form>
  );
}

// ═══ كاتب المنتجات ═════════════════════════════════════════════════════════

export function ProductWriter({
  storeId, ready = true, initial, onApply, onUsed,
}: {
  storeId: string;
  ready?: boolean;
  initial?: { name?: string; category?: string; details?: string };
  /** داخل نموذج المنتج: تعبئة الحقول — التاجر يراجعها ثم يحفظ بنفسه */
  onApply?: (r: { name: string; summary: string; description: string }) => void;
  onUsed?: (used: number, limit: number) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [details, setDetails] = useState(initial?.details ?? "");
  const [audience, setAudience] = useState("");
  const [lang, setLang] = useState<AiLang>("ar");
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<AiProductResult | null>(null);

  async function run() {
    setBusy(true);
    try {
      const res = await aiGenerate(storeId, "product", lang, { name: name.trim(), category: category.trim() || undefined, details: details.trim() || undefined, audience: audience.trim() || undefined });
      setR(res.result);
      onUsed?.(res.used, res.limit);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(false);
    }
  }
  const set = <K extends keyof AiProductResult>(k: K, v: AiProductResult[K]) => setR((p) => (p ? { ...p, [k]: v } : p));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Shell title="كاتب المنتجات" hint="اكتب ما تعرفه عن المنتج، ويكتب لك الاسم والوصف والمزايا وبيانات البحث." busy={busy} onRun={run} ready={ready} canRun={name.trim().length >= 2}>
        <div className="space-y-2"><Label htmlFor="pw-name">اسم المنتج أو نوعه</Label><Input id="pw-name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} placeholder="مثال: دهن عود كمبودي" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="pw-cat">التصنيف (اختياري)</Label><Input id="pw-cat" value={category} maxLength={100} onChange={(e) => setCategory(e.target.value)} placeholder="عطور" /></div>
          <div className="space-y-2"><Label>اللغة</Label><LangSelect value={lang} onChange={setLang} /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="pw-det">المواصفات والمزايا</Label><Textarea id="pw-det" rows={4} value={details} maxLength={2500} onChange={(e) => setDetails(e.target.value)} placeholder="الحجم ٦ مل، معتّق ٥ سنوات، ثبات عالٍ، يصل خلال يومين…" /></div>
        <div className="space-y-2"><Label htmlFor="pw-aud">لمن؟ (اختياري)</Label><Input id="pw-aud" value={audience} maxLength={200} onChange={(e) => setAudience(e.target.value)} placeholder="هدية للرجال، عشّاق العود الثقيل" /></div>
      </Shell>

      <div className="min-w-0 rounded-xl border bg-muted/20 p-4">
        {!r ? (
          <Empty busy={busy} text="ستظهر النتيجة هنا — قابلة للتعديل والنسخ." />
        ) : (
          <div className="space-y-4">
            <Field label="اسم المنتج" value={r.title} onChange={(v) => set("title", v)} limit={100} />
            <Field label="وصف مختصر" value={r.summary} onChange={(v) => set("summary", v)} limit={120} />
            <Field label="الوصف الكامل" value={r.description} onChange={(v) => set("description", v)} rows={7} limit={1200} />
            {!!r.features.length && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><Label className="text-xs text-muted-foreground">المزايا</Label><CopyButton text={r.features.map((f) => `• ${f}`).join("\n")} label="نسخ الكل" /></div>
                <ul className="space-y-1 text-sm" dir="auto">{r.features.map((f) => <li key={f} className="flex gap-2"><IconCheck className="mt-1 size-3.5 shrink-0 text-emerald-600" />{f}</li>)}</ul>
              </div>
            )}
            {!!r.specs.length && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between"><Label className="text-xs text-muted-foreground">المواصفات</Label><CopyButton text={r.specs.map((s) => `${s.label}: ${s.value}`).join("\n")} label="نسخ الكل" /></div>
                <div className="overflow-hidden rounded-lg border text-sm" dir="auto">{r.specs.map((s) => <div key={s.label} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] border-b last:border-0"><span className="bg-muted/50 px-3 py-1.5 text-muted-foreground">{s.label}</span><span className="px-3 py-1.5">{s.value}</span></div>)}</div>
              </div>
            )}
            <Field label="عنوان البحث (SEO)" value={r.seoTitle} onChange={(v) => set("seoTitle", v)} limit={60} />
            <Field label="وصف البحث (Meta)" value={r.metaDescription} onChange={(v) => set("metaDescription", v)} rows={2} limit={155} />
            <Chips label="كلمات البحث" items={r.keywords} />
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {onApply && (
                <Button type="button" className="gap-2" onClick={() => onApply({ name: r.title.slice(0, 100), summary: r.summary.slice(0, 120), description: [r.description, r.features.length ? r.features.map((f) => `• ${f}`).join("\n") : ""].filter(Boolean).join("\n\n").slice(0, 1200) })}>
                  <IconWand className="size-4" /> ضعها في نموذج المنتج
                </Button>
              )}
              <Button type="button" variant="outline" className="gap-2" disabled={busy || !ready} onClick={run}><IconRefresh className="size-4" /> صيغة أخرى</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ busy, text }: { busy: boolean; text: string }) {
  return (
    <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
      {busy ? (
        <>
          <IconLoader2 className="size-6 animate-spin text-primary" />
          <span>يكتب RVIOS AI…</span>
        </>
      ) : (
        <>
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconSparkles className="size-5" /></span>
          <span>{text}</span>
        </>
      )}
    </div>
  );
}

// ═══ المسوّق ════════════════════════════════════════════════════════════════

const PLATFORMS = [
  ["instagram", "إنستغرام"], ["tiktok", "تيك توك"], ["snapchat", "سناب شات"], ["whatsapp", "واتساب"],
  ["facebook", "فيسبوك"], ["x", "إكس (تويتر)"], ["ad", "إعلان ممول"], ["sms", "رسالة SMS"],
] as const;
const TONES = ["ودّي", "فاخر وراقٍ", "حماسي", "مختصر ومباشر", "مرح"];

export function MarketingWriter({ storeId, ready = true, onUsed }: { storeId: string; ready?: boolean; onUsed?: (used: number, limit: number) => void }) {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string>("instagram");
  const [tone, setTone] = useState(TONES[0]);
  const [occasion, setOccasion] = useState("");
  const [offer, setOffer] = useState("");
  const [lang, setLang] = useState<AiLang>("ar");
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<AiMarketingResult | null>(null);

  async function run() {
    setBusy(true);
    try {
      const res = await aiGenerate(storeId, "marketing", lang, { topic: topic.trim(), platform, tone, occasion: occasion.trim() || undefined, offer: offer.trim() || undefined, count: 3 });
      setR(res.result);
      onUsed?.(res.used, res.limit);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Shell title="المسوّق" hint="منشورات وإعلانات ورسائل عروض جاهزة للنشر، بثلاث صيغ مختلفة." busy={busy} onRun={run} ready={ready} canRun={topic.trim().length >= 2}>
        <div className="space-y-2"><Label htmlFor="mk-topic">عن ماذا؟</Label><Textarea id="mk-topic" rows={3} value={topic} maxLength={1500} onChange={(e) => setTopic(e.target.value)} placeholder="وصول تشكيلة عطور الشتاء، أو منتج بعينه، أو متجري كله" /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2"><Label>المنصة</Label>
            <Select value={platform} onValueChange={setPlatform}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>النبرة</Label>
            <Select value={tone} onValueChange={setTone}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2"><Label htmlFor="mk-occ">المناسبة (اختياري)</Label><Input id="mk-occ" value={occasion} maxLength={120} onChange={(e) => setOccasion(e.target.value)} placeholder="رمضان، العيد، الجمعة البيضاء" /></div>
          <div className="space-y-2"><Label htmlFor="mk-off">العرض (اختياري)</Label><Input id="mk-off" value={offer} maxLength={120} onChange={(e) => setOffer(e.target.value)} placeholder="خصم ٢٠٪ حتى الخميس" /></div>
        </div>
        <div className="space-y-2"><Label>اللغة</Label><LangSelect value={lang} onChange={setLang} /></div>
      </Shell>

      <div className="min-w-0 rounded-xl border bg-muted/20 p-4">
        {!r ? (
          <Empty busy={busy} text="ستظهر الصيغ هنا — انسخ ما يعجبك أو اطلب غيرها." />
        ) : (
          <div className="space-y-3">
            {r.items.map((it, i) => {
              const full = it.hashtags.length ? `${it.text}\n\n${it.hashtags.join(" ")}` : it.text;
              return (
                <div key={i} className="rounded-lg border bg-background p-3">
                  <div className="mb-1 flex items-center justify-between"><span className="text-xs font-medium text-muted-foreground">الصيغة {i + 1}</span><CopyButton text={full} /></div>
                  <p dir="auto" className="whitespace-pre-wrap text-sm leading-7">{it.text}</p>
                  {!!it.hashtags.length && <p dir="auto" className="mt-2 text-xs text-primary">{it.hashtags.join(" ")}</p>}
                </div>
              );
            })}
            {!!r.tips.length && (
              <div className="rounded-lg bg-primary/5 p-3 text-sm">
                <p className="mb-1 font-medium">نصائح للنشر</p>
                <ul className="list-disc space-y-1 ps-5" dir="auto">{r.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            )}
            <Button type="button" variant="outline" className="gap-2" disabled={busy || !ready} onClick={run}><IconRefresh className="size-4" /> صيغ أخرى</Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ مساعد السيو ═══════════════════════════════════════════════════════════

export function SeoAssistant({ storeId, ready = true, onUsed }: { storeId: string; ready?: boolean; onUsed?: (used: number, limit: number) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [city, setCity] = useState("");
  const [lang, setLang] = useState<AiLang>("ar");
  const [busy, setBusy] = useState(false);
  const [r, setR] = useState<AiSeoResult | null>(null);

  async function run() {
    setBusy(true);
    try {
      const res = await aiGenerate(storeId, "seo", lang, { name: name.trim(), description: description.trim() || undefined, keywords: keywords.trim() || undefined, city: city.trim() || undefined });
      setR(res.result);
      onUsed?.(res.used, res.limit);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(false);
    }
  }
  const set = <K extends keyof AiSeoResult>(k: K, v: AiSeoResult[K]) => setR((p) => (p ? { ...p, [k]: v } : p));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Shell title="مساعد الظهور في البحث" hint="الصق اسم منتجك ووصفه، ويقترح عنوان البحث ووصفه وكلماته وتحسينات محددة." busy={busy} onRun={run} ready={ready} canRun={name.trim().length >= 2}>
        <div className="space-y-2"><Label htmlFor="seo-name">اسم المنتج أو الصفحة</Label><Input id="seo-name" value={name} maxLength={200} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="seo-desc">الوصف الحالي (اختياري)</Label><Textarea id="seo-desc" rows={5} value={description} maxLength={4000} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="seo-kw">كلمات تستهدفها (اختياري)</Label><Input id="seo-kw" value={keywords} maxLength={300} onChange={(e) => setKeywords(e.target.value)} placeholder="عود كمبودي، دهن عود" /></div>
          <div className="space-y-2"><Label htmlFor="seo-city">المدينة (اختياري)</Label><Input id="seo-city" value={city} maxLength={80} onChange={(e) => setCity(e.target.value)} placeholder="صنعاء" /></div>
        </div>
        <div className="space-y-2"><Label>اللغة</Label><LangSelect value={lang} onChange={setLang} /></div>
      </Shell>

      <div className="min-w-0 rounded-xl border bg-muted/20 p-4">
        {!r ? (
          <Empty busy={busy} text="ستظهر الاقتراحات هنا." />
        ) : (
          <div className="space-y-4">
            <Field label="عنوان البحث (SEO)" value={r.seoTitle} onChange={(v) => set("seoTitle", v)} limit={60} />
            <Field label="وصف البحث (Meta)" value={r.metaDescription} onChange={(v) => set("metaDescription", v)} rows={2} limit={155} />
            <Chips label="كلمات البحث المقترحة" items={r.keywords} />
            {!!r.improvements.length && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">تحسينات مقترحة</Label>
                <ol className="space-y-1.5 text-sm" dir="auto">{r.improvements.map((t, i) => <li key={i} className="flex gap-2"><span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] tabular-nums">{i + 1}</span>{t}</li>)}</ol>
              </div>
            )}
            {r.improvedDescription && <Field label="الوصف المحسّن" value={r.improvedDescription} onChange={(v) => set("improvedDescription", v)} rows={7} />}
            <Button type="button" variant="outline" className="gap-2" disabled={busy || !ready} onClick={run}><IconRefresh className="size-4" /> اقتراحات أخرى</Button>
          </div>
        )}
      </div>
    </div>
  );
}
