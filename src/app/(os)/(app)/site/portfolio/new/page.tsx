"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { ApiError } from "@/lib/api/client";
import { createProject } from "@/lib/api/cms";
import { ProjectForm } from "../project-form";

export default function NewProjectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(values: Parameters<typeof createProject>[0]) {
    setSaving(true);
    try {
      const project = await createProject(values);
      toast.success("تم إنشاء المشروع", { description: project.title });
      router.push(`/site/portfolio/${project.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء المشروع.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/site/portfolio" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى معرض الأعمال
      </Link>
      <PageHeader title="مشروع جديد" description="أضف مشروعًا إلى معرض أعمال الموقع الرئيسي." />
      <ProjectForm submitLabel="إنشاء المشروع" saving={saving} onSubmit={handleSubmit} />
    </div>
  );
}
