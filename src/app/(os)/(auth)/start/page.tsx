"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

import { useAuth } from "@/lib/auth/auth-context";
import { parseDraft, saveDraft } from "@/lib/shop/store-draft";

const NEXT = { register: "/register", login: "/login", forgot: "/forgot-password" } as const;

/**
 * مدخل الطلب القادم من منصة المتاجر: يحفظه ثم ينتقل إلى التسجيل أو الدخول أو استعادة كلمة
 * المرور — والانتقال يمحو الطلب من الرابط. من كان داخلًا أصلًا يكمل طلبه مباشرة.
 */
export default function StartPage() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "loading") return;
    const draft = parseDraft(new URLSearchParams(window.location.hash.slice(1)).get("o") ?? "");
    if (draft) saveDraft(draft);
    else toast.error("تعذّرت قراءة طلب المتجر — أكمله من صفحة «متجر جديد» بعد الدخول.");
    const mode = new URLSearchParams(window.location.search).get("mode") as keyof typeof NEXT | null;
    router.replace(status === "authenticated" ? "/store/new" : (mode && NEXT[mode]) || "/register");
  }, [status, router]);

  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
      <IconLoader2 className="size-4 animate-spin" /> جارٍ تجهيز طلب متجرك…
    </div>
  );
}
