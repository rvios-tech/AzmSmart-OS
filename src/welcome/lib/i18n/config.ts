export const locales = ["ar", "en"] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = "ar";
export const hasLocale = (v: string): v is Lang => (locales as readonly string[]).includes(v);
export const dirOf = (l: Lang) => (l === "ar" ? "rtl" : "ltr");
/** يضيف بادئة اللغة إلى المسارات الداخلية */
export const withLang = (lang: Lang, href: string) => {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (/^\/(ar|en)(\/|$|\?|#)/.test(href)) return href;
  return href === "/" ? `/${lang}` : `/${lang}${href}`;
};
/** يستبدل لغة المسار الحالي */
export const swapLang = (path: string, to: Lang) => {
  const rest = path.replace(/^\/(ar|en)(?=\/|$)/, "");
  return `/${to}${rest}`;
};
