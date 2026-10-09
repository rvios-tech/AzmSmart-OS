"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconSettings,
  IconPlus,
  IconCalendarDue,
  IconLoader2,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteDialog } from "@/components/delete-dialog";
import { NewTaskDialog, TaskDialog } from "@/components/work/task-dialog";
import { ProjectSettingsDialog } from "@/components/work/project-settings-dialog";
import { ApiError } from "@/lib/api/client";
import {
  TASK_STATUS_LABELS,
  deleteTaskApi,
  getProjectApi,
  listActivityApi,
  listTasksApi,
  updateTaskApi,
  type ActivityDto,
} from "@/lib/api/work";
import { formatDateShort, formatPercent } from "@/lib/format";
import {
  initials,
  toProjectView,
  toTaskView,
  type ProjectStatusLabel,
  type TaskStatusLabel,
  type WProject,
  type WTask,
} from "@/lib/work/view";
import { ProjectWorkspace, type TaskActions } from "./project-workspace";

const STATUS_DOT: Record<ProjectStatusLabel, string> = {
  "على المسار": "bg-foreground",
  "في خطر": "bg-muted-foreground",
  "متأخر": "bg-muted-foreground/50",
  "مكتمل": "bg-primary",
};

/** صفحة تفاصيل المشروع: الترويسة + مساحة العمل التفاعلية، كلها على بيانات حقيقية. */
export function ProjectDetail({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<WProject | null>(null);
  const [tasks, setTasks] = useState<WTask[]>([]);
  const [events, setEvents] = useState<ActivityDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addStatus, setAddStatus] = useState(1);
  const [openTask, setOpenTask] = useState<WTask | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<WTask | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, t, a] = await Promise.all([
        getProjectApi(projectId),
        listTasksApi({ projectId }),
        listActivityApi({ projectId }).catch(() => ({ activity: [] as ActivityDto[] })),
      ]);
      setProject(toProjectView(p));
      setTasks(t.map(toTaskView));
      setEvents(a.activity);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تحميل المشروع.");
    }
  }, [projectId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const people = useMemo(
    () => (project ? [...(project.lead ? [project.lead] : []), ...project.members.filter((m) => m.id !== project.lead?.id)] : []),
    [project],
  );

  if (error) {
    return (
      <Card>
        <CardContent className="space-y-3 py-16 text-center">
          <p className="font-medium">{error}</p>
          <Button variant="outline" asChild><Link href="/projects">العودة إلى المشاريع</Link></Button>
        </CardContent>
      </Card>
    );
  }
  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const actions: TaskActions = {
    onOpen: (task) => setOpenTask(task),
    onMove: async (task: WTask, status: TaskStatusLabel) => {
      try {
        await updateTaskApi(task.uid, { status: TASK_STATUS_LABELS.indexOf(status) });
        toast.success(`نُقلت ${task.id} إلى «${status}»`);
        await load();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "تعذّر النقل.");
      }
    },
    onDelete: (task) => setPendingDelete(task),
  };

  const shown = people.slice(0, 5);
  const extra = people.length - shown.length;

  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="size-9 shrink-0" asChild>
              <Link href="/projects">
                <IconArrowRight className="size-4" />
                <span className="sr-only">العودة إلى المشاريع</span>
              </Link>
            </Button>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="size-3 rounded-full bg-foreground" />
                <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {project.key}
                </span>
                <Badge variant="secondary" className="gap-1.5 font-medium">
                  <span className={`size-1.5 rounded-full ${STATUS_DOT[project.status]}`} />
                  {project.status}
                </Badge>
              </div>
              {project.description && (
                <p className="max-w-2xl text-sm text-muted-foreground">{project.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 pt-0.5 text-xs text-muted-foreground">
                {(project.start || project.due) && (
                  <span className="flex items-center gap-1.5">
                    <IconCalendarDue className="size-4" />
                    {project.start ? formatDateShort(project.start) : "—"} – {project.due ? formatDateShort(project.due) : "—"}
                  </span>
                )}
                {project.category && (<><span>·</span><span>{project.category}</span></>)}
                <span>·</span>
                <span>
                  اكتملت{" "}
                  <span className="tabular-nums" dir="ltr">
                    {project.taskCounts.done}/{project.taskCounts.total}
                  </span>{" "}
                  مهمة
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="me-1 flex items-center -space-x-2">
              {shown.map((m) => (
                <Avatar key={m.id} className="size-8 ring-2 ring-background">
                  <AvatarImage src={m.avatar || undefined} alt={m.name} />
                  <AvatarFallback className="text-[10px]">{initials(m.name)}</AvatarFallback>
                </Avatar>
              ))}
              {extra > 0 && (
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                  +{extra}
                </span>
              )}
            </div>
            <Button variant="outline" size="icon" className="size-9" onClick={() => setSettingsOpen(true)}>
              <IconSettings className="size-4" />
              <span className="sr-only">إعدادات المشروع</span>
            </Button>
            <Button onClick={() => { setAddStatus(1); setAddOpen(true); }}>
              <IconPlus className="size-4" /> مهمة جديدة
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border bg-card px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="tabular-nums">{formatPercent(project.progress, 0)}</span>
            <span className="text-muted-foreground">مكتمل</span>
          </div>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
          </div>
          <span className={`hidden size-2.5 rounded-full sm:block ${STATUS_DOT[project.status]}`} />
          <span className="hidden text-sm text-muted-foreground sm:block">{project.status}</span>
        </div>
      </div>

      <ProjectWorkspace
        project={project}
        tasks={tasks}
        actions={actions}
        events={events}
        onAddTask={(status) => {
          setAddStatus(TASK_STATUS_LABELS.indexOf(status));
          setAddOpen(true);
        }}
      />

      <NewTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        projectId={project.id}
        defaultStatus={addStatus}
        people={people}
        onCreated={() => void load()}
      />

      <TaskDialog
        task={openTask}
        open={openTask !== null}
        onOpenChange={(o) => { if (!o) setOpenTask(null); }}
        people={people}
        onSaved={() => void load()}
      />

      <ProjectSettingsDialog
        project={project}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onChanged={() => void load()}
      />

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
        name={pendingDelete ? pendingDelete.id : "المهمة"}
        description={pendingDelete ? `سيؤدي هذا إلى حذف «${pendingDelete.title}» نهائياً. لا يمكن التراجع عن هذا الإجراء.` : undefined}
        onConfirm={async () => {
          if (!pendingDelete) return;
          try {
            await deleteTaskApi(pendingDelete.uid);
            await load();
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف.");
          }
        }}
      />
    </div>
  );
}
