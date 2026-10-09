// ---------------------------------------------------------------------------
// أدوات التنسيق العربية لنظام عزم سمارت.
//
// كل الأرقام تُعرض بالأرقام العربية الغربية (0-9) لأنها الأكثر شيوعاً في
// واجهات الأعمال الخليجية، مع فواصل آلاف ورموز عملة عربية. التواريخ تُعرض
// بالتقويم الميلادي بأسماء شهور عربية.
// ---------------------------------------------------------------------------

/** اللغة الأساسية للواجهة — عربية بأرقام لاتينية (0-9). */
export const LOCALE = "ar-SA-u-nu-latn";

/** عملة النظام الافتراضية. */
export const CURRENCY = "SAR";

/** رمز العملة المختصر المستخدم في العرض المكثّف (البطاقات والجداول). */
export const CURRENCY_SYMBOL = "ر.س";

/** تنسيق رقم عادي مع فواصل الآلاف: 18472 → "18,472" */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(LOCALE, options).format(value);
}

/**
 * تنسيق مبلغ مالي بالريال السعودي: 1250 → "1,250 ر.س"
 * نستخدم رمزاً لاحقاً يدوياً بدل `style: "currency"` لأن الأخير يُخرج
 * "SAR 1,250" أو "١٬٢٥٠ ر.س." بترتيب غير متسق بين المتصفحات.
 */
export function formatCurrency(
  value: number,
  { decimals = 0 }: { decimals?: number } = {}
): string {
  const n = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
  return `${n} ${CURRENCY_SYMBOL}`;
}

/**
 * مبلغ بعملة متجر بعينه: (25000, "ر.ي") → "25,000 ر.ي".
 * العملة تتبع دولة المتجر لا عملة النظام — متجر أردني يعرض «د.أ» لا «ر.س».
 */
export function formatMoney(value: number, symbol: string): string {
  return `${formatNumber(value)} ${symbol}`;
}

/**
 * مبلغ فوترة منصة المتاجر بعملتها (رمز ISO من الخادم): (60, "USD") → "$60"،
 * (3000, "YER") → "3,000 ر.ي". الباقات والقوالب تُسعَّر بالدولار افتراضيًا.
 */
export function formatBilling(value: number, currency: string): string {
  const n = formatNumber(value, { maximumFractionDigits: 2 });
  if (currency === "USD") return `$${n}`;
  return `${n} ${{ YER: "ر.ي", SAR: "ر.س" }[currency] ?? currency}`;
}

/** مبلغ مالي مختصر للمخططات والبطاقات: 423000 → "423 ألف ر.س" */
export function formatCompactCurrency(value: number): string {
  return `${formatCompact(value)} ${CURRENCY_SYMBOL}`;
}

/** اختصار الأرقام الكبيرة: 1250 → "1.25 ألف"، 2400000 → "2.4 مليون" */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${trim(value / 1_000_000_000)} مليار`;
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)} مليون`;
  if (abs >= 1_000) return `${trim(value / 1_000)} ألف`;
  return formatNumber(value);
}

function trim(n: number): string {
  return formatNumber(Number(n.toFixed(1)));
}

/** نسبة مئوية: 12.5 → "12.5%" (تبقى العلامة بعد الرقم كما هو متعارف عليه). */
export function formatPercent(value: number, decimals = 1): string {
  return `${formatNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })}%`;
}

/** نسبة مئوية مع إشارة الاتجاه: 12.5 → "+12.5%"، -3.1 → "−3.1%" */
export function formatDelta(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatPercent(Math.abs(value), decimals)}`;
}

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const MONTHS_AR_SHORT = [
  "ينا", "فبر", "مار", "أبر", "مايو", "يون",
  "يول", "أغس", "سبت", "أكت", "نوف", "ديس",
];

const WEEKDAYS_AR = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت",
];

function toDate(value: string | number | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

/** تاريخ كامل: "12 مارس 2025" */
export function formatDate(value: string | number | Date): string {
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

/** تاريخ مختصر: "12 مار 2025" */
export function formatDateShort(value: string | number | Date): string {
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS_AR_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** يوم وشهر فقط: "12 مارس" */
export function formatDayMonth(value: string | number | Date): string {
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
}

/** شهر وسنة: "مارس 2025" */
export function formatMonthYear(value: string | number | Date): string {
  const d = toDate(value);
  return `${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
}

/** اسم اليوم: "الخميس" */
export function formatWeekday(value: string | number | Date): string {
  return WEEKDAYS_AR[toDate(value).getDay()];
}

/** وقت بنظام 12 ساعة بالعربية: "3:45 م" */
export function formatTime(value: string | number | Date): string {
  const d = toDate(value);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const period = h < 12 ? "ص" : "م";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${period}`;
}

/** تاريخ ووقت: "12 مارس 2025، 3:45 م" */
export function formatDateTime(value: string | number | Date): string {
  return `${formatDate(value)}، ${formatTime(value)}`;
}

/**
 * صياغة الجمع العربي الثلاثي (مفرد / مثنى / جمع).
 * مثال: pluralize(3, "طلب", "طلبان", "طلبات") → "3 طلبات"
 */
export function pluralize(
  count: number,
  singular: string,
  dual: string,
  plural: string
): string {
  if (count === 1) return singular;
  if (count === 2) return dual;
  // العربية تستخدم صيغة الجمع من 3 إلى 10، ثم المفرد المنصوب من 11 فأكثر.
  const n = count % 100;
  if (n >= 3 && n <= 10) return `${formatNumber(count)} ${plural}`;
  return `${formatNumber(count)} ${singular}`;
}

/** وقت نسبي بالعربية: "قبل 5 دقائق"، "قبل 3 أيام" */
export function formatRelativeTime(value: string | number | Date): string {
  const then = toDate(value).getTime();
  const diff = Math.round((Date.now() - then) / 1000);

  if (diff < 45) return "الآن";
  if (diff < 90) return "قبل دقيقة";

  const minutes = Math.round(diff / 60);
  if (minutes < 60) return `قبل ${pluralize(minutes, "دقيقة", "دقيقتين", "دقائق")}`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${pluralize(hours, "ساعة", "ساعتين", "ساعات")}`;

  const days = Math.round(hours / 24);
  if (days < 7) return `قبل ${pluralize(days, "يوم", "يومين", "أيام")}`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `قبل ${pluralize(weeks, "أسبوع", "أسبوعين", "أسابيع")}`;

  const months = Math.round(days / 30);
  if (months < 12) return `قبل ${pluralize(months, "شهر", "شهرين", "أشهر")}`;

  const years = Math.round(days / 365);
  return `قبل ${pluralize(years, "سنة", "سنتين", "سنوات")}`;
}

/** حجم ملف بالعربية: 2048 → "2 ك.ب" */
export function formatFileSize(bytes: number): string {
  const units = ["بايت", "ك.ب", "م.ب", "ج.ب", "ت.ب"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${formatNumber(Number(n.toFixed(i === 0 ? 0 : 1)))} ${units[i]}`;
}

/**
 * يغلّف النصوص ثنائية الاتجاه (المعرّفات، البريد، الروابط، الأكواد) بحيث
 * لا تنعكس علاماتها داخل فقرة عربية. استخدمها مع `dir="ltr"` عند الحاجة.
 */
export function isolateLtr(text: string): string {
  return `⁦${text}⁩`;
}
