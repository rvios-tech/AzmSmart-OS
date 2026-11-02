"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconBrandWhatsapp, IconCheck, IconLoader2, IconLock, IconX } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { costOf } from "@/components/shop/template-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  checkSlug, createStore, getPricing, type Plan, type Pricing, type SlugCheck,
} from "@/lib/api/shop";
import { teamWhatsapp } from "@/lib/contact";
import { clearDraft, readDraft } from "@/lib/shop/store-draft";
import { formatBilling } from "@/lib/format";
import {
  COUNTRIES, PLAN_LABEL, SECTORS, STOREFRONT_URL, STORE_TEMPLATES, TEMPLATE_TIER_LABEL,
} from "@/lib/shop/constants";
import { useStore } from "@/lib/shop/store-context";
import { cn } from "@/lib/utils";

const COLORS = ["#9E2226", "#2F5D50", "#1F4E79", "#7A4B1E", "#5B2A6E", "#A8641B", "#2C2C2C", "#0F766E"];
/** باقة النظام ← مفتاحها في جدول الأسعار العام */
const PRICE_KEY = { plus: "pro", pro: "biz" } as const;
const PERKS: Record<Plan, string[]> = {
  basic: ["القالب الأساسي المجاني", "تعديل شكل المتجر بنفسك", "١٠ منتجات"],
  plus: ["كل القوالب (المدفوع دفعة واحدة)", "ربط دومين خاص", "٥٠٠ منتج وكوبونات"],
  pro: ["القياسية مجانًا، والتوقيع بخصم ٤٠٪", "دومين خاص", "منتجات بلا حد، وفريق ومخزون"],
};
type Billing = "month" | "year";

