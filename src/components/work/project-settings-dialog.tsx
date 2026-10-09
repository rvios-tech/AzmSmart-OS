"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  PROJECT_STATUS_LABELS, addMilestoneApi, deleteMilestoneApi, updateMilestoneApi, updateProjectApi,
} from "@/lib/api/work";
import { listTeamMembers, type TeamMember } from "@/lib/api/workspace";
import { formatDateShort } from "@/lib/format";
import type { WProject } from "@/lib/work/view";

const CATEGORIES = ["المنتج", "الهندسة", "التسويق", "البيانات", "الأمن", "التصميم"];

/** إعدادات المشروع: البيانات الأساسية، الفريق، والمعالم. */
export function ProjectSettingsDialog({
  project,
  open,
  onOpenChange,
  onChanged,
}: {
  project: WProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [f, setF] = useState({
    name: "", description: "", status: "0", category: "", startDate: "", dueDate: "", budget: "0", spent: "0", leadId: "",
  });
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [msTitle, setMsTitle] = useState("");
  const [msDate, setMsDate] = useState("");

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setF({
        name: project.name,
        description: project.description,
        status: String(project.statusCode),
        category: project.category,
        startDate: project.start,
        dueDate: project.due,
        budget: String(project.budget),
        spent: String(project.spent),
        leadId: project.lead?.id ?? "",
      });
      setMemberIds(project.members.map((m) => m.id));
      try {
        setTeam((await listTeamMembers()).members.filter((m) => m.isActive));
      } catch {
        setTeam([]);
      }
    })();
    // يُهيَّأ النموذج عند الفتح فقط: تحديث المعالم يعيد تحميل المشروع ولا يجب أن يمسح ما كُتب
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await updateProjectApi(project.id, {
        name: f.name.trim(),
        description: f.description,
        status: Number(f.status),
        category: f.category,
        startDate: f.startDate || undefined,
        dueDate: f.dueDate || undefined,
        budget: Math.max(0, Math.trunc(Number(f.budget) || 0)),
        spent: Math.max(0, Math.trunc(Number(f.spent) || 0)),
        leadId: f.leadId || undefined,
        memberIds,
      });
      toast.success("حُفظت إعدادات المشروع");
      onChanged();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  async function addMs() {
    if (msTitle.trim().length < 2 || !msDate) return toast.error("اكتب اسم المعلم وتاريخه");
    try {
      await addMilestoneApi(project.id, { title: msTitle.trim(), date: msDate });
      setMsTitle("");
      setMsDate("");
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّرت الإضافة.");
    }
  }

  async function toggleMs(id: string, done: boolean) {
    try {
      await updateMilestoneApi(id, { done });
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    }
  }

  async function removeMs(id: string) {
    try {
      await deleteMilestoneApi(id);
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>إعدادات المشروع</DialogTitle>
          <DialogDescription>{project.key} · بياناته وفريقه ومعالمه.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2"><Label>الاسم</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} /></div>
            <div className="grid gap-2">
              <Label>الحالة</Label>
              <Select value={f.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{PROJECT_STATUS_LABELS.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2"><Label>الوصف</Label><Textarea rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={1000} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>التصنيف</Label>
              <Select value={f.category || "none"} onValueChange={(v) => set("category", v === "none" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بلا تصنيف</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>البداية</Label><Input type="date" dir="ltr" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
            <div className="grid gap-2"><Label>الاستحقاق</Label><Input type="date" dir="ltr" value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} /></div>
            <div className="grid gap-2"><Label>الميزانية</Label><Input type="number" min={0} value={f.budget} onChange={(e) => set("budget", e.target.value)} /></div>
            <div className="grid gap-2"><Label>المصروف</Label><Input type="number" min={0} value={f.spent} onChange={(e) => set("spent", e.target.value)} /></div>
            <div className="grid gap-2">
              <Label>القائد</Label>
              <Select value={f.leadId} onValueChange={(v) => set("leadId", v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر" /></SelectTrigger>
                <SelectContent>{team.map((m) => <SelectItem key={m.user.id} value={m.user.id}>{m.user.displayName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>أعضاء المشروع</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {team.map((m) => (
                <label key={m.user.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Checkbox
                    checked={memberIds.includes(m.user.id)}
                    onCheckedChange={(c) =>
                      setMemberIds((p) => (c === true ? [...new Set([...p, m.user.id])] : p.filter((x) => x !== m.user.id)))
                    }
                  />
                  {m.user.displayName}
                </label>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">المعالم</p>
          {project.milestones.length === 0 && <p className="text-sm text-muted-foreground">لا معالم بعد.</p>}
          {project.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
              <Checkbox checked={m.done} onCheckedChange={(c) => void toggleMs(m.id, c === true)} aria-label="منجز" />
              <span className={`flex-1 text-sm ${m.done ? "text-muted-foreground line-through" : ""}`}>{m.title}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatDateShort(m.date)}</span>
              <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => void removeMs(m.id)} aria-label="حذف المعلم">
                <IconTrash className="size-4" />
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Input className="min-w-40 flex-1" placeholder="معلم جديد" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} maxLength={80} />
            <Input className="w-40" type="date" dir="ltr" value={msDate} onChange={(e) => setMsDate(e.target.value)} />
            <Button type="button" variant="outline" onClick={() => void addMs()}><IconPlus className="size-4" /> إضافة</Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          <Button type="button" disabled={saving} onClick={() => void save()}>
            {saving ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />} حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
