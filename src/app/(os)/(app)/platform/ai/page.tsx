"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconBook2, IconChartBar, IconFlask, IconLoader2, IconPencil, IconPlus, IconSparkles, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@/lib/api/client";
import {
  createAiKnowledge, deleteAiKnowledge, getAiUsageStats, listAiKnowledge, testAiKnowledge, updateAiKnowledge,
  type AiAudience, type AiKnowledgeEntry, type AiKnowledgeList, type AiUsageStats,
} from "@/lib/api/ai-admin";
import { formatCompact, formatDateShort, formatNumber } from "@/lib/format";

const AUD: Record<AiAudience, string> = { merchant: "التجّار (لوحة عزم سمارت)", public: "الزوّار (rvios.com وstore.rvios.com)" };
const FEATURE: Record<string, string> = {
  chat: "محادثة", insights: "تحليلات", product: "كاتب المنتجات", marketing: "المسوّق", seo: "البحث", reply: "الرد على العملاء", policy: "صفحات المتجر", title: "عناوين",
};
const err = (e: unknown) => (e instanceof ApiError ? e.message : "تعذّر الاتصال بالخادم.");

type Draft = { id?: string; title: string; tags: string; audience: AiAudience[]; text: string; active: boolean };
const EMPTY: Draft = { title: "", tags: "", audience: ["merchant", "public"], text: "", active: true };

/**
 * «تدريب» RVIOS AI: ما يكتبه الفريق هنا يقرؤه المساعد حين يُسأل عنه — عروض موسمية، سياسة
 * جديدة، ميزة أُطلقت، جواب لسؤال يتكرر. القاعدة المكتوبة في الشيفرة تظهر للاطلاع.
 */
