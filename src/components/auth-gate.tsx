"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";

import { useAuth } from "@/lib/auth/auth-context";

/**
 * يحجب لوحة التحكم عن أي طلب بلا جلسة صالحة، ويوجّه إلى تسجيل الدخول.
 * الحماية الحقيقية على الخادم دائمًا (`TenantGuard`) — هذا فقط يمنع
 * وميض واجهة فارغة قبل التوجيه، وليس بديلًا عنها.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex h-svh items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" />
        جارٍ التحقق من الجلسة…
      </div>
    );
  }

  return <>{children}</>;
}
