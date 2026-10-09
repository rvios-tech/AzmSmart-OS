"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft,
  IconFileInvoice,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceActions } from "./invoice-actions";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { getClient, type ApiClient } from "@/lib/api/clients";
import {
  getInvoice,
  INVOICE_STATUS_LABELS,
  type ApiInvoice,
  type InvoiceStatus,
} from "@/lib/api/invoices";

const statusStyles: Record<InvoiceStatus, string> = {
  0: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  1: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  2: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  3: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  4: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  5: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<ApiInvoice | null>(null);
  const [client, setClient] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getInvoice(params.id)
      .then(async (inv) => {
        if (cancelled) return;
        setInvoice(inv);
        if (inv.clientId) {
          getClient(inv.clientId)
            .then((c) => !cancelled && setClient(c))
            .catch(() => undefined);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? "لم يتم العثور على هذه الفاتورة."
              : "تعذّر تحميل الفاتورة.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft className="size-4" /> العودة إلى الفواتير
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <IconAlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-lg font-medium">{error ?? "لم يتم العثور على الفاتورة"}</p>
            <Button className="mt-6" asChild>
              <Link href="/invoices">العودة إلى الفواتير</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/invoices" aria-label="العودة إلى الفواتير">
              <IconArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight tabular-nums">
                {invoice.invoiceNumber}
              </h1>
              <Badge variant="secondary" className={statusStyles[invoice.status]}>
                {INVOICE_STATUS_LABELS[invoice.status]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              صدرت في {formatDateShort(invoice.issueDate)}
              {invoice.dueDate && ` · تستحق في ${formatDateShort(invoice.dueDate)}`}
            </p>
          </div>
        </div>
        <InvoiceActions invoice={invoice} onUpdated={setInvoice} />
      </div>

      <Card className="mx-auto w-full max-w-3xl overflow-hidden shadow-sm">
        <CardContent className="space-y-8 p-8 sm:p-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <IconFileInvoice className="size-6" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">
                  {client?.name ?? "بلا عميل"}
                </p>
                {client?.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
                {client?.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
              </div>
            </div>

            <div className="sm:text-end">
              <p className="text-3xl font-semibold uppercase tracking-tight">الفاتورة</p>
              <p className="mt-1 font-medium tabular-nums text-muted-foreground">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>

          <Separator />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-9">الوصف</TableHead>
                  <TableHead className="h-9 text-end">الكمية</TableHead>
                  <TableHead className="h-9 text-end">سعر الوحدة</TableHead>
                  <TableHead className="h-9 text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-end tabular-nums text-muted-foreground">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-end tabular-nums text-muted-foreground">
                      {formatCurrency(item.unitPrice)}
                    </TableCell>
                    <TableCell className="text-end font-medium tabular-nums">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span className="font-medium tabular-nums">{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الخصم</span>
                <span className="font-medium tabular-nums">
                  −{formatCurrency(Number(invoice.discountAmount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  الضريبة ({Number(invoice.taxPercent)}٪)
                </span>
                <span className="font-medium tabular-nums">{formatCurrency(Number(invoice.taxAmount))}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-semibold">الإجمالي</span>
                <span className="text-xl font-semibold tracking-tight tabular-nums">
                  {formatCurrency(Number(invoice.total))}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>المدفوع</span>
                <span className="tabular-nums">{formatCurrency(Number(invoice.paidAmount))}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>المتبقي</span>
                <span className="tabular-nums">{formatCurrency(Number(invoice.remainingAmount))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
