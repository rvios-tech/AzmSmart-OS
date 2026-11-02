"use client";

import { useMemo } from "react";

import { navGroups, type NavGroup } from "@/config/nav";
import { useWorkspace } from "./workspace-context";

/**
 * القائمة الجانبية بحسب من أكون: كل نوع مستخدم يرى مساحته فقط (تاجر، فريق
 * المنصة، مدير الموقع، موظف). مساحة العمل العامة والتطبيقات والحساب للجميع.
 */
export function useNavGroups(): NavGroup[] {
  const { isPlatform, isSite, showStore } = useWorkspace();
  return useMemo(
    () =>
      navGroups.filter((g) => {
        // حساب فريق المنصة معزول: لوحة الإدارة وحسابه فقط — لا متجر ولا مساحة عمل
        if (isPlatform) return g.audience === "platform" || (isSite && g.audience === "site") || g.label === "الحساب";
        switch (g.audience ?? "all") {
          case "off":
            return false;
          case "platform":
            return isPlatform;
          case "site":
            return isSite;
          case "store":
            return showStore;
          default:
            return true;
        }
      }),
    [isPlatform, isSite, showStore],
  );
}
