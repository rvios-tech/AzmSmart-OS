"use client";

import { getToken, setToken } from "@/lib/api/client";
import type { SupportSession } from "@/lib/api/platform-ops";

/**
 * جلسة دعم فريق المنصة داخل لوحة شركة أخرى («أدِر هذا المتجر»).
 *
 * رمز الموظف وشركته يُحفظان جانبًا، ثم تعمل اللوحة كلها برمز الدعم — كل
 * الشاشات بأدواتها نفسها. «العودة إلى لوحة المنصة» تستعيدهما. الرمز يسقط بعد
 * ساعتين، والخادم يتحقق مع كل طلب أن صاحبه ما زال من فريق المنصة.
 */
const STAFF_TOKEN = "azm_staff_token";
const STAFF_COMPANY = "azm_staff_company";
const RETURN_TO = "azm_support_return";

export function inSupport(): boolean {
  try {
    return !!window.localStorage.getItem(STAFF_TOKEN);
  } catch {
    return false;
  }
}

export function startSupport(s: SupportSession, dest: string, returnTo: string): void {
  const ls = window.localStorage;
  // جلسة داخل جلسة لا تُفقد رمز الموظف الأصلي
  if (!ls.getItem(STAFF_TOKEN)) {
    const token = getToken();
    if (token) ls.setItem(STAFF_TOKEN, token);
    const company = ls.getItem("azm_company");
    if (company) ls.setItem(STAFF_COMPANY, company);
    ls.setItem(RETURN_TO, returnTo);
  }
  setToken(s.accessToken);
  ls.setItem("azm_company", JSON.stringify({ id: s.company.id, name: s.company.name, workspaceSlug: s.company.workspaceSlug }));
  if (s.storeId) ls.setItem("azm_active_store", s.storeId);
  else ls.removeItem("azm_active_store");
  window.location.assign(dest);
}

export function endSupport(): void {
  const ls = window.localStorage;
  const token = ls.getItem(STAFF_TOKEN);
  const company = ls.getItem(STAFF_COMPANY);
  const back = ls.getItem(RETURN_TO) || "/platform";
  ls.removeItem(STAFF_TOKEN);
  ls.removeItem(STAFF_COMPANY);
  ls.removeItem(RETURN_TO);
  ls.removeItem("azm_active_store");
  if (token) setToken(token);
  if (company) ls.setItem("azm_company", company);
  window.location.assign(back);
}
