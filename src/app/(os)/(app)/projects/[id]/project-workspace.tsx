"use client";

import { useMemo, useState } from "react";
import {
  IconLayoutDashboard,
  IconLayoutKanban,
  IconList,
  IconTimeline,
  IconUsers,
  IconActivity,
  IconChecklist,
  IconBolt,
  IconMessageCircle,
  IconFlag3Filled,
  IconPlus,
  IconDotsVertical,
  IconTrash,
  IconExternalLink,
  IconArrowsSort,
  IconCircleCheckFilled,
  IconCircle,
  IconWallet,
  IconProgressCheck,
  IconCalendarDue,
  IconClock,
  IconTargetArrow,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  initials,
  type WMember,
  type WProject as Project,
  type WTask as Task,
  type TaskPriorityLabel as TaskPriority,
  type TaskStatusLabel as TaskStatus,
} from "@/lib/work/view";
import { TASK_STATUS_LABELS, type ActivityDto } from "@/lib/api/work";
import {
  formatCurrency,
  formatDateShort,
  formatDayMonth,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  pluralize,
} from "@/lib/format";

// ---------------------------------------------------------------------------
// خرائط البيانات الوصفية
// ---------------------------------------------------------------------------

// تدرّج رمادي محايد لمسار المهمة: باهت ← قوي كلما تقدّم العمل. لا ألوان هنا،
// والتمييز يأتي من درجة الرمادي مع التسمية.
const STATUS_DOT: Record<TaskStatus, string> = {
  "متراكم": "bg-muted-foreground/40",
  "للتنفيذ": "bg-muted-foreground/60",
  "قيد التنفيذ": "bg-muted-foreground",
  "قيد المراجعة": "bg-foreground/70",
  "مكتمل": "bg-foreground",
};

const BOARD_COLUMNS: {
  status: TaskStatus;
  dot: string;
}[] = [
  { status: "متراكم", dot: STATUS_DOT["متراكم"] },
  { status: "للتنفيذ", dot: STATUS_DOT["للتنفيذ"] },
  { status: "قيد التنفيذ", dot: STATUS_DOT["قيد التنفيذ"] },
  { status: "قيد المراجعة", dot: STATUS_DOT["قيد المراجعة"] },
  { status: "مكتمل", dot: STATUS_DOT["مكتمل"] },
];

const PRIORITY_META: Record<TaskPriority, { flag: string }> = {
  "عاجلة": { flag: "text-foreground" },
  "عالية": { flag: "text-foreground/70" },
  "متوسطة": { flag: "text-muted-foreground" },
  "منخفضة": { flag: "text-muted-foreground/40" },
};

// ألوان أعمدة مخطط جانت (مسار رمادي موحّد، وتعبئة بدرجة تتبع الحالة).
const BAR_FILL: Record<TaskStatus, string> = {
  "متراكم": STATUS_DOT["متراكم"],
  "للتنفيذ": STATUS_DOT["للتنفيذ"],
  "قيد التنفيذ": STATUS_DOT["قيد التنفيذ"],
  "قيد المراجعة": STATUS_DOT["قيد المراجعة"],
  "مكتمل": STATUS_DOT["مكتمل"],
};

// ---------------------------------------------------------------------------
// دوال مساعدة
// ---------------------------------------------------------------------------

function firstName(name: string) {
  return name.split(" ")[0];
}

function currency(n: number) {
  return formatCurrency(Math.round(n));
}

function shortDate(iso: string) {
  return iso ? formatDayMonth(iso) : "—";
}

function longDate(iso: string) {
  return iso ? formatDateShort(iso) : "—";
}

const DAY = 86_400_000;

function isoToMs(iso: string) {
  return new Date(iso + "T00:00:00Z").getTime();
}

const NO_ONE: WMember = { id: "", name: "غير مُسنَد", avatar: "" };

// ---------------------------------------------------------------------------
// مكوّنات واجهة مشتركة صغيرة
// ---------------------------------------------------------------------------

