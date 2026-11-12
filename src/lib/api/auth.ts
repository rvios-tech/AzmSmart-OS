import { apiFetch } from "./client";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface AuthCompany {
  id: string;
  name: string;
  workspaceSlug?: string;
}

/** شركة العرض التجريبي — للقراءة فقط في الخادم (انظر `demo.constant.ts` هناك) */
export const DEMO_WORKSPACE = "rvios-demo";
export const isDemoCompany = (c: AuthCompany | null | undefined) => c?.workspaceSlug === DEMO_WORKSPACE;

/** دخول العرض التجريبي — بلا حساب، جلسة قصيرة للمشاهدة فقط */
export function demo(): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/demo", { method: "POST", auth: false });
}

export interface LoginResponse {
  accessToken: string;
  /** «جهاز موثوق» — يُرسل مع الدخول التالي فلا يُطلب رمز البريد طوال مدته */
  trustToken?: string;
  user: AuthUser;
  company: AuthCompany;
  companies: (AuthCompany & { role: number })[];
}

/** كلمة المرور صحيحة، وبقي رمز البريد — لا جلسة قبله */
export interface VerificationRequired {
  verificationRequired: true;
  email: string;
  /** `false` إن تعذّر الإرسال — إعادة الإرسال تكمله */
  sent: boolean;
}

export interface RegisterResponse {
  accessToken: string;
  user: AuthUser;
  company: AuthCompany;
}

export interface MeResponse {
  userId: string;
  companyId: string;
  role: number;
  membershipId: string;
}

export function login(input: {
  email: string;
  password: string;
  companyId?: string;
  trustToken?: string;
}): Promise<LoginResponse | VerificationRequired> {
  return apiFetch<LoginResponse | VerificationRequired>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
}

export function register(input: {
  email: string;
  password: string;
  displayName: string;
  companyName: string;
}): Promise<RegisterResponse | VerificationRequired> {
  return apiFetch<RegisterResponse | VerificationRequired>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
}

const post = <T,>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body), auth: false });

export const verifyCode = (input: { email: string; code: string; companyId?: string }) => post<LoginResponse>("/auth/verify", input);
export const resendCode = (email: string) => post<{ ok: boolean }>("/auth/verify/resend", { email });
export const forgotPassword = (email: string) => post<{ ok: boolean }>("/auth/password/forgot", { email });
export const resetPassword = (input: { email: string; code: string; newPassword: string }) => post<{ ok: boolean }>("/auth/password/reset", input);

/** الدخول أو التسجيل بحساب Google — `isNew` لحساب أُنشئ الآن */
export function google(credential: string): Promise<LoginResponse & { isNew: boolean }> {
  return apiFetch<LoginResponse & { isNew: boolean }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
    auth: false,
  });
}

/** تجديد رمز الجلسة قبل انتهائه — جلسة منزلقة لمن يفتح اللوحة باستمرار */
export function refresh(): Promise<{ accessToken: string }> {
  return apiFetch<{ accessToken: string }>("/auth/refresh", { method: "POST" });
}

export function me(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/auth/me");
}
