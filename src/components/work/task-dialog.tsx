"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconSend } from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import {
  TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, addCommentApi, createTaskApi, listCommentsApi, updateTaskApi,
  type TaskComment, type TaskDto,
} from "@/lib/api/work";
import { formatRelativeTime } from "@/lib/format";
import { initials, type WMember, type WTask } from "@/lib/work/view";

const POINTS = [0, 1, 2, 3, 5, 8];
const UNASSIGNED = "none";

/** عرض مهمة وتعديلها مع نقاش التعليقات — تستعمله كل صفحات المهام واللوحات. */
export function TaskDialog({
  task,
  open,
  onOpenChange,
  people,
  onSaved,
}: {
  task: WTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: WMember[];
  onSaved: (task: TaskDto) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("1");
  const [priority, setPriority] = useState("1");
  const [assignee, setAssignee] = useState(UNASSIGNED);
  const [points, setPoints] = useState("0");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !task) return;
    void (async () => {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(String(TASK_STATUS_LABELS.indexOf(task.status)));
      setPriority(String(TASK_PRIORITY_LABELS.indexOf(task.priority)));
      setAssignee(task.assignee?.id ?? UNASSIGNED);
      setPoints(String(task.points));
      setDue(task.due);
      setDraft("");
      setComments(null);
      try {
        setComments(await listCommentsApi(task.uid));
      } catch {
        setComments([]);
      }
    })();
  }, [open, task]);

  if (!task) return null;

  async function save() {
    if (!task) return;
    if (title.trim().length < 2) return toast.error("عنوان المهمة مطلوب");
    setSaving(true);
    try {
      const saved = await updateTaskApi(task.uid, {
        title: title.trim(),
        description,
        status: Number(status),
        priority: Number(priority),
        assigneeId: assignee === UNASSIGNED ? null : assignee,
        points: Number(points),
        dueDate: due || undefined,
      });
      onSaved(saved);
      toast.success("حُفظت المهمة");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  async function send() {
    if (!task || !draft.trim()) return;
    setSending(true);
    try {
      const c = await addCommentApi(task.uid, draft.trim());
      setComments((prev) => [...(prev ?? []), c]);
      setDraft("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إرسال التعليق.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{task.id}</span>
            المهمة
          </DialogTitle>
          <DialogDescription>عدّل التفاصيل أو ناقش الفريق في التعليقات.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="t-title">العنوان</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-desc">الوصف</Label>
            <Textarea id="t-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={4000} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>الحالة</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_STATUS_LABELS.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>الأولوية</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_PRIORITY_LABELS.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>المسؤول</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>غير مُسنَد</SelectItem>
                  {people.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>نقاط الجهد</Label>
              <Select value={points} onValueChange={setPoints}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{POINTS.map((p) => <SelectItem key={p} value={String(p)}>{p === 0 ? "بلا تقدير" : p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-due">الاستحقاق</Label>
              <Input id="t-due" type="date" dir="ltr" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">التعليقات</p>
          {!comments && <IconLoader2 className="size-4 animate-spin text-muted-foreground" />}
          {comments?.length === 0 && <p className="text-sm text-muted-foreground">لا تعليقات بعد.</p>}
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="size-7">
                <AvatarImage src={c.author?.avatar ?? undefined} alt={c.author?.name ?? ""} />
                <AvatarFallback className="text-[10px]">{initials(c.author?.name ?? "؟")}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.author?.name ?? "—"}</span> · {formatRelativeTime(c.createdAt)}
                </p>
                <p className="whitespace-pre-wrap text-sm">{c.body}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="اكتب تعليقًا…" value={draft} maxLength={2000}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
            <Button type="button" variant="outline" size="icon" disabled={sending || !draft.trim()} onClick={() => void send()} aria-label="إرسال">
              <IconSend className="size-4 rtl:-scale-x-100" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving && <IconLoader2 className="size-4 animate-spin" />} حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** إنشاء مهمة جديدة داخل مشروع. */
export function NewTaskDialog({
  open,
  onOpenChange,
  projectId,
  defaultStatus,
  people,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultStatus: number;
  people: WMember[];
  onCreated: (task: TaskDto) => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState(String(defaultStatus));
  const [priority, setPriority] = useState("1");
  const [assignee, setAssignee] = useState(UNASSIGNED);
  const [points, setPoints] = useState("3");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setTitle("");
      setStatus(String(defaultStatus));
      setPriority("1");
      setAssignee(UNASSIGNED);
      setPoints("3");
    })();
  }, [open, defaultStatus]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return toast.error("عنوان المهمة مطلوب");
    setSaving(true);
    try {
      const t = await createTaskApi({
        projectId,
        title: title.trim(),
        status: Number(status),
        priority: Number(priority),
        assigneeId: assignee === UNASSIGNED ? undefined : assignee,
        points: Number(points),
      });
      onCreated(t);
      toast.success("تم إنشاء المهمة", { description: `${t.code} · ${t.title}` });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء المهمة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>مهمة جديدة</DialogTitle>
            <DialogDescription>أضف مهمة إلى لوحة هذا المشروع.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nt-title">العنوان</Label>
              <Input id="nt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: ربط الحالات الفارغة" autoFocus maxLength={160} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>الحالة</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_STATUS_LABELS.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>الأولوية</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{TASK_PRIORITY_LABELS.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>المسؤول</Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGNED}>غير مُسنَد</SelectItem>
                    {people.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>نقاط الجهد</Label>
                <Select value={points} onValueChange={setPoints}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{POINTS.map((p) => <SelectItem key={p} value={String(p)}>{p === 0 ? "بلا تقدير" : p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving}>إنشاء المهمة</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
