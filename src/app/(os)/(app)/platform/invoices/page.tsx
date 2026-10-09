"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconFileInvoice,
  IconLoader2,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconPlus,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateShort, formatNumber } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import {
  listPlatformInvoices,
  reviewPlatformInvoice,
  createPlatformInvoice,
  listOrganizations,
  PLATFORM_INVOICE_STATUS_LABELS,
  INVOICE_KIND_LABELS,
  PAY_METHOD_NAMES,
  SHOP_PLAN_LABELS,
  type PlatformInvoice,
  type PlatformOrganization,
} from "@/lib/api/platform";

const statusStyles = [
  "bg-amber-500/10 text-amber-600 dark:text-amber-400", // بانتظار الدفع
  "bg-blue-500/10 text-blue-600 dark:text-blue-400", // قيد المراجعة
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", // مدفوعة
  "bg-rose-500/10 text-rose-600 dark:text-rose-400", // مرفوضة
];

const tabs = ["الكل", ...PLATFORM_INVOICE_STATUS_LABELS] as const;

export default function PlatformInvoicesPage() {
  const [rows, setRows] = useState<PlatformInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("الكل");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const [amount, setAmount] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [invoices, orgs] = await Promise.all([listPlatformInvoices(), listOrganizations()]);
        if (!cancelled) {
          setRows(invoices);
          setOrganizations(orgs);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر تحميل الفواتير.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const invoice = await createPlatformInvoice({
        companyId,
        amount: Number(amount),
        periodStart,
        periodEnd,
      });
      setRows((prev) => [invoice, ...prev]);
      setCreateOpen(false);
      setCompanyId("");
      setAmount("");
      setPeriodStart("");
      setPeriodEnd("");
      toast.success("تم إنشاء الفاتورة", { description: invoice.invoiceNumber });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء الفاتورة.");
    } finally {
      setCreating(false);
    }
  }

  const filtered =
    tab === "الكل" ? rows : rows.filter((r) => PLATFORM_INVOICE_STATUS_LABELS[r.status] === tab);

  async function handleReview(id: string, decision: "paid" | "rejected") {
    setReviewingId(id);
    try {
      const updated = await reviewPlatformInvoice(id, { decision });
      setRows((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast.success(decision === "paid" ? "تم تسجيل الفاتورة كمدفوعة" : "تم رفض الفاتورة");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحديث الفاتورة.");
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="فواتير الاشتراك" description="مراجعة إيصالات التحويل البنكي وتفعيل الاشتراكات.">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <IconPlus className="size-4" /> فاتورة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>فاتورة اشتراك جديدة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="org">الشركة</Label>
                  <Select value={companyId} onValueChange={setCompanyId} required>
                    <SelectTrigger id="org" className="w-full"><SelectValue placeholder="اختر شركة" /></SelectTrigger>
                    <SelectContent>
                      {organizations.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">المبلغ</Label>
                  <Input id="amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="tabular-nums" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="periodStart">بداية الفترة</Label>
                    <Input id="periodStart" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodEnd">نهاية الفترة</Label>
                    <Input id="periodEnd" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={creating || !companyId}>
                  {creating && <IconLoader2 className="size-4 animate-spin" />}
                  إنشاء الفاتورة
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="px-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                {tabs.map((t) => (
                  <TabsTrigger key={t} value={t}>{t}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الفاتورة</TableHead>
                  <TableHead>الشركة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الدفع</TableHead>
                  <TableHead className="text-start">المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="pe-6 w-40">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" /> جارٍ التحميل…
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
                  filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="ps-6 font-medium tabular-nums">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>{inv.organization.name}</TableCell>
                      <TableCell>
                        <div>{INVOICE_KIND_LABELS[inv.kind] ?? "اشتراك"}{inv.plan ? ` — ${SHOP_PLAN_LABELS[inv.plan]}` : ""}{inv.months ? ` · ${formatNumber(inv.months)} شهر` : ""}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {formatDateShort(inv.periodStart)} – {formatDateShort(inv.periodEnd)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {inv.method ? PAY_METHOD_NAMES[inv.method] ?? inv.method : "—"}
                        {inv.proofKey && /^https?:\/\//i.test(inv.proofKey) ? (
                          <a href={inv.proofKey} target="_blank" rel="noreferrer noopener" className="block text-xs text-primary underline">
                            عرض الإيصال
                          </a>
                        ) : (
                          inv.proofKey && <span className="block text-xs text-muted-foreground" dir="ltr">{inv.proofKey}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-start font-medium tabular-nums">
                        {formatCurrency(Number(inv.amount))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusStyles[inv.status]}>
                          {PLATFORM_INVOICE_STATUS_LABELS[inv.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="pe-6">
                        {inv.status <= 1 ? (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-emerald-600 hover:text-emerald-600"
                              disabled={reviewingId === inv.id}
                              onClick={() => void handleReview(inv.id, "paid")}
                            >
                              <IconCheck className="size-4" /> دفعت
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              disabled={reviewingId === inv.id}
                              onClick={() => void handleReview(inv.id, "rejected")}
                            >
                              <IconX className="size-4" /> رفض
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {inv.reviewedAt ? `رُوجعت ${formatDateShort(inv.reviewedAt)}` : "—"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && !error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <IconFileInvoice className="mx-auto mb-2 size-6 opacity-50" />
                      لا توجد فواتير.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
