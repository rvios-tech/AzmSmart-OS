"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconPlus,
  IconLoader2,
  IconAlertTriangle,
  IconBriefcase2,
  IconDotsVertical,
  IconPencil,
  IconTrash,
  IconStarFilled,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  deleteProject,
  listProjects,
  PROJECT_STATUS_LABELS,
  type CmsProject,
  type ProjectStatus,
} from "@/lib/api/cms";

const statusStyles: Record<ProjectStatus, string> = {
  0: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  1: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  2: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function PortfolioPage() {
  const [rows, setRows] = useState<CmsProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "تعذّر تحميل المشاريع."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const deleting = rows.find((p) => p.id === deleteId) ?? null;

  async function handleDelete(id: string) {
    try {
      await deleteProject(id);
      setRows((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف المشروع.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="معرض الأعمال" description="مشاريع الموقع الرئيسي المعروضة للزوار.">
        <Button asChild>
          <Link href="/site/portfolio/new"><IconPlus className="size-4" /> مشروع جديد</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">المشروع</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-10 pe-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" /> جارٍ التحميل…
                </TableCell></TableRow>
              )}
              {!loading && error && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-destructive">
                  <IconAlertTriangle className="mx-auto mb-2 size-6" /> {error}
                </TableCell></TableRow>
              )}
              {!loading && !error && rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="ps-6">
                    <Link href={`/site/portfolio/${p.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                      {p.featured && <IconStarFilled className="size-3.5 text-amber-500" />}
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.client ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.category?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusStyles[p.status]}>
                      {PROJECT_STATUS_LABELS[p.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="pe-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8"><IconDotsVertical className="size-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/site/portfolio/${p.id}`}><IconPencil className="size-4" /> تعديل</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleteId(p.id)}>
                          <IconTrash className="size-4" /> حذف
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !error && rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <IconBriefcase2 className="mx-auto mb-2 size-6 opacity-50" /> لا توجد مشاريع بعد.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        name={deleting?.title ?? "المشروع"}
        onConfirm={() => {
          if (deleteId) void handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
