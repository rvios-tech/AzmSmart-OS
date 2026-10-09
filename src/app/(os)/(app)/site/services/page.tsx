"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconPlus,
  IconLoader2,
  IconAlertTriangle,
  IconBriefcase,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";
import { ApiError } from "@/lib/api/client";
import {
  createService,
  deleteService,
  listServices,
  updateService,
  SERVICE_STATUS,
  SERVICE_STATUS_LABELS,
  type CmsService,
} from "@/lib/api/cms";

function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

type Draft = { title: string; titleEn: string; description: string; descriptionEn: string };
const EMPTY_DRAFT: Draft = { title: "", titleEn: "", description: "", descriptionEn: "" };

export default function SiteServicesPage() {
  const [rows, setRows] = useState<CmsService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listServices()
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "تعذّر تحميل الخدمات."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setDialogOpen(true);
  }

  function openEdit(service: CmsService) {
    setEditingId(service.id);
    setDraft({
      title: service.title,
      titleEn: service.titleEn,
      description: service.description,
      descriptionEn: service.descriptionEn,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateService(editingId, draft);
        setRows((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        toast.success("تم حفظ التغييرات");
      } else {
        const created = await createService({ ...draft, slug: slugify(draft.title) });
        setRows((prev) => [...prev, created]);
        toast.success("تمت إضافة الخدمة");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ الخدمة.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(service: CmsService) {
    try {
      const status = service.status === SERVICE_STATUS.ACTIVE ? SERVICE_STATUS.INACTIVE : SERVICE_STATUS.ACTIVE;
      const updated = await updateService(service.id, { status });
      setRows((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تغيير الحالة.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteService(id);
      setRows((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف الخدمة.");
    }
  }

  const deleting = rows.find((s) => s.id === deleteId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="الخدمات" description="خدمات الموقع الرئيسي التي تُعرض للزوار.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <IconPlus className="size-4" /> خدمة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "تعديل الخدمة" : "خدمة جديدة"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="title">العنوان (عربي)</Label>
                    <Input id="title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">العنوان (إنجليزي)</Label>
                    <Input id="titleEn" dir="ltr" value={draft.titleEn} onChange={(e) => setDraft((d) => ({ ...d, titleEn: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">الوصف (عربي)</Label>
                  <Textarea id="description" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={3} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">الوصف (إنجليزي)</Label>
                  <Textarea id="descriptionEn" dir="ltr" value={draft.descriptionEn} onChange={(e) => setDraft((d) => ({ ...d, descriptionEn: e.target.value }))} rows={3} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <IconLoader2 className="size-4 animate-spin" />}
                  {editingId ? "حفظ التغييرات" : "إضافة الخدمة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading && (
        <Card><CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <IconLoader2 className="size-6 animate-spin" /> جارٍ التحميل…
        </CardContent></Card>
      )}

      {!loading && error && (
        <Card><CardContent className="flex items-center justify-center gap-2 py-16 text-destructive">
          <IconAlertTriangle className="size-6" /> {error}
        </CardContent></Card>
      )}

      {!loading && !error && rows.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <IconBriefcase className="size-7 opacity-50" />
          <p>لا توجد خدمات بعد.</p>
        </CardContent></Card>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold tracking-tight">{s.title}</p>
                    <p className="text-xs text-muted-foreground" dir="ltr">{s.titleEn}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0">
                        <IconDotsVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEdit(s)}>
                        <IconPencil className="size-4" /> تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void toggleStatus(s)}>
                        {s.status === SERVICE_STATUS.ACTIVE ? "تعطيل" : "تفعيل"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteId(s.id)}>
                        <IconTrash className="size-4" /> حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                <Badge
                  variant="secondary"
                  className={s.status === SERVICE_STATUS.ACTIVE ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/10 text-slate-600"}
                >
                  {SERVICE_STATUS_LABELS[s.status]}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        name={deleting?.title ?? "الخدمة"}
        onConfirm={() => {
          if (deleteId) void handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
