"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
  IconUsers,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { formatCurrency, formatDateShort, formatNumber } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { deleteClient, listClients, type ApiClient } from "@/lib/api/clients";

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await listClients();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "تعذّر تحميل العملاء.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const deleting = rows.find((c) => c.id === deleteId) ?? null;

  const stats = useMemo(() => {
    const total = rows.length;
    const totalBalance = rows.reduce((sum, c) => sum + Number(c.currentBalance), 0);
    return { total, totalBalance };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q),
    );
  }, [rows, search]);

  async function handleDelete(id: string) {
    try {
      await deleteClient(id);
      setRows((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف العميل.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="العملاء"
        description="إدارة دليل عملائك وأرصدتهم."
      >
        <Button size="sm" asChild>
          <Link href="/customers/new">
            <IconPlus className="size-4" /> إضافة عميل
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryTile label="إجمالي العملاء" value={formatNumber(stats.total)} />
        <SummaryTile
          label="إجمالي الأرصدة"
          value={formatCurrency(stats.totalBalance)}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="flex flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو الهاتف…"
                className="ps-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatNumber(filtered.length)} عميل
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">العميل</TableHead>
                  <TableHead>الهاتف</TableHead>
                  <TableHead>المدينة</TableHead>
                  <TableHead className="text-start">الرصيد</TableHead>
                  <TableHead>تاريخ الإضافة</TableHead>
                  <TableHead className="w-10 pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" />
                      جارٍ تحميل العملاء…
                    </TableCell>
                  </TableRow>
                )}

                {!loading && error && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-destructive">
                      <IconAlertTriangle className="mx-auto mb-2 size-6" />
                      {error}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error &&
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="ps-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback>{c.name.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/customers/${c.id}`}
                              className="font-medium hover:underline"
                            >
                              {c.name}
                            </Link>
                            {c.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {c.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.city ?? "—"}
                      </TableCell>
                      <TableCell className="text-start font-medium tabular-nums">
                        {formatCurrency(Number(c.currentBalance))}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDateShort(c.createdAt)}
                      </TableCell>
                      <TableCell className="pe-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <IconDotsVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${c.id}`}>
                                <IconEye className="size-4" /> عرض
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/customers/${c.id}/edit`}>
                                <IconPencil className="size-4" /> تعديل
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setDeleteId(c.id)}
                            >
                              <IconTrash className="size-4" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && !error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <IconUsers className="mx-auto mb-2 size-6 opacity-50" />
                      لا يوجد عملاء يطابقون البحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        name={deleting?.name ?? "عميل"}
        onConfirm={() => {
          if (deleteId) void handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
