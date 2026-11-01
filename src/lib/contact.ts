/**
 * واتساب فريق RVIOS — رقم المملكة لمن فيها، وإلا الرقم اليمني (كموقع RVIOS ومنصة المتاجر).
 * النظام تطبيق خلف تسجيل الدخول، فتكفي منطقة جهاز المستخدم الزمنية ولا تدخل في أي تخزين مؤقت.
 */
const WHATSAPP = { sa: "966551341301", ye: "967739008083" };

export function teamWhatsapp(text?: string): string {
  let zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    /* متصفح قديم: الرقم الافتراضي */
  }
  const number = zone === "Asia/Riyadh" ? WHATSAPP.sa : WHATSAPP.ye;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
