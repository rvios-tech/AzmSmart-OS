"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";

import { useWorkspace } from "@/lib/workspace/workspace-context";

/**
 * يحجب صفحات إدارة المنصة عن غير فريق RVIOS. المستخدم مُصادَق عليه لكنه
 * غير مخوَّل لهذا القسم، فيُوجَّه إلى لوحته لا إلى الدخول (٤٠٣ لا ٤٠١).
 * الحماية الفعلية في الباكند (`@PlatformOnly`) — هذا لمنع وميض واجهة فارغة.
 */
export function PlatformGate({ children }: { children: React.ReactNode }) {
  const { status, isPlatform } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && !isPlatform) router.replace("/dashboard");
  }, [status, isPlatform, router]);

  if (status !== "ready" || !isPlatform) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" /> جارٍ التحقّق من الصلاحية…
      </div>
    );
  }
  return <>{children}</>;
}
