"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconBell,
  IconSearch,
  IconLogout,
  IconUserCircle,
  IconSettings,
} from "@tabler/icons-react";

import { useIdentity } from "@/lib/workspace/use-identity";
import { listNotificationsApi, type NotificationDto } from "@/lib/api/work";
import { formatRelativeTime } from "@/lib/format";
import { useNavGroups } from "@/lib/workspace/use-nav";
import { useIsMac } from "@/hooks/use-platform";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { CustomizerButton } from "@/components/theme-customizer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// ترجمة أجزاء URL إلى تسميات عربية قابلة للقراءة
const CRUMB_LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم",
  analytics: "التحليلات",
  ecommerce: "التجارة الإلكترونية",
  crm: "إدارة العملاء",
  crypto: "الأصول الرقمية",
  healthcare: "الرعاية الصحية",
  logistics: "اللوجستيك",
  hr: "الموارد البشرية",
  "real-estate": "العقارات",
  products: "المنتجات",
  storefront: "واجهة المتجر",
  orders: "الطلبات",
  customers: "العملاء",
  categories: "الفئات",
  inventory: "المخزون",
  discounts: "الخصومات",
  shipping: "الشحن",
  reviews: "التقييمات",
  invoices: "الفواتير",
  cart: "السلة",
  checkout: "إتمام الشراء",
  projects: "المشاريع",
  team: "الفريق",
  roles: "الأدوار",
  contacts: "جهات الاتصال",
  activity: "النشاط",
  apps: "التطبيقات",
  "ai-chat": "المساعد الذكي",
  chat: "المحادثات",
  mail: "البريد",
  calendar: "التقويم",
  kanban: "كانبان",
  tasks: "المهام",
  notes: "الملاحظات",
  "file-manager": "مدير الملفات",
  blog: "المدونة",
  profile: "الملف الشخصي",
  settings: "الإعدادات",
  notifications: "الإشعارات",
  developers: "المطورون",
  integrations: "التكاملات",
  pricing: "الأسعار",
  search: "البحث",
  support: "الدعم الفني",
  help: "مركز المساعدة",
  login: "تسجيل الدخول",
  register: "إنشاء حساب",
  "forgot-password": "نسيت كلمة المرور",
  "reset-password": "إعادة تعيين كلمة المرور",
  "verify-otp": "التحقق برمز OTP",
  lock: "شاشة القفل",
  errors: "الأخطاء",
  maintenance: "الصيانة",
  "coming-soon": "قريباً",
  landing: "الصفحة الترحيبية",
  onboarding: "الإعداد الأولي",
  examples: "الأمثلة",
  "data-table": "جدول البيانات",
  charts: "المخططات",
  forms: "النماذج",
  components: "المكونات",
  "empty-states": "الحالات الفارغة",
  reports: "التقارير",
  new: "جديد",
  store: "المتجر",
  platform: "إدارة المنصة",
  companies: "الشركات",
  subscriptions: "اشتراكات المتاجر",
  site: "الموقع الرئيسي",
  media: "الوسائط",
  messages: "الرسائل",
  services: "الخدمات",
  portfolio: "معرض الأعمال",
  plan: "الاشتراك",
  edit: "تعديل",
};

const ID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((s) =>
    ID_SEGMENT.test(s) ? "التفاصيل" : (CRUMB_LABELS[s] ?? s.replace(/-/g, " "))
  );
}

