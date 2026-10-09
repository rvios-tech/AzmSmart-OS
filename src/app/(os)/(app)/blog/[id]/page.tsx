"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconDeviceFloppy,
  IconLoader2,
  IconWorld,
  IconArrowRight,
  IconAlertTriangle,
  IconTrash,
} from "@tabler/icons-react";

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
import { DeleteDialog } from "@/components/delete-dialog";
import { ApiError } from "@/lib/api/client";
import {
  deletePost,
  getPost,
  listCategories,
  updatePost,
  POST_STATUS,
  type CmsCategory,
  type CmsPost,
} from "@/lib/api/cms";

export default function EditPostPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [post, setPost] = useState<CmsPost | null>(null);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<string>("0");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPost(params.id), listCategories()])
      .then(([p, cats]) => {
        if (cancelled) return;
        setPost(p);
        setCategories(cats);
        setTitle(p.title);
        setDescription(p.description);
        setContent(p.content);
        setCategoryId(p.categoryId);
        setStatus(String(p.status));
      })
      .catch(() => {
        if (!cancelled) setError("لم يتم العثور على هذا المقال.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSave() {
    if (!post) return;
    setSaving(true);
    try {
      const updated = await updatePost(post.id, {
        title,
        description,
        content,
        metaDescription: description.slice(0, 160) || title.slice(0, 160),
        categoryId,
        status: Number(status) as 0 | 1,
      });
      setPost(updated);
      toast.success("تم حفظ التغييرات");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ التغييرات.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post) return;
    try {
      await deletePost(post.id);
      router.push("/blog");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف المقال.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <IconArrowRight className="size-4" /> العودة إلى المدونة
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <IconAlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-lg font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى المدونة
      </Link>

      <PageHeader title="تعديل المقال" description={`آخر تحديث: ${post.updatedAt.slice(0, 10)}`}>
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
          <IconTrash className="size-4" /> حذف
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? <IconLoader2 className="size-4 animate-spin" /> : <IconDeviceFloppy className="size-4" />}
          حفظ التغييرات
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان المقال"
                className="h-auto border-0 px-0 py-1 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-3xl dark:bg-transparent"
              />
              <Separator />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                className="resize-none border-0 px-0 text-base leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">المقتطف</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">إعدادات المقال</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">الحالة</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={String(POST_STATUS.DRAFT)}>مسودة</SelectItem>
                    <SelectItem value={String(POST_STATUS.PUBLISHED)}>منشورة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div>
                  <p className="text-xs">المشاهدات</p>
                  <p className="font-medium tabular-nums text-foreground">{post.views}</p>
                </div>
                <div>
                  <p className="text-xs">تاريخ النشر</p>
                  <p className="font-medium tabular-nums text-foreground">
                    {post.publishedAt ? post.publishedAt.slice(0, 10) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <IconLoader2 className="size-4 animate-spin" /> : <IconWorld className="size-4" />}
            حفظ التغييرات
          </Button>
        </div>
      </div>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={post.title}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
