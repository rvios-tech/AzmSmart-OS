"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  IconArrowLeft,
  IconMail,
  IconPhone,
  IconMapPin,
  IconReceipt,
  IconId,
  IconCalendar,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { CustomerActions } from "./customer-actions";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { getClient, type ApiClient } from "@/lib/api/clients";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<ApiClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const c = await getClient(params.id);
        if (!cancelled) setCustomer(c);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? "لم يتم العثور على هذا العميل."
              : "تعذّر تحميل بيانات العميل.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
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

  if (error || !customer) {
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
            <IconAlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-lg font-medium">
              {error ?? "لم يتم العثور على العميل"}
            </p>
            <Button className="mt-6" asChild>
              <Link href="/customers">العودة إلى العملاء</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = customer.name.slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-9 shrink-0" asChild>
            <Link href="/customers">
              <IconArrowLeft className="size-4" />
              <span className="sr-only">العودة إلى العملاء</span>
            </Link>
          </Button>
          <div className="space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              عميل منذ {formatDateShort(customer.createdAt)}
            </p>
          </div>
        </div>
        <CustomerActions id={customer.id} name={customer.name} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="size-20 rounded-xl">
                  <AvatarFallback className="rounded-xl text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-lg font-semibold tracking-tight">
                    {customer.name}
                  </p>
                  {customer.email && (
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                  )}
                </div>
              </div>

              <Separator />

              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                <MetaRow icon={IconMail} label="البريد الإلكتروني" value={customer.email ?? "—"} />
                <MetaRow icon={IconPhone} label="الهاتف" value={customer.phone ?? "—"} />
                <MetaRow icon={IconMapPin} label="العنوان" value={[customer.address, customer.city].filter(Boolean).join("، ") || "—"} />
                <MetaRow icon={IconId} label="الرقم الضريبي" value={customer.taxNumber ?? "—"} mono />
                <MetaRow icon={IconCalendar} label="تاريخ الإضافة" value={formatDateShort(customer.createdAt)} />
                <MetaRow icon={IconId} label="معرّف العميل" value={customer.id} mono />
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">الرصيد الحالي</p>
                <IconReceipt className="size-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(Number(customer.currentBalance))}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={mono ? "truncate text-sm font-medium tabular-nums" : "truncate text-sm font-medium"}>
          {value}
        </dd>
      </div>
    </div>
  );
}