export default function PlatformAiPage() {
  const [data, setData] = useState<AiKnowledgeList | null>(null);
  const [usage, setUsage] = useState<AiUsageStats | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AiKnowledgeEntry | null>(null);
  const [q, setQ] = useState("");
  const [qAud, setQAud] = useState<AiAudience>("public");
  const [picked, setPicked] = useState<{ id: string; title: string; team: boolean }[] | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [k, u] = await Promise.all([listAiKnowledge(), getAiUsageStats()]);
      setData(k);
      setUsage(u);
    } catch (e) {
      toast.error(err(e));
    }
  }, []);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [k, u] = await Promise.all([listAiKnowledge(), getAiUsageStats()]);
        if (!cancelled) {
          setData(k);
          setUsage(u);
        }
      } catch (e) {
        if (!cancelled) toast.error(err(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!draft) return;
    const input = { title: draft.title.trim(), tags: draft.tags.split(/[،,]/).map((t) => t.trim()).filter(Boolean), audience: draft.audience, text: draft.text.trim(), active: draft.active };
    if (input.title.length < 3 || input.text.length < 20 || !input.audience.length) {
      toast.error("العنوان ٣ أحرف على الأقل، والنص ٢٠ حرفًا، وجمهور واحد على الأقل.");
      return;
    }
    setSaving(true);
    try {
      if (draft.id) await updateAiKnowledge(draft.id, input);
      else await createAiKnowledge(input);
      toast.success("حُفظت — يقرؤها المساعد من الآن");
      setDraft(null);
      await load();
    } catch (e) {
      toast.error(err(e));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(e: AiKnowledgeEntry) {
    try {
      await updateAiKnowledge(e.id, { active: !e.active });
      setData((d) => (d ? { ...d, entries: d.entries.map((x) => (x.id === e.id ? { ...x, active: !x.active } : x)) } : d));
    } catch (er) {
      toast.error(err(er));
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await deleteAiKnowledge(deleting.id);
      setData((d) => (d ? { ...d, entries: d.entries.filter((x) => x.id !== deleting.id) } : d));
      toast.success("حُذفت");
    } catch (e) {
      toast.error(err(e));
    } finally {
      setDeleting(null);
    }
  }

  async function test() {
    if (q.trim().length < 2) return;
    setTesting(true);
    try {
      setPicked((await testAiKnowledge(q.trim(), qAud)).picked);
    } catch (e) {
      toast.error(err(e));
    } finally {
      setTesting(false);
    }
  }

  const tokens = (t?: { input: number; output: number; thoughts: number }) => (t ? formatCompact(t.input + t.output + t.thoughts) : "—");

  return (
    <div className="space-y-6">
      <PageHeader title="RVIOS AI" description="درّب المساعد بمعرفة الفريق، واختبر ما يقرؤه، وتابع استهلاكه.">
        <Button className="gap-2" onClick={() => setDraft({ ...EMPTY })}><IconPlus className="size-4" /> معرفة جديدة</Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="طلبات التجّار هذا الشهر" value={usage ? formatNumber(usage.merchant.requests) : "—"} />
        <MetricCard label="أسئلة الزوّار هذا الشهر" value={usage ? formatNumber(usage.public.requests) : "—"} />
        <MetricCard label="أسئلة الزوّار اليوم" value={usage ? formatNumber(usage.public.today) : "—"} />
        <MetricCard label="الرموز هذا الشهر" value={usage ? `${tokens(usage.merchant.tokens)} + ${tokens(usage.public.tokens)}` : "—"} />
      </div>

      <Tabs defaultValue="knowledge">
        <TabsList>
          <TabsTrigger value="knowledge" className="gap-1.5"><IconBook2 className="size-4" /> المعرفة</TabsTrigger>
          <TabsTrigger value="test" className="gap-1.5"><IconFlask className="size-4" /> اختبار</TabsTrigger>
          <TabsTrigger value="usage" className="gap-1.5"><IconChartBar className="size-4" /> الاستهلاك</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>معرفة الفريق</CardTitle>
              <CardDescription>تُسترجع حسب السؤال وتوضع في تعليمات المساعد. اكتب حقائق مؤكدة فقط — المساعد يكررها كما هي.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!data && <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…</div>}
              {data && !data.entries.length && (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  لا معرفة مضافة بعد. أضف عرضًا موسميًا أو سياسة جديدة أو جوابًا لسؤال يتكرر.
                </div>
              )}
              {data?.entries.map((e) => (
                <div key={e.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{e.title}</span>
                      {e.audience.map((a) => <Badge key={a} variant="secondary" className="font-normal">{a === "merchant" ? "التجّار" : "الزوّار"}</Badge>)}
                      {!e.active && <Badge variant="outline">معطّلة</Badge>}
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground" dir="auto">{e.text}</p>
                    <p className="text-xs text-muted-foreground">آخر تعديل {formatDateShort(e.updatedAt)}{e.tags.length ? ` · ${e.tags.join("، ")}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={e.active} onCheckedChange={() => void toggle(e)} aria-label="مفعّلة" />
                    <Button variant="ghost" size="icon" onClick={() => setDraft({ id: e.id, title: e.title, tags: e.tags.join("، "), audience: e.audience, text: e.text, active: e.active })} aria-label="تعديل"><IconPencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleting(e)} aria-label="حذف"><IconTrash className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>القاعدة الأساسية ({data?.builtin.length ?? 0} قسمًا)</CardTitle>
              <CardDescription>مكتوبة في الشيفرة (الخدمات، المنصة، الأسعار الحيّة من الإعدادات، الأدلة…) — تعديلها مع فريق التطوير.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {data?.builtin.map((b) => <Badge key={b.id} variant="outline" className="font-normal" title={b.audience.map((a) => AUD[a]).join(" · ")}>{b.title}</Badge>)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>ماذا سيقرأ المساعد؟</CardTitle>
              <CardDescription>اكتب سؤالًا كما يكتبه زائر أو تاجر، وشاهد الأقسام التي ستصل المساعد للإجابة عنه.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); void test(); }}>
                <Input dir="auto" value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثال: هل عندكم عرض في رمضان؟" className="flex-1" />
                <Select value={qAud} onValueChange={(v) => setQAud(v as AiAudience)}>
                  <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="public">زائر الموقع</SelectItem><SelectItem value="merchant">تاجر في اللوحة</SelectItem></SelectContent>
                </Select>
                <Button type="submit" disabled={testing || q.trim().length < 2} className="gap-2">{testing ? <IconLoader2 className="size-4 animate-spin" /> : <IconSparkles className="size-4" />} اختبر</Button>
              </form>
              {picked && (
                picked.length ? (
                  <ol className="space-y-2">
                    {picked.map((p, i) => (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <span className="flex size-6 items-center justify-center rounded bg-muted text-xs tabular-nums">{i + 1}</span>
                        <span>{p.title}</span>
                        {p.team && <Badge className="bg-primary/10 text-primary" variant="secondary">معرفة الفريق</Badge>}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">لا قسم يطابق — سيجيب المساعد من التعليمات العامة فقط. أضف معرفة لهذا السؤال إن كان يتكرر.</p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>طلبات التجّار حسب الأداة</CardTitle><CardDescription>منذ {usage ? formatDateShort(usage.since) : "—"}</CardDescription></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {usage && Object.entries(usage.merchant.byFeature).sort((a, b) => b[1] - a[1]).map(([f, n]) => (
                  <div key={f} className="flex justify-between"><span>{FEATURE[f] ?? f}</span><span className="tabular-nums">{formatNumber(n)}</span></div>
                ))}
                {usage && !Object.keys(usage.merchant.byFeature).length && <p className="text-muted-foreground">لا طلبات هذا الشهر.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>أكثر المتاجر استعمالًا</CardTitle><CardDescription>الطلبات المحتسبة هذا الشهر</CardDescription></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {usage?.topStores.map((s) => (
                  <div key={s.id ?? s.slug} className="flex justify-between gap-3"><span className="truncate">{s.name ?? "—"} <span className="text-xs text-muted-foreground" dir="ltr">{s.slug}</span></span><span className="tabular-nums">{formatNumber(s.requests)}</span></div>
                ))}
                {usage && !usage.topStores.length && <p className="text-muted-foreground">لا طلبات هذا الشهر.</p>}
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>مساعد الزوّار</CardTitle><CardDescription>الحدود: AI_PUBLIC_DAILY للمنصة وAI_PUBLIC_PER_IP_DAY لكل زائر في إعداد الخادم</CardDescription></CardHeader>
              <CardContent className="flex flex-wrap gap-6 text-sm">
                <span>www.rvios.com: <b className="tabular-nums">{formatNumber(usage?.public.bySite.web ?? 0)}</b></span>
                <span>store.rvios.com: <b className="tabular-nums">{formatNumber(usage?.public.bySite.platform ?? 0)}</b></span>
                <span>رموز الإدخال: <b className="tabular-nums">{formatCompact(usage?.public.tokens.input ?? 0)}</b></span>
                <span>رموز الإخراج: <b className="tabular-nums">{formatCompact(usage?.public.tokens.output ?? 0)}</b></span>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "تعديل المعرفة" : "معرفة جديدة"}</DialogTitle>
            <DialogDescription>حقيقة واحدة واضحة لكل قسم. المساعد يقتبس منها ولا يخترع ما ليس فيها.</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-2"><Label htmlFor="kn-t">العنوان</Label><Input id="kn-t" value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="عرض رمضان على الباقات" /></div>
              <div className="space-y-2"><Label htmlFor="kn-x">النص</Label><Textarea id="kn-x" dir="auto" rows={7} value={draft.text} maxLength={4000} onChange={(e) => setDraft({ ...draft, text: e.target.value })} placeholder="ما يجب أن يعرفه المساعد ويقوله بالضبط…" /><p className="text-xs text-muted-foreground tabular-nums">{formatNumber(draft.text.length)}/{formatNumber(4000)}</p></div>
              <div className="space-y-2"><Label htmlFor="kn-g">كلمات بحث (بفواصل، عربي وإنجليزي)</Label><Input id="kn-g" value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} placeholder="رمضان، خصم، عرض، ramadan, offer" /></div>
              <div className="space-y-2">
                <Label>يقرؤها</Label>
                <div className="flex flex-wrap gap-4">
                  {(Object.keys(AUD) as AiAudience[]).map((a) => (
                    <label key={a} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={draft.audience.includes(a)} onCheckedChange={(v) => setDraft({ ...draft, audience: v ? [...new Set([...draft.audience, a])] : draft.audience.filter((x) => x !== a) })} />
                      {AUD[a]}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={draft.active} onCheckedChange={(v) => setDraft({ ...draft, active: v })} /> مفعّلة</label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>إلغاء</Button>
            <Button onClick={() => void save()} disabled={saving} className="gap-2">{saving && <IconLoader2 className="size-4 animate-spin" />} حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف «{deleting?.title}»؟</AlertDialogTitle>
            <AlertDialogDescription>لن يقرأها المساعد بعد الآن. للإيقاف المؤقت استعمل التعطيل بدل الحذف.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void remove()}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
