import { apiFetch, setToken } from "./client";

export interface WorkspaceContext {
  user: { id: string; email: string; displayName: string; avatarUrl: string | null } | null;
  company: {
    id: string;
    name: string;
    workspaceSlug: string;
    planType: number;
    subscriptionStatus: number;
    storeSlots: number;
  } | null;
  /** دور المستخدم داخل الشركة النشطة: 0 مالك … 9 ضيف */
  role: number;
  /** null إن لم يكن من فريق المنصة */
  platformRole: number | null;
  isSite: boolean;
  storeCount: number;
}

export function getWorkspaceContext(): Promise<WorkspaceContext> {
  return apiFetch<WorkspaceContext>("/auth/context");
}

export function switchCompany(companyId: string): Promise<{ accessToken: string; company: { id: string; name: string } }> {
  return apiFetch("/auth/switch", { method: "POST", body: JSON.stringify({ companyId }) });
}

export interface TeamMember {
  id: string;
  role: number;
  isActive: boolean;
  joinedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    lastLoginAt: string | null;
  };
}

export function listTeamMembers(): Promise<{ members: TeamMember[] }> {
  return apiFetch("/team/members");
}

export interface PlatformOverview {
  totals: {
    companies: number;
    users: number;
    stores: number;
    suspendedStores: number;
    products: number;
    orders: number;
    paidSubscriptions: number;
    graceSubscriptions: number;
    expiringSoon: number;
    pendingInvoices: number;
  };
  plans: { plan: number; count: number }[];
  series: { month: string; revenue: number; companies: number; stores: number }[];
}

export function getPlatformOverview(): Promise<PlatformOverview> {
  return apiFetch<PlatformOverview>("/platform/overview");
}

export function addTeamMember(input: {
  email: string;
  displayName: string;
  password?: string;
  role: number;
}): Promise<{ id: string }> {
  return apiFetch("/team/members", { method: "POST", body: JSON.stringify(input) });
}

export function updateTeamMember(id: string, input: { role?: number; isActive?: boolean }): Promise<{ ok: true }> {
  return apiFetch(`/team/members/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  avatarUrl: string | null;
  language: string;
  timezone: string;
}

export const getProfile = () => apiFetch<Profile>("/me/profile");
export const updateProfile = (input: { displayName?: string; phone?: string; avatarUrl?: string; timezone?: string; language?: string }) =>
  apiFetch<Profile>("/me/profile", { method: "PATCH", body: JSON.stringify(input) });
/** التغيير يُبطل كل الجلسات السابقة في الخادم — والرمز الجديد يُحفظ فتستمر هذه الجلسة. */
export async function changePassword(currentPassword: string, newPassword: string) {
  const r = await apiFetch<{ ok: true; accessToken: string }>("/me/password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
  setToken(r.accessToken);
  return r;
}
