import type { ProductsResponse, SaveAppearanceInput, Store } from "./shop";
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
  appearanceLockedUntil: string | null;
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

/** يفتح تعديل «شكل المتجر» قبل انتهاء أسبوع القفل */
export function unlockPlatformStoreAppearance(id: string): Promise<Pick<PlatformShopStore, "appearanceLockedUntil">> {
  return apiFetch(`/platform/shop-stores/${id}/appearance-unlock`, { method: "POST" });
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

// ── طلبات المتاجر المدفوعة ───────────────────────────────
export interface StoreRequest {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  country: string;
  template: string;
  createdAt: string;
  company: { id: string; name: string };
  owner: { email: string; displayName: string } | null;
  invoices: { id: string; invoiceNumber: string; kind: number; plan: number | null; months: number | null; item: string | null; amount: string; currency: string; status: number }[];
  total: number;
}

export const listStoreRequests = () => apiFetch<StoreRequest[]>("/platform/shop-stores/requests");

export const activateStoreRequest = (id: string, paymentReference?: string) =>
  apiFetch<{ ok: true }>(`/platform/shop-stores/${id}/activate`, { method: "POST", body: JSON.stringify({ paymentReference }) });

export const rejectStoreRequest = (id: string, reason?: string) =>
  apiFetch<{ ok: true }>(`/platform/shop-stores/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) });

/** حذف متجر نهائيًا — للمدير العام وحده */
export const deletePlatformStore = (id: string) =>
  apiFetch<{ ok: true }>(`/platform/shop-stores/${id}`, { method: "DELETE" });

// ── الحسابات وصلاحيات فريق المنصة ─────────────────────────
export interface PlatformUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastLoginAt: string | null;
  emailVerifiedAt: string | null;
  isPlatformStaff: boolean;
  platformRole: number | null;
  google: boolean;
  companies: { id: string; name: string; role: number }[];
}

export const listPlatformUsers = (q?: string, staffOnly = false) => {
  const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(staffOnly ? { staff: "1" } : {}) }).toString();
  return apiFetch<PlatformUser[]>(`/platform/users${qs ? `?${qs}` : ""}`);
};

export const setPlatformUserRole = (id: string, role: 0 | 1 | 2 | null) =>
  apiFetch<{ id: string; isPlatformStaff: boolean; platformRole: number | null }>(`/platform/users/${id}/staff`, { method: "PATCH", body: JSON.stringify({ role }) });

// ── محرر شكل المتجر من لوحة المنصة (بلا قفل الأسبوع) ─────────────
export const getTeamStoreEditor = (id: string) =>
  apiFetch<{ store: Store } & ProductsResponse>(`/platform/shop-stores/${id}/editor`);

export const saveTeamAppearance = (id: string, input: SaveAppearanceInput) =>
  apiFetch<{ store: Store }>(`/platform/shop-stores/${id}/appearance`, { method: "PUT", body: JSON.stringify(input) });
