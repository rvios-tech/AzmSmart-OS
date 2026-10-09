"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconPrinter, IconTrash, IconCash, IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { deleteInvoice, updateInvoice, type ApiInvoice } from "@/lib/api/invoices";

export function InvoiceActions({
  invoice,
  onUpdated,
}: {
  invoice: ApiInvoice;
  onUpdated: (invoice: ApiInvoice) => void;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState(invoice.remainingAmount);
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    try {
      await deleteInvoice(invoice.id);
      router.push("/invoices");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف الفاتورة.");
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const paidAmount = Number(invoice.paidAmount) + Number(amount || 0);
      const updated = await updateInvoice(invoice.id, { paidAmount });
      onUpdated(updated);
      setPayOpen(false);
      toast.success("تم تسجيل الدفعة", {
        description: `المتبقّي الآن ${formatCurrency(Number(updated.remainingAmount))}.`,
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تسجيل الدفعة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={Number(invoice.remainingAmount) <= 0}>
            <IconCash className="size-4" /> تسجيل دفعة
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleRecordPayment}>
            <DialogHeader>
              <DialogTitle>تسجيل دفعة</DialogTitle>
              <DialogDescription>
                المتبقّي حالياً {formatCurrency(Number(invoice.remainingAmount))}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="amount">المبلغ المدفوع</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                max={Number(invoice.remainingAmount)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="tabular-nums"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <IconLoader2 className="size-4 animate-spin" />}
                تأكيد الدفع
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Button variant="outline" onClick={() => window.print()}>
        <IconPrinter className="size-4" /> طباعة
      </Button>

      <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
        <IconTrash className="size-4" /> حذف
      </Button>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        name={`فاتورة ${invoice.invoiceNumber}`}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
