/** أسماء أدوار الشركة — مطابقة لـ UserRole في الباكند (الأصغر = صلاحية أعلى). */
export const ROLE_LABELS = [
  "مالك",
  "مدير عام",
  "مدير",
  "تنفيذي",
  "مدير موارد بشرية",
  "مدير مالي",
  "مدير قسم",
  "قائد فريق",
  "موظف",
  "ضيف",
] as const;

export const PLATFORM_ROLE_LABELS = ["دعم المنصة", "فوترة المنصة", "مدير المنصة"] as const;

export const COMPANY_PLAN_LABELS = ["تجريبي", "أساسي", "احترافي", "مؤسسي"] as const;

/** أقسام المتجر التي يُحدَّد بها ما يراه الموظف (دون المدير) — مطابقة لـ `shop-sections.ts` في الباكند */
export const SHOP_SECTIONS = [
  { key: "orders", label: "الطلبات", hint: "الطلبات والمرتجعات والسلات المتروكة" },
  { key: "products", label: "المنتجات", hint: "المنتجات والتصنيفات والمخزون والأسئلة والتقييمات وأقسام الرئيسية" },
  { key: "customers", label: "العملاء", hint: "قائمة العملاء ورصيد المكافآت" },
  { key: "marketing", label: "التسويق", hint: "قسائم الخصم" },
  { key: "reports", label: "التقارير والأرباح", hint: "التحليلات والتقارير وسعر التكلفة والأرباح" },
] as const;

/** القسم الذي تتبعه صفحة في القائمة — ما لا يتبع قسمًا يحكمه الدور وحده */
const SECTION_PAGES: Record<string, string[]> = {
  orders: ["/orders", "/returns", "/carts"],
  products: ["/products", "/categories", "/inventory", "/trash", "/questions", "/sections", "/reviews"],
  customers: ["/store/customers"],
  marketing: ["/discounts"],
  reports: ["/dashboard/analytics", "/reports"],
};

export function sectionOfUrl(url: string): string | null {
  for (const [k, list] of Object.entries(SECTION_PAGES)) {
    if (list.some((u) => url === u || url.startsWith(`${u}/`))) return k;
  }
  return null;
}