export default function NewStorePage() {
  const router = useRouter();
  const { reload, setActive, slots } = useStore();

  // طلب بدأه التاجر في منصة المتاجر: يكمله هنا من الخطوة الأخيرة. اللوحة لا تُرسم قبل الجلسة،
  // فالقراءة الأولى في المتصفح دائمًا
  const [draft] = useState(() => (typeof window === "undefined" ? null : readDraft()));
  const dial = draft ? COUNTRIES.find((c) => draft.whatsapp.startsWith(String(c.dial))) : undefined;
  const [step, setStep] = useState(draft ? (draft.plan === "basic" ? 2 : 3) : 0);
  const [templateId, setTemplateId] = useState(draft?.template && STORE_TEMPLATES.some((t) => t.id === draft.template) ? draft.template : "essential");
  const [plan, setPlan] = useState<Plan>(draft?.plan ?? "basic");
  const [billing, setBilling] = useState<Billing>(draft?.billing ?? "month");
  const [pricing, setPricing] = useState<Pricing | null>(null);

  const [name, setName] = useState(draft?.name ?? "");
  const [slug, setSlug] = useState(draft?.slug ?? "");
  const [sector, setSector] = useState("other");
  const [country, setCountry] = useState<string>(dial?.code ?? "YE");
  const [whatsapp, setWhatsapp] = useState(draft ? (dial ? draft.whatsapp.slice(String(dial.dial).length) : draft.whatsapp) : "");
  const [city, setCity] = useState("");
  const [tagline, setTagline] = useState("");
  const [color, setColor] = useState(draft?.color ?? COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [check, setCheck] = useState<SlugCheck | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setPricing(await getPricing());
      } catch {
        toast.error("تعذّر جلب الأسعار — أعد تحميل الصفحة.");
      }
    })();
  }, []);

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

  const template = STORE_TEMPLATES.find((t) => t.id === templateId)!;
  const premium = template.tier !== "free";
  const currency = pricing?.currency ?? "USD";
  const paid = plan !== "basic";
  const basePrice = (id: string) => pricing?.templates?.find((t) => t.id === id)?.price ?? 0;
  const planPrice = (p: Plan, b: Billing) => (p === "basic" ? 0 : pricing?.plans?.[PRICE_KEY[p]]?.[b] ?? 0);
  // في خطوة القالب لم تُختر باقة بعد: يظهر سعر القالب نفسه
  const templateCost = paid ? costOf(template.tier, plan, basePrice(templateId)) ?? 0 : basePrice(templateId);
  const subscription = planPrice(plan, billing);
  const total = subscription + (paid ? templateCost : 0);
  const steps = useMemo(() => ["القالب", "الباقة", "بيانات المتجر", ...(paid ? ["الدفع والتواصل"] : [])], [paid]);

  function pickTemplate(id: string) {
    setTemplateId(id);
    const tier = STORE_TEMPLATES.find((t) => t.id === id)?.tier;
    // القالب المدفوع يحتاج باقة مدفوعة
    if (tier !== "free" && plan === "basic") setPlan("plus");
  }

  const noSlot = slots !== null && slots.free === 0 && slots.owned > 0;
  const detailsOk = name.trim().length >= 2 && whatsapp.trim().length >= 6 && (check === null || check.ok);
  const stepOk = step === 2 ? detailsOk : true;
  const last = step === steps.length - 1;

  async function finish() {
    // يُفتح الآن داخل نقرة المستخدم — بعد الانتظار يحجبه المتصفح كنافذة منبثقة
    const wa = paid ? window.open("", "_blank") : null;
    setSaving(true);
    try {
      // المدفوع طلبٌ: يُحجز المتجر بانتظار الفريق، ويتفعّل بالباقة والقالب بعد الدفع
      const { store } = await createStore({
        name: name.trim(), slug: slug.trim() || undefined, sector, country, whatsapp: whatsapp.trim(),
        city: city.trim() || undefined, tagline: tagline.trim() || undefined, color, colorDeep: color,
        ...(paid ? { plan: plan as "plus" | "pro", months: billing === "year" ? 12 : 1, template: templateId } : {}),
      });
      clearDraft();
      await reload();
      setActive(store.id);
      if (!paid) {
        toast.success("أُنشئ متجرك — عدّل شكله كما تريد");
        router.push("/store/appearance");
        return;
      }
      const message = [
        "مرحبًا فريق RVIOS، أريد إكمال الدفع وإنشاء متجري:",
        `المتجر: ${store.name} (${store.slug})`,
        `القالب: ${template.name}`,
        `الباقة: ${PLAN_LABEL[plan]} · ${billing === "year" ? "سنوي" : "شهري"}`,
        `الإجمالي: ${formatBilling(total, currency)}`,
      ].join("\n");
      if (wa) {
        wa.opener = null;
        wa.location.href = teamWhatsapp(message);
      }
      toast.success("وصل طلبك إلى فريق RVIOS — أكمل الدفع معهم على واتساب ليتفعّل متجرك", {
        action: { label: "واتساب", onClick: () => window.open(teamWhatsapp(message), "_blank", "noopener") },
        duration: 15000,
      });
      router.push("/dashboard");
    } catch (err) {
      wa?.close();
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء المتجر.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="متجر جديد" description="القالب، ثم الباقة، ثم بيانات متجرك." />

      {draft && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 text-sm">
            أكملنا طلبك من منصة المتاجر بالقالب والباقة والبيانات التي اخترتها — راجعها ثم {paid ? "تواصل مع الفريق لإكمال الدفع" : "أنشئ متجرك"}.
          </CardContent>
        </Card>
      )}

      <ol className="flex flex-wrap gap-2 text-sm">
        {steps.map((s, i) => (
          <li key={s}>
            <button type="button" disabled={i > step} onClick={() => setStep(i)}
              className={cn("flex items-center gap-2 rounded-full border px-3 py-1.5",
                i === step ? "border-primary bg-primary/10 font-medium" : i < step ? "text-foreground" : "text-muted-foreground")}>
              <span className="grid size-5 place-items-center rounded-full bg-muted text-xs tabular-nums">
                {i < step ? <IconCheck className="size-3.5" /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      {noSlot && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 text-sm">
            بلغتَ عدد المتاجر المتاح في حسابك ({slots.slots}). لإنشاء متجر إضافي اشترِ
            خانة من صفحة الاشتراك (تتطلب باقة برو).
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {step === 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {STORE_TEMPLATES.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => pickTemplate(t.id)} aria-pressed={templateId === t.id}
                    className={cn("w-full overflow-hidden rounded-xl border text-start transition-colors",
                      templateId === t.id ? "border-primary ring-2 ring-primary/30" : "hover:border-foreground/30")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${STOREFRONT_URL}/previews/${t.id}-desk.webp`} alt="" loading="lazy" className="aspect-[16/10] w-full bg-muted object-cover object-top" />
                    <span className="flex items-center justify-between gap-2 p-3">
                      <span className="min-w-0">
                        <span className="block font-medium">{t.name}</span>
                        <span className="text-xs text-muted-foreground">{TEMPLATE_TIER_LABEL[t.tier]}</span>
                      </span>
                      <span className="text-sm font-medium tabular-nums">{t.tier === "free" ? "مجاني" : formatBilling(basePrice(t.id), currency)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="inline-flex rounded-lg border p-1 text-sm">
                {(["month", "year"] as const).map((b) => (
                  <button key={b} type="button" onClick={() => setBilling(b)} aria-pressed={billing === b}
                    className={cn("rounded-md px-3 py-1.5", billing === b && "bg-primary text-primary-foreground")}>
                    {b === "month" ? "شهري" : "سنوي"}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {(["basic", "plus", "pro"] as const).map((p) => {
                  const locked = p === "basic" && premium;
                  return (
                    <button key={p} type="button" disabled={locked} onClick={() => setPlan(p)} aria-pressed={plan === p}
                      className={cn("space-y-3 rounded-xl border p-4 text-start transition-colors",
                        plan === p ? "border-primary ring-2 ring-primary/30" : "hover:border-foreground/30", locked && "cursor-not-allowed opacity-60")}>
                      <span className="block font-semibold">{PLAN_LABEL[p]}</span>
                      <span className="block text-2xl font-semibold tabular-nums">
                        {p === "basic" ? "مجانًا" : formatBilling(planPrice(p, billing), currency)}
                        {p !== "basic" && <small className="ms-1 text-xs font-normal text-muted-foreground">/ {billing === "year" ? "سنة" : "شهر"}</small>}
                      </span>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        {PERKS[p].map((x) => <li key={x} className="flex gap-1.5"><IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />{x}</li>)}
                      </ul>
                      {locked && <span className="flex items-center gap-1 text-xs"><IconLock className="size-3.5" /> تشمل القالب الأساسي فقط</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <Card>
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
                        className={cn("size-8 rounded-full ring-offset-2 ring-offset-background", color === c && "ring-2 ring-foreground")} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && paid && (
            <Card>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">الدفع والتواصل</h2>
                  <p className="text-sm text-muted-foreground">بقيت خطوة واحدة: تواصل مع فريق RVIOS لإكمال الدفع وإنشاء متجرك.</p>
                </div>
                <ol className="space-y-3 text-sm">
                  {[
                    ["اضغط «تواصل مع الفريق»", "يصل طلبك إلى فريق RVIOS، ويفتح واتساب برسالة جاهزة فيها تفاصيله."],
                    ["أكمل الدفع مع الفريق", "يرسل لك الفريق طرق الدفع المتاحة في بلدك ويؤكد استلام المبلغ."],
                    ["يفعّل الفريق متجرك", "بعد استلام الدفع يفعّله الفريق بالباقة والقالب اللذين اخترتهما، وحتى ذلك يمكنك تجهيز منتجاتك."],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex gap-3 rounded-lg border p-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs text-primary-foreground tabular-nums">{i + 1}</span>
                      <span><b className="block font-medium">{t}</b><span className="text-muted-foreground">{d}</span></span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4 rounded-xl border bg-card p-4 lg:sticky lg:top-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${STOREFRONT_URL}/previews/${templateId}-desk.webp`} alt="" className="aspect-[16/10] w-full rounded-lg bg-muted object-cover object-top" />
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">القالب</dt>
            <dd className="text-end font-medium">
              {template.name} · {template.tier === "free" ? "مجاني" : paid && templateCost === 0 ? "مشمول" : formatBilling(templateCost, currency)}
              {premium && <small className="block text-xs font-normal text-muted-foreground">دفعة واحدة</small>}
            </dd>
            {step > 0 && (
              <>
                <dt className="text-muted-foreground">الباقة</dt>
                <dd className="text-end font-medium">
                  {PLAN_LABEL[plan]}{paid && ` · ${formatBilling(subscription, currency)}`}
                  {paid && <small className="block text-xs font-normal text-muted-foreground">{billing === "year" ? "سنويًا" : "شهريًا"}</small>}
                </dd>
              </>
            )}
          </dl>
          {step === 0
            ? <p className="text-xs text-muted-foreground">تختار الباقة ونوع الاشتراك في الخطوة التالية.</p>
            : (
              <div className="flex items-baseline justify-between border-t border-dashed pt-3">
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <b className="text-2xl tabular-nums">{formatBilling(total, currency)}</b>
              </div>
            )}
          <div className="flex gap-2 border-t pt-3">
            {step > 0 && <Button type="button" variant="outline" disabled={saving} onClick={() => setStep((s) => s - 1)}>رجوع</Button>}
            {!last ? (
              <Button type="button" className="flex-1" disabled={!stepOk} onClick={() => setStep((s) => s + 1)}>
                متابعة <IconArrowLeft className="size-4" />
              </Button>
            ) : (
              <Button type="button" className="flex-1" disabled={saving || noSlot || !detailsOk} onClick={() => void finish()}>
                {saving ? <IconLoader2 className="size-4 animate-spin" /> : paid && <IconBrandWhatsapp className="size-4" />}
                {paid ? "تواصل مع الفريق" : "إنشاء المتجر"}
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
