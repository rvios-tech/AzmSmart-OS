"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconPlus,
  IconLayoutGrid,
  IconLayoutList,
  IconCalendarDue,
  IconChecklist,
  IconArrowUpLeft,
  IconFolders,
  IconDotsVertical,
  IconExternalLink,
  IconTrash,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteDialog } from "@/components/delete-dialog";
import { ApiError } from "@/lib/api/client";
import {
  PROJECT_STATUS_LABELS,
  createProjectApi,
  deleteProjectApi,
  listProjectsApi,
  type Person,
  type ProjectDto as Project,
  type ProjectStatusLabel as ProjectStatus,
} from "@/lib/api/work";
import { listTeamMembers, type TeamMember } from "@/lib/api/workspace";
import { formatDateShort, formatNumber, formatPercent } from "@/lib/format";

// لوحة رمادية موحّدة — الحالة تُعبَّر عنها بنقطة صغيرة وتسمية، لا باللون.
const STATUS_DOT: Record<ProjectStatus, string> = {
  "على المسار": "bg-foreground",
  "في خطر": "bg-muted-foreground",
  "متأخر": "bg-muted-foreground/50",
  "مكتمل": "bg-primary",
};

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "الكل" },
  ...PROJECT_STATUS_LABELS.map((l, i) => ({ value: String(i), label: l })),
];

const dueLabel = (p: Project) => (p.dueDate ? formatDateShort(p.dueDate) : "—");

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

function AvatarStack({
  members,
  lead,
  max = 4,
}: {
  members: Person[];
  lead: Person | null;
  max?: number;
}) {
  // قائد المشروع أولاً ثم البقية، دون تكرار.
  const people = lead ? [lead, ...members.filter((m) => m.id !== lead.id)] : members;
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((m, i) => (
        <Tooltip key={m.id}>
          <TooltipTrigger asChild>
            <Avatar className="size-7 ring-2 ring-card">
              <AvatarImage src={m.avatar ?? undefined} alt={m.name} />
              <AvatarFallback className="text-[10px]">
                {initials(m.name)}
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            {m.name}
            {lead && i === 0 ? " · قائد المشروع" : ""}
          </TooltipContent>
        </Tooltip>
      ))}
      {extra > 0 && (
        <span className="flex size-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-card">
          +{extra}
        </span>
      )}
    </div>
  );
}

function NeutralProgress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="secondary" className="gap-1.5 font-medium">
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {status}
    </Badge>
  );
}

function ProjectMenu({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (project: Project) => void;
}) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          aria-label={`إجراءات ${project.name}`}
          onClick={(e) => {
            // الزر داخل <Link> البطاقة، فنمنع الانتقال عند فتح القائمة.
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onSelect={() => router.push(`/projects/${project.id}`)}>
          <IconExternalLink className="size-4" /> فتح
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={() => onDelete(project)}
        >
          <IconTrash className="size-4" /> حذف
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (project: Project) => void;
}) {
  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <Card className="relative gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
        <span className="absolute inset-x-0 top-0 h-1 bg-muted-foreground/20" />
        <CardContent className="space-y-4 p-5 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">
                {project.key.slice(0, 2)}
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-semibold tracking-tight group-hover:underline">
                  {project.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                    {project.key}
                  </span>
                  <span>{project.category}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge status={PROJECT_STATUS_LABELS[project.status]} />
              <ProjectMenu project={project} onDelete={onDelete} />
            </div>
          </div>

          <p className="line-clamp-2 text-sm text-muted-foreground">
            {project.description}
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">نسبة الإنجاز</span>
              <span className="font-medium tabular-nums">
                {formatPercent(project.progress, 0)}
              </span>
            </div>
            <NeutralProgress value={project.progress} />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <IconChecklist className="size-4" />
              <span className="tabular-nums" dir="ltr">
                {project.taskCounts.done}/{project.taskCounts.total}
              </span>{" "}
              مهمة
            </span>
            <span className="flex items-center gap-1.5">
              <IconCalendarDue className="size-4" />
              <span className="tabular-nums">{dueLabel(project)}</span>
            </span>
          </div>
        </CardContent>
        <div className="flex items-center justify-between border-t px-5 py-3">
          <AvatarStack members={project.members} lead={project.lead} />
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            فتح <IconArrowUpLeft className="size-3.5" />
          </span>
        </div>
      </Card>
    </Link>
  );
}

