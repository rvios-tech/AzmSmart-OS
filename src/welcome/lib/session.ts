"use client";
let first: boolean | undefined;
let mounted = false;

/** أول زيارة في هذه الجلسة؟ (تُحسب مرة واحدة ويشترك فيها المكوّنات) */
export function isFirstVisit() {
  if (first === undefined) {
    try { first = !sessionStorage.getItem("rv-visited"); sessionStorage.setItem("rv-visited", "1"); }
    catch { first = false; }
  }
  return first;
}

/** هل سبق أن حُمّلت صفحة في هذا التبويب؟ (لتفعيل انتقال الصفحات عند التنقل فقط) */
export function markMounted() { const was = mounted; mounted = true; return was; }
