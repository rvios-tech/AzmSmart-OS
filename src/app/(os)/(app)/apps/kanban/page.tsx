"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconExternalLink, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { DeleteDialog } from "@/components/delete-dialog";
import { NewTaskDialog, TaskDialog } from "@/components/work/task-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  TASK_STATUS_LABELS, deleteTaskApi, getProjectApi, listProjectsApi, listTasksApi, updateTaskApi,
  type ProjectDto,
} from "@/lib/api/work";
import { toProjectView, toTaskView, type TaskStatusLabel, type WProject, type WTask } from "@/lib/work/view";
import { BoardView, type TaskActions } from "../../projects/[id]/project-workspace";

/** لوحة كانبان لمشروع تختاره — نفس لوحة صفحة المشروع، على بيانات حقيقية. */
export default function KanbanPage() {
  const [projects, setProjects] = useState<ProjectDto[] | null>(null);
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<WProject | null>(null);
  const [tasks, setTasks] = useState<WTask[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addStatus, setAddStatus] = useState(1);
  const [openTask, setOpenTask] = useState<WTask | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WTask | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const p = await listProjectsApi();
        setProjects(p);
        setProjectId(p[0]?.id ?? "");
      } catch (err) {
        setProjects([]);
        toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل المشاريع.");
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const [p, t] = await Promise.all([getProjectApi(projectId), listTasksApi({ projectId })]);
      setProject(toProjectView(p));
      setTasks(t.map(toTaskView));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل اللوحة.");
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

  const actions: TaskActions = {
    onOpen: (t) => setOpenTask(t),
    onMove: async (t: WTask, status: TaskStatusLabel) => {
      try {
        await updateTaskApi(t.uid, { status: TASK_STATUS_LABELS.indexOf(status) });
        await load();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "تعذّر النقل.");
      }
    },
    onDelete: (t) => setPendingDelete(t),
  };

  if (!projects) {
    return <div className="flex h-64 items-center justify-center"><IconLoader2 className="size-5 animate-spin" /></div>;
  }
  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="لوحة كانبان" description="حرّك المهام بين الأعمدة." />
        <Card><CardContent className="space-y-3 py-16 text-center text-sm text-muted-foreground">
          لا مشاريع بعد.
          <div><Button asChild><Link href="/projects">أنشئ مشروعًا</Link></Button></div>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="لوحة كانبان" description="حرّك المهام بين الأعمدة من قائمة كل بطاقة.">
        <Select value={projectId} onValueChange={(v) => { setProject(null); setProjectId(v); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="اختر مشروعًا" /></SelectTrigger>
          <SelectContent>
            {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.key} · {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {project && (
          <Button variant="outline" asChild>
            <Link href={`/projects/${project.id}`}><IconExternalLink className="size-4" /> صفحة المشروع</Link>
          </Button>
        )}
      </PageHeader>

      {!project ? (
        <div className="flex h-48 items-center justify-center"><IconLoader2 className="size-5 animate-spin" /></div>
      ) : (
        <BoardView tasks={tasks} actions={actions} onAddTask={(s) => { setAddStatus(TASK_STATUS_LABELS.indexOf(s)); setAddOpen(true); }} />
      )}

      {project && (
        <>
          <NewTaskDialog open={addOpen} onOpenChange={setAddOpen} projectId={project.id} defaultStatus={addStatus} people={people} onCreated={() => void load()} />
          <TaskDialog task={openTask} open={openTask !== null} onOpenChange={(o) => { if (!o) setOpenTask(null); }} people={people} onSaved={() => void load()} />
          <DeleteDialog
            open={pendingDelete !== null}
            onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
            name={pendingDelete ? pendingDelete.id : "المهمة"}
            description={pendingDelete ? `سيؤدي هذا إلى حذف «${pendingDelete.title}» نهائياً.` : undefined}
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
        </>
      )}
    </div>
  );
}
