"use client";

import { useSyncExternalStore } from "react";
import { IconBuildingStore } from "@tabler/icons-react";

import { readDraft } from "@/lib/shop/store-draft";

const noop = () => () => {};
/** `null` = لا طلب. نصّ لا كائن: اللقطة تُقارن بالمساواة، وكائن جديد كل مرة يعيد الرسم بلا نهاية */
const draftName = () => {
  const d = readDraft();
  return d ? d.name : null;
};

/** في صفحات الدخول والتسجيل: يذكّر التاجر بأن طلب متجره محفوظ ويكتمل بعدها */
export function DraftNotice() {
  const name = useSyncExternalStore(noop, draftName, () => null);
  if (name === null) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
      <IconBuildingStore className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>
        طلب متجرك <b>{name || "الجديد"}</b> محفوظ — بعد الدخول نكمله بالقالب والباقة التي اخترتها.
      </p>
    </div>
  );
}
