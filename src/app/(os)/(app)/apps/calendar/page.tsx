"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconLoader2,
  IconMapPin,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import {
  createMeetingApi, deleteMeetingApi, listMeetingsApi, listProjectsApi, listTasksApi,
} from "@/lib/api/work";
import { formatDateShort, formatMonthYear } from "@/lib/format";
import { cn } from "@/lib/utils";

type Kind = "meeting" | "task" | "milestone";

type CalEvent = {
  key: string;
  kind: Kind;
  date: string; // YYYY-MM-DD
  title: string;
  time?: string;
  place?: string | null;
  href?: string;
  meetingId?: string;
  done?: boolean;
};

const DOT: Record<Kind, string> = {
  meeting: "bg-violet-500",
  task: "bg-blue-500",
  milestone: "bg-amber-500",
};
const KIND_LABEL: Record<Kind, string> = { meeting: "اجتماع", task: "موعد مهمة", milestone: "معلم مشروع" };

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** تقويم الشركة: اجتماعاتها + مواعيد استحقاق المهام + معالم المشاريع — كلها حقيقية. */
export default function CalendarPage() {
  const [today] = useState(() => {
    const n = new Date();
    return iso(n.getFullYear(), n.getMonth(), n.getDate());
  });
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() };
  });
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState<CalEvent[] | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [f, setF] = useState({ title: "", date: today, time: "10:00", location: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meetings, tasks, projects] = await Promise.all([listMeetingsApi(), listTasksApi(), listProjectsApi()]);
      const out: CalEvent[] = [
        ...meetings.map<CalEvent>((m) => ({
          key: `m-${m.id}`, kind: "meeting", date: m.date, title: m.title, time: m.time, place: m.location, meetingId: m.id,
        })),
        ...tasks.filter((t) => t.dueDate).map<CalEvent>((t) => ({
          key: `t-${t.id}`, kind: "task", date: t.dueDate!.slice(0, 10), title: `${t.code} · ${t.title}`,
          href: `/projects/${t.projectId}`, done: t.status === 4,
        })),
        ...projects.flatMap((p) => p.milestones.map<CalEvent>((ms) => ({
          key: `s-${ms.id}`, kind: "milestone", date: ms.date.slice(0, 10), title: `${p.key} · ${ms.title}`,
          href: `/projects/${p.id}`, done: ms.done,
        }))),
      ];
      setEvents(out);
    } catch (err) {
      setEvents([]);
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل التقويم.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events ?? []) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  const view = new Date(cursor.y, cursor.m, 1);
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: view.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const step = (delta: number) => setCursor((c) => {
    const d = new Date(c.y, c.m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  function goToday() {
    const [y, m] = today.split("-").map(Number);
    setCursor({ y, m: m - 1 });
    setSelected(today);
  }

  const upcoming = useMemo(
    () => (events ?? []).filter((e) => e.date >= today && !e.done).sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? "").localeCompare(b.time ?? "")).slice(0, 30),
    [events, today],
  );
  const dayEvents = byDate.get(selected) ?? [];

  async function addMeeting() {
    if (!f.title.trim()) return;
    setSaving(true);
    try {
      await createMeetingApi({ title: f.title.trim(), date: f.date, time: f.time, location: f.location.trim() || undefined });
      setAddOpen(false);
      setF({ title: "", date: f.date, time: "10:00", location: "" });
      setSelected(f.date);
      await load();
      toast.success("تمت إضافة الاجتماع");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّرت الإضافة.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMeeting(id: string) {
    try {
      await deleteMeetingApi(id);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف (يتطلب مدير قسم فأعلى).");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">التقويم</h1>
          <p className="text-sm text-muted-foreground">الاجتماعات ومواعيد المهام ومعالم المشاريع في مكان واحد.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button variant="ghost" size="icon" className="rounded-e-none" onClick={() => step(-1)} aria-label="الشهر السابق">
              <IconChevronRight className="size-4" />
            </Button>
            <span className="min-w-32 px-2 text-center text-sm font-medium">{formatMonthYear(view)}</span>
            <Button variant="ghost" size="icon" className="rounded-s-none" onClick={() => step(1)} aria-label="الشهر التالي">
              <IconChevronLeft className="size-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={goToday}>اليوم</Button>
          <Button onClick={() => { setF((p) => ({ ...p, date: selected })); setAddOpen(true); }}>
            <IconPlus className="size-4" /> اجتماع جديد
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {(Object.keys(DOT) as Kind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5"><span className={cn("size-2 rounded-full", DOT[k])} />{KIND_LABEL[k]}</span>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[560px] sm:min-w-0">
              <div className="grid grid-cols-7 border-b bg-muted/30">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-2.5 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const key = day ? iso(cursor.y, cursor.m, day) : "";
                  const list = day ? byDate.get(key) ?? [] : [];
                  return (
                    <button
                      key={i}
                      disabled={!day}
                      onClick={() => day && setSelected(key)}
                      className={cn(
                        "min-h-24 border-b border-e p-1.5 text-start align-top transition-colors last:border-e-0",
                        "[&:nth-child(7n)]:border-e-0",
                        day ? "hover:bg-muted/40" : "bg-muted/20",
                        key === selected && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                      )}
                    >
                      {day && (
                        <>
                          <span className={cn(
                            "flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                            key === today ? "bg-primary text-primary-foreground" : "text-foreground",
                          )}>
                            {day}
                          </span>
                          <div className="mt-1 space-y-1">
                            {list.slice(0, 2).map((e) => (
                              <div key={e.key} className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px]">
                                <span className={cn("size-1.5 shrink-0 rounded-full", DOT[e.kind])} />
                                <span className={cn("truncate text-muted-foreground", e.done && "line-through")}>{e.title}</span>
                              </div>
                            ))}
                            {list.length > 2 && <span className="px-1 text-[11px] text-muted-foreground">+{list.length - 2} أخرى</span>}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{formatDateShort(selected)}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {!events && <IconLoader2 className="size-4 animate-spin text-muted-foreground" />}
              {events && dayEvents.length === 0 && <p className="text-sm text-muted-foreground">لا شيء في هذا اليوم.</p>}
              {dayEvents.map((e) => <EventRow key={e.key} e={e} onDelete={removeMeeting} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">القادم</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 px-4 pb-4">
                  {upcoming.length === 0 && <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">لا مواعيد قادمة.</p>}
                  {upcoming.map((e) => (
                    <button key={e.key} onClick={() => { const [y, m] = e.date.split("-").map(Number); setCursor({ y, m: m - 1 }); setSelected(e.date); }}
                      className="flex w-full items-start gap-3 rounded-lg p-2.5 text-start transition-colors hover:bg-muted/50">
                      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[e.kind])} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{e.title}</span>
                        <span className="text-xs text-muted-foreground tabular-nums">{formatDateShort(e.date)}{e.time ? ` · ${e.time}` : ""}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اجتماع جديد</DialogTitle>
            <DialogDescription>يظهر لكل أعضاء الشركة في التقويم.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ev-title">العنوان</Label>
              <Input id="ev-title" value={f.title} maxLength={200} autoFocus placeholder="ما موضوع الاجتماع؟"
                onChange={(e) => setF({ ...f, title: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label htmlFor="ev-date">التاريخ</Label>
                <Input id="ev-date" type="date" dir="ltr" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="ev-time">الوقت</Label>
                <Input id="ev-time" type="time" dir="ltr" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="ev-loc">المكان</Label>
                <Input id="ev-loc" value={f.location} maxLength={200} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>إلغاء</Button>
            <Button onClick={() => void addMeeting()} disabled={saving || !f.title.trim() || !f.date || !f.time}>
              {saving && <IconLoader2 className="size-4 animate-spin" />} إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventRow({ e, onDelete }: { e: CalEvent; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-2.5">
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[e.kind])} />
      <div className="min-w-0 flex-1">
        {e.href ? (
          <Link href={e.href} className={cn("block truncate text-sm font-medium hover:underline", e.done && "line-through text-muted-foreground")}>{e.title}</Link>
        ) : (
          <p className="truncate text-sm font-medium">{e.title}</p>
        )}
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          <span>{KIND_LABEL[e.kind]}</span>
          {e.time && <span className="flex items-center gap-1"><IconClock className="size-3" />{e.time}</span>}
          {e.place && <span className="flex items-center gap-1"><IconMapPin className="size-3" />{e.place}</span>}
        </p>
      </div>
      {e.meetingId && (
        <Button variant="ghost" size="icon" className="size-7" aria-label="حذف الاجتماع" onClick={() => onDelete(e.meetingId!)}>
          <IconTrash className="size-4" />
        </Button>
      )}
    </div>
  );
}
