import { apiFetch } from "./client";

// ── حسابات الدفع (الكريمي، جيب، جوالي…) ─────────────────────
export interface PayAccount {
  id: string;
  provider: string;
  title: string;
  holder: string;
  number: string;
  currency: "YER" | "USD" | "SAR" | "";
  /** رابط https أو مسار ثابت `/pay/…` */
  qr: string;
  note: string;
  enabled: boolean;
  providerName?: string;
  providerNameEn?: string;
  kind?: string;
  color?: string;
}

export interface PayProvider {
  id: string;
  name: string;
  nameEn: string;
  kind: string;
  color: string;
}

export const CURRENCY_LABELS: Record<string, string> = { YER: "ريال يمني", USD: "دولار أمريكي", SAR: "ريال سعودي" };

/** الحسابات المعلنة — عامة بلا جلسة، تعرضها صفحة الباقة والفواتير للتاجر */
export const publicPayAccounts = () =>
  apiFetch<{ accounts: PayAccount[] }>("/shop/public/payment-accounts", { auth: false }).then((r) => r.accounts);

// ── طلبات «متجر بتصميم خاص» ─────────────────────────────
export type LeadStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export interface PlatformLead {
  id: string;
  kind: string;
  name: string;
  phone: string;
  email: string;
  country: string;
  business: string;
  budget: string;
  timeline: string;
  details: { storeName?: string; features?: string[]; styles?: string[]; references?: string[]; existing?: string };
  message: string;
  status: LeadStatus;
  notes: string;
  handledBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  quoted: "أُرسل العرض",
  won: "تم الاتفاق",
  lost: "لم يكتمل",
};
export const LEAD_BUDGET_LABELS: Record<string, string> = { starter: "أساسي", growth: "متوسط", premium: "متكامل", unsure: "لم يحدد" };
export const LEAD_TIMELINE_LABELS: Record<string, string> = { asap: "بأسرع وقت", month: "خلال شهر", quarter: "خلال ٣ أشهر", unsure: "لم يحدد" };

export const listLeads = (status: string = "open", page = 1) =>
  apiFetch<{ items: PlatformLead[]; total: number; page: number; pages: number; counts: Record<string, number> }>(
    `/platform/leads?status=${status}&page=${page}`,
  );
export const updateLead = (id: string, input: { status?: LeadStatus; notes?: string }) =>
  apiFetch<PlatformLead>(`/platform/leads/${id}`, { method: "PATCH", body: JSON.stringify(input) });

// ── صندوق تنبيهات الفريق ────────────────────────────────
export interface PlatformAlert {
  id: string;
  kind: string;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
export const listAlerts = (unread = false, page = 1) =>
  apiFetch<{ items: PlatformAlert[]; total: number; unread: number; page: number; pages: number }>(
    `/platform/alerts?page=${page}${unread ? "&unread=1" : ""}`,
  );
export const alertsCount = () => apiFetch<{ unread: number }>("/platform/alerts/count");
export const readAlert = (id: string) => apiFetch<{ ok: true }>(`/platform/alerts/${id}/read`, { method: "PATCH" });
export const readAllAlerts = () => apiFetch<{ updated: number }>("/platform/alerts/read-all", { method: "POST" });

// ── إدارة متجر من لوحة المنصة ───────────────────────────
export interface PlatformStoreOverview {
  store: {
    id: string;
    slug: string;
    name: string;
    template: string;
    status: number;
    verified: boolean;
    ownedTemplates: string[];
    createdAt: string;
    logo?: string;
    customDomain?: string | null;
    whatsapp?: string;
    country?: string;
    [k: string]: unknown;
  };
  plan: string;
  company: { id: string; name: string; companyCode: string; createdAt: string };
  owner: { id: string; displayName: string; email: string; phone: string | null; lastLoginAt: string | null } | null;
  subscription: { id: string; plan: number; status: number; currentPeriodEnd: string | null } | null;
  counts: { products: number; orders: number; customers: number; categories: number; sales: number };
  invoices: { id: string; invoiceNumber: string; kind: number; status: number; amount: string | number; currency: string; plan: number | null; item: string | null; createdAt: string }[];
  templates: { id: string; tier: string; price: number; owned: boolean }[];
}

export const getStoreOverview = (id: string) => apiFetch<PlatformStoreOverview>(`/platform/shop-stores/${id}/overview`);
export const setStoreTemplate = (id: string, template: string) =>
  apiFetch<{ ok: true; template: string; ownedTemplates: string[] }>(`/platform/shop-stores/${id}/template`, {
    method: "PATCH",
    body: JSON.stringify({ template }),
  });

// ── جلسة الدعم: «أدِر هذا المتجر» ───────────────────────
export interface SupportSession {
  accessToken: string;
  company: { id: string; name: string; companyCode: string; workspaceSlug: string };
  storeId: string | null;
  expiresIn: string;
}
export const openStoreSupport = (storeId: string) =>
  apiFetch<SupportSession>(`/platform/shop-stores/${storeId}/support-session`, { method: "POST" });
export const openSiteSupport = () => apiFetch<SupportSession>("/platform/site/support-session", { method: "POST" });
