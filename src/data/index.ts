// ---------------------------------------------------------------------------
// بيانات توضيحية لنظام عزم سمارت – جميع الأرقام والمعلومات للأغراض التجريبية فقط.
// ---------------------------------------------------------------------------

export const revenueByMonth = [
  { month: "يناير", revenue: 186000, orders: 240, profit: 62000 },
  { month: "فبراير", revenue: 220500, orders: 298, profit: 74000 },
  { month: "مارس", revenue: 197000, orders: 271, profit: 68000 },
  { month: "أبريل", revenue: 273400, orders: 342, profit: 91000 },
  { month: "مايو", revenue: 312000, orders: 389, profit: 108000 },
  { month: "يونيو", revenue: 289000, orders: 361, profit: 96000 },
  { month: "يوليو", revenue: 348000, orders: 421, profit: 122000 },
  { month: "أغسطس", revenue: 381000, orders: 458, profit: 134000 },
  { month: "سبتمبر", revenue: 356000, orders: 432, profit: 126000 },
  { month: "أكتوبر", revenue: 423000, orders: 501, profit: 151000 },
  { month: "نوفمبر", revenue: 468000, orders: 548, profit: 168000 },
  { month: "ديسمبر", revenue: 524000, orders: 612, profit: 192000 },
];

export const visitorsByDay = [
  { date: "الإثنين", desktop: 1240, mobile: 980 },
  { date: "الثلاثاء", desktop: 1480, mobile: 1120 },
  { date: "الأربعاء", desktop: 1360, mobile: 1240 },
  { date: "الخميس", desktop: 1720, mobile: 1380 },
  { date: "الجمعة", desktop: 1920, mobile: 1560 },
  { date: "السبت", desktop: 1120, mobile: 1720 },
  { date: "الأحد", desktop: 980, mobile: 1480 },
];

export const trafficSources = [
  { source: "بحث طبيعي", value: 4820, fill: "var(--chart-1)" },
  { source: "مباشر", value: 3210, fill: "var(--chart-2)" },
  { source: "إحالة", value: 2140, fill: "var(--chart-3)" },
  { source: "تواصل اجتماعي", value: 1680, fill: "var(--chart-4)" },
  { source: "بريد إلكتروني", value: 940, fill: "var(--chart-5)" },
];

export const salesByCategory = [
  { category: "إلكترونيات", value: 38 },
  { category: "ملابس", value: 24 },
  { category: "منزل ومعيشة", value: 18 },
  { category: "جمال وعناية", value: 12 },
  { category: "أخرى", value: 8 },
];

export type StatCard = {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down";
  hint: string;
};

export const overviewStats: StatCard[] = [
  { label: "إجمالي الإيرادات", value: "1,065,000 ر.س", change: 12.5, trend: "up", hint: "مقارنة بالشهر الماضي" },
  { label: "عملاء جدد", value: "2,318", change: 8.2, trend: "up", hint: "مقارنة بالشهر الماضي" },
  { label: "حسابات نشطة", value: "18,472", change: 3.1, trend: "up", hint: "مقارنة بالشهر الماضي" },
  { label: "معدل الإلغاء", value: "1.8%", change: 0.4, trend: "down", hint: "مقارنة بالشهر الماضي" },
];

export const ecommerceStats: StatCard[] = [
  { label: "إجمالي المبيعات", value: "196,500 ر.س", change: 14.2, trend: "up", hint: "هذا الشهر" },
  { label: "الطلبات", value: "612", change: 9.7, trend: "up", hint: "هذا الشهر" },
  { label: "متوسط قيمة الطلب", value: "320 ر.س", change: 2.3, trend: "up", hint: "هذا الشهر" },
  { label: "المبالغ المستردة", value: "4,650 ر.س", change: 1.1, trend: "down", hint: "هذا الشهر" },
];

const firstNames = [
  "محمد", "أحمد", "عبدالله", "خالد", "سعد",
  "نورة", "سارة", "هند", "فاطمة", "ريم",
  "عمر", "يوسف", "إبراهيم", "علي", "ماجد",
  "منى", "لمى", "شيخة", "دانة", "مريم",
];
const lastNames = [
  "الراشدي", "العتيبي", "المطيري", "الشمري", "القحطاني",
  "الزهراني", "الغامدي", "الدوسري", "الحربي", "النعيمي",
  "المري", "الكعبي", "السعدي", "الفلاسي", "البلوشي",
  "الكندي", "الهاشمي", "العمري", "الجابري", "الصالح",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export type Customer = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  company: string;
  status: "نشط" | "غير نشط" | "معلق";
  plan: "مجاني" | "احترافي" | "مؤسسي";
  spent: number;
  location: string;
  joined: string;
};

