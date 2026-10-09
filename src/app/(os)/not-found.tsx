import { IconMapPinQuestion, IconLifebuoy } from "@tabler/icons-react";

import { ErrorState } from "@/components/error-state";

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      title="الصفحة غير موجودة"
      description="الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها. تحقق من العنوان، أو عد إلى لوحة التحكم للمتابعة."
      icon={IconMapPinQuestion}
      secondaryHref="/help"
      secondaryLabel="تواصل مع الدعم"
      secondaryIcon={IconLifebuoy}
    />
  );
}
