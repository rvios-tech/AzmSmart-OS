"use client";

import { useMemo } from "react";

import { navGroups, type NavGroup, type NavItem } from "@/config/nav";
import { sectionOfUrl } from "./roles";
import { useStore } from "@/lib/shop/store-context";
import { FEATURE_OF_URL } from "@/lib/shop/plans";
import { useWorkspace } from "./workspace-context";

/**
 * القائمة الجانبية بحسب من أكون: كل نوع مستخدم يرى مساحته فقط (تاجر، فريق
 * المنصة، مدير الموقع، موظف). مساحة العمل العامة والتطبيقات والحساب للجميع.
 */
export function useNavGroups(): NavGroup[] {
  const { isPlatform, isSite, showStore, ctx } = useWorkspace();
  const sections = ctx?.sections ?? null;
  const { store } = useStore();
  const features = store?.features;
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
        .map((g) => (sections && g.audience === "store" ? { ...g, items: g.items.map((i) => only(i, sections)).filter((i): i is NavItem => !!i) } : g))
        // ما ليس في باقة المتجر يبقى ظاهرًا بقفل — يدعو للترقية بدل أن يختفي
        .map((g) => (features && g.audience === "store" ? { ...g, items: g.items.map((i) => lockOf(i, features)) } : g)),
    [isPlatform, isSite, showStore, sections, features],
  );
}

const ok = (url: string | undefined, sections: string[]) => {
  const s = url ? sectionOfUrl(url) : null;
  return !s || sections.includes(s);
};

const lockedUrl = (url: string | undefined, f: Record<string, boolean>) => !!url && !!FEATURE_OF_URL[url] && f[FEATURE_OF_URL[url]] === false;
function lockOf(item: NavItem, f: Record<string, boolean>): NavItem {
  if (item.items?.length) return { ...item, items: item.items.map((c) => (lockedUrl(c.url, f) ? { ...c, locked: true } : c)) };
  return lockedUrl(item.url, f) ? { ...item, locked: true } : item;
}

function only(item: NavItem, sections: string[]): NavItem | null {
  if (!item.items?.length) return ok(item.url, sections) ? item : null;
  const items = item.items.filter((c) => ok(c.url, sections));
  return items.length ? { ...item, items } : null;
}
