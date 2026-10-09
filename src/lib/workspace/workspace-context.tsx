"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { getWorkspaceContext, type WorkspaceContext } from "@/lib/api/workspace";
import { PLATFORM_ROLE_LABELS, ROLE_LABELS } from "./roles";

interface WorkspaceValue {
  status: "loading" | "ready" | "error";
  ctx: WorkspaceContext | null;
  /** فريق منصة RVIOS */
  isPlatform: boolean;
  /** شركة الموقع الرئيسي المحجوزة */
  isSite: boolean;
  /** يملك متجرًا أو لا يملك مساحة أخرى تخصّه — أي مستخدم عادي يرى المتجر */
  showStore: boolean;
  /** التسمية التي تظهر تحت اسمه: «مدير المنصة» أو «مالك» … */
  roleLabel: string;
  reload: () => Promise<void>;
}

const Ctx = createContext<WorkspaceValue | null>(null);

/**
 * سياق مساحة العمل: من أنا وأي أقسام أراها. يُستهلَك لرسم القائمة والصفحة
 * الرئيسية بحسب النوع (تاجر / فريق المنصة / مدير الموقع / موظف). المنع
 * الفعلي يقع في الباكند على كل مسار — هذا للرسم لا للحراسة.
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtx] = useState<WorkspaceContext | null>(null);
  const [status, setStatus] = useState<WorkspaceValue["status"]>("loading");

  const reload = useCallback(async () => {
    try {
      setCtx(await getWorkspaceContext());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await reload();
    })();
  }, [reload]);

  const value = useMemo<WorkspaceValue>(() => {
    const isPlatform = ctx?.platformRole != null;
    const isSite = !!ctx?.isSite;
    const roleLabel = isPlatform
      ? PLATFORM_ROLE_LABELS[ctx!.platformRole!] ?? "فريق المنصة"
      : isSite
        ? "مدير الموقع"
        : ROLE_LABELS[ctx?.role ?? 8] ?? "عضو";
    return {
      status,
      ctx,
      isPlatform,
      isSite,
      showStore: !isSite && (!isPlatform || (ctx?.storeCount ?? 0) > 0),
      roleLabel,
      reload,
    };
  }, [ctx, status, reload]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace(): WorkspaceValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWorkspace يجب أن يُستخدم داخل WorkspaceProvider");
  return v;
}
