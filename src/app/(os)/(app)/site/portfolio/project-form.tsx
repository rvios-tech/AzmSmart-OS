"use client";

import { useEffect, useState } from "react";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/image-uploader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProjectCategory,
  listProjectCategories,
  listServices,
  METRIC_DIRECTION,
  PROJECT_STATUS,
  type CmsProject,
  type CmsProjectCategory,
  type CmsService,
  type ProjectImage,
  type ProjectInput,
  type ProjectMetric,
} from "@/lib/api/cms";

export function slugify(input: string): string {
  return input.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-").replace(/-+/g, "-");
}

export type ProjectFormValues = ProjectInput;

function toFormValues(p?: CmsProject): ProjectFormValues {
  if (!p) {
    return {
      slug: "",
      title: "",
      summary: "",
      description: "",
      status: PROJECT_STATUS.DRAFT,
      featured: false,
      gallery: [],
      metrics: [],
      serviceIds: [],
    };
  }
  return {
    slug: p.slug,
    title: p.title,
    titleEn: p.titleEn ?? undefined,
    summary: p.summary,
    description: p.description,
    challenge: p.challenge ?? undefined,
    solution: p.solution ?? undefined,
    outcome: p.outcome ?? undefined,
    client: p.client ?? undefined,
    industry: p.industry ?? undefined,
    year: p.year ?? undefined,
    categoryId: p.categoryId ?? undefined,
    serviceIds: p.services.map((s) => s.serviceId),
    coverImageUrl: p.coverImageUrl ?? undefined,
    gallery: p.gallery.map((g) => ({ url: g.url, order: g.order })),
    metrics: p.metrics.map((m) => ({ label: m.label, value: m.value, unit: m.unit ?? undefined, direction: m.direction, order: m.order })),
    liveUrl: p.liveUrl ?? undefined,
    repoUrl: p.repoUrl ?? undefined,
    featured: p.featured,
    order: p.order,
    status: p.status,
  };
}

