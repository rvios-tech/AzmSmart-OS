// ثوابت واجهة المتاجر — تطابق ما يقبله الباكند (`shop.constants.ts`).
// الأسماء العربية للعرض فقط؛ القيم المخزّنة معرّفات لاتينية أو أرقام.

export const COUNTRIES = [
  { code: "YE", name: "اليمن", dial: "967" },
  { code: "SA", name: "السعودية", dial: "966" },
  { code: "EG", name: "مصر", dial: "20" },
  { code: "JO", name: "الأردن", dial: "962" },
  { code: "IQ", name: "العراق", dial: "964" },
  { code: "SD", name: "السودان", dial: "249" },
  { code: "SY", name: "سوريا", dial: "963" },
  { code: "LY", name: "ليبيا", dial: "218" },
  { code: "OM", name: "عُمان", dial: "968" },
  { code: "MA", name: "المغرب", dial: "212" },
  { code: "DZ", name: "الجزائر", dial: "213" },
  { code: "TN", name: "تونس", dial: "216" },
  { code: "LB", name: "لبنان", dial: "961" },
  { code: "PS", name: "فلسطين", dial: "970" },
  { code: "MR", name: "موريتانيا", dial: "222" },
] as const;

export const SECTORS = [
  { id: "fashion", name: "أزياء وملابس وإكسسوارات" },
  { id: "perfumes", name: "عطور وبخور" },
  { id: "beauty", name: "تجميل وعناية شخصية" },
  { id: "electronics", name: "إلكترونيات وأجهزة" },
  { id: "home", name: "أثاث ومستلزمات منزل" },
  { id: "food", name: "أطعمة وحلويات" },
  { id: "jewelry", name: "مجوهرات وساعات" },
  { id: "kids", name: "أطفال ومستلزماتهم" },
  { id: "health", name: "صحة ومكمّلات" },
  { id: "auto", name: "سيارات ودرّاجات وقطع غيار" },
  { id: "stationery", name: "كتب وقرطاسية وهدايا" },
  { id: "hardware", name: "مواد بناء وأدوات ومعدّات" },
  { id: "agriculture", name: "زراعة ومستلزماتها" },
  { id: "handmade", name: "مشغولات يدوية وفنون" },
  { id: "toys", name: "ألعاب وترفيه" },
  { id: "other", name: "أخرى" },
] as const;

/** أسماء الباقات كما في منصة المتاجر: احترافي = plus، أعمال = pro (رموز التخزين لم تتغيّر) */
export const PLAN_LABEL = { basic: "المجانية", plus: "الاحترافية", pro: "الأعمال" } as const;

export type TemplateTier = "free" | "standard" | "signature";
export const TEMPLATE_TIER_LABEL: Record<TemplateTier, string> = { free: "مجاني", standard: "قياسي", signature: "توقيع" };

/** قوالب واجهة منصة المتاجر (RVIOS StoreOS) — الأسماء للعرض، والأسعار والحقوق من الخادم */
export const STORE_TEMPLATES: { id: string; name: string; tier: TemplateTier }[] = [
  { id: "essential", name: "أساسي", tier: "free" },
  { id: "dahab", name: "ذهب", tier: "signature" },
  { id: "noir", name: "نوار", tier: "signature" },
  { id: "maison", name: "ميزون", tier: "signature" },
  { id: "volt", name: "فولت", tier: "signature" },
  { id: "khatwa", name: "خطوة", tier: "signature" },
  { id: "satr", name: "سَتر", tier: "signature" },
  { id: "nada", name: "ندى", tier: "signature" },
  { id: "bayt", name: "بيت", tier: "standard" },
  { id: "qita", name: "قِطع", tier: "standard" },
  { id: "nabd", name: "نبض", tier: "standard" },
  { id: "maida", name: "مائدة", tier: "standard" },
  { id: "turath", name: "تراث", tier: "standard" },
  { id: "zahr", name: "زهر", tier: "standard" },
  { id: "sukkar", name: "سُكّر", tier: "standard" },
  { id: "asal", name: "عسل", tier: "standard" },
  { id: "marah", name: "مرح", tier: "standard" },
  { id: "waraq", name: "ورق", tier: "standard" },
];
export const templateName = (id: string) => STORE_TEMPLATES.find((t) => t.id === id)?.name ?? id;

/** 0=قيد التأكيد · 1=مؤكد · 2=مكتمل · 3=ملغى */
export const ORDER_STATUS = [
  { value: 0, label: "قيد التأكيد", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { value: 1, label: "مؤكد", tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  { value: 2, label: "مكتمل", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { value: 3, label: "ملغى", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
] as const;

/** 0=عند الاستلام · 1=بانتظار التحويل · 2=إيصال للمراجعة · 3=مدفوع */
export const PAY_STATUS = [
  { value: 0, label: "عند الاستلام" },
  { value: 1, label: "بانتظار التحويل" },
  { value: 2, label: "إيصال بانتظار مراجعتك" },
  { value: 3, label: "مدفوع" },
] as const;

export const PAY_METHOD_LABEL: Record<string, string> = {
  cod: "عند الاستلام",
  wallet: "محفظة إلكترونية",
  bank: "تحويل بنكي",
};

export const orderStatus = (v: number) =>
  ORDER_STATUS.find((s) => s.value === v) ?? ORDER_STATUS[0];
