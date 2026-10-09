/**
 * روابط الصفحة الترحيبية خارج عزم سمارت — منتجات RVIOS الأخرى وموقع الشركة.
 * تُضبط بالبيئة للإنتاج، والافتراض لخوادم التطوير المحلية.
 */
const trim = (u: string) => u.replace(/\/+$/, "");

/** موقع RVIOS الرئيسي — التواصل وطلب العرض التوضيحي */
export const RVIOS_URL = trim(process.env.NEXT_PUBLIC_RVIOS_URL ?? "http://localhost:3000");
/** واجهة منصة المتاجر */
export const STOREOS_URL = trim(process.env.NEXT_PUBLIC_STOREOS_URL ?? "http://store.rvios.com");
/** الصفحة الترحيبية نفسها — هنا في عزم سمارت */
export const AZMSMART_URL = "/";

/** صفحة التواصل في موقع RVIOS بموضوع محدّد */
export const contactUrl = (topic?: string) => `${RVIOS_URL}/ar/contact${topic ? `?topic=${topic}` : ""}`;
