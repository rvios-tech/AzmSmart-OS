"use client";

import { useMemo } from "react";

import { navGroups, type NavGroup, type NavItem } from "@/config/nav";
import { sectionOfUrl } from "./roles";
import { useWorkspace } from "./workspace-context";

/**
 * القائمة الجانبية بحسب من أكون: كل نوع مستخدم يرى مساحته فقط (تاجر، فريق
 * المنصة، مدير الموقع، موظف). مساحة العمل العامة والتطبيقات والحساب للجميع.
 */
export function useNavGroups(): NavGroup[] {
  const { isPlatform, isSite, showStore, ctx } = useWorkspace();
  const sections = ctx?.sections ?? null;
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
      })
        // الموظف يرى أقسام المتجر الممنوحة له فقط — والمنع الفعلي في الخادم
        .map((g) => (sections && g.audience === "store" ? { ...g, items: g.items.filter((i) => allowed(i, sections)) } : g)),
    [isPlatform, isSite, showStore, sections],
  );
}

function allowed(item: NavItem, sections: string[]): boolean {
  const urls = [item.url, ...(item.items ?? []).map((x) => x.url)].filter((u): u is string => !!u);
  const s = urls.map(sectionOfUrl).find(Boolean);
  return !s || sections.includes(s);
}
