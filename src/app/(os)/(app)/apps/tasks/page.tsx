"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCalendar,
  IconCircleCheck,
  IconListCheck,
  IconLoader2,
  IconPlus,
  IconProgress,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { TaskDialog } from "@/components/work/task-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import {
  createTaskApi, listProjectsApi, listTasksApi, updateTaskApi, type ProjectDto,
} from "@/lib/api/work";
import { listTeamMembers } from "@/lib/api/workspace";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import { initials, toMember, toTaskView, type WMember, type WTask } from "@/lib/work/view";

const PRIORITY_STYLE: Record<string, string> = {
  "عاجلة": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "عالية": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "متوسطة": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "منخفضة": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const today = () => new Date().toISOString().slice(0, 10);

/** مهامي ومهام الفريق عبر كل المشاريع — على بيانات حقيقية. */
export default function TasksPage() {
  const [scope, setScope] = useState<"me" | "all">("me");
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");
  const [tasks, setTasks] = useState<WTask[] | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [people, setPeople] = useState<WMember[]>([]);
  const [draft, setDraft] = useState("");
  const [projectId, setProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<WTask | null>(null);
  const [now] = useState(() => today());

  const load = useCallback(async () => {
    try {
      const [t, p] = await Promise.all([
        listTasksApi({ assignee: scope === "me" ? "me" : undefined }),
        listProjectsApi(),
      ]);
      setTasks(t.map(toTaskView));
      setProjects(p);
      setProjectId((cur) => cur || p[0]?.id || "");
    } catch (err) {
      setTasks([]);
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المهام.");
    }
  }, [scope]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const { members } = await listTeamMembers();
        setPeople(members.filter((m) => m.isActive).map((m) => toMember({ id: m.user.id, name: m.user.displayName, avatar: m.user.avatarUrl })));
      } catch {
        setPeople([]);
      }
    })();
  }, []);

  const list = useMemo(() => tasks ?? [], [tasks]);
  const stats = useMemo(() => {
    const done = list.filter((t) => t.status === "مكتمل").length;
    const overdue = list.filter((t) => t.status !== "مكتمل" && t.due && t.due < now).length;
    return { total: list.length, done, active: list.length - done, overdue };
  }, [list, now]);

  const shown = list.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.status === "مكتمل" : t.status !== "مكتمل",
  );

  async function toggle(t: WTask) {
    try {
      await updateTaskApi(t.uid, { status: t.status === "مكتمل" ? 1 : 4 });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    }
  }

  async function add() {
    const title = draft.trim();
    if (title.length < 2) return;
    if (!projectId) return toast.error("أنشئ مشروعًا أولًا لتضيف إليه مهام");
    setBusy(true);
    try {
      await createTaskApi({ projectId, title });
      setDraft("");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّرت الإضافة.");
    } finally {
      setBusy(false);
    }
  }

  const tiles = [
    { label: "الإجمالي", value: stats.total, icon: IconListCheck, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { label: "مكتملة", value: stats.done, icon: IconCircleCheck, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "قيد التنفيذ", value: stats.active, icon: IconProgress, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    { label: "متأخرة", value: stats.overdue, icon: IconAlertTriangle, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="المهام" description="تابع كل ما يحتاج فريقك إلى إنجازه، عبر كل المشاريع.">
        <Tabs value={scope} onValueChange={(v) => { setTasks(null); setScope(v as "me" | "all"); }}>
          <TabsList>
            <TabsTrigger value="me">مهامي</TabsTrigger>
            <TabsTrigger value="all">كل الفريق</TabsTrigger>
          </TabsList>
        </Tabs>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex items-center gap-3">
              <span className={cn("flex size-10 items-center justify-center rounded-lg", tile.className)}>
                <tile.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums tracking-tight">{tile.value}</p>
                <p className="text-xs text-muted-foreground">{tile.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              className="min-w-48 flex-1"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) void add();
              }}
              placeholder="أضف مهمة ثم اضغط Enter…"
              maxLength={160}
            />
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-48"><SelectValue placeholder="المشروع" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.key} · {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => void add()} disabled={busy}>
              {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlus className="size-4" />} إضافة
            </Button>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">الكل ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">قيد التنفيذ ({stats.active})</TabsTrigger>
              <TabsTrigger value="done">مكتملة ({stats.done})</TabsTrigger>
            </TabsList>
          </Tabs>

          {!tasks ? (
            <div className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></div>
          ) : shown.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {projects.length === 0 ? (
                <>لا مشاريع بعد — <Link href="/projects" className="underline">أنشئ مشروعًا</Link> لتبدأ بالمهام.</>
              ) : "لا توجد مهام هنا بعد."}
            </div>
          ) : (
            <div className="divide-y">
              {shown.map((t) => {
                const done = t.status === "مكتمل";
                const overdue = !done && t.due && t.due < now;
                return (
                  <div key={t.uid} className="flex items-center gap-3 py-3">
                    <Checkbox checked={done} onCheckedChange={() => void toggle(t)} aria-label="إنجاز" />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setOpen(t)}
                        className={cn("block max-w-full truncate text-start text-sm font-medium hover:underline", done && "text-muted-foreground line-through")}
                      >
                        {t.title}
                      </button>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Link href={`/projects/${t.projectId}`} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground hover:underline">
                          {t.id}
                        </Link>
                        <Badge variant="secondary">{t.status}</Badge>
                        {t.due && (
                          <span className={cn("flex items-center gap-1 text-xs", overdue ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>
                            <IconCalendar className="size-3" />
                            {formatDateShort(t.due)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className={PRIORITY_STYLE[t.priority]}>{t.priority}</Badge>
                    {t.assignee && (
                      <Avatar className="size-7">
                        <AvatarImage src={t.assignee.avatar || undefined} alt={t.assignee.name} />
                        <AvatarFallback>{initials(t.assignee.name)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        task={open}
        open={open !== null}
        onOpenChange={(o) => { if (!o) setOpen(null); }}
        people={people}
        onSaved={() => void load()}
      />
    </div>
  );
}
