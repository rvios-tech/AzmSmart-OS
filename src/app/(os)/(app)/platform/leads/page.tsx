"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { IconBrandWhatsapp, IconLoader2, IconMail, IconPalette } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  LEAD_BUDGET_LABELS, LEAD_STATUS_LABELS, LEAD_TIMELINE_LABELS, listLeads, updateLead, type LeadStatus, type PlatformLead,
} from "@/lib/api/platform-ops";
import { formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE: Record<LeadStatus, string> = {
  new: "bg-primary/10 text-primary",
  contacted: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  quoted: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  won: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  lost: "bg-muted text-muted-foreground",
};
const FILTERS: [string, string][] = [["open", "المفتوحة"], ["new", "الجديدة"], ["contacted", "تم التواصل"], ["quoted", "أُرسل العرض"], ["won", "تم الاتفاق"], ["lost", "لم يكتمل"], ["all", "الكل"]];

function waText(l: PlatformLead) {
  const store = l.details.storeName ? ` «${l.details.storeName}»` : "";
  return encodeURIComponent(`مرحبًا ${l.name}، معك فريق RVIOS بخصوص طلب تصميم متجرك${store}. متى يناسبك أن نتحدث عن التفاصيل؟`);
}

function LeadsView() {
  const params = useSearchParams();
  const [filter, setFilter] = useState("open");
  const [data, setData] = useState<Awaited<ReturnType<typeof listLeads>> | null>(null);
  const [open, setOpen] = useState<PlatformLead | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await listLeads(filter);
      setData(r);
      const want = params.get("id");
      if (want && !open) {
        const hit = r.items.find((x) => x.id === want);
        if (hit) {
          setOpen(hit);
          setNotes(hit.notes);
        }
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحميل.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, params]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function save(patch: { status?: LeadStatus; notes?: string }) {
    if (!open) return;
    setSaving(true);
    try {
      const l = await updateLead(open.id, patch);
      setOpen(l);
      setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === l.id ? l : x)) } : d));
      toast.success("حُفظ");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="طلبات التصميم الخاص" description="زوار طلبوا متجرًا بتصميم خاص من منصة المتاجر — تواصل معهم، وأرسل العرض، وتابع حتى الاتفاق." />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([k, label]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
            {label}
            {data?.counts[k] ? <span className="ms-1 tabular-nums opacity-70">{formatNumber(data.counts[k])}</span> : null}
          </Button>
        ))}
      </div>

      {!data && <div className="py-16 text-center"><IconLoader2 className="mx-auto size-6 animate-spin" /></div>}
      {data && data.items.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground"><IconPalette className="size-8" /> لا طلبات هنا بعد.</CardContent></Card>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => { setOpen(l); setNotes(l.notes); }}
            className="space-y-2 rounded-xl border bg-card p-4 text-start transition hover:border-primary"
          >
            <div className="flex items-center gap-2">
              <b className="truncate">{l.details.storeName || l.name}</b>
              <Badge variant="secondary" className={cn("ms-auto", TONE[l.status])}>{LEAD_STATUS_LABELS[l.status]}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{l.name}{l.business ? ` · ${l.business}` : ""}</div>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {l.budget && <span className="rounded-full bg-muted px-2 py-0.5">الميزانية: {LEAD_BUDGET_LABELS[l.budget] ?? l.budget}</span>}
              {l.timeline && <span className="rounded-full bg-muted px-2 py-0.5">{LEAD_TIMELINE_LABELS[l.timeline] ?? l.timeline}</span>}
              {(l.details.features?.length ?? 0) > 0 && <span className="rounded-full bg-muted px-2 py-0.5">{formatNumber(l.details.features!.length)} ميزة</span>}
            </div>
            <div className="text-xs text-muted-foreground">{formatDateTime(l.createdAt)}</div>
          </button>
        ))}
      </div>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-lg">
          {open && (
            <div className="space-y-5 p-4">
              <SheetHeader className="p-0"><SheetTitle>{open.details.storeName || open.name}</SheetTitle></SheetHeader>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                  <a href={`https://wa.me/${open.phone}?text=${waText(open)}`} target="_blank" rel="noopener"><IconBrandWhatsapp className="size-4" /> واتساب</a>
                </Button>
                {open.email && <Button size="sm" variant="outline" asChild><a href={`mailto:${open.email}`}><IconMail className="size-4" /> بريد</a></Button>}
                <Select value={open.status} onValueChange={(v) => void save({ status: v as LeadStatus })}>
                  <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((k) => <SelectItem key={k} value={k}>{LEAD_STATUS_LABELS[k]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">الاسم</dt><dd className="col-span-2">{open.name}</dd>
                <dt className="text-muted-foreground">واتساب</dt><dd className="col-span-2" dir="ltr">+{open.phone}</dd>
                {open.email && <><dt className="text-muted-foreground">البريد</dt><dd className="col-span-2" dir="ltr">{open.email}</dd></>}
                {open.country && <><dt className="text-muted-foreground">الدولة</dt><dd className="col-span-2">{open.country}</dd></>}
                {open.business && <><dt className="text-muted-foreground">النشاط</dt><dd className="col-span-2">{open.business}</dd></>}
                {open.budget && <><dt className="text-muted-foreground">الميزانية</dt><dd className="col-span-2">{LEAD_BUDGET_LABELS[open.budget] ?? open.budget}</dd></>}
                {open.timeline && <><dt className="text-muted-foreground">الموعد</dt><dd className="col-span-2">{LEAD_TIMELINE_LABELS[open.timeline] ?? open.timeline}</dd></>}
                {open.details.existing && <><dt className="text-muted-foreground">لديه الآن</dt><dd className="col-span-2">{open.details.existing}</dd></>}
                <dt className="text-muted-foreground">وصل</dt><dd className="col-span-2">{formatDateTime(open.createdAt)}</dd>
              </dl>
              {!!open.details.features?.length && (
                <div className="space-y-1.5"><div className="text-sm font-medium">الصفحات والمزايا</div>
                  <div className="flex flex-wrap gap-1.5">{open.details.features.map((f) => <span key={f} className="rounded-full border px-2.5 py-0.5 text-xs">{f}</span>)}</div></div>
              )}
              {!!open.details.styles?.length && (
                <div className="space-y-1.5"><div className="text-sm font-medium">الأسلوب</div>
                  <div className="flex flex-wrap gap-1.5">{open.details.styles.map((f) => <span key={f} className="rounded-full border px-2.5 py-0.5 text-xs">{f}</span>)}</div></div>
              )}
              {!!open.details.references?.length && (
                <div className="space-y-1.5"><div className="text-sm font-medium">أمثلة أعجبته</div>
                  {open.details.references.map((r) => <a key={r} href={/^https?:\/\//.test(r) ? r : `https://${r}`} target="_blank" rel="noopener nofollow" dir="ltr" className="block truncate text-sm text-primary underline">{r}</a>)}</div>
              )}
              {open.message && <div className="space-y-1.5"><div className="text-sm font-medium">رسالته</div><p className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{open.message}</p></div>}
              <div className="space-y-1.5">
                <div className="text-sm font-medium">ملاحظات الفريق</div>
                <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="السعر المقترح، موعد المكالمة، ما اتُّفق عليه…" />
                <Button size="sm" disabled={saving || notes === open.notes} onClick={() => void save({ notes })}>{saving && <IconLoader2 className="size-4 animate-spin" />} حفظ الملاحظات</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function PlatformLeadsPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center"><IconLoader2 className="mx-auto size-6 animate-spin" /></div>}>
      <LeadsView />
    </Suspense>
  );
}
