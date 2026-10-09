"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconDeviceFloppy, IconLoader2, IconWorld, IconX } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import {
  createCategory,
  createPost,
  listCategories,
  POST_STATUS,
  type CmsCategory,
  type PostStatus,
} from "@/lib/api/cms";

/**
 * يبني رابطًا من العنوان — يحتفظ بالحروف العربية عمدًا. أغلب عناوين
 * هذا الموقع عربية، وفرض تحويلها لاتينيًا يعني رابطًا لا يفهمه أحد.
 */
function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export default function NewPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => undefined);
  }, []);

  async function ensureCategoryId(): Promise<string> {
    if (categoryId) return categoryId;
    const name = newCategoryName.trim();
    if (!name) throw new ApiError(0, "اختر فئة أو أنشئ فئة جديدة أولاً.");
    const category = await createCategory({ name, nameEn: name, slug: slugify(name) });
    setCategories((prev) => [...prev, category]);
    setCategoryId(category.id);
    return category.id;
  }

  async function save(status: PostStatus) {
    setError(null);
    if (!title.trim()) {
      setError("العنوان مطلوب.");
      return;
    }
    setSaving(true);
    try {
      const catId = await ensureCategoryId();
      const post = await createPost({
        title: title.trim(),
        slug: slugify(title),
        description: description.trim() || title.trim(),
        content: content.trim() || title.trim(),
        metaDescription: (description.trim() || title.trim()).slice(0, 160),
        categoryId: catId,
        status,
      });
      toast.success(status === POST_STATUS.PUBLISHED ? "تم نشر المقال" : "تم حفظ المسودة", {
        description: post.title,
      });
      router.push(`/blog/${post.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ المقال.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مقال جديد" description="اكتب مسودة مقالك ثم انشره في مدونتك.">
        <Button variant="outline" asChild>
          <Link href="/blog">
            <IconX className="size-4" /> إلغاء
          </Link>
        </Button>
        <Button onClick={() => void save(POST_STATUS.PUBLISHED)} disabled={saving}>
          {saving ? <IconLoader2 className="size-4 animate-spin" /> : <IconWorld className="size-4" />}
          نشر
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="sr-only">العنوان</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان المقال"
                  className="h-auto border-0 px-0 py-1 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-3xl dark:bg-transparent"
                />
              </div>
              <Separator />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ابدأ كتابة مقالك…"
                rows={18}
                className="resize-none border-0 px-0 text-base leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">المقتطف</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ملخص قصير يظهر في المعاينات ونتائج البحث…"
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">إعدادات المقال</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                {categories.length > 0 ? (
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger id="category" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="category"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="لا توجد فئات بعد — اكتب اسم فئة جديدة"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button onClick={() => void save(POST_STATUS.PUBLISHED)} disabled={saving}>
              {saving ? <IconLoader2 className="size-4 animate-spin" /> : <IconWorld className="size-4" />}
              نشر المقال
            </Button>
            <Button variant="outline" onClick={() => void save(POST_STATUS.DRAFT)} disabled={saving}>
              {saving ? <IconLoader2 className="size-4 animate-spin" /> : <IconDeviceFloppy className="size-4" />}
              حفظ المسودة
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
