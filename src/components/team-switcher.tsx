"use client";

import Link from "next/link";
import {
  IconBuildingStore,
  IconCheck,
  IconPlus,
  IconSelector,
} from "@tabler/icons-react";

import { useAuth } from "@/lib/auth/auth-context";
import { useStore } from "@/lib/shop/store-context";
import { useWorkspace } from "@/lib/workspace/workspace-context";
import {
  DropdownMenu,
  DropdownMenuContent,
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

const PLAN_LABEL = { basic: "مجانية", plus: "احترافية", pro: "أعمال" } as const;

/**
 * مبدّل المتجر النشط — يحلّ محلّ «مساحات العمل» الوهمية. الحساب الواحد قد
 * يملك حتى خمسة متاجر، وكل صفحات التجارة تعمل على المتجر المختار هنا.
 */
export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { company } = useAuth();
  const { stores, store, slots, setActive } = useStore();
  const { roleLabel } = useWorkspace();

  const title = store?.name ?? company?.name ?? "عزم سمارت";
  const subtitle = store ? PLAN_LABEL[store.plan] : roleLabel;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className="flex aspect-square size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                style={store ? { background: store.color } : undefined}
              >
                <IconBuildingStore className="size-5" />
              </div>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate font-semibold tracking-tight">{title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </span>
              </div>
              <IconSelector className="ms-auto size-4 text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-60 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "left"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              متاجري
            </DropdownMenuLabel>
            {stores.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => setActive(s.id)}
                className="gap-2 p-2"
              >
                <div
                  className="flex size-6 items-center justify-center rounded-md border"
                  style={{ borderColor: s.color }}
                >
                  <IconBuildingStore className="size-3.5 shrink-0" />
                </div>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-sm font-medium">{s.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {PLAN_LABEL[s.plan]}
                  </span>
                </div>
                {store?.id === s.id && <IconCheck className="size-4 shrink-0" />}
              </DropdownMenuItem>
            ))}
            {stores.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">
                لا متاجر بعد.
              </p>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/store/new">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <IconPlus className="size-4" />
                </div>
                <span className="font-medium text-muted-foreground">
                  متجر جديد
                  {slots && slots.free === 0 && stores.length > 0
                    ? " (بلا خانة شاغرة)"
                    : ""}
                </span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
