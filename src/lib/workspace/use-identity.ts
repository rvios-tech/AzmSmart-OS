"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { useWorkspace } from "./workspace-context";

/** هوية المستخدم الحقيقية للعرض في القائمة والرأس — لا بيانات وهمية. */
export function useIdentity() {
  const { user, company, logout } = useAuth();
  const { roleLabel } = useWorkspace();
  const name = user?.displayName ?? "";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return {
    name,
    email: user?.email ?? "",
    avatar: user?.avatarUrl ?? undefined,
    initials: initials || "؟",
    companyName: company?.name ?? "",
    roleLabel,
    logout,
  };
}
