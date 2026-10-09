"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight, IconLoader2, IconAlertTriangle, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteDialog } from "@/components/delete-dialog";
import { ApiError } from "@/lib/api/client";
import { deleteProject, getProject, updateProject, type CmsProject } from "@/lib/api/cms";
import { ProjectForm } from "../project-form";

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<CmsProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProject(params.id)
      .then((p) => !cancelled && setProject(p))
      .catch(() => !cancelled && setError("لم يتم العثور على هذا المشروع."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSubmit(values: Parameters<typeof updateProject>[1]) {
    if (!project) return;
    setSaving(true);
    try {
      const updated = await updateProject(project.id, values);
      setProject(updated);
      toast.success("تم حفظ التغييرات");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ التغييرات.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    try {
      await deleteProject(project.id);
      router.push("/site/portfolio");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف المشروع.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link href="/site/portfolio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <IconArrowRight className="size-4" /> العودة إلى معرض الأعمال
        </Link>
        <Card><CardContent className="py-16 text-center">
          <IconAlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
          <p className="text-lg font-medium">{error}</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/site/portfolio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى معرض الأعمال
      </Link>

      <PageHeader title={project.title} description={`المعرّف: ${project.slug}`}>
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
          <IconTrash className="size-4" /> حذف
        </Button>
      </PageHeader>

      <ProjectForm initial={project} submitLabel="حفظ التغييرات" saving={saving} onSubmit={handleSubmit} />

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} name={project.title} onConfirm={() => void handleDelete()} />
    </div>
  );
}
