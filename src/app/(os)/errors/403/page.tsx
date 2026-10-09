import type { Metadata } from "next";
import { IconLock, IconLifebuoy } from "@tabler/icons-react";

import { ErrorState } from "@/components/error-state";

export const metadata: Metadata = {
  title: "الوصول مرفوض",
  description: "ليست لديك صلاحية لعرض هذه الصفحة.",
};

export default function ForbiddenPage() {
  return (
    <ErrorState
      code="403"
      title="الوصول مرفوض"
      description="ليست لديك صلاحية لعرض هذه الصفحة. إن كنت تعتقد أن هذا خطأ، فاطلب من مدير مساحة العمل منحك الصلاحية."
      icon={IconLock}
      secondaryHref="/help"
      secondaryLabel="تواصل مع الدعم"
      secondaryIcon={IconLifebuoy}
    />
  );
}
