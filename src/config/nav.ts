import {
  IconWallet,
  IconLayoutDashboard,
  IconShoppingCart,
  IconUsers,
  IconBox,
  IconMessageCircle,
  IconLayoutKanban,
  IconCalendarEvent,
  IconChecklist,
  IconMail,
  IconUserCircle,
  IconPalette,
  IconSettings,
  IconTag,
  IconFileInvoice,
  IconInbox,
  IconUserShield,
  IconLockAccess,
  IconHelpCircle,
  IconSparkles,
  IconFolders,
  IconUsersGroup,
  IconActivity,
  IconPuzzle,
  IconBell,
  IconNotes,
  IconFolder,
  IconTable,
  IconChartPie,
  IconForms,
  IconComponents,
  IconMoodEmpty,
  IconRocket,
  IconWorld,
  IconAlertTriangle,
  IconReportAnalytics,
  IconTruck,
  IconDiscount2,
  IconRosetteDiscountCheck,
  IconShoppingBag,
  IconShieldLock,
  IconLifebuoy,
  IconCode,
  IconSearch,
  IconCoin,
  IconStethoscope,
  IconTruckDelivery,
  IconBriefcase,
  IconBuildingSkyscraper,
  IconCalendarDollar,
  type Icon,
} from "@tabler/icons-react";

export type Workspace = {
  name: string;
  plan: string;
  icon: Icon;
};

export const workspaces: Workspace[] = [
  { name: "RVIOS OS", plan: "مؤسسي", icon: IconSparkles },
  { name: "دار الخليج للتقنية", plan: "ناشئة", icon: IconRocket },
  { name: "مجموعة الأفق", plan: "مجاني", icon: IconWorld },
];

export type NavChild = { title: string; url: string; /** خارج باقة المتجر — قفل صغير */ locked?: boolean };

export type NavItem = {
  title: string;
  url?: string;
  icon?: Icon;
  badge?: string;
  items?: NavChild[];
  locked?: boolean;
};

/**
 * من يرى المجموعة. `all` (الافتراضي) لكل مستخدم؛ الباقي بحسب `useWorkspace`:
 * `platform` فريق المنصة · `site` مدير الموقع الرئيسي · `store` صاحب متجر.
 * `off` مخفيّة حتى تُفعَّل وحدتها (الصفحات تبقى بروابطها).
 * الإخفاء للرسم فقط — المنع الفعلي في الباكند.
 */
export type NavAudience = "all" | "platform" | "site" | "store" | "off";