const companies = [
  "دار الخليج للتقنية", "مجموعة الأفق", "شركة النخيل", "الريادة للحلول",
  "بوابة الخليج", "شركة الأمل", "تقنية المستقبل", "مؤسسة الابتكار",
  "الشركة العربية للبرمجيات", "دار النور", "مجموعة الرائد", "الحلول الذكية",
];
const locations = [
  "الرياض، السعودية", "دبي، الإمارات", "أبوظبي، الإمارات", "الكويت، الكويت",
  "مسقط، عُمان", "الدوحة، قطر", "المنامة، البحرين", "جدة، السعودية",
  "عمّان، الأردن", "بيروت، لبنان",
];
const plans: Customer["plan"][] = ["مجاني", "احترافي", "مؤسسي"];
const statuses: Customer["status"][] = ["نشط", "غير نشط", "معلق"];

export const customers: Customer[] = Array.from({ length: 48 }, (_, i) => {
  const first = pick(firstNames, i * 3);
  const last = pick(lastNames, i * 5 + 2);
  const name = `${first} ${last}`;
  return {
    id: `ZM-${(1042 + i).toString()}`,
    name,
    email: `${first.toLowerCase().replace(/[أإآا]/g, "a").replace(/[ة]/g, "h")}.${last.toLowerCase().replace(/ال/g, "al")}@${pick(companies, i).split(" ")[0].toLowerCase().replace(/[^a-z0-9]/g, "")}.sa`,
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${(i % 70) + 1}`,
    company: pick(companies, i),
    status: pick(statuses, i + (i % 4)),
    plan: pick(plans, i + (i % 3)),
    spent: 1800 + ((i * 137) % 34500),
    location: pick(locations, i * 2),
    joined: new Date(2024, i % 12, ((i * 7) % 27) + 1).toISOString().slice(0, 10),
  };
});

// المعرّفات تبقى بحروف لاتينية لأنها مفاتيح توجيه تظهر في الروابط، بينما
// كل النصوص المعروضة للمستخدم عربية.
export type Order = {
  id: string;
  customer: string;
  avatar: string;
  product: string;
  date: string;
  amount: number;
  status: "مدفوع" | "معلق" | "مسترد" | "فاشل";
  method: string;
};

const products = [
  "سماعة نور اللاسلكية", "لوحة مفاتيح ظفار", "ساعة رياضية سمارت", "شاشة بوابة 4K",
  "فأرة ألفا اللاسلكية", "مصباح ذكي لومن", "مكبر صوت صدى", "طائرة بدون طيار نسر",
  "شاحن سريع كوبالت", "حقيبة ظهر أطلس",
];
const methods = ["مدى", "فيزا", "ماستركارد", "آبل باي", "STC Pay"];
const orderStatuses: Order["status"][] = ["مدفوع", "معلق", "مسترد", "فاشل"];

export const orders: Order[] = Array.from({ length: 40 }, (_, i) => {
  const first = pick(firstNames, i * 2 + 1);
  const last = pick(lastNames, i * 3);
  return {
    id: `ORD-${7100 + i}`,
    customer: `${first} ${last}`,
    avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${((i + 12) % 70) + 1}`,
    product: pick(products, i),
    date: new Date(2026, 6, ((i * 3) % 27) + 1).toISOString().slice(0, 10),
    amount: 110 + ((i * 53) % 3500),
    status: pick(orderStatuses, i + (i % 5)),
    method: pick(methods, i),
  };
});

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sold: number;
  status: "متوفر" | "مخزون منخفض" | "نفد المخزون";
  image: string;
};

const categoryByProduct: Record<string, string> = {
  "سماعة نور اللاسلكية": "إلكترونيات",
  "لوحة مفاتيح ظفار": "إلكترونيات",
  "ساعة رياضية سمارت": "رياضة",
  "شاشة بوابة 4K": "إلكترونيات",
  "فأرة ألفا اللاسلكية": "إلكترونيات",
  "مصباح ذكي لومن": "منزل ومعيشة",
  "مكبر صوت صدى": "منزل ومعيشة",
  "طائرة بدون طيار نسر": "رياضة",
  "شاحن سريع كوبالت": "إلكترونيات",
  "حقيبة ظهر أطلس": "رياضة",
};

