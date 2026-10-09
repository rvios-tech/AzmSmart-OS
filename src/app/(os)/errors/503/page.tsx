import type { Metadata } from "next";
import { IconServerBolt, IconActivityHeartbeat } from "@tabler/icons-react";

import { ErrorState } from "@/components/error-state";

export const metadata: Metadata = {
  title: "الخدمة غير متاحة",
  description: "الخدمة غير متاحة مؤقتاً.",
};

export default function ServiceUnavailablePage() {
  return (
    <ErrorState
      code="503"
      title="الخدمة غير متاحة مؤقتاً"
      description="نجري بعض أعمال الصيانة أو نتعامل مع ضغط عالٍ في الوقت الحالي. ستعود الخدمة قريباً — يرجى المحاولة بعد دقائق."
      icon={IconServerBolt}
      secondaryHref="/maintenance"
      secondaryLabel="صفحة حالة النظام"
      secondaryIcon={IconActivityHeartbeat}
    />
  );
}
