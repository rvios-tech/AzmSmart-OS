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
