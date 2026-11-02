import type { Plan } from "@/lib/api/shop";

/**
 * طلب متجر بدأه التاجر في منصة المتاجر (القالب والباقة والبيانات) ويكمله هنا بعد التسجيل أو الدخول.
 * يصل في `#` الرابط فلا يمر بأي خادم، ويبقى في `sessionStorage` عبر صفحات الدخول والتحقق.
 */
export interface StoreDraft {
  template: string;
  plan: Plan;
  billing: "month" | "year";
  name: string;
  slug: string;
  whatsapp: string;
  color: string;
}

const KEY = "azm_store_draft";
/** أسماء الباقات في منصة المتاجر ← أسماؤها هنا */
const PLAN_OF: Record<string, Plan> = { free: "basic", pro: "plus", biz: "pro" };

/** يقرأ الطلب من جزء الرابط؛ `null` لطلب تالف أو مجهول الإصدار */
export function parseDraft(fragment: string): StoreDraft | null {
  try {
    const b64 = fragment.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
    const o = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    if (o.v !== 1) return null;
    const str = (k: string, max: number) => (typeof o[k] === "string" ? (o[k] as string).slice(0, max) : "");
    return {
      template: str("tpl", 20) || "essential",
      plan: PLAN_OF[str("plan", 10)] ?? "basic",
      billing: o.billing === "year" ? "year" : "month",
      name: str("name", 60),
      slug: str("slug", 40).toLowerCase().replace(/[^a-z0-9-]/g, ""),
      whatsapp: str("whatsapp", 20).replace(/\D/g, ""),
      color: /^#[0-9a-fA-F]{6}$/.test(str("color", 7)) ? str("color", 7) : "#9E2226",
    };
  } catch {
    return null;
  }
}

export function saveDraft(d: StoreDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* تخزين محجوب: يبدأ التاجر الطلب من جديد هنا */
  }
}

export function readDraft(): StoreDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoreDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* لا شيء ليُمسح */
  }
}

/** بعد الدخول أو التسجيل: إلى إكمال طلب المتجر إن وُجد، وإلا لوحة التحكم */
export const afterAuthPath = () => (readDraft() ? "/store/new" : "/dashboard");
