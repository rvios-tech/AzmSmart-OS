"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowLeft, IconDeviceFloppy, IconLoader2 } from "@tabler/icons-react";

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
import { ApiError } from "@/lib/api/client";
import { createClient } from "@/lib/api/clients";

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();

    setSaving(true);
    try {
      const client = await createClient({
        name,
        phone: emptyToUndefined(form.get("phone")),
        email: emptyToUndefined(form.get("email")),
        address: emptyToUndefined(form.get("address")),
        city: emptyToUndefined(form.get("city")),
        taxNumber: emptyToUndefined(form.get("taxNumber")),
      });
      toast.success("تم إنشاء العميل", {
        description: `أُضيف ${client.name} إلى دليل العملاء.`,
      });
      router.push(`/customers/${client.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إنشاء العميل.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="size-4" /> العودة إلى العملاء
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader title="إضافة عميل" description="أنشئ سجل عميل جديد.">
          <Button variant="outline" asChild>
            <Link href="/customers">إلغاء</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-4" />
            )}
            حفظ العميل
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>بيانات العميل</CardTitle>
            <CardDescription>الاسم وطرق التواصل مع هذا العميل.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" name="name" placeholder="شركة أحمد للتجارة" required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" name="phone" type="tel" dir="ltr" className="text-start" placeholder="777123456" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" dir="ltr" className="text-start" placeholder="ahmed@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input id="city" name="city" placeholder="صنعاء" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">الرقم الضريبي</Label>
              <Input id="taxNumber" name="taxNumber" dir="ltr" className="text-start" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">العنوان</Label>
              <Input id="address" name="address" placeholder="شارع الزبيري، صنعاء" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href="/customers">إلغاء</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-4" />
            )}
            حفظ العميل
          </Button>
        </div>
      </form>
    </div>
  );
}

function emptyToUndefined(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s || undefined;
}
