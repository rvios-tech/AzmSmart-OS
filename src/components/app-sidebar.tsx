"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChevronLeft, IconLock } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { type NavItem } from "@/config/nav";
import { useNavGroups } from "@/lib/workspace/use-nav";
import { TeamSwitcher } from "@/components/team-switcher";
import { NavUser } from "@/components/nav-user";
import { useThemeConfig } from "@/components/theme-customizer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();
  const { config } = useThemeConfig();
  const navGroups = useNavGroups();

  return (
    <Sidebar
      collapsible={config.sidebarCollapsible}
      variant={config.sidebarVariant}
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent className="overscroll-contain">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <NavEntry key={item.title} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function badgeClass(badge: string) {
  return /^\d+$/.test(badge)
    ? "bg-sidebar-accent text-sidebar-accent-foreground"
    : "bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground peer-hover/menu-button:text-primary-foreground peer-data-active/menu-button:text-primary-foreground";
}

function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const { setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  // Collapsible parent with children.
  if (item.items?.length) return <NavParent item={item} pathname={pathname} onNavigate={closeMobile} />;

  // Flat link item.
  const active =
    pathname === item.url ||
    (item.url !== "/dashboard" && !!item.url && pathname.startsWith(`${item.url}/`));
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
        <Link href={item.url ?? "#"} onClick={closeMobile}>
          {item.icon && <item.icon className="size-4" />}
          <span>{item.title}</span>
          {item.locked && <IconLock className="ms-auto size-3.5 opacity-50" aria-label="خارج باقتك" />}
        </Link>
      </SidebarMenuButton>
      {item.badge && (
        <SidebarMenuBadge className={badgeClass(item.badge)}>
          {item.badge}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

/** أدقّ صفحة فرعية تطابق المسار: /orders/123 ← «كل الطلبات»، و/products/new ← «إضافة منتج» لا «المنتجات» */
function activeChild(item: NavItem, pathname: string) {
  return (item.items ?? [])
    .filter((c) => pathname === c.url || (c.url !== "/dashboard" && pathname.startsWith(`${c.url}/`)))
    .sort((a, b) => b.url.length - a.url.length)[0]?.url;
}

function NavParent({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const current = activeChild(item, pathname);
  const [open, setOpen] = useState(!!current);
  // الدخول إلى صفحة من المجموعة (من رابط أو بحث) يفتحها — يُضبط أثناء الرسم لا في تأثير
  const [seen, setSeen] = useState(current);
  if (current !== seen) {
    setSeen(current);
    if (current) setOpen(true);
  }
  {
    const childActive = !!current;
    return (
      <Collapsible
        asChild
        open={open}
        onOpenChange={setOpen}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton tooltip={item.title} isActive={childActive}>
              {item.icon && <item.icon className="size-4" />}
              <span>{item.title}</span>
              {item.badge && (
                <SidebarMenuBadge
                  className={cn(
                    "group-data-[state=open]/collapsible:hidden",
                    badgeClass(item.badge)
                  )}
                >
                  {item.badge}
                </SidebarMenuBadge>
              )}
              <IconChevronLeft className="ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden [--tw-animation-duration:260ms] data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <SidebarMenuSub>
              {(item.items ?? []).map((sub) => (
                <SidebarMenuSubItem key={sub.title}>
                  <SidebarMenuSubButton asChild isActive={current === sub.url}>
                    <Link href={sub.url} onClick={onNavigate}>
                      {sub.title}
                      {sub.locked && <IconLock className="ms-auto size-3.5 opacity-50" aria-label="خارج باقتك" />}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }
}
