"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconUserCircle,
  IconBell,
  IconSettings,
  IconLogout,
  IconArrowsExchange,
  IconSun,
  IconMoon,
} from "@tabler/icons-react";

import { useIdentity } from "@/lib/workspace/use-identity";
import { useAuth } from "@/lib/auth/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const me = useIdentity();
  const { companies, company, switchCompany } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={me.avatar} alt={me.name} />
                <AvatarFallback className="rounded-lg">{me.initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate text-sm font-medium">
                  {me.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {me.email}
                </span>
              </div>
              <IconDotsVertical className="ms-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            side={isMobile ? "bottom" : "left"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={me.avatar} alt={me.name} />
                  <AvatarFallback className="rounded-lg">{me.initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-sm font-medium">
                    {me.name}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {me.email}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"
                >
                  {me.roleLabel}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <IconUserCircle className="size-4" /> الحساب
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/notifications">
                  <IconBell className="size-4" /> الإشعارات
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <IconSettings className="size-4" /> الإعدادات
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <IconSun className="size-4" />
              ) : (
                <IconMoon className="size-4" />
              )}
              تبديل المظهر
            </DropdownMenuItem>
            {companies.length > 1 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">تبديل الشركة</DropdownMenuLabel>
                {companies.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    disabled={c.id === company?.id}
                    onClick={() => void switchCompany(c.id).catch(() => toast.error("تعذّر التبديل"))}
                  >
                    <IconArrowsExchange className="size-4" /> {c.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => me.logout()}>
              <IconLogout className="size-4" /> تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