function ProgressBar({
  value,
  tone = "primary",
}: {
  value: number;
  tone?: "primary" | "foreground" | "muted";
}) {
  const fill =
    tone === "foreground"
      ? "bg-foreground"
      : tone === "muted"
        ? "bg-muted-foreground/70"
        : "bg-primary";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full rounded-full transition-all ${fill}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function KpiTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function TaskLabels({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((l) => (
        <span
          key={l}
          className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
        >
          {l}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// اللوحة (كانبان)
// ---------------------------------------------------------------------------

export type TaskActions = {
  onOpen: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
};

function TaskMenu({
  task,
  actions,
  className,
}: {
  task: Task;
  actions: TaskActions;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`size-6 text-muted-foreground ${className ?? ""}`}
          aria-label={`إجراءات ${task.title}`}
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => actions.onOpen(task)}>
          <IconExternalLink className="size-4" /> فتح
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {TASK_STATUS_LABELS.filter((l) => l !== task.status).map((l) => (
          <DropdownMenuItem key={l} onSelect={() => actions.onMove(task, l)}>
            <IconArrowsSort className="size-4" /> نقل إلى {l}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => actions.onDelete(task)}
        >
          <IconTrash className="size-4" /> حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BoardCard({ task, actions }: { task: Task; actions: TaskActions }) {
  const prio = PRIORITY_META[task.priority];
  const who = task.assignee ?? NO_ONE;
  return (
    <div className="group/card space-y-2.5 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:border-foreground/20">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <IconFlag3Filled className={`size-3.5 ${prio.flag}`} />
          <span className="font-mono text-[11px] text-muted-foreground">
            {task.id}
          </span>
        </span>
        <div className="flex items-center gap-1">
          {task.points > 0 && (
            <span className="flex size-5 items-center justify-center rounded bg-muted text-[10px] font-medium tabular-nums text-muted-foreground">
              {task.points}
            </span>
          )}
          <TaskMenu task={task} actions={actions} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => actions.onOpen(task)}
        className="block w-full text-start text-sm font-medium leading-snug hover:underline"
      >
        {task.title}
      </button>

      <TaskLabels labels={task.labels} />

      <div className="flex items-center justify-between pt-0.5">
        <Avatar className="size-6">
          <AvatarImage src={who.avatar || undefined} alt={who.name} />
          <AvatarFallback className="text-[9px]">
            {initials(who.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.due && (
            <span className="flex items-center gap-1">
              <IconCalendarDue className="size-3.5" />
              <span className="tabular-nums">{shortDate(task.due)}</span>
            </span>
          )}
          {task.comments > 0 && (
            <span className="flex items-center gap-1">
              <IconMessageCircle className="size-3.5" />
              <span className="tabular-nums">{formatNumber(task.comments)}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function BoardView({
  tasks,
  actions,
  onAddTask,
}: {
  tasks: Task[];
  actions: TaskActions;
  onAddTask: (status: TaskStatus) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {BOARD_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div
            key={col.status}
            className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/40 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${col.dot}`} />
                <span className="text-sm font-medium">{col.status}</span>
                <span className="rounded bg-background px-1.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {formatNumber(colTasks.length)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => onAddTask(col.status)}
                aria-label={`إضافة مهمة إلى ${col.status}`}
              >
                <IconPlus className="size-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {colTasks.map((t) => (
                <BoardCard key={t.uid} task={t} actions={actions} />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="justify-start text-muted-foreground"
              onClick={() => onAddTask(col.status)}
            >
              <IconPlus className="size-4" /> إضافة مهمة
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// القائمة
// ---------------------------------------------------------------------------

function ListView({
  tasks,
  actions,
}: {
  tasks: Task[];
  actions: TaskActions;
}) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const allChecked = checked.size === tasks.length && tasks.length > 0;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-10 ps-4">
                <Checkbox
                  aria-label="تحديد الكل"
                  checked={allChecked}
                  onCheckedChange={(v) =>
                    setChecked(v ? new Set(tasks.map((t) => t.uid)) : new Set())
                  }
                />
              </TableHead>
              <TableHead>المهمة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الأولوية</TableHead>
              <TableHead>المسؤول</TableHead>
              <TableHead>الاستحقاق</TableHead>
              <TableHead className="text-end">النقاط</TableHead>
              <TableHead className="w-10 pe-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((t) => (
              <TableRow key={t.uid} data-state={checked.has(t.uid) && "selected"}>
                <TableCell className="ps-4">
                  <Checkbox
                    aria-label={`تحديد ${t.title}`}
                    checked={checked.has(t.uid)}
                    onCheckedChange={() => toggle(t.uid)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconFlag3Filled
                      className={`size-3.5 shrink-0 ${PRIORITY_META[t.priority].flag}`}
                    />
                    <div className="min-w-0">
                      <button type="button" onClick={() => actions.onOpen(t)} className="block max-w-full truncate text-start font-medium hover:underline">{t.title}</button>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {t.id}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="gap-1.5 font-medium">
                    <span
                      className={`size-1.5 rounded-full ${STATUS_DOT[t.status]}`}
                    />
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="gap-1 font-normal">
                    <IconFlag3Filled
                      className={`size-3 ${PRIORITY_META[t.priority].flag}`}
                    />
                    {t.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarImage
                        src={(t.assignee ?? NO_ONE).avatar || undefined}
                        alt={(t.assignee ?? NO_ONE).name}
                      />
                      <AvatarFallback className="text-[9px]">
                        {initials((t.assignee ?? NO_ONE).name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {(t.assignee ?? NO_ONE).name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">
                  {shortDate(t.due)}
                </TableCell>
                <TableCell className="text-end font-medium tabular-nums">
                  {formatNumber(t.points)}
                </TableCell>
                <TableCell className="pe-4 text-end">
                  <TaskMenu task={t} actions={actions} className="ms-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// الجدول الزمني (مخطط جانت)
//
// في الواجهة العربية يتدفّق المحور الزمني من اليمين إلى اليسار: الأشهر تُرتّب
// بحكم `flex` داخل سياق RTL، والأشرطة والعلامات تُموضَع بـ `insetInlineStart`
// لا بـ `left` حتى تُقاس من بداية المحور (يوليو) على اليمين.
// ---------------------------------------------------------------------------

const MONTH_NAMES = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

/** نافذة الجدول: من أول شهر فيه عمل إلى آخره، بحد أدنى ثلاثة أشهر. */
function ganttWindow(project: Project, tasks: Task[], now: number) {
  const stamps = [
    ...tasks.flatMap((t) => [t.start, t.due]),
    ...project.milestones.map((m) => m.date),
    project.start,
    project.due,
  ]
    .filter(Boolean)
    .map(isoToMs)
    .filter((n) => Number.isFinite(n));
  const lo = new Date(Math.min(now, ...(stamps.length ? stamps : [now])));
  const hi = new Date(Math.max(now, ...(stamps.length ? stamps : [now])));
  const start = Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth(), 1);
  let months = (hi.getUTCFullYear() - lo.getUTCFullYear()) * 12 + (hi.getUTCMonth() - lo.getUTCMonth()) + 1;
  months = Math.min(18, Math.max(3, months));
  const cols = Array.from({ length: months }, (_, i) => {
    const d0 = new Date(Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth() + i, 1));
    const d1 = new Date(Date.UTC(lo.getUTCFullYear(), lo.getUTCMonth() + i + 1, 1));
    return {
      label: MONTH_NAMES[d0.getUTCMonth()],
      year: d0.getUTCFullYear(),
      days: Math.round((d1.getTime() - d0.getTime()) / DAY),
    };
  });
  const end = start + cols.reduce((a, c) => a + c.days, 0) * DAY;
  return { start, end, span: end - start, cols, totalDays: cols.reduce((a, c) => a + c.days, 0) };
}

function GanttView({ project, tasks }: { project: Project; tasks: Task[] }) {
  const [now] = useState(() => Date.now());
  const win = useMemo(() => ganttWindow(project, tasks, now), [project, tasks, now]);
  const toPct = (ms: number) => Math.min(100, Math.max(0, ((ms - win.start) / win.span) * 100));

  const rows = useMemo(
    () =>
      tasks
        .filter((t) => t.start)
        .sort((a, b) => isoToMs(a.start) - isoToMs(b.start))
        .slice(0, 30),
    [tasks]
  );

  const weekLines: number[] = [];
  for (let d = 7; d < win.totalDays; d += 7) weekLines.push((d / win.totalDays) * 100);

  const milestones = project.milestones
    .filter((m) => m.date)
    .map((m) => ({ ...m, pct: toPct(isoToMs(m.date)) }));

  const todayPct = toPct(now);

  return (
    <Card className="overflow-hidden py-0">
      <div className="overflow-x-auto">
        <div className="min-w-[780px]">
          {/* ترويسة الأشهر */}
          <div className="flex border-b bg-muted/40">
            <div className="w-56 shrink-0 border-e px-4 py-2.5 text-xs font-medium text-muted-foreground">
              المهمة
            </div>
            <div className="flex flex-1">
              {win.cols.map((m, i) => (
                <div
                  key={i}
                  className="border-e px-3 py-2.5 text-xs font-medium last:border-e-0"
                  style={{ width: `${(m.days / win.totalDays) * 100}%` }}
                >
                  {m.label}{" "}
                  <span className="text-muted-foreground">{m.year}</span>
                </div>
              ))}
            </div>
          </div>

          {/* شريط المعالم */}
          <div className="flex border-b bg-background">
            <div className="w-56 shrink-0 border-e px-4 py-2 text-[11px] font-medium text-muted-foreground">
              المعالم
            </div>
            <div className="relative h-7 flex-1">
              {milestones.map((m) => (
                <Tooltip key={m.id}>
                  <TooltipTrigger asChild>
                    <span
                      className="absolute top-1/2 flex -translate-y-1/2 items-center justify-center ltr:-translate-x-1/2 rtl:translate-x-1/2"
                      style={{ insetInlineStart: `${m.pct}%` }}
                    >
                      <span
                        className={`size-2.5 rotate-45 rounded-[2px] border ${
                          m.done
                            ? "border-foreground bg-foreground"
                            : "border-muted-foreground bg-muted"
                        }`}
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {m.title} · {shortDate(m.date)}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* الجسم مع طبقة خطوط الشبكة */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 flex">
              <div className="w-56 shrink-0" />
              <div className="relative flex-1">
                {weekLines.map((x, i) => (
                  <div
                    key={i}
                    className="absolute inset-y-0 w-px bg-border/60"
                    style={{ insetInlineStart: `${x}%` }}
                  />
                ))}
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="absolute inset-y-0 w-px border-s border-dashed border-muted-foreground/40"
                    style={{ insetInlineStart: `${m.pct}%` }}
                  />
                ))}
                <div
                  className="absolute inset-y-0 w-0.5 bg-primary/50"
                  style={{ insetInlineStart: `${todayPct}%` }}
                />
              </div>
            </div>

            {rows.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                لا مهام بتواريخ بعد — حدّد تاريخ بداية أو استحقاق للمهام لتظهر هنا.
              </p>
            )}

            {rows.map((t) => {
              const left = toPct(isoToMs(t.start));
              const right = toPct(isoToMs(t.due || t.start) + DAY);
              const width = Math.max(right - left, 2.5);
              const fill = t.status === "مكتمل" ? 100 : t.status === "قيد المراجعة" ? 75 : t.status === "قيد التنفيذ" ? 40 : 0;
              return (
                <div
                  key={t.uid}
                  className="flex items-center border-b last:border-b-0"
                >
                  <div className="w-56 shrink-0 border-e px-4 py-2">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {t.id} · {firstName((t.assignee ?? NO_ONE).name)}
                    </p>
                  </div>
                  <div className="relative h-11 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center overflow-hidden rounded-md bg-muted"
                          style={{
                            insetInlineStart: `${left}%`,
                            width: `${width}%`,
                          }}
                        >
                          <div
                            className={`h-full ${BAR_FILL[t.status]}`}
                            style={{ width: `${fill}%` }}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t.title} · {shortDate(t.start)} – {shortDate(t.due || t.start)}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>

          {/* مفتاح المخطط */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t px-4 py-3 text-xs text-muted-foreground">
            {BOARD_COLUMNS.map((c) => (
              <span key={c.status} className="flex items-center gap-1.5">
                <span className={`size-2.5 rounded-sm ${c.dot}`} />
                {c.status}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rotate-45 rounded-[2px] bg-foreground" />
              معلم
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-0.5 bg-primary/60" />
              اليوم
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// الأعضاء
// ---------------------------------------------------------------------------

function MembersView({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const roster = [
    ...(project.lead ? [{ member: project.lead, lead: true }] : []),
    ...project.members
      .filter((m) => m.id !== project.lead?.id)
      .map((member) => ({ member, lead: false })),
  ];

  if (roster.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">لا أعضاء في المشروع بعد.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roster.map(({ member, lead }) => {
        const assigned = tasks.filter((t) => t.assignee?.id === member.id);
        const done = assigned.filter((t) => t.status === "مكتمل").length;
        const points = assigned.reduce((s, t) => s + t.points, 0);
        return (
          <Card key={member.id} className={lead ? "ring-1 ring-primary/30" : ""}>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="size-11">
                  <AvatarImage src={member.avatar || undefined} alt={member.name} />
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {lead ? "قائد المشروع" : "عضو"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-lg font-semibold tabular-nums">{formatNumber(assigned.length)}</p>
                  <p className="text-xs text-muted-foreground">مهام مسندة</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-lg font-semibold tabular-nums">{formatNumber(done)}</p>
                  <p className="text-xs text-muted-foreground">منجزة</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-lg font-semibold tabular-nums">{formatNumber(points)}</p>
                  <p className="text-xs text-muted-foreground">نقاط الجهد</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// النشاط
// ---------------------------------------------------------------------------

function ActivityFeed({ events }: { events: ActivityDto[] }) {
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">لا نشاط بعد.</p>;
  }
  return (
    <ol className="relative space-y-5 border-s ps-6">
      {events.map((e) => {
        const who = e.actor ?? { id: "", name: "النظام", avatar: null };
        return (
          <li key={e.id} className="relative">
            <span className="absolute -start-[31px] top-0.5">
              <Avatar className="size-6 ring-4 ring-background">
                <AvatarImage src={who.avatar ?? undefined} alt={who.name} />
                <AvatarFallback className="text-[9px]">{initials(who.name)}</AvatarFallback>
              </Avatar>
            </span>
            <p className="text-sm">
              <span className="font-medium">{who.name}</span> {e.description}
            </p>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(e.createdAt)}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// نظرة عامة
// ---------------------------------------------------------------------------

function OverviewView({
  project,
  tasks,
  events,
}: {
  project: Project;
  tasks: Task[];
  events: ActivityDto[];
}) {
  const doneTasks = tasks.filter((t) => t.status === "مكتمل");
  const totalPoints = tasks.reduce((s, t) => s + t.points, 0);
  const donePoints = doneTasks.reduce((s, t) => s + t.points, 0);
  const teamSize = new Set([
    ...(project.lead ? [project.lead.id] : []),
    ...project.members.map((m) => m.id),
  ]).size;
  const spentPct = project.budget > 0 ? Math.min(100, Math.round((project.spent / project.budget) * 100)) : 0;
  const durationDays =
    project.start && project.due
      ? Math.max(0, Math.round((isoToMs(project.due) - isoToMs(project.start)) / DAY))
      : 0;

  const kpis = [
    {
      icon: IconProgressCheck,
      label: "نسبة الإنجاز",
      value: formatPercent(project.progress, 0),
      hint: "التقدّم الإجمالي",
    },
    {
      icon: IconChecklist,
      label: "المهام المنجزة",
      value: `${formatNumber(doneTasks.length)} / ${formatNumber(tasks.length)}`,
      hint: pluralize(
        tasks.length - doneTasks.length,
        "مهمة متبقية",
        "مهمتان متبقيتان",
        "مهام متبقية"
      ),
    },
    {
      icon: IconBolt,
      label: "نقاط الجهد",
      value: `${formatNumber(donePoints)} / ${formatNumber(totalPoints)}`,
      hint: "المنجز من المخطط",
    },
    {
      icon: IconUsers,
      label: "الفريق",
      value: formatNumber(teamSize),
      hint: "المساهمون",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiTile key={k.label} {...k} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* صحة التسليم */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">صحة التسليم</CardTitle>
            <CardDescription>
              نسبة الإنجاز واستهلاك الميزانية والتواريخ المهمة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <IconTargetArrow className="size-4 text-muted-foreground" />
                  نسبة الإنجاز
                </span>
                <span className="tabular-nums">
                  {formatPercent(project.progress, 0)}
                </span>
              </div>
              <ProgressBar value={project.progress} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <IconWallet className="size-4 text-muted-foreground" />
                  الميزانية المصروفة
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {project.budget > 0
                    ? `${currency(project.spent)} من ${currency(project.budget)} · ${formatPercent(spentPct, 0)}`
                    : "لم تُحدَّد ميزانية"}
                </span>
              </div>
              <ProgressBar
                value={spentPct}
                tone={spentPct > 90 ? "foreground" : "muted"}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <DateStat
                icon={IconCalendarDue}
                label="البداية"
                value={shortDate(project.start)}
              />
              <DateStat
                icon={IconCalendarDue}
                label="الاستحقاق"
                value={shortDate(project.due)}
              />
              <DateStat
                icon={IconClock}
                label="المدة"
                value={durationDays ? pluralize(durationDays, "يوم", "يومان", "أيام") : "—"}
              />
            </div>
          </CardContent>
        </Card>

        {/* المعالم */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المعالم</CardTitle>
            <CardDescription>
              اكتمل {formatNumber(project.milestones.filter((m) => m.done).length)}{" "}
              من {formatNumber(project.milestones.length)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {project.milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-3">
                  {m.done ? (
                    <IconCircleCheckFilled className="mt-0.5 size-5 shrink-0 text-foreground" />
                  ) : (
                    <IconCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground/50" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        m.done ? "text-muted-foreground line-through" : ""
                      }`}
                    >
                      {m.title}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {longDate(m.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">النشاط الأخير</CardTitle>
            <CardDescription>آخر التحديثات على هذا المشروع</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed events={events.slice(0, 5)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">الفريق</CardTitle>
            <CardDescription>قائد المشروع والمتعاونون</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[...(project.lead ? [project.lead] : []), ...project.members.filter((m) => m.id !== project.lead?.id)]
              .slice(0, 5)
              .map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={m.avatar || undefined} alt={m.name} />
                    <AvatarFallback className="text-[10px]">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.id === project.lead?.id ? "قائد المشروع" : "عضو"}
                    </p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DateStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// هيكل مساحة العمل
// ---------------------------------------------------------------------------

const TABS = [
  { value: "overview", label: "نظرة عامة", icon: IconLayoutDashboard },
  { value: "board", label: "اللوحة", icon: IconLayoutKanban },
  { value: "list", label: "القائمة", icon: IconList },
  { value: "timeline", label: "الجدول الزمني", icon: IconTimeline },
  { value: "members", label: "الأعضاء", icon: IconUsers },
  { value: "activity", label: "النشاط", icon: IconActivity },
];

export function ProjectWorkspace({
  project,
  tasks,
  actions,
  onAddTask,
  events,
}: {
  project: Project;
  tasks: Task[];
  actions: TaskActions;
  onAddTask: (status: TaskStatus) => void;
  events: ActivityDto[];
}) {
  return (
    <Tabs defaultValue="overview" className="w-full gap-4">
      <div className="overflow-x-auto">
        <TabsList className="h-9">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
              <t.icon className="size-4" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview">
        <OverviewView project={project} tasks={tasks} events={events} />
      </TabsContent>
      <TabsContent value="board">
        <BoardView tasks={tasks} actions={actions} onAddTask={onAddTask} />
      </TabsContent>
      <TabsContent value="list">
        <ListView tasks={tasks} actions={actions} />
      </TabsContent>
      <TabsContent value="timeline">
        <GanttView project={project} tasks={tasks} />
      </TabsContent>
      <TabsContent value="members">
        <MembersView project={project} tasks={tasks} />
      </TabsContent>
      <TabsContent value="activity">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">النشاط</CardTitle>
            <CardDescription>
              سجل كامل بالتغييرات على {project.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFeed events={events} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
