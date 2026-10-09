import { PageHeader } from "@/components/page-header";
import { EmptyStatesGrid } from "./empty-states-grid";

export const metadata = { title: "الحالات الفارغة" };

export default function EmptyStatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="الحالات الفارغة"
        description="حالات متسقة ومتوافقة مع الهوية لشاشات انعدام البيانات وغياب النتائج والأخطاء."
      />

      <EmptyStatesGrid />
    </div>
  );
}
