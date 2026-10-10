"use client";

import { useRouter } from "next/navigation";
import { IconEye } from "@tabler/icons-react";

import { isDemoCompany } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/auth-context";

/** شريط أعلى لوحة التحكم في العرض التجريبي — يذكّر أنه للمشاهدة ويدعو لإنشاء حساب. */
export function DemoBanner() {
  const { company, logout } = useAuth();
  const router = useRouter();
  if (!isDemoCompany(company)) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b bg-primary px-4 py-2 text-center text-sm text-primary-foreground">
      <span className="inline-flex items-center gap-1.5"><IconEye className="size-4" /> أنت في العرض التجريبي — تصفّح كل شيء، والتعديل معطّل.</span>
      <button
        type="button"
        onClick={() => { logout(); router.push("/register"); }}
        className="rounded-full bg-primary-foreground/15 px-3 py-0.5 font-medium underline-offset-4 hover:bg-primary-foreground/25"
      >
        أنشئ حسابك مجانًا
      </button>
    </div>
  );
}