function ProjectRow({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (project: Project) => void;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">
          {project.key.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-medium group-hover:underline">
            {project.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            <span className="font-mono">{project.key}</span> · {project.category}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:w-28">
        <span className={`size-2 rounded-full ${STATUS_DOT[PROJECT_STATUS_LABELS[project.status]]}`} />
        <span className="text-sm text-muted-foreground">{PROJECT_STATUS_LABELS[project.status]}</span>
      </div>
      <div className="flex items-center gap-2 sm:w-44">
        <NeutralProgress value={project.progress} />
        <span className="w-12 text-end text-xs font-medium tabular-nums">
          {formatPercent(project.progress, 0)}
        </span>
      </div>
      <div
        className="hidden text-sm text-muted-foreground tabular-nums sm:block sm:w-20"
        dir="ltr"
      >
        {project.taskCounts.done}/{project.taskCounts.total}
      </div>
      <div className="hidden text-sm text-muted-foreground tabular-nums sm:block sm:w-28">
        {dueLabel(project)}
      </div>
      <div className="flex items-center justify-end gap-1 sm:w-28">
        <AvatarStack members={project.members} lead={project.lead} max={3} />
        <ProjectMenu project={project} onDelete={onDelete} />
      </div>
    </Link>
  );
}

const CATEGORIES = ["المنتج", "الهندسة", "التسويق", "البيانات", "الأمن", "التصميم"];

function AddProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (p: Project) => void;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [category, setCategory] = useState("المنتج");
  const [status, setStatus] = useState("0");
  const [leadId, setLeadId] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setName("");
      setKey("");
      setCategory("المنتج");
      setStatus("0");
      setDescription("");
      try {
        const { members: list } = await listTeamMembers();
        const active = list.filter((m) => m.isActive);
        setMembers(active);
        setLeadId(active[0]?.user.id ?? "");
      } catch {
        setMembers([]);
      }
    })();
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("اسم المشروع مطلوب");
    const derived =
      key.trim() || name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "PRJ";
    setSaving(true);
    try {
      const project = await createProjectApi({
        name: name.trim(),
        key: derived,
        category,
        status: Number(status),
        leadId: leadId || undefined,
        description: description.trim() || undefined,
      });
      onCreated(project);
      toast.success("تم إنشاء المشروع", { description: `${project.key} · ${project.name}` });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء المشروع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>مشروع جديد</DialogTitle>
            <DialogDescription>ابدأ مبادرة جديدة، ويمكنك ضبط التفاصيل لاحقاً.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div className="grid gap-2">
                <Label htmlFor="project-name">الاسم</Label>
                <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: تطوير تطبيق الجوال" autoFocus />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-key">الرمز</Label>
                <Input id="project-key" value={key} onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="MOB" maxLength={8} dir="ltr" className="text-start" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="project-category">التصنيف</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="project-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-status">الحالة</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="project-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_LABELS.map((s, i) => <SelectItem key={s} value={String(i)}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-lead">قائد المشروع</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger id="project-lead"><SelectValue placeholder="اختر القائد" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>{m.user.displayName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="project-description">الوصف</Label>
              <Textarea id="project-description" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="ما موضوع هذا المشروع؟" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>إنشاء المشروع</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [items, setItems] = useState<Project[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listProjectsApi());
    } catch (err) {
      setItems([]);
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المشاريع.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const list = useMemo(() => items ?? [], [items]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: list.length };
    for (const p of list) map[String(p.status)] = (map[String(p.status)] ?? 0) + 1;
    return map;
  }, [list]);

  const stats = useMemo(() => {
    const active = list.filter((p) => p.status !== 3).length;
    const tasks = list.reduce((a, p) => a + p.taskCounts.total, 0);
    const done = list.reduce((a, p) => a + p.taskCounts.done, 0);
    const people = new Set<string>();
    for (const p of list) for (const m of p.members) people.add(m.id);
    const healthy = list.filter((p) => p.status === 0 || p.status === 3).length;
    return {
      active,
      tasks,
      done,
      people: people.size,
      onTrack: list.length ? Math.round((healthy / list.length) * 100) : 0,
    };
  }, [list]);

  const filtered = useMemo(
    () => (filter === "all" ? list : list.filter((p) => String(p.status) === filter)),
    [filter, list],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="المشاريع" description="تابع سير التسليم في كل مبادرة تعمل عليها فرقك.">
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <IconPlus className="size-4" /> مشروع جديد
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="المشاريع النشطة" value={formatNumber(stats.active)} hint={`من ${formatNumber(list.length)}`} />
        <MetricCard label="المهام المنجزة" value={formatNumber(stats.done)} hint={`من ${formatNumber(stats.tasks)} مهمة`} tone="good" />
        <MetricCard label="أعضاء الفريق" value={formatNumber(stats.people)} hint="في جميع المشاريع" />
        <MetricCard label="على المسار" value={formatPercent(stats.onTrack, 0)} hint="من إجمالي المشاريع" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="min-w-0">
          <div className="overflow-x-auto">
            <TabsList className="h-9">
              {FILTERS.map((f) => (
                <TabsTrigger key={f.value} value={f.value} className="gap-1.5">
                  {f.label}
                  <span className="rounded bg-foreground/10 px-1.5 text-[10px] font-medium tabular-nums">
                    {formatNumber(counts[f.value] ?? 0)}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>

        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="size-7"
            onClick={() => setView("grid")} aria-label="عرض شبكي">
            <IconLayoutGrid className="size-4" />
          </Button>
          <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="size-7"
            onClick={() => setView("list")} aria-label="عرض قائمة">
            <IconLayoutList className="size-4" />
          </Button>
        </div>
      </div>

      {!items ? (
        <div className="py-16 text-center text-sm text-muted-foreground">جارٍ التحميل…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <IconFolders className="size-8 opacity-50" />
            <p className="text-sm">{list.length === 0 ? "لا مشاريع بعد — أنشئ أول مشروع." : "لا توجد مشاريع في هذا العرض."}</p>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} onDelete={setPendingDelete} />)}
        </div>
      ) : (
        <Card className="overflow-hidden py-0">
          <div className="hidden items-center gap-3 border-b bg-muted/40 px-5 py-2.5 text-xs font-medium text-muted-foreground sm:flex">
            <span className="flex-1">المشروع</span>
            <span className="w-28">الحالة</span>
            <span className="w-44">نسبة الإنجاز</span>
            <span className="w-20">المهام</span>
            <span className="w-28">الاستحقاق</span>
            <span className="w-28 text-end">الفريق</span>
          </div>
          <div className="divide-y">
            {filtered.map((p) => <ProjectRow key={p.id} project={p} onDelete={setPendingDelete} />)}
          </div>
        </Card>
      )}

      <AddProjectDialog open={addOpen} onOpenChange={setAddOpen} onCreated={(p) => setItems((prev) => [p, ...(prev ?? [])])} />

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        name={pendingDelete ? pendingDelete.name : "المشروع"}
        description={pendingDelete ? `سيؤدي هذا إلى حذف «${pendingDelete.name}» ومهامه ومعالمه نهائياً. لا يمكن التراجع عن هذا الإجراء.` : undefined}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteProjectApi(pendingDelete.id);
            setItems((prev) => prev?.filter((p) => p.id !== pendingDelete.id) ?? prev);
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف.");
          }
        }}
      />
    </div>
  );
}
