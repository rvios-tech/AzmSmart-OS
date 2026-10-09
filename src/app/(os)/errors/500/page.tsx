import type { Metadata } from "next";
import { IconAlertTriangle, IconReload } from "@tabler/icons-react";

import { ErrorState } from "@/components/error-state";

export const metadata: Metadata = {
  title: "حدث خطأ ما",
  description: "وقع خطأ غير متوقع لدينا.",
};

export default function ServerErrorPage() {
  return (
    <ErrorState
      code="500"
      title="حدث خطأ غير متوقع لدينا"
      description="وقع خطأ أثناء معالجة طلبك، وقد تم إبلاغ فريقنا. يرجى المحاولة مرة أخرى بعد قليل."
      icon={IconAlertTriangle}
      secondaryHref="/errors/500"
      secondaryLabel="إعادة المحاولة"
      secondaryIcon={IconReload}
    />
  );
}
