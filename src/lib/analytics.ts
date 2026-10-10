/**
 * Google Analytics لعزم سمارت (الصفحة الترحيبية ولوحة التحكم). في الإنتاج وحده فلا تُحسب
 * زيارات التطوير. `NEXT_PUBLIC_GA_IDS` (مفصولة بفواصل) يستبدل الافتراضي، وقيمة فارغة تعطّله.
 */
const raw = process.env.NEXT_PUBLIC_GA_IDS ?? "G-L8KCY9M4ZP";
export const GA_IDS = raw.split(",").map((s) => s.trim()).filter((s) => /^(G|GT|AW|DC)-[A-Z0-9]+$/.test(s));
export const analyticsOn = process.env.NODE_ENV === "production" && GA_IDS.length > 0;
export const gtagInit = () =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());` +
  GA_IDS.map((id) => `gtag('config',${JSON.stringify(id)});`).join("");
