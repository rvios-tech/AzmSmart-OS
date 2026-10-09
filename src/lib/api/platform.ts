import { apiFetch } from "./client";

export interface PlatformMe {
  userId: string;
  platformRole: number;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  companyCode: string;
  workspaceSlug: string;
  planType: number;
  subscriptionStatus: number;
  trialEndsAt: string | null;
  country: string | null;
  currency: string | null;
  createdAt: string;
  memberCount: number;
}

export interface PlatformOrganizationDetail extends Omit<PlatformOrganization, "memberCount"> {
  memberships: {
    id: string;
    role: number;
    isActive: boolean;
    joinedAt: string | null;
    user: { id: string; displayName: string; email: string };
  }[];
}

export const PLAN_LABELS = ["تجريبي", "أساسي", "احترافي", "مؤسسي"];
export const SUBSCRIPTION_STATUS_LABELS = ["نشط", "منتهٍ", "معلَّق", "ملغى"];

export function platformMe(): Promise<PlatformMe> {
  return apiFetch<PlatformMe>("/platform/me");
}

export function listOrganizations(): Promise<PlatformOrganization[]> {
  return apiFetch<PlatformOrganization[]>("/platform/organizations");
}

export function getOrganization(id: string): Promise<PlatformOrganizationDetail> {
  return apiFetch<PlatformOrganizationDetail>(`/platform/organizations/${id}`);
}

export function updateOrganizationPlan(
  id: string,
  input: { planType?: number; subscriptionStatus?: number; trialEndsAt?: string },
): Promise<PlatformOrganizationDetail> {
  return apiFetch<PlatformOrganizationDetail>(`/platform/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export interface PlatformInvoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  organization: { id: string; name: string; companyCode: string };
  amount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: number;
  paymentReference: string | null;
  kind: number;
  plan: number | null;
  months: number | null;
  storeRef: string | null;
  method: string | null;
  proofKey: string | null;
  voidReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export const PLATFORM_INVOICE_STATUS_LABELS = [
  "بانتظار الدفع",
  "قيد المراجعة",
  "مدفوعة",
  "مرفوضة",
];

export const INVOICE_KIND_LABELS = ["اشتراك", "بناء متجر", "دومين", "متجر إضافي", "قالب"];
export const PAY_METHOD_NAMES: Record<string, string> = { kuraimi: "الكريمي", jaib: "جيب", paypal: "PayPal" };

export function listPlatformInvoices(status?: number): Promise<PlatformInvoice[]> {
  const query = status !== undefined ? `?status=${status}` : "";
  return apiFetch<PlatformInvoice[]>(`/platform/invoices${query}`);
}

export function createPlatformInvoice(input: {
  companyId: string;
  amount: number;
  currency?: string;
  periodStart: string;
  periodEnd: string;
}): Promise<PlatformInvoice> {
  return apiFetch<PlatformInvoice>("/platform/invoices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function reviewPlatformInvoice(
  id: string,
  input: { decision: "paid" | "rejected"; paymentReference?: string; reason?: string },
): Promise<PlatformInvoice> {
  return apiFetch<PlatformInvoice>(`/platform/invoices/${id}/review`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/* ───────── منصة المتاجر: متاجر واشتراكات وإعدادات ───────── */

export interface PlatformShopStore {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string;
  whatsapp: string;
  /** 0=نشط · 1=معلَّق */
  status: number;
  verified: boolean;
  createdAt: string;
  organization: { id: string; name: string; companyCode: string };
  _count: { products: number; orders: number };
}

export function listPlatformStores(q?: string): Promise<PlatformShopStore[]> {
  return apiFetch<PlatformShopStore[]>(`/platform/shop-stores${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}

export function setPlatformStoreStatus(id: string, suspended: boolean): Promise<PlatformShopStore> {
  return apiFetch<PlatformShopStore>(`/platform/shop-stores/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ suspended }),
  });
}

export function setPlatformStoreVerified(id: string, verified: boolean): Promise<PlatformShopStore> {
  return apiFetch<PlatformShopStore>(`/platform/shop-stores/${id}/verified`, {
    method: "PATCH",
    body: JSON.stringify({ verified }),
  });
}

export interface PlatformStoreSubscription {
  id: string;
  storeRef: string;
  /** 0=مجانية · 1=احترافية · 2=أعمال */
  plan: number;
  /** 0=نشط · 1=في المهلة · 2=منتهٍ */
  status: number;
  currentPeriodEnd: string | null;
  organization: { id: string; name: string; companyCode: string };
}

export interface PlatformSubscriptionList {
  subscriptions: PlatformStoreSubscription[];
  counts: { all: number; active: number; grace: number; expired: number; paid: number };
}

export type SubscriptionFilter = "all" | "active" | "grace" | "expired" | "paid" | "soon";

export const SHOP_PLAN_LABELS = ["المجانية", "الاحترافية", "الأعمال"];
export const SHOP_SUB_STATUS_LABELS = ["نشط", "في المهلة", "منتهٍ"];

export function listStoreSubscriptions(filter: SubscriptionFilter = "all"): Promise<PlatformSubscriptionList> {
  return apiFetch<PlatformSubscriptionList>(
    `/platform/store-subscriptions${filter === "all" ? "" : `?filter=${filter}`}`,
  );
}

export function updateStoreSubscription(
  id: string,
  input: { plan?: number; status?: number; extendDays?: number },
): Promise<PlatformStoreSubscription> {
  return apiFetch<PlatformStoreSubscription>(`/platform/store-subscriptions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export interface PlatformSettings {
  prices: { plus: number | null; pro: number | null };
  addons: { store_build: number | null; domain: number | null; extra_store: number | null };
  yearlyMonthsFree: number;
  /** عملة الفوترة (ISO) */
  currency: string;
  /** أسعار القوالب المدفوعة — الافتراضي أو ما ضُبط (`tpl.<id>`) */
  templates: Record<string, number>;
  /** إعدادات تطبيق AZM الجوال (`GET /app/config`) */
  app: { minVersion: string; latestVersion: string | null; maintenance: boolean; maintenanceMessage: string | null; storeUrl: string | null };
  methods: { id: string; name: string; scope: string; instructions: string }[];
}

export function getPlatformSettings(): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/platform/settings");
}

export function updatePlatformSettings(values: Record<string, string | number | null>): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>("/platform/settings", {
    method: "PATCH",
    body: JSON.stringify({ values }),
  });
}
