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
        switch (g.audience ?? "all") {
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
