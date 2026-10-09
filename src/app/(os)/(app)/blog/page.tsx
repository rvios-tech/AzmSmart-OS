"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconPlus,
  IconSearch,
  IconEye,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconFileText,
  IconWorld,
  IconClipboardText,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDateShort, formatNumber } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import {
  deletePost,
  listCategories,
  listPosts,
  POST_STATUS,
  POST_STATUS_LABELS,
  type CmsCategory,
  type CmsPost,
  type PostStatus,
} from "@/lib/api/cms";

const statusStyles: Record<PostStatus, string> = {
  [POST_STATUS.PUBLISHED]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  [POST_STATUS.DRAFT]: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

function gradient(a: number, b: number) {
  return `linear-gradient(135deg, var(--chart-${a}), var(--chart-${b}))`;
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BlogPage() {
  const [rows, setRows] = useState<CmsPost[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [posts, cats] = await Promise.all([listPosts(), listCategories()]);
        if (!cancelled) {
          setRows(posts);
          setCategories(cats);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل المقالات.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const deleting = rows.find((p) => p.id === deleteId) ?? null;

  const stats = useMemo(() => {
    const published = rows.filter((p) => p.status === POST_STATUS.PUBLISHED).length;
    const drafts = rows.filter((p) => p.status === POST_STATUS.DRAFT).length;
    const views = rows.reduce((s, p) => s + p.views, 0);
    return { published, drafts, views };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesCategory = categoryId === "all" || p.categoryId === categoryId;
      const matchesStatus = status === "all" || String(p.status) === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [rows, search, categoryId, status]);

  async function handleDelete(id: string) {
    try {
      await deletePost(id);
      setRows((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف المقال.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="المدونة" description="اكتب وانشر مقالات الموقع الرئيسي.">
        <Button asChild>
          <Link href="/blog/new">
            <IconPlus className="size-4" /> مقال جديد
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="منشورة" value={formatNumber(stats.published)} icon={IconWorld} />
        <StatTile label="المسودات" value={formatNumber(stats.drafts)} icon={IconClipboardText} />
        <StatTile label="إجمالي المشاهدات" value={formatNumber(stats.views)} icon={IconEye} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في المقالات…"
            className="ps-9"
          />
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value={String(POST_STATUS.PUBLISHED)}>منشورة</SelectItem>
              <SelectItem value={String(POST_STATUS.DRAFT)}>مسودة</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <IconLoader2 className="size-6 animate-spin" />
            جارٍ تحميل المقالات…
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-destructive">
            <IconAlertTriangle className="size-6" />
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <IconFileText className="size-7 opacity-50" />
            <p>لا توجد مقالات مطابقة للتصفية.</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <Card key={p.id} className="overflow-hidden pt-0">
              <div
                className="relative flex h-40 items-center justify-center"
                style={{ background: gradient((i % 5) + 1, ((i + 2) % 5) + 1) }}
              >
                <span className="select-none text-6xl font-bold text-white/25">
                  {p.title.slice(0, 1)}
                </span>
                <Badge
                  variant="secondary"
                  className={`absolute right-3 top-3 border-transparent shadow-sm backdrop-blur-sm ${statusStyles[p.status]}`}
                >
                  {POST_STATUS_LABELS[p.status]}
                </Badge>
                <Badge
                  variant="secondary"
                  className="absolute bottom-3 start-3 bg-black/30 font-normal text-white backdrop-blur-sm"
                >
                  {p.category.name}
                </Badge>
              </div>
              <CardContent className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/blog/${p.id}`}
                    className="line-clamp-2 font-semibold leading-snug tracking-tight hover:underline"
                  >
                    {p.title}
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-me-2 -mt-1 size-8 shrink-0">
                        <IconDotsVertical className="size-4" />
                        <span className="sr-only">إجراءات المقال</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem asChild>
                        <Link href={`/blog/${p.id}`}>
                          <IconPencil className="size-4" /> تعديل
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleteId(p.id)}>
                        <IconTrash className="size-4" /> حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              </CardContent>
              <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {p.publishedAt ? formatDateShort(p.publishedAt) : formatDateShort(p.createdAt)}
                </p>
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <IconEye className="size-3.5" />
                  {p.views > 0 ? formatNumber(p.views) : "—"}
                </span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        name={deleting?.title ?? "المقال"}
        onConfirm={() => {
          if (deleteId) void handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
