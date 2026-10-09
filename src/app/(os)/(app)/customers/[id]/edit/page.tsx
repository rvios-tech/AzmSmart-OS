"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { getClient, updateClient, type ApiClient } from "@/lib/api/clients";

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getClient(params.id)
      .then((c) => {
        if (!cancelled) setCustomer(c);
      })
      .catch(() => {
        if (!cancelled) setError("لم يتم العثور على هذا العميل.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!customer) return;
    setError(null);

    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const updated = await updateClient(customer.id, {
        name: String(form.get("name") ?? "").trim(),
        phone: emptyToUndefined(form.get("phone")),
        email: emptyToUndefined(form.get("email")),
        address: emptyToUndefined(form.get("address")),
        city: emptyToUndefined(form.get("city")),
        taxNumber: emptyToUndefined(form.get("taxNumber")),
      });
      toast.success("تم حفظ التغييرات", { description: `تم تحديث بيانات ${updated.name}.` });
      router.push(`/customers/${updated.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر حفظ التغييرات.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <IconArrowLeft className="size-4" /> العودة إلى العملاء
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-lg font-medium">{error ?? "لم يتم العثور على العميل"}</p>
            <Button className="mt-6" asChild>
              <Link href="/customers">العودة إلى العملاء</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/customers/${customer.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <IconArrowLeft className="size-4" /> العودة إلى {customer.name}
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PageHeader
          title="تعديل بيانات العميل"
          description={`حدّث سجل ${customer.name}`}
        >
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}`}>إلغاء</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-4" />
            )}
            حفظ التغييرات
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
              <Input id="name" name="name" defaultValue={customer.name} required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">الهاتف</Label>
              <Input id="phone" name="phone" type="tel" dir="ltr" className="text-start" defaultValue={customer.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" dir="ltr" className="text-start" defaultValue={customer.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">المدينة</Label>
              <Input id="city" name="city" defaultValue={customer.city ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">الرقم الضريبي</Label>
              <Input id="taxNumber" name="taxNumber" dir="ltr" className="text-start" defaultValue={customer.taxNumber ?? ""} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">العنوان</Label>
              <Input id="address" name="address" defaultValue={customer.address ?? ""} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}`}>إلغاء</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-4" />
            )}
            حفظ التغييرات
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
