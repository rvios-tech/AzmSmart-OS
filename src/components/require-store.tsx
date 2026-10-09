"use client";

import Link from "next/link";
import {
  IconAlertTriangle,
  IconBuildingStore,
  IconLoader2,
  IconLock,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/shop/store-context";
import type { Store } from "@/lib/api/shop";

/**
 * بوّابة صفحات التجارة: تضمن متجرًا نشطًا قبل رسم المحتوى، وتعرض الحالة
 * المناسبة بدله (تحميل، خطأ، لا متجر بعد، متجر موقوف). المحتوى دالة تستلم
 * المتجر مضمونًا غير فارغ — فلا تتحقق كل صفحة بنفسها.
 */
export function RequireStore({
  children,
  allowSuspended = false,
}: {
  children: (store: Store) => React.ReactNode;
  /** الصفحات القرائية تبقى متاحة لمتجر موقوف؛ الكتابة يمنعها الخادم. */
  allowSuspended?: boolean;
}) {
  const { status, error, store } = useStore();

  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
      </div>
    );
  }

  if (status === "error") {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <IconAlertTriangle className="mx-auto mb-2 size-6 text-destructive" />
          <p className="font-medium">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!store) {
    return (
      <Card>
        <CardContent className="space-y-4 py-16 text-center">
          <IconBuildingStore className="mx-auto size-10 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-lg font-semibold">لم تُنشئ متجرك بعد</p>
            <p className="text-sm text-muted-foreground">
              أنشئ متجرك الأول ليصير لك رابط خاص وكتالوج وطلبات.
            </p>
          </div>
          <Button asChild>
            <Link href="/store/new">أنشئ متجرك</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (store.status === 1 && !allowSuspended) {
    return (
      <Card>
        <CardContent className="space-y-2 py-16 text-center">
          <IconLock className="mx-auto size-8 text-muted-foreground" />
          <p className="text-lg font-semibold">هذا المتجر موقوف</p>
          <p className="text-sm text-muted-foreground">
            أوقفته الإدارة مؤقتًا. تواصل مع الدعم لرفع الإيقاف.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children(store)}</>;
}
