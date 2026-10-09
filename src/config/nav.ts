import {
  IconLayoutDashboard,
  IconChartBar,
  IconShoppingCart,
  IconUsers,
  IconCreditCard,
  IconBox,
  IconMessageCircle,
  IconLayoutKanban,
  IconCalendarEvent,
  IconChecklist,
  IconMail,
  IconUserCircle,
  IconSettings,
  IconTag,
  IconFileInvoice,
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
  IconCategory,
  IconPackages,
  IconDiscount2,
  IconTruck,
  IconStar,
  IconShoppingBag,
  IconShieldLock,
  IconAddressBook,
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
  { name: "عزم سمارت", plan: "مؤسسي", icon: IconSparkles },
  { name: "دار الخليج للتقنية", plan: "ناشئة", icon: IconRocket },
  { name: "مجموعة الأفق", plan: "مجاني", icon: IconWorld },
];

export type NavChild = { title: string; url: string };

export type NavItem = {
  title: string;
  url?: string;
  icon?: Icon;
  badge?: string;
  items?: NavChild[];
};

/**
 * من يرى المجموعة. `all` (الافتراضي) لكل مستخدم؛ الباقي بحسب `useWorkspace`:
 * `platform` فريق المنصة · `site` مدير الموقع الرئيسي · `store` صاحب متجر.
 * الإخفاء للرسم فقط — المنع الفعلي في الباكند.
 */
export type NavAudience = "all" | "platform" | "site" | "store";

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
      { title: "المتاجر", url: "/platform/stores", icon: IconShoppingBag },
      { title: "اشتراكات المتاجر", url: "/platform/subscriptions", icon: IconCalendarDollar },
      { title: "الفواتير", url: "/platform/invoices", icon: IconFileInvoice },
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
    items: [
      { title: "نظرة عامة", url: "/dashboard", icon: IconLayoutDashboard },
      { title: "التحليلات", url: "/dashboard/analytics", icon: IconChartBar },
      { title: "التقارير", url: "/reports", icon: IconReportAnalytics },
      {
        title: "المنتجات",
        icon: IconBox,
        items: [
          { title: "كل المنتجات", url: "/products" },
          { title: "إضافة منتج", url: "/products/new" },
        ],
      },
      { title: "الطلبات", url: "/orders", icon: IconShoppingCart },
      { title: "عملاء المتجر", url: "/store/customers", icon: IconUsers },
      { title: "التصنيفات", url: "/categories", icon: IconCategory },
      { title: "المخزون", url: "/inventory", icon: IconPackages },
      { title: "الشحن والتوصيل", url: "/shipping", icon: IconTruck },
      { title: "إعدادات المتجر", url: "/store/settings", icon: IconSettings },
      { title: "الاشتراك", url: "/store/plan", icon: IconTag },
    ],
  },
  {
    label: "مساحة العمل",
    items: [
      {
        title: "العملاء",
        icon: IconUsers,
        items: [
          { title: "كل العملاء", url: "/customers" },
          { title: "إضافة عميل", url: "/customers/new" },
        ],
      },
      {
        title: "الفواتير",
        icon: IconFileInvoice,
        items: [
          { title: "كل الفواتير", url: "/invoices" },
          { title: "فاتورة جديدة", url: "/invoices/new" },
        ],
      },
      { title: "المشاريع", url: "/projects", icon: IconFolders },
      { title: "الفريق", url: "/team", icon: IconUsersGroup },
      { title: "الأدوار والصلاحيات", url: "/roles", icon: IconShieldLock },
      { title: "جهات الاتصال", url: "/contacts", icon: IconAddressBook },
      { title: "النشاط", url: "/activity", icon: IconActivity },
    ],
  },
  {
    label: "التطبيقات",
    items: [
      { title: "المساعد الذكي", url: "/apps/ai-chat", icon: IconSparkles, badge: "جديد" },
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
    audience: "platform",
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
    audience: "platform",
    items: [
      { title: "الأسعار", url: "/pricing", icon: IconTag },
      { title: "نتائج البحث", url: "/search", icon: IconSearch },
      { title: "الدعم الفني", url: "/support", icon: IconLifebuoy },
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
    audience: "platform",
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