export type NavGroup = {
  label: string;
  audience?: NavAudience;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "إدارة المنصة",
    audience: "platform",
    items: [
      { title: "نظرة عامة", url: "/platform", icon: IconLayoutDashboard },
      { title: "الشركات", url: "/platform/companies", icon: IconBuildingSkyscraper },
      { title: "التنبيهات", url: "/platform/alerts", icon: IconBell },
      { title: "طلبات المتاجر", url: "/platform/requests", icon: IconInbox },
      { title: "طلبات التوثيق", url: "/platform/verification", icon: IconRosetteDiscountCheck },
      { title: "تذاكر الدعم", url: "/platform/support", icon: IconLifebuoy },
      { title: "طلبات التصميم الخاص", url: "/platform/leads", icon: IconPalette },
      { title: "المتاجر", url: "/platform/stores", icon: IconShoppingBag },
      { title: "الباقات", url: "/platform/plans", icon: IconTag },
      { title: "اشتراكات المتاجر", url: "/platform/subscriptions", icon: IconCalendarDollar },
      { title: "الفواتير", url: "/platform/invoices", icon: IconFileInvoice },
      { title: "الحسابات", url: "/platform/users", icon: IconUserShield },
      { title: "RVIOS AI", url: "/platform/ai", icon: IconSparkles },
      { title: "الموقع والمدونة", url: "/platform/site", icon: IconWorld },
      { title: "إعدادات المنصة", url: "/platform/settings", icon: IconSettings },
    ],
  },
  {
    label: "الموقع الرئيسي",
    audience: "site",
    items: [
      { title: "نظرة عامة", url: "/site", icon: IconLayoutDashboard },
      { title: "المدونة", url: "/blog", icon: IconNotes },
      { title: "الخدمات", url: "/site/services", icon: IconBriefcase },
      { title: "معرض الأعمال", url: "/site/portfolio", icon: IconFolders },
      { title: "مكتبة الوسائط", url: "/site/media", icon: IconFolder },
      { title: "رسائل التواصل", url: "/site/messages", icon: IconMail },
      { title: "إعدادات الموقع", url: "/site/settings", icon: IconSettings },
    ],
  },
  {
    label: "المتجر",
    audience: "store",
    // مرتّبة بما يفعله التاجر كل يوم: الطلبات ثم المنتجات ثم العملاء والتسويق والتقارير
    items: [
      { title: "نظرة عامة", url: "/dashboard", icon: IconLayoutDashboard },
      { title: "RVIOS AI", url: "/ai", icon: IconSparkles, badge: "جديد" },
      {
        title: "الطلبات",
        icon: IconShoppingCart,
        items: [
          { title: "كل الطلبات", url: "/orders" },
          { title: "طلب جديد", url: "/orders/new" },
          { title: "المرتجعات", url: "/returns" },
          { title: "السلات المتروكة", url: "/carts" },
        ],
      },
      {
        title: "الكتالوج",
        icon: IconBox,
        items: [
          { title: "المنتجات", url: "/products" },
          { title: "إضافة منتج", url: "/products/new" },
          { title: "التصنيفات", url: "/categories" },
          { title: "المخزون", url: "/inventory" },
          { title: "أقسام الرئيسية", url: "/sections" },
          { title: "سلة المحذوفات", url: "/trash" },
        ],
      },
      {
        title: "العملاء",
        icon: IconUsers,
        items: [
          { title: "عملاء المتجر", url: "/store/customers" },
          { title: "إشعارات العملاء", url: "/store/broadcasts" },
          { title: "التقييمات", url: "/reviews" },
          { title: "أسئلة العملاء", url: "/questions" },
        ],
      },
      { title: "قسائم الخصم", url: "/discounts", icon: IconDiscount2 },
      {
        title: "التقارير",
        icon: IconReportAnalytics,
        items: [
          { title: "التحليلات", url: "/dashboard/analytics" },
          { title: "التقارير المفصّلة", url: "/reports/insights" },
          { title: "المبيعات والتصدير", url: "/reports" },
          { title: "الزوار", url: "/reports/visitors" },
        ],
      },
      {
        title: "الشحن",
        icon: IconTruck,
        items: [
          { title: "مناطق التوصيل", url: "/shipping" },
          { title: "شركات الشحن", url: "/shipping/carriers" },
        ],
      },
    ],
  },
  {
    label: "إعدادات المتجر",
    audience: "store",
    items: [
      { title: "الإعدادات", url: "/store/settings", icon: IconSettings },
      { title: "شكل المتجر", url: "/store/appearance", icon: IconPalette },
      { title: "الباقة والاشتراك", url: "/store/plan", icon: IconTag },
      { title: "المحفظة والمكافآت", url: "/store/wallet", icon: IconWallet },
      { title: "توثيق المتجر", url: "/store/verification", icon: IconRosetteDiscountCheck },
      { title: "الدعم الفني", url: "/support", icon: IconLifebuoy },
    ],
  },
  {
    label: "الفريق",
    items: [
      { title: "الفريق", url: "/team", icon: IconUsersGroup },
      { title: "الأدوار والصلاحيات", url: "/roles", icon: IconShieldLock },
      { title: "النشاط", url: "/activity", icon: IconActivity },
    ],
  },
  {
    label: "التطبيقات",
    // لا عمل لها بعد في حسابات المتاجر — تظهر حين تُفعَّل
    audience: "off",
    items: [
      { title: "المحادثات", url: "/apps/chat", icon: IconMessageCircle },
      { title: "البريد", url: "/apps/mail", icon: IconMail },
      { title: "التقويم", url: "/apps/calendar", icon: IconCalendarEvent },
      { title: "لوحة كانبان", url: "/apps/kanban", icon: IconLayoutKanban },
      { title: "المهام", url: "/apps/tasks", icon: IconChecklist },
      { title: "الملاحظات", url: "/apps/notes", icon: IconNotes },
      { title: "مدير الملفات", url: "/apps/file-manager", icon: IconFolder },
    ],
  },
  {
    label: "الحساب",
    items: [
      { title: "الملف الشخصي", url: "/profile", icon: IconUserCircle },
      { title: "الإعدادات", url: "/settings", icon: IconSettings },
      { title: "الإشعارات", url: "/notifications", icon: IconBell },
      { title: "المطورون", url: "/developers", icon: IconCode },
      { title: "التكاملات", url: "/integrations", icon: IconPuzzle },
    ],
  },
  {
    label: "لوحات القوالب",
    // صفحات عرض من قالب الواجهة الأصلي — ليست جزءًا من النظام
    audience: "off",
    items: [
      { title: "إدارة العملاء", url: "/dashboard/crm", icon: IconUsers },
      { title: "الأصول الرقمية", url: "/dashboard/crypto", icon: IconCoin, badge: "جديد" },
      { title: "الرعاية الصحية", url: "/dashboard/healthcare", icon: IconStethoscope },
      { title: "اللوجستيك", url: "/dashboard/logistics", icon: IconTruckDelivery },
      { title: "الموارد البشرية", url: "/dashboard/hr", icon: IconBriefcase },
      { title: "العقارات", url: "/dashboard/real-estate", icon: IconBuildingSkyscraper },
    ],
  },
  {
    label: "الصفحات",
    // صفحات عرض من قالب الواجهة الأصلي — ليست جزءًا من النظام
    audience: "off",
    items: [
      { title: "الأسعار", url: "/pricing", icon: IconTag },
      { title: "نتائج البحث", url: "/search", icon: IconSearch },
      { title: "مركز المساعدة", url: "/help", icon: IconHelpCircle },
      {
        title: "المصادقة",
        icon: IconLockAccess,
        items: [
          { title: "تسجيل الدخول", url: "/login" },
          { title: "إنشاء حساب", url: "/register" },
          { title: "نسيت كلمة المرور", url: "/forgot-password" },
          { title: "إعادة تعيين كلمة المرور", url: "/reset-password" },
          { title: "التحقق برمز OTP", url: "/verify-otp" },
          { title: "شاشة القفل", url: "/lock" },
        ],
      },
      {
        title: "صفحات الأخطاء",
        icon: IconAlertTriangle,
        items: [
          { title: "404 · غير موجود", url: "/errors/404" },
          { title: "403 · ممنوع", url: "/errors/403" },
          { title: "500 · خطأ في الخادم", url: "/errors/500" },
          { title: "503 · الخدمة غير متاحة", url: "/errors/503" },
          { title: "وضع الصيانة", url: "/maintenance" },
          { title: "قريباً", url: "/coming-soon" },
        ],
      },
    ],
  },
  {
    label: "واجهة المستخدم والأمثلة",
    // صفحات عرض من قالب الواجهة الأصلي — ليست جزءًا من النظام
    audience: "off",
    items: [
      { title: "جدول البيانات", url: "/examples/data-table", icon: IconTable },
      { title: "المخططات", url: "/examples/charts", icon: IconChartPie },
      { title: "تخطيطات النماذج", url: "/examples/forms", icon: IconForms },
      { title: "عناصر الواجهة", url: "/examples/components", icon: IconComponents },
      { title: "الحالات الفارغة", url: "/examples/empty-states", icon: IconMoodEmpty },
      { title: "الصفحة الترحيبية", url: "/", icon: IconWorld },
      { title: "الإعداد الأولي", url: "/onboarding", icon: IconRocket },
    ],
  },
];
