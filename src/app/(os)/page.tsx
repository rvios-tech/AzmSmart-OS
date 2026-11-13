import { redirect } from "next/navigation";

/**
 * لوحة RVIOS OS جزء من منظومة RVIOS لا منتج مستقل: لا صفحة ترحيبية هنا — التعريف بالمنظومة
 * في rvios.com ومنصة المتاجر. الجذر يفتح اللوحة، و`AuthGate` يحوّل غير الداخل إلى الدخول.
 */
export default function Root() {
  redirect("/dashboard");
}
