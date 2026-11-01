/**
 * البريد الذي ينتظر رمز تحقق أو إعادة تعيين بين صفحتين. في `sessionStorage` لا في الرابط:
 * الروابط تُحفظ في السجلّات وتاريخ المتصفح، ولا مكان فيها لبيانات شخصية.
 */
const KEY = "azm_pending_email";

export function setPendingEmail(email: string, companyId?: string): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ email, companyId }));
  } catch {
    /* تخزين محجوب: الصفحة التالية تعيده إلى الدخول */
  }
}

function read(): { email?: string; companyId?: string } {
  try {
    return JSON.parse(window.sessionStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export const readPendingEmail = (): string | null => read().email ?? null;
export const readPendingCompany = (): string | undefined => read().companyId;

export function clearPendingEmail(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* لا شيء ليُمسح */
  }
}
