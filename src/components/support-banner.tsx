"use client";

import { IconArrowBackUp, IconHeadset } from "@tabler/icons-react";

import { endSupport } from "@/lib/auth/support";
import { useWorkspace } from "@/lib/workspace/workspace-context";

/** شريط جلسة الدعم: يذكّر الموظف أنه يعمل داخل لوحة شركة أخرى، ويعيده بنقرة. */
export function SupportBanner() {
  const { ctx } = useWorkspace();
  if (!ctx?.support) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      <span className="inline-flex items-center gap-1.5">
        <IconHeadset className="size-4" /> تدير «{ctx.company?.name}» كفريق RVIOS — كل تعديل يُطبَّق على حساب العميل مباشرة.
      </span>
      <button
        type="button"
        onClick={endSupport}
        className="inline-flex items-center gap-1 rounded-full bg-amber-950/10 px-3 py-0.5 hover:bg-amber-950/20"
      >
        <IconArrowBackUp className="size-4" /> العودة إلى لوحة المنصة
      </button>
    </div>
  );
}
