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
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  company: AuthCompany;
  companies: (AuthCompany & { role: number })[];
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
}): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
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
}): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
    auth: false,
  });
}

export function me(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/auth/me");
}