export function AppHeader() {
  const crumbs = useBreadcrumb();
  const navGroups = useNavGroups();
  const router = useRouter();
  const isMac = useIsMac();
  const [open, setOpen] = React.useState(false);

  const go = React.useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ms-1" />
      <div className="me-1 h-5 w-px shrink-0 self-center bg-border" />
      <Breadcrumb className="hidden sm:block">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <BreadcrumbItem>
                <BreadcrumbPage
                  className={
                    i < crumbs.length - 1 ? "text-muted-foreground" : ""
                  }
                >
                  {c}
                </BreadcrumbPage>
              </BreadcrumbItem>
              {i < crumbs.length - 1 && <BreadcrumbSeparator />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ms-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          className="hidden h-9 w-56 justify-start gap-2 px-3 text-muted-foreground md:flex"
          onClick={() => setOpen(true)}
        >
          <IconSearch className="size-4" />
          <span className="text-sm">بحث…</span>
          <KbdGroup className="ms-auto">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <span className="text-[11px] font-medium text-muted-foreground">+</span>
            <Kbd>K</Kbd>
          </KbdGroup>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          onClick={() => setOpen(true)}
        >
          <IconSearch className="size-5" />
        </Button>

        <NotificationsMenu />
        <ThemeToggle />
        <CustomizerButton />
        <div className="mx-1 h-6 w-px shrink-0 self-center bg-border" />
        <UserMenu />
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="اكتب أمراً أو ابحث…" />
        <CommandList>
          <CommandEmpty>لا توجد نتائج.</CommandEmpty>
          {navGroups.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.flatMap((item) => {
                if (item.items?.length) {
                  return item.items.map((sub) => (
                    <CommandItem
                      key={sub.title}
                      value={`${item.title} ${sub.title}`}
                      onSelect={() => go(sub.url)}
                    >
                      {item.icon && <item.icon className="size-4" />}
                      <span className="min-w-0 flex-1 truncate">{sub.title}</span>
                    </CommandItem>
                  ));
                }
                return (
                  <CommandItem
                    key={item.title}
                    value={item.title}
                    onSelect={() => go(item.url ?? "#")}
                  >
                    {item.icon && <item.icon className="size-4" />}
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </header>
  );
}

function NotificationsMenu() {
  const [data, setData] = React.useState<{ unread: number; items: NotificationDto[] } | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const r = await listNotificationsApi();
      setData({ unread: r.unread, items: r.notifications.slice(0, 5) });
    } catch {
      setData({ unread: 0, items: [] });
    }
  }, []);

  React.useEffect(() => {
    void (async () => {
      await refresh();
    })();
    const t = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  return (
    <DropdownMenu onOpenChange={(o) => { if (o) void refresh(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="الإشعارات">
          <IconBell className="size-5" />
          {!!data?.unread && (
            <span className="absolute end-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-background">
              {data.unread > 9 ? "9+" : data.unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-1rem)] sm:w-80">
        <div className="px-2 py-1.5">
          <DropdownMenuLabel className="p-0">الإشعارات</DropdownMenuLabel>
        </div>
        <DropdownMenuSeparator />
        {(data?.items.length ?? 0) === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">لا إشعارات جديدة.</p>
        )}
        {data?.items.map((n) => (
          <DropdownMenuItem key={n.id} asChild className="items-start gap-2 py-2.5">
            <Link href={n.link ?? "/notifications"}>
              <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-primary"}`} />
              <div className="grid min-w-0 gap-0.5">
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                <p className="line-clamp-2 whitespace-normal text-xs text-muted-foreground">{n.body}</p>
                <span className="text-[11px] text-muted-foreground">{formatRelativeTime(n.createdAt)}</span>
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-sm font-medium">
          <Link href="/notifications">عرض كل الإشعارات</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const me = useIdentity();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5">
          <Avatar className="size-7">
            <AvatarImage src={me.avatar} alt={me.name} />
            <AvatarFallback>{me.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium lg:inline">{me.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="size-8 shrink-0">
            <AvatarImage src={me.avatar} alt={me.name} />
            <AvatarFallback>{me.initials}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0">
            <span className="truncate text-sm font-medium">{me.name}</span>
            <span className="truncate text-xs text-muted-foreground">{me.roleLabel} · {me.companyName}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <IconUserCircle className="size-4" /> الملف الشخصي
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <IconSettings className="size-4" /> الإعدادات
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => me.logout()}>
          <IconLogout className="size-4" /> تسجيل الخروج
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