export function ProjectForm({
  initial,
  submitLabel,
  saving,
  onSubmit,
}: {
  initial?: CmsProject;
  submitLabel: string;
  saving: boolean;
  onSubmit: (values: ProjectFormValues) => void;
}) {
  const [values, setValues] = useState<ProjectFormValues>(() => toFormValues(initial));
  const [categories, setCategories] = useState<CmsProjectCategory[]>([]);
  const [services, setServices] = useState<CmsService[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    listProjectCategories().then(setCategories).catch(() => undefined);
    listServices().then(setServices).catch(() => undefined);
  }, []);

  function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const gallery = values.gallery ?? [];
  const metrics = values.metrics ?? [];
  const serviceIds = values.serviceIds ?? [];

  function updateGallery(i: number, patch: Partial<Omit<ProjectImage, "id">>) {
    update("gallery", gallery.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }
  function addGalleryRow() {
    update("gallery", [...gallery, { url: "", order: gallery.length }]);
  }
  function addGalleryImage(url: string) {
    update("gallery", [...gallery, { url, order: gallery.length }]);
  }
  function removeGalleryRow(i: number) {
    update("gallery", gallery.filter((_, idx) => idx !== i));
  }

  function updateMetric(i: number, patch: Partial<Omit<ProjectMetric, "id">>) {
    update("metrics", metrics.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function addMetricRow() {
    update("metrics", [...metrics, { label: "", value: "", direction: METRIC_DIRECTION.UP, order: metrics.length }]);
  }
  function removeMetricRow(i: number) {
    update("metrics", metrics.filter((_, idx) => idx !== i));
  }

  function toggleService(id: string) {
    update("serviceIds", serviceIds.includes(id) ? serviceIds.filter((s) => s !== id) : [...serviceIds, id]);
  }

  async function ensureCategoryId(): Promise<string | undefined> {
    if (values.categoryId) return values.categoryId;
    const name = newCategoryName.trim();
    if (!name) return undefined;
    const category = await createProjectCategory({ name, nameEn: name, slug: slugify(name) });
    setCategories((prev) => [...prev, category]);
    update("categoryId", category.id);
    return category.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const categoryId = await ensureCategoryId();
    onSubmit({
      ...values,
      categoryId,
      slug: values.slug || slugify(values.title),
      gallery: gallery.filter((g) => g.url.trim()),
      metrics: metrics.filter((m) => m.label.trim() && m.value.trim()),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">الأساسيات</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">العنوان</Label>
                <Input
                  id="title"
                  value={values.title}
                  onChange={(e) => update("title", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">الملخّص</Label>
                <Textarea id="summary" value={values.summary} onChange={(e) => update("summary", e.target.value)} rows={2} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">الوصف الكامل</Label>
                <Textarea id="description" value={values.description} onChange={(e) => update("description", e.target.value)} rows={5} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">العميل</Label>
                  <Input id="client" value={values.client ?? ""} onChange={(e) => update("client", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">القطاع</Label>
                  <Input id="industry" value={values.industry ?? ""} onChange={(e) => update("industry", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">القصّة</CardTitle>
              <CardDescription>التحدّي، الحلّ، والنتيجة — تظهر كسرد في صفحة المشروع.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="challenge">التحدّي</Label>
                <Textarea id="challenge" value={values.challenge ?? ""} onChange={(e) => update("challenge", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="solution">الحلّ</Label>
                <Textarea id="solution" value={values.solution ?? ""} onChange={(e) => update("solution", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">النتيجة</Label>
                <Textarea id="outcome" value={values.outcome ?? ""} onChange={(e) => update("outcome", e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">مؤشرات النتائج</CardTitle>
              <CardDescription>أرقام تُعرض كبطاقات — «زيادة التحويل: 32٪».</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_5rem_4rem_2rem] items-center gap-2">
                  <Input placeholder="التسمية" value={m.label} onChange={(e) => updateMetric(i, { label: e.target.value })} />
                  <Input placeholder="القيمة" value={m.value} onChange={(e) => updateMetric(i, { value: e.target.value })} className="tabular-nums" />
                  <Input placeholder="الوحدة" value={m.unit ?? ""} onChange={(e) => updateMetric(i, { unit: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeMetricRow(i)}>
                    <IconTrash className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addMetricRow}>
                <IconPlus className="size-4" /> إضافة مؤشر
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">معرض الصور</CardTitle>
              <CardDescription>ارفع صورًا من جهازك أو الصق روابط خارجية.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {gallery.map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input dir="ltr" placeholder="https://…" value={g.url} onChange={(e) => updateGallery(i, { url: e.target.value })} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeGalleryRow(i)}>
                    <IconTrash className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <ImageUploadButton label="رفع صورة" onUploaded={addGalleryImage} />
                <Button type="button" variant="outline" size="sm" onClick={addGalleryRow}>
                  <IconPlus className="size-4" /> إضافة رابط
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">النشر</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select value={String(values.status ?? PROJECT_STATUS.DRAFT)} onValueChange={(v) => update("status", Number(v) as ProjectFormValues["status"])}>
                  <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(PROJECT_STATUS.DRAFT)}>مسودة</SelectItem>
                    <SelectItem value={String(PROJECT_STATUS.PUBLISHED)}>منشور</SelectItem>
                    <SelectItem value={String(PROJECT_STATUS.ARCHIVED)}>مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="featured">مشروع مميّز</Label>
                <Switch id="featured" checked={values.featured ?? false} onCheckedChange={(v) => update("featured", v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">صورة الغلاف</Label>
                <div className="flex gap-2">
                  <Input id="coverImageUrl" dir="ltr" className="flex-1" placeholder="https://…" value={values.coverImageUrl ?? ""} onChange={(e) => update("coverImageUrl", e.target.value)} />
                  <ImageUploadButton label="رفع" onUploaded={(url) => update("coverImageUrl", url)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="liveUrl">رابط المشروع الحي</Label>
                <Input id="liveUrl" dir="ltr" value={values.liveUrl ?? ""} onChange={(e) => update("liveUrl", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">التصنيف</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {categories.length > 0 ? (
                <Select value={values.categoryId ?? ""} onValueChange={(v) => update("categoryId", v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="اختر تصنيفًا" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="لا تصنيفات — اكتب اسم تصنيف جديد" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">الخدمات المقدَّمة</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {services.length === 0 && <p className="text-sm text-muted-foreground">أضف خدمات أولاً من صفحة الخدمات.</p>}
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={serviceIds.includes(s.id)} onCheckedChange={() => toggleService(s.id)} />
                  {s.title}
                </label>
              ))}
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving && <IconLoader2 className="size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
