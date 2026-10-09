"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconPlus, IconTrash, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { listClients, type ApiClient } from "@/lib/api/clients";
import { createInvoice } from "@/lib/api/invoices";

type DraftItem = { id: number; description: string; quantity: number; unitPrice: number };

let nextId = 1;
const newItem = (): DraftItem => ({ id: nextId++, description: "", quantity: 1, unitPrice: 0 });

export default function NewInvoicePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(15);
  const [items, setItems] = useState<DraftItem[]>([newItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listClients().then(setClients).catch(() => undefined);
  }, []);

  const { subtotal, taxAmount, total } = useMemo(() => {
    const subtotal = items.reduce((s, it) => s + (it.quantity || 0) * (it.unitPrice || 0), 0);
    const taxable = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxable * taxPercent) / 100;
    return { subtotal, taxAmount, total: taxable + taxAmount };
  }, [items, discountAmount, taxPercent]);

  function updateItem(id: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  function removeItem(id: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validItems = items
      .filter((it) => it.description.trim() && it.quantity > 0)
      .map((it) => ({ description: it.description.trim(), quantity: it.quantity, unitPrice: it.unitPrice }));

    if (validItems.length === 0) {
      setError("أضف بندًا واحدًا على الأقلّ ببيانات صحيحة.");
      return;
    }

    setSaving(true);
    try {
      const invoice = await createInvoice({
        clientId: clientId || undefined,
        issueDate,
        dueDate: dueDate || undefined,
        items: validItems,
        discountAmount,
        taxPercent,
      });
      toast.success("تم إنشاء الفاتورة", {
        description: `${invoice.invoiceNumber} · ${formatCurrency(Number(invoice.total))}`,
      });
      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إنشاء الفاتورة.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PageHeader title="فاتورة جديدة" description="أنشئ فاتورة جديدة وأضف بنودها.">
        <Button type="button" variant="outline" asChild>
          <Link href="/invoices">إلغاء</Link>
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <IconLoader2 className="size-4 animate-spin" />}
          حفظ الفاتورة
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الفاتورة باسم</CardTitle>
            <CardDescription>اختر العميل وحدّد تواريخ الفاتورة.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="client">العميل</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client" className="w-full">
                  <SelectValue placeholder="اختر عميلاً (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">تاريخ الإصدار</Label>
              <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">مبلغ الخصم</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">نسبة الضريبة %</Label>
              <Input
                id="tax"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="tabular-nums"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الملخص</CardTitle>
            <CardDescription>تتحدّث الإجماليات أثناء التعديل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الخصم</span>
              <span className="font-medium tabular-nums">−{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الضريبة ({taxPercent}٪)</span>
              <span className="font-medium tabular-nums">{formatCurrency(taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-semibold">الإجمالي</span>
              <span className="text-xl font-semibold tracking-tight tabular-nums">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بنود الفاتورة</CardTitle>
          <CardDescription>أضف المنتجات أو الخدمات التي تُصدر الفاتورة مقابلها.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden gap-3 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_5rem_8rem_7rem_2.5rem]">
            <span>الوصف</span>
            <span className="text-end">الكمية</span>
            <span className="text-end">سعر الوحدة</span>
            <span className="text-end">المبلغ</span>
            <span />
          </div>

          {items.map((it) => (
            <div key={it.id} className="grid gap-3 sm:grid-cols-[1fr_5rem_8rem_7rem_2.5rem] sm:items-center">
              <Input
                value={it.description}
                onChange={(e) => updateItem(it.id, { description: e.target.value })}
                placeholder="مثال: خدمة استشارية"
              />
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={it.quantity}
                onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                className="tabular-nums sm:text-end"
                aria-label="الكمية"
              />
              <Input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={it.unitPrice}
                onChange={(e) => updateItem(it.id, { unitPrice: Number(e.target.value) })}
                className="tabular-nums sm:text-end"
                aria-label="سعر الوحدة"
              />
              <div className="flex h-9 items-center justify-end px-1 font-medium tabular-nums sm:h-auto">
                {formatCurrency((it.quantity || 0) * (it.unitPrice || 0))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="justify-self-end text-muted-foreground"
                onClick={() => removeItem(it.id)}
                disabled={items.length === 1}
                aria-label="حذف البند"
              >
                <IconTrash className="size-4" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, newItem()])}>
            <IconPlus className="size-4" /> إضافة بند
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href="/invoices">إلغاء</Link>
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <IconLoader2 className="size-4 animate-spin" />}
          حفظ الفاتورة
        </Button>
      </div>
    </form>
  );
}
