"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconActivity,
  IconCircleCheck,
  IconFolders,
  IconLoader2,
  IconMessage2,
  IconPlus,
  IconSearch,
  IconUserPlus,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api/client";
import { listActivityApi, type ActivityDto } from "@/lib/api/work";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/work/view";

type Category = "task" | "comment" | "project" | "other";
type Group = "today" | "yesterday" | "week" | "older";

const CATEGORY: Record<Category, { label: string; dot: string; badge: string; icon: React.ComponentType<{ className?: string }> }> = {
  task: { label: "المهام", dot: "bg-blue-500", badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400", icon: IconCircleCheck },
  comment: { label: "التعليقات", dot: "bg-violet-500", badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400", icon: IconMessage2 },
  project: { label: "المشاريع", dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: IconFolders },
  other: { label: "أخرى", dot: "bg-slate-400", badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400", icon: IconPlus },
};

const GROUP_LABEL: Record<Group, string> = {
  today: "اليوم",
  yesterday: "أمس",
  week: "هذا الأسبوع",
  older: "أقدم",
};
const GROUP_ORDER: Group[] = ["today", "yesterday", "week", "older"];

const categoryOf = (e: ActivityDto): Category =>
  e.action === "task.commented" ? "comment" : e.entityType === "task" ? "task" : e.entityType === "project" ? "project" : "other";

function groupOf(iso: string, now: number): Group {
  const d = new Date(iso);
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startToday.getTime() - new Date(d).setHours(0, 0, 0, 0)) / 86_400_000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return "week";
  return "older";
}

/** سجل نشاط الشركة الحقيقي: من فعل ماذا ومتى. */
export default function ActivityPage() {
  const [events, setEvents] = useState<ActivityDto[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const r = await listActivityApi({ page: 1 });
      setEvents(r.activity);
      setPage(1);
      setPages(r.pages);
      setTotal(r.total);
    } catch (err) {
      setEvents([]);
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل النشاط.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function more() {
    setLoadingMore(true);
    try {
      const r = await listActivityApi({ page: page + 1 });
      setEvents((prev) => [...(prev ?? []), ...r.activity]);
      setPage(page + 1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحميل.");
    } finally {
      setLoadingMore(false);
    }
  }

  const list = useMemo(() => events ?? [], [events]);

  const counts = useMemo(() => {
    const c: Record<"all" | Category, number> = { all: list.length, task: 0, comment: 0, project: 0, other: 0 };
    for (const e of list) c[categoryOf(e)] += 1;
    return c;
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter(
      (e) =>
        (filter === "all" || categoryOf(e) === filter) &&
        (!q || `${e.actor?.name ?? ""} ${e.description ?? ""}`.toLowerCase().includes(q)),
    );
  }, [list, filter, search]);

  const grouped = useMemo(
    () =>
      GROUP_ORDER.map((g) => ({ group: g, items: filtered.filter((e) => groupOf(e.createdAt, now) === g) })).filter(
        (g) => g.items.length > 0,
      ),
    [filtered, now],
  );

  const contributors = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string | null; count: number }>();
    for (const e of list) {
      if (!e.actor) continue;
      const cur = map.get(e.actor.id);
      if (cur) cur.count += 1;
      else map.set(e.actor.id, { name: e.actor.name, avatar: e.actor.avatar, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [list]);

  const filters: { value: "all" | Category; label: string }[] = [
    { value: "all", label: "الكل" },
    { value: "task", label: CATEGORY.task.label },
    { value: "comment", label: CATEGORY.comment.label },
    { value: "project", label: CATEGORY.project.label },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="النشاط" description="كل ما يجري في مساحة عملك، في سجل واحد." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في النشاط…" className="ps-9" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filters.map((f) => {
                const active = filter === f.value;
                return (
                  <Button key={f.value} variant={active ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)}>
                    {f.label}
                    <span className={cn("ms-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums", active ? "bg-primary-foreground/15" : "bg-muted")}>
                      {counts[f.value]}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          <Card>
            <CardContent className="space-y-8">
              {!events ? (
                <div className="py-16 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></div>
              ) : grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <IconActivity className="mb-3 size-8 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium">لا يوجد نشاط</p>
                  <p className="text-sm text-muted-foreground">
                    {list.length === 0 ? "ابدأ بإنشاء مشروع أو مهمة وسيظهر كل شيء هنا." : "جرّب عامل تصفية أو كلمة بحث أخرى."}
                  </p>
                </div>
              ) : (
                grouped.map(({ group, items }) => (
                  <div key={group} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xs font-semibold tracking-wide text-muted-foreground">{GROUP_LABEL[group]}</h2>
                      <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
                      <Separator className="flex-1" />
                    </div>

                    <ol className="relative space-y-6 border-s ps-8">
                      {items.map((e) => {
                        const meta = CATEGORY[categoryOf(e)];
                        const Icon = meta.icon;
                        const who = e.actor ?? { id: "", name: "النظام", avatar: null };
                        return (
                          <li key={e.id} className="relative">
                            <span className="absolute -start-12 top-0">
                              <span className="relative inline-flex">
                                <Avatar className="size-8 ring-4 ring-card">
                                  <AvatarImage src={who.avatar ?? undefined} alt={who.name} />
                                  <AvatarFallback>{initials(who.name)}</AvatarFallback>
                                </Avatar>
                                <span className={cn("absolute -bottom-1 -end-1 flex size-4 items-center justify-center rounded-full ring-2 ring-card", meta.badge)}>
                                  <Icon className="size-2.5" />
                                </span>
                              </span>
                            </span>
                            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                              <p className="text-sm leading-relaxed">
                                <span className="font-medium">{who.name}</span>{" "}
                                <span className="text-muted-foreground">{e.description}</span>
                              </p>
                              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatRelativeTime(e.createdAt)}</span>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))
              )}
              {events && page < pages && (
                <div className="text-center">
                  <Button variant="outline" size="sm" disabled={loadingMore} onClick={() => void more()}>
                    {loadingMore && <IconLoader2 className="size-4 animate-spin" />} عرض المزيد
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconActivity className="size-4" /> ملخص النشاط
              </CardTitle>
              <CardDescription>ما حُمِّل من السجل</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-3xl font-semibold tracking-tight tabular-nums">{total}</p>
                <p className="text-xs text-muted-foreground">إجمالي الأحداث</p>
              </div>
              <Separator />
              <div className="space-y-4">
                {(["task", "comment", "project"] as Category[]).map((c) => {
                  const meta = CATEGORY[c];
                  const value = counts[c];
                  const pct = list.length ? Math.round((value / list.length) * 100) : 0;
                  return (
                    <div key={c} className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn("size-2.5 rounded-full", meta.dot)} />
                        <span className="text-muted-foreground">{meta.label}</span>
                        <span className="ms-auto font-medium tabular-nums">{value}</span>
                        <span className="w-9 text-end text-xs text-muted-foreground tabular-nums">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">أبرز المساهمين</CardTitle>
              <CardDescription>الأكثر نشاطًا في الفريق</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contributors.length === 0 && <p className="text-sm text-muted-foreground">لا مساهمات بعد.</p>}
              {contributors.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={c.avatar ?? undefined} alt={c.name} />
                    <AvatarFallback>{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.count} إجراء</p>
                  </div>
                  <Progress value={(c.count / contributors[0].count) * 100} className="h-1.5 w-16" />
                </div>
              ))}
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/team"><IconUserPlus className="size-4" /> إدارة الفريق</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
