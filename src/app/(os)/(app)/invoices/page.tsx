"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconEye,
  IconTrash,
  IconFileInvoice,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  deleteInvoice,
  listInvoices,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  type ApiInvoice,
  type InvoiceStatus,
} from "@/lib/api/invoices";

const statusStyles: Record<InvoiceStatus, string> = {
  [INVOICE_STATUS.DRAFT]: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  [INVOICE_STATUS.SENT]: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  [INVOICE_STATUS.PARTIALLY_PAID]: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  [INVOICE_STATUS.PAID]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  [INVOICE_STATUS.OVERDUE]: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  [INVOICE_STATUS.VOID]: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

const tabs = ["الكل", ...Object.values(INVOICE_STATUS_LABELS)] as const;

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

export default function InvoicesPage() {
  const [rows, setRows] = useState<ApiInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("الكل");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listInvoices()
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل الفواتير.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const outstanding = rows
      .filter((v) => v.status === INVOICE_STATUS.SENT || v.status === INVOICE_STATUS.OVERDUE || v.status === INVOICE_STATUS.PARTIALLY_PAID)
      .reduce((s, v) => s + Number(v.remainingAmount), 0);
    const paid = rows
      .filter((v) => v.status === INVOICE_STATUS.PAID)
      .reduce((s, v) => s + Number(v.total), 0);
    const overdue = rows.filter((v) => v.status === INVOICE_STATUS.OVERDUE).length;
    const drafts = rows.filter((v) => v.status === INVOICE_STATUS.DRAFT).length;
    return { outstanding, paid, overdue, drafts };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((v) => {
      const matchesTab = tab === "الكل" || INVOICE_STATUS_LABELS[v.status] === tab;
      const matchesSearch = !q || v.invoiceNumber.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [rows, search, tab]);

  const pendingDelete = rows.find((v) => v.id === deleteId) ?? null;

  async function handleDelete(id: string) {
    try {
      await deleteInvoice(id);
      setRows((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف الفاتورة.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الفواتير" description="إنشاء وتتبّع فواتيرك.">
        <Button size="sm" asChild>
          <Link href="/invoices/new">
            <IconPlus className="size-4" /> فاتورة جديدة
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile label="مستحقة" value={formatCurrency(stats.outstanding)} />
        <SummaryTile label="مدفوعة" value={formatCurrency(stats.paid)} />
        <SummaryTile label="متأخرة" value={formatNumber(stats.overdue)} />
        <SummaryTile label="مسودات" value={formatNumber(stats.drafts)} />
      </div>

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="flex flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="overflow-x-auto sm:overflow-visible">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  {tabs.map((t) => (
                    <TabsTrigger key={t} value={t}>
                      {t}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم الفاتورة…"
                className="ps-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الفاتورة</TableHead>
                  <TableHead>تاريخ الإصدار</TableHead>
                  <TableHead>تاريخ الاستحقاق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-start">الإجمالي</TableHead>
                  <TableHead className="text-start">المتبقي</TableHead>
                  <TableHead className="w-10 pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" /> جارٍ تحميل الفواتير…
                    </TableCell>
                  </TableRow>
                )}

                {!loading && error && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-destructive">
                      <IconAlertTriangle className="mx-auto mb-2 size-6" /> {error}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error &&
                  filtered.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="ps-6">
                        <Link href={`/invoices/${v.id}`} className="font-medium tabular-nums hover:underline">
                          {v.invoiceNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDateShort(v.issueDate)}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {v.dueDate ? formatDateShort(v.dueDate) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusStyles[v.status]}>
                          {INVOICE_STATUS_LABELS[v.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-start font-medium tabular-nums">
                        {formatCurrency(Number(v.total))}
                      </TableCell>
                      <TableCell className="text-start tabular-nums text-muted-foreground">
                        {formatCurrency(Number(v.remainingAmount))}
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
                              <Link href={`/invoices/${v.id}`}>
                                <IconEye className="size-4" /> عرض
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteId(v.id)}>
                              <IconTrash className="size-4" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && !error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <IconFileInvoice className="mx-auto mb-2 size-6 opacity-50" /> لا توجد فواتير تطابق البحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DeleteDialog
        open={deleteId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        name={pendingDelete ? `فاتورة ${pendingDelete.invoiceNumber}` : "فاتورة"}
        onConfirm={() => {
          if (deleteId) void handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