export const productList: Product[] = Array.from({ length: 24 }, (_, i) => {
  const stock = (i * 17) % 140;
  const name = pick(products, i);
  return {
    id: `PRD-${200 + i}`,
    name,
    category: categoryByProduct[name] ?? "إلكترونيات",
    price: 75 + ((i * 41) % 1800),
    stock,
    sold: 40 + ((i * 89) % 1200),
    status: stock === 0 ? "نفد المخزون" : stock < 20 ? "مخزون منخفض" : "متوفر",
    image: `https://api.dicebear.com/9.x/shapes/svg?seed=prd${i}`,
  };
});

export const topProducts = (() => {
  const seen = new Set<string>();
  return productList
    .slice()
    .sort((a, b) => b.sold - a.sold)
    .filter((p) => (seen.has(p.name) ? false : seen.add(p.name)))
    .slice(0, 5);
})();

export type Activity = {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
};

export const recentActivity: Activity[] = [
  { id: "a1", user: "محمد الراشدي", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=1", action: "أنشأ طلباً جديداً", target: "طلب ORD-7241", time: "قبل دقيقتين" },
  { id: "a2", user: "سارة العتيبي", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=12", action: "ترقّت إلى خطة", target: "مؤسسية", time: "قبل 18 دقيقة" },
  { id: "a3", user: "نورة المطيري", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=5", action: "أضافت تقييماً على", target: "ساعة رياضية سمارت", time: "قبل ساعة" },
  { id: "a4", user: "خالد الشمري", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=13", action: "طلب استرداد الطلب", target: "طلب ORD-7188", time: "قبل 3 ساعات" },
  { id: "a5", user: "هند القحطاني", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=9", action: "دعت زميلاً إلى", target: "دار الخليج للتقنية", time: "قبل 5 ساعات" },
  { id: "a6", user: "عمر الزهراني", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=15", action: "أكمل عملية الإعداد", target: "", time: "أمس" },
];

export const currentUser = {
  name: "أحمد العمري",
  email: "ahmed.alamri@azmsmart.sa",
  role: "مدير النظام",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=8",
};

// ---------------------------------------------------------------------------
// الفواتير
// ---------------------------------------------------------------------------

export type InvoiceItem = {
  description: string;
  qty: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  number: string;
  client: string;
  clientEmail: string;
  company: string;
  avatar: string;
  issued: string;
  due: string;
  status: "مدفوعة" | "معلقة" | "متأخرة" | "مسودة";
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  amount: number;
};

const lineItemCatalog = [
  { description: "خطة مؤسسية – ترخيص سنوي", unitPrice: 4500 },
  { description: "خطة احترافية – اشتراك شهري", unitPrice: 184 },
  { description: "مقاعد فريق إضافية", unitPrice: 56 },
  { description: "خدمات الإعداد والتطبيق", unitPrice: 2800 },
  { description: "دعم أولوي (SLA)", unitPrice: 1125 },
  { description: "تطوير تكامل مخصص", unitPrice: 1800 },
  { description: "إضافة التحليلات المتقدمة", unitPrice: 450 },
  { description: "مساحة تخزين إضافية (100 GB)", unitPrice: 94 },
];

const invoiceStatuses: Invoice["status"][] = ["مدفوعة", "معلقة", "متأخرة", "مسودة"];

export const invoices: Invoice[] = Array.from({ length: 14 }, (_, i) => {
  const cust = customers[(i * 3 + 1) % customers.length];
  const itemCount = (i % 3) + 1;
  const items: InvoiceItem[] = Array.from({ length: itemCount }, (_, j) => {
    const cat = lineItemCatalog[(i * 2 + j) % lineItemCatalog.length];
    return { description: cat.description, qty: ((i + j) % 4) + 1, unitPrice: cat.unitPrice };
  });
  const subtotal = items.reduce((a, b) => a + b.qty * b.unitPrice, 0);
  const tax = Math.round(subtotal * 0.15); // ضريبة القيمة المضافة 15%
  return {
    id: `INV-${2043 + i}`,
    number: `INV-${2043 + i}`,
    client: cust.name,
    clientEmail: cust.email,
    company: cust.company,
    avatar: cust.avatar,
    issued: new Date(2026, 5 + (i % 2), ((i * 5) % 27) + 1).toISOString().slice(0, 10),
    due: new Date(2026, 6 + (i % 2), ((i * 5) % 27) + 1).toISOString().slice(0, 10),
    status: invoiceStatuses[i % invoiceStatuses.length],
    items,
    subtotal,
    tax,
    amount: subtotal + tax,
  };
});

// ---------------------------------------------------------------------------
// دوال البحث (تُستخدم في صفحات التفاصيل)
// ---------------------------------------------------------------------------

export const getCustomerById = (id: string) =>
  customers.find((c) => c.id === id);

export const getOrderById = (id: string) => orders.find((o) => o.id === id);

export const getProductById = (id: string) =>
  productList.find((p) => p.id === id);

export const getInvoiceById = (id: string) =>
  invoices.find((inv) => inv.id === id);

export const company = {
  name: "عزم سمارت",
  email: "billing@azmsmart.sa",
  address: "طريق الملك فهد، برج المملكة، الدور 24",
  city: "الرياض 12214",
  country: "المملكة العربية السعودية",
  phone: "+966 11 555 0142",
  taxId: "SA-300482910573",
};

// ---------------------------------------------------------------------------
// أعضاء الفريق
// ---------------------------------------------------------------------------

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
  status: "نشط" | "بعيد" | "غير متصل";
  location: string;
};

export const team: TeamMember[] = [
  { id: "TM-01", name: "أحمد العمري", role: "رئيس المنتج", department: "المنتج", email: "ahmed.alamri@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=8", status: "نشط", location: "الرياض، السعودية" },
  { id: "TM-02", name: "سارة الراشدي", role: "مديرة النمو", department: "التسويق", email: "sara.alrashdi@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=32", status: "نشط", location: "دبي، الإمارات" },
  { id: "TM-03", name: "عبدالله الشمري", role: "مهندس أول", department: "الهندسة", email: "abdallah.alshammari@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=33", status: "بعيد", location: "أبوظبي، الإمارات" },
  { id: "TM-04", name: "نورة المطيري", role: "مصممة منتجات", department: "التصميم", email: "noura.almutairi@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=45", status: "نشط", location: "الرياض، السعودية" },
  { id: "TM-05", name: "خالد القحطاني", role: "مهندس خلفية", department: "الهندسة", email: "khalid.alqahtani@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=52", status: "غير متصل", location: "جدة، السعودية" },
  { id: "TM-06", name: "هند الزهراني", role: "قائدة نجاح العملاء", department: "نجاح العملاء", email: "hind.alzahrani@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=47", status: "نشط", location: "الدوحة، قطر" },
  { id: "TM-07", name: "فيصل الغامدي", role: "محلل بيانات", department: "البيانات", email: "faisal.alghamdi@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=59", status: "نشط", location: "الكويت، الكويت" },
  { id: "TM-08", name: "ريم الدوسري", role: "مهندسة واجهات", department: "الهندسة", email: "reem.aldosari@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=41", status: "بعيد", location: "المنامة، البحرين" },
  { id: "TM-09", name: "ماجد الحربي", role: "مهندس DevOps", department: "الهندسة", email: "majed.alharbi@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=60", status: "نشط", location: "مسقط، عُمان" },
  { id: "TM-10", name: "دانة النعيمي", role: "استراتيجية المحتوى", department: "التسويق", email: "dana.alnaimi@azmsmart.sa", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=44", status: "غير متصل", location: "عمّان، الأردن" },
];

export const getTeamMember = (i: number) => team[i % team.length];

// ---------------------------------------------------------------------------
// المشاريع والمهام
// ---------------------------------------------------------------------------

export type ProjectStatus = "على المسار" | "في خطر" | "متأخر" | "مكتمل";
export type TaskStatus = "متراكم" | "للتنفيذ" | "قيد التنفيذ" | "قيد المراجعة" | "مكتمل";
export type TaskPriority = "منخفضة" | "متوسطة" | "عالية" | "عاجلة";

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: TeamMember;
  labels: string[];
  projectId: string;
  start: string;
  due: string;
  points: number;
  comments: number;
  subtasks: { total: number; done: number };
};

export type Milestone = { title: string; date: string; done: boolean };

export type Project = {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  color: string;
  category: string;
  lead: TeamMember;
  members: TeamMember[];
  start: string;
  due: string;
  budget: number;
  spent: number;
  taskCounts: { total: number; done: number };
  milestones: Milestone[];
};

const projectSeeds = [
  { name: "تطبيق الجوال الجديد", key: "APP", category: "المنتج", color: "var(--chart-1)", status: "على المسار" as ProjectStatus, progress: 68, desc: "إعادة بناء تطبيق iOS وAndroid على نظام تصميم موحد مع دعم العمل دون اتصال." },
  { name: "منصة الفوترة v2", key: "BILL", category: "الهندسة", color: "var(--chart-2)", status: "في خطر" as ProjectStatus, progress: 42, desc: "ترحيل الفواتير والاشتراكات إلى محرك الفوترة الجديد المتدرج." },
  { name: "إعادة تصميم الموقع", key: "WEB", category: "التسويق", color: "var(--chart-3)", status: "على المسار" as ProjectStatus, progress: 81, desc: "تحديث موقع azmsmart.sa بهوية بصرية جديدة ونظام إدارة محتوى وصفحات محلية." },
  { name: "مستودع البيانات", key: "DATA", category: "البيانات", color: "var(--chart-4)", status: "متأخر" as ProjectStatus, progress: 34, desc: "دمج تحليلات المنتج في مستودع بيانات منظّم مع نماذج dbt." },
  { name: "تجربة الإعداد الجديدة", key: "ONB", category: "المنتج", color: "var(--chart-5)", status: "على المسار" as ProjectStatus, progress: 55, desc: "إعادة تصميم تدفق التفعيل لرفع معدل الاحتفاظ بالمستخدمين." },
  { name: "الامتثال لمعيار ISO 27001", key: "SEC", category: "الأمن", color: "var(--chart-1)", status: "مكتمل" as ProjectStatus, progress: 100, desc: "الحصول على شهادة ISO 27001 مع ضوابط مدققة وسياسات ومراقبة." },
];

export const projects: Project[] = projectSeeds.map((p, i) => {
  const memberCount = 3 + (i % 4);
  const members = Array.from({ length: memberCount }, (_, j) => getTeamMember(i + j));
  const total = 18 + ((i * 7) % 22);
  const done = Math.round((total * p.progress) / 100);
  return {
    id: `PRJ-${101 + i}`,
    name: p.name,
    key: p.key,
    description: p.desc,
    status: p.status,
    progress: p.progress,
    color: p.color,
    category: p.category,
    lead: getTeamMember(i),
    members,
    start: new Date(2026, 3 + (i % 3), ((i * 4) % 20) + 1).toISOString().slice(0, 10),
    due: new Date(2026, 8 + (i % 3), ((i * 6) % 25) + 1).toISOString().slice(0, 10),
    budget: 150000 + i * 56250,
    spent: Math.round((150000 + i * 56250) * (p.progress / 100) * 0.9),
    taskCounts: { total, done },
    milestones: [
      { title: "الإطلاق والاكتشاف", date: "2026-04-12", done: true },
      { title: "اعتماد التصميم", date: "2026-05-28", done: p.progress > 40 },
      { title: "إصدار تجريبي", date: "2026-07-15", done: p.progress > 70 },
      { title: "الإتاحة العامة", date: "2026-09-30", done: p.progress === 100 },
    ],
  };
});

export const getProjectById = (id: string) => projects.find((p) => p.id === id);

const taskTitles = [
  "تصميم قائمة تحقق الإعداد الجديدة", "إصلاح اختبارات تكامل المصادقة", "تطبيق أحداث الاستخدام المتدرج",
  "ترحيل ملفات PDF للفواتير القديمة", "إضافة الوضع الليلي للموقع التسويقي", "إعداد نماذج dbt للتدريج",
  "كتابة برمجية الوسيط لحد معدل API", "إرسال إشعارات الدفع", "إعادة تصميم صفحة الإعدادات",
  "إضافة دعم SSO / SAML", "قياس مسار التفعيل", "توطين صفحة الأسعار (EN/FR)",
  "بناء منطق إعادة محاولة webhooks الفوترة", "إنشاء Storybook للمكونات", "مراجعة إمكانية الوصول (WCAG AA)",
  "تحسين زمن استجابة استعلامات لوحة التحكم", "إضافة استيراد CSV جهات الاتصال", "إعداد دليل حوادث الطوارئ",
  "إعادة هيكلة الشريط الجانبي للتنقل", "صياغة سياسة الوصول ISO", "إضافة الحالات الفارغة في التطبيق",
  "ربط إشعارات Slack", "تحسين دقة البحث", "تقليل حجم الحزمة الأولية",
];
const allTaskStatuses: TaskStatus[] = ["متراكم", "للتنفيذ", "قيد التنفيذ", "قيد المراجعة", "مكتمل"];
const allPriorities: TaskPriority[] = ["منخفضة", "متوسطة", "عالية", "عاجلة"];
const labelPool = ["واجهة", "خلفية", "تصميم", "خطأ", "ميزة", "بنية", "توثيق", "بحث"];

export const projectTasks: Task[] = taskTitles.map((title, i) => {
  const project = projects[i % projects.length];
  const total = (i % 4) + 1;
  const statusIdx = i % allTaskStatuses.length;
  return {
    id: `TSK-${1200 + i}`,
    title,
    status: allTaskStatuses[statusIdx],
    priority: allPriorities[(i * 3) % allPriorities.length],
    assignee: getTeamMember(i + 2),
    labels: [labelPool[i % labelPool.length], labelPool[(i * 5 + 2) % labelPool.length]].filter((v, idx, a) => a.indexOf(v) === idx),
    projectId: project.id,
    start: new Date(2026, 6, ((i * 2) % 20) + 1).toISOString().slice(0, 10),
    due: new Date(2026, 6, ((i * 3) % 24) + 4).toISOString().slice(0, 10),
    points: [1, 2, 3, 5, 8][i % 5],
    comments: (i * 3) % 9,
    subtasks: { total, done: statusIdx === 4 ? total : i % (total + 1) },
  };
});

export const tasksForProject = (projectId: string) =>
  projectTasks.filter((t) => t.projectId === projectId);

// ---------------------------------------------------------------------------
// مدير الملفات
// ---------------------------------------------------------------------------

export type FileNode = {
  id: string;
  name: string;
  kind: "folder" | "image" | "document" | "video" | "audio" | "archive" | "code";
  size: string;
  modified: string;
  owner: TeamMember;
  items?: number;
  starred?: boolean;
};

export const files: FileNode[] = [
  { id: "F-01", name: "أصول العلامة التجارية", kind: "folder", size: "—", items: 128, modified: "2026-07-10", owner: getTeamMember(3), starred: true },
  { id: "F-02", name: "مواصفات المنتج", kind: "folder", size: "—", items: 64, modified: "2026-07-12", owner: getTeamMember(0) },
  { id: "F-03", name: "التسويق", kind: "folder", size: "—", items: 42, modified: "2026-07-08", owner: getTeamMember(1) },
  { id: "F-04", name: "الهندسة", kind: "folder", size: "—", items: 210, modified: "2026-07-14", owner: getTeamMember(2), starred: true },
  { id: "F-05", name: "خارطة-الطريق-Q3.pdf", kind: "document", size: "2.4 MB", modified: "2026-07-15", owner: getTeamMember(0) },
  { id: "F-06", name: "صورة-رئيسية-نهائية.png", kind: "image", size: "5.1 MB", modified: "2026-07-13", owner: getTeamMember(3) },
  { id: "F-07", name: "عرض-توضيحي.mp4", kind: "video", size: "84 MB", modified: "2026-07-11", owner: getTeamMember(1) },
  { id: "F-08", name: "خطط-الأسعار.xlsx", kind: "document", size: "412 KB", modified: "2026-07-09", owner: getTeamMember(6) },
  { id: "F-09", name: "حزمة-الشعارات.zip", kind: "archive", size: "18 MB", modified: "2026-07-07", owner: getTeamMember(3) },
  { id: "F-10", name: "مرجع-API.md", kind: "code", size: "96 KB", modified: "2026-07-14", owner: getTeamMember(2) },
  { id: "F-11", name: "تعليق-صوتي-إعداد.mp3", kind: "audio", size: "12 MB", modified: "2026-07-06", owner: getTeamMember(9) },
  { id: "F-12", name: "مقابلات-العملاء.pdf", kind: "document", size: "3.8 MB", modified: "2026-07-05", owner: getTeamMember(5) },
];

// ---------------------------------------------------------------------------
// التكاملات
// ---------------------------------------------------------------------------

export type Integration = {
  id: string;
  name: string;
  category: string;
  description: string;
  connected: boolean;
  initial: string;
  color: string;
};

export const integrations: Integration[] = [
  { id: "IN-01", name: "Slack", category: "التواصل", description: "احصل على تنبيهات وتحديثات في قنواتك.", connected: true, initial: "S", color: "oklch(0.62 0.19 25)" },
  { id: "IN-02", name: "GitHub", category: "المطورون", description: "ربط طلبات السحب والنشر.", connected: true, initial: "G", color: "oklch(0.4 0 0)" },
  { id: "IN-03", name: "Stripe", category: "المدفوعات", description: "مزامنة الفواتير والاشتراكات والمدفوعات.", connected: true, initial: "S", color: "oklch(0.55 0.2 285)" },
  { id: "IN-04", name: "Figma", category: "التصميم", description: "تضمين التصاميم والنماذج الأولية.", connected: false, initial: "F", color: "oklch(0.62 0.21 25)" },
  { id: "IN-05", name: "Notion", category: "الإنتاجية", description: "ربط الوثائق وقاعدة المعرفة.", connected: false, initial: "N", color: "oklch(0.3 0 0)" },
  { id: "IN-06", name: "Linear", category: "المطورون", description: "مزامنة ثنائية الاتجاه للمسائل والدورات.", connected: true, initial: "L", color: "oklch(0.55 0.22 275)" },
  { id: "IN-07", name: "Google Drive", category: "التخزين", description: "إرفاق الملفات من Drive.", connected: false, initial: "D", color: "oklch(0.7 0.17 145)" },
  { id: "IN-08", name: "Zoom", category: "التواصل", description: "بدء الاجتماعات من أي سجل.", connected: false, initial: "Z", color: "oklch(0.6 0.2 255)" },
  { id: "IN-09", name: "HubSpot", category: "التسويق", description: "مزامنة جهات الاتصال والحملات.", connected: false, initial: "H", color: "oklch(0.65 0.2 35)" },
  { id: "IN-10", name: "Jira", category: "المطورون", description: "استيراد الملاحم والدورات التطويرية.", connected: false, initial: "J", color: "oklch(0.58 0.2 260)" },
  { id: "IN-11", name: "Intercom", category: "الدعم", description: "عرض المحادثات بشكل مدمج.", connected: true, initial: "I", color: "oklch(0.6 0.18 245)" },
  { id: "IN-12", name: "Segment", category: "البيانات", description: "بث الأحداث إلى مستودع البيانات.", connected: false, initial: "S", color: "oklch(0.7 0.18 155)" },
];

// ---------------------------------------------------------------------------
// الإشعارات
// ---------------------------------------------------------------------------

export type NotificationKind = "mention" | "comment" | "assign" | "system" | "billing" | "deploy";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  actor?: TeamMember;
  time: string;
  read: boolean;
};

export const notifications: Notification[] = [
  { id: "N-01", kind: "mention", title: "نورة المطيري ذكرتك", description: '"@أحمد هل يمكنك مراجعة قائمة تحقق الإعداد الجديدة؟" في تطبيق الجوال الجديد', actor: getTeamMember(3), time: "قبل دقيقتين", read: false },
  { id: "N-02", kind: "assign", title: "مهمة جديدة موكلة إليك", description: 'تم تعيينك لـ "تطبيق أحداث الاستخدام المتدرج" في منصة الفوترة v2', actor: getTeamMember(2), time: "قبل 25 دقيقة", read: false },
  { id: "N-03", kind: "comment", title: "عبدالله الشمري علّق", description: 'ترك تعليقاً على "إضافة دعم SSO / SAML"', actor: getTeamMember(2), time: "قبل ساعة", read: false },
  { id: "N-04", kind: "deploy", title: "نشر ناجح", description: "web-app v2.14.0 تم نشره على الإنتاج في 3 دقائق و12 ثانية", time: "قبل ساعتين", read: true },
  { id: "N-05", kind: "billing", title: "تم استلام الدفعة", description: "تم دفع الفاتورة INV-2043 من دار الخليج للتقنية – 4,860 ر.س", time: "قبل 4 ساعات", read: true },
  { id: "N-06", kind: "system", title: "تسجيل دخول جديد", description: "تسجيل دخول جديد من Chrome على macOS في الرياض", time: "قبل 6 ساعات", read: true },
  { id: "N-07", kind: "comment", title: "سارة الراشدي علّقت", description: '"يبدو رائعاً — سنطلق الصفحات المحلية الأسبوع القادم."', actor: getTeamMember(1), time: "أمس", read: true },
  { id: "N-08", kind: "mention", title: "هند الزهراني ذكرتك", description: '"@أحمد سأل عميل عن خارطة الطريق للربع الثالث."', actor: getTeamMember(5), time: "أمس", read: true },
  { id: "N-09", kind: "assign", title: "اقتراب موعد معلم مشروع", description: '"الإصدار التجريبي" لتطبيق الجوال الجديد موعده بعد 3 أيام', time: "قبل يومين", read: true },
  { id: "N-10", kind: "system", title: "التخزين بلغ 82%", description: "مساحة العمل تقترب من حد التخزين المتاح", time: "قبل 3 أيام", read: true },
];

// ---------------------------------------------------------------------------
// الأصول الرقمية (لوحة التحكم المالي)
// ---------------------------------------------------------------------------

export type CryptoAsset = {
  symbol: string;
  name: string;
  chain: string;
  price: number;
  change24h: number;
  holdings: number;
  color: string;
  spark: number[];
};

export const cryptoAssets: CryptoAsset[] = [
  { symbol: "BTC", name: "Bitcoin", chain: "Bitcoin", price: 68214.32, change24h: 2.4, holdings: 0.684, color: "#F7931A", spark: [64100, 63800, 65200, 66100, 65700, 67300, 68214] },
  { symbol: "ETH", name: "Ethereum", chain: "Ethereum", price: 3541.08, change24h: 3.8, holdings: 9.2, color: "#627EEA", spark: [3280, 3325, 3298, 3410, 3388, 3472, 3541] },
  { symbol: "SOL", name: "Solana", chain: "Solana", price: 168.24, change24h: 7.1, holdings: 120, color: "#14B8A6", spark: [141, 148, 152, 149, 158, 163, 168] },
  { symbol: "BNB", name: "BNB", chain: "BNB Chain", price: 592.4, change24h: -1.2, holdings: 14, color: "#D9A400", spark: [612, 604, 598, 601, 595, 599, 592] },
  { symbol: "USDC", name: "USD Coin", chain: "Ethereum", price: 1.0, change24h: 0.0, holdings: 12000, color: "#2775CA", spark: [1, 1, 1, 1, 1, 1, 1] },
  { symbol: "XRP", name: "XRP", chain: "XRP Ledger", price: 0.62, change24h: -2.8, holdings: 9000, color: "#475569", spark: [0.66, 0.65, 0.64, 0.63, 0.64, 0.63, 0.62] },
  { symbol: "ADA", name: "Cardano", chain: "Cardano", price: 0.46, change24h: 4.2, holdings: 6500, color: "#2B6BE4", spark: [0.42, 0.43, 0.44, 0.43, 0.45, 0.45, 0.46] },
  { symbol: "POL", name: "Polygon", chain: "Polygon", price: 0.72, change24h: -3.4, holdings: 700, color: "#7C3AED", spark: [0.78, 0.76, 0.75, 0.74, 0.73, 0.74, 0.72] },
];

function genSeries(
  labels: string[],
  start: number,
  end: number,
  volatility: number,
  seed: number
): { t: string; value: number }[] {
  const n = labels.length;
  return labels.map((t, i) => {
    const p = n === 1 ? 1 : i / (n - 1);
    const trend = start + (end - start) * p;
    const wobble =
      Math.sin(i * 1.7 + seed) * volatility +
      Math.sin(i * 0.6 + seed * 2) * volatility * 0.5;
    return { t, value: Math.max(0, Math.round(trend + wobble)) };
  });
}

const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const days30 = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
const weekdays = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
const monthsYear = ["أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو"];

export const cryptoPortfolioRanges: Record<
  string,
  { t: string; value: number }[]
> = {
  "24H": genSeries(hours, 124600, 128420, 900, 1),
  "7D": genSeries(weekdays, 118200, 128420, 2200, 3),
  "30D": genSeries(days30, 96400, 128420, 3600, 5),
  "1Y": genSeries(monthsYear, 52800, 128420, 6400, 7),
};

export type CryptoTx = {
  id: string;
  type: "شراء" | "بيع" | "تبادل" | "إرسال" | "استلام" | "تخزين";
  asset: string;
  detail?: string;
  amount: number;
  value: number;
  time: string;
  status: "مكتملة" | "معلقة" | "فاشلة";
};

export const cryptoTransactions: CryptoTx[] = [
  { id: "TX-9F2A", type: "شراء", asset: "ETH", amount: 1.5, value: 5311.62, time: "قبل دقيقتين", status: "مكتملة" },
  { id: "TX-7C4B", type: "استلام", asset: "USDC", detail: "من 0x8f…3a91", amount: 2500, value: 2500, time: "قبل 18 دقيقة", status: "مكتملة" },
  { id: "TX-5A18", type: "تبادل", asset: "SOL", detail: "USDC → SOL", amount: 12.4, value: 2086.18, time: "قبل ساعة", status: "مكتملة" },
  { id: "TX-2E90", type: "تخزين", asset: "ETH", detail: "Lido", amount: 3.0, value: 10623.24, time: "قبل 3 ساعات", status: "مكتملة" },
  { id: "TX-1D77", type: "بيع", asset: "POL", amount: 1800, value: 1296, time: "قبل 5 ساعات", status: "مكتملة" },
  { id: "TX-8B03", type: "إرسال", asset: "BTC", detail: "إلى 0x1c…9d2f", amount: 0.05, value: 3410.72, time: "أمس", status: "مكتملة" },
  { id: "TX-6F55", type: "شراء", asset: "BTC", amount: 0.12, value: 8185.72, time: "أمس", status: "مكتملة" },
  { id: "TX-4A2C", type: "تبادل", asset: "ADA", detail: "XRP → ADA", amount: 4200, value: 1932, time: "قبل يومين", status: "معلقة" },
  { id: "TX-3E81", type: "استلام", asset: "SOL", detail: "من 0x4b…7e10", amount: 40, value: 6729.6, time: "قبل يومين", status: "مكتملة" },
  { id: "TX-0C6D", type: "بيع", asset: "BNB", amount: 6, value: 3554.4, time: "قبل 3 أيام", status: "فاشلة" },
];
