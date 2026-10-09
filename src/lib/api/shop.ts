import { apiFetch } from "./client";

// ---------------------------------------------------------------------------
// منصة المتاجر — طبقة الاتصال بمسارات `/shop/*` في الباكند الموحّد.
//
// المبالغ أعداد صحيحة بوحدة العملة الأساسية (ريال لا هللة) كما يخزّنها
// الباكند، فلا `Decimal` نصّي هنا كما في الفواتير. العملة تُشتقّ من دولة
// المتجر (`store.currency`) ولا تُخزَّن.
// ---------------------------------------------------------------------------

export type Plan = "basic" | "plus" | "pro";

export interface Store {
  id: string;
  slug: string;
  name: string;
  sector: string;
  tagline: string;
  about: string;
  city: string;
  address: string;
  whatsapp: string;
  hours: string;
  logo: string;
  banner: string;
  showcase: string;
  color: string;
  colorDeep: string;
  theme: string;
  savedTheme: string;
  layout: string;
  savedLayout: string;
  /** قالب واجهة منصة المتاجر — الفعّال حسب الباقة */
  template: string;
  savedTemplate: string;
  /** القوالب المدفوعة المملوكة (مشتراة دفعة واحدة) */
  ownedTemplates: string[];
  /** النطاق الخاص الفعّال — `null` في الباقة المجانية حتى لو كان محفوظًا */
  customDomain: string | null;
  savedCustomDomain: string | null;
  plan: Plan;
  verified: boolean;
  /** 0=نشط · 1=موقوف */
  status: number;
  country: string;
  currency: string;
  deliveryFee: number;
  deliveryFreeOver: number;
  deliveryNote: string;
  payMethods: string;
  payNote: string;
  createdAt: string;
}

export interface StoresResponse {
  stores: Store[];
  slots: { owned: number; slots: number; free: number; max: number };
}

export interface CreateStoreInput {
  name: string;
  slug?: string;
  sector?: string;
  country?: string;
  whatsapp: string;
  city?: string;
  tagline?: string;
  color?: string;
  colorDeep?: string;
}

export type UpdateStoreInput = Partial<
  Pick<
    Store,
    | "name" | "tagline" | "about" | "city" | "address" | "hours" | "logo"
    | "banner" | "showcase" | "sector" | "color" | "colorDeep" | "theme"
    | "layout" | "country" | "whatsapp" | "slug" | "deliveryFee"
    | "deliveryFreeOver" | "deliveryNote" | "payNote" | "template"
  > & { payMethods: string[]; /** نصّ فارغ يحذف النطاق */ customDomain: string }
>;

export interface SlugCheck {
  slug: string;
  ok: boolean;
  reason: string;
  suggestion: string | null;
}

const s = (id: string) => `/shop/stores/${id}`;
const json = (body: unknown) => ({ body: JSON.stringify(body) });

// ── المتاجر ───────────────────────────────────────────────
export const listStores = () => apiFetch<StoresResponse>("/shop/stores");

export const getStore = (id: string) =>
  apiFetch<{ store: Store; plan: Plan }>(s(id));

export const createStore = (input: CreateStoreInput) =>
  apiFetch<{ store: Store }>("/shop/stores", { method: "POST", ...json(input) });

export const updateStore = (id: string, input: UpdateStoreInput) =>
  apiFetch<{ store: Store }>(s(id), { method: "PATCH", ...json(input) });

export const deleteStore = (id: string) =>
  apiFetch<{ ok: true }>(s(id), { method: "DELETE" });

export const checkSlug = (q: string, except?: string) =>
  apiFetch<SlugCheck>(
    `/shop/stores/slug/check?q=${encodeURIComponent(q)}${except ? `&except=${except}` : ""}`,
  );

// ── الكتالوج ──────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  sort: number;
  count: number;
}

export interface Variant {
  id?: string;
  v1: string;
  v2: string;
  price: number | null;
  qty: number;
  sku: string;
  /** صورة الخيار (لون مثلًا) — قالب «أتولييه» يعرضها في الشبكة */
  image?: string;
  live: boolean;
}

export interface Product {
  id: string;
  name: string;
  summary: string;
  description: string;
  variant: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  qty: number;
  lowStock: number;
  image: string;
  live: boolean;
  sort: number;
  categoryId: string | null;
  categoryName: string;
  hasVariants: boolean;
  opt1Name: string;
  opt2Name: string;
  images: string[];
  variants: Variant[];
  createdAt: string;
}

export interface ProductInput {
  name?: string;
  summary?: string;
  description?: string;
  variant?: string;
  brand?: string;
  opt1Name?: string;
  opt2Name?: string;
  price?: number;
  oldPrice?: number;
  qty?: number;
  lowStock?: number;
  live?: boolean;
  sort?: number;
  categoryId?: string | null;
  images?: string[];
  variants?: Array<Omit<Variant, "price"> & { price?: number | null }>;
}

export interface ProductsResponse {
  products: Product[];
  capacity: {
    used: number;
    max: number | null;
    canAdd: boolean;
    imagesPerProduct: number;
    variantsPerProduct: number | null;
  };
}

export const listCategories = (storeId: string) =>
  apiFetch<Category[]>(`${s(storeId)}/categories`);

export const createCategory = (
  storeId: string,
  input: { name: string; parentId?: string },
) =>
  apiFetch<Category>(`${s(storeId)}/categories`, { method: "POST", ...json(input) });

export const updateCategory = (
  storeId: string,
  id: string,
  input: { name?: string; sort?: number },
) =>
  apiFetch<Category>(`${s(storeId)}/categories/${id}`, {
    method: "PATCH",
    ...json(input),
  });

export const deleteCategory = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/categories/${id}`, { method: "DELETE" });

export const listProducts = (storeId: string) =>
  apiFetch<ProductsResponse>(`${s(storeId)}/products`);

export const getProduct = (storeId: string, id: string) =>
  apiFetch<Product>(`${s(storeId)}/products/${id}`);

export const createProduct = (storeId: string, input: ProductInput) =>
  apiFetch<Product>(`${s(storeId)}/products`, { method: "POST", ...json(input) });

export const updateProduct = (storeId: string, id: string, input: ProductInput) =>
  apiFetch<Product>(`${s(storeId)}/products/${id}`, {
    method: "PATCH",
    ...json(input),
  });

export const deleteProduct = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/products/${id}`, { method: "DELETE" });

// ── الطلبات والعملاء والتوصيل ─────────────────────────────
/** 0=قيد التأكيد · 1=مؤكد · 2=مكتمل · 3=ملغى */
export type OrderStatus = 0 | 1 | 2 | 3;

export interface OrderItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  productId: string | null;
}

export interface Order {
  id: string;
  ref: string;
  status: OrderStatus;
  statusLabel: string;
  /** 0=عند الاستلام · 1=بانتظار التحويل · 2=إيصال للمراجعة · 3=مدفوع */
  payStatus: number;
  payMethod: string;
  payProof: string;
  custName: string;
  custPhone: string;
  custAddress: string;
  note: string;
  zoneName: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
  wa: string;
}

export interface OrdersResponse {
  orders: Order[];
  page: number;
  pages: number;
  total: number;
  perPage: number;
  counts: Record<string, number>;
}

export const listOrders = (
  storeId: string,
  params: { status?: number; page?: number } = {},
) => {
  const q = new URLSearchParams();
  if (params.status !== undefined) q.set("status", String(params.status));
  if (params.page) q.set("page", String(params.page));
  const qs = q.toString();
  return apiFetch<OrdersResponse>(`${s(storeId)}/orders${qs ? `?${qs}` : ""}`);
};

export const getOrder = (storeId: string, id: string) =>
  apiFetch<Order>(`${s(storeId)}/orders/${id}`);

export const advanceOrder = (storeId: string, id: string, status: 1 | 2 | 3) =>
  apiFetch<Order>(`${s(storeId)}/orders/${id}`, {
    method: "PATCH",
    ...json({ status }),
  });

export const setOrderPayment = (storeId: string, id: string, paid: boolean) =>
  apiFetch<{ ok: true; payStatus: number }>(`${s(storeId)}/orders/${id}/payment`, {
    method: "PATCH",
    ...json({ paid }),
  });

export interface StoreCustomer {
  id: string;
  phone: string;
  name: string;
  address: string;
  firstAt: string;
  lastAt: string;
  ordersCount: number;
  spent: number;
  lastOrder: string | null;
}

export const listStoreCustomers = (storeId: string) =>
  apiFetch<{ customers: StoreCustomer[]; total: number; returning: number }>(
    `${s(storeId)}/customers`,
  );

export interface Zone {
  id: string;
  name: string;
  fee: number;
  freeOver: number;
  sort: number;
}

export const listZones = (storeId: string) =>
  apiFetch<{ zones: Zone[]; fallback: { fee: number; freeOver: number } }>(
    `${s(storeId)}/zones`,
  );

export const createZone = (
  storeId: string,
  input: { name: string; fee?: number; freeOver?: number },
) => apiFetch<Zone>(`${s(storeId)}/zones`, { method: "POST", ...json(input) });

export const updateZone = (
  storeId: string,
  id: string,
  input: { name?: string; fee?: number; freeOver?: number },
) =>
  apiFetch<Zone>(`${s(storeId)}/zones/${id}`, { method: "PATCH", ...json(input) });

export const deleteZone = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/zones/${id}`, { method: "DELETE" });

// ── النظرة العامة والتحليلات ──────────────────────────────
export interface LowStockItem {
  id: string;
  name: string;
  qty: number;
  lowStock: number;
  image: string;
}

export interface Overview {
  kpis: { pending: number; visits: number; products: number; confirmed: number };
  chart: Array<{ day: string; visits: number; orders: number }>;
  capacity: { used: number; max: number | null; pct: number; plan: Plan };
  recent: Order[];
  lowStock: LowStockItem[];
}

export interface Analytics {
  range: { days: number; from: string; to: string };
  totals: {
    orders: number;
    soldOrders: number;
    revenue: number;
    averageOrder: number;
    visits: number;
    conversion: number;
    cancelRate: number;
  };
  series: Array<{ day: string; orders: number; revenue: number; visits: number }>;
  byStatus: Record<string, number>;
  byPayMethod: Record<string, { orders: number; revenue: number }>;
  byZone: Record<string, { orders: number; revenue: number }>;
  topProducts: Array<{
    productId: string | null;
    name: string;
    qty: number;
    revenue: number;
  }>;
  customers: { buyers: number; returning: number; newBuyers: number };
  lowStock: LowStockItem[];
}

export const getOverview = (storeId: string) =>
  apiFetch<Overview>(`${s(storeId)}/overview`);

export const getAnalytics = (storeId: string, days = 30) =>
  apiFetch<Analytics>(`${s(storeId)}/analytics?days=${days}`);

// ── الاشتراك والفوترة (مسارات التاجر) ─────────────────────
export interface Subscription {
  storeRef: string;
  plan: Plan;
  status: number;
  currentPeriodEnd: string | null;
  daysLeft: number | null;
  effectivePlan: Plan;
  graceDays: number;
}

export interface Pricing {
  prices: { plus: number | null; pro: number | null };
  addons: {
    store_build: number | null;
    domain: number | null;
    extra_store: number | null;
  };
  yearlyMonthsFree: number;
  /** عملة الفوترة (ISO) — USD افتراضيًا */
  currency: string;
  /** بأسماء منصة المتاجر: احترافي = plus، أعمال = pro */
  plans?: Record<"free" | "pro" | "biz", { month: number | null; year: number | null }>;
  templates?: { id: string; tier: "free" | "standard" | "signature"; price: number }[];
  methods: Array<{ id: string; name: string; scope: string; instructions: string }>;
}

export interface ShopInvoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  /** 0=بانتظار الدفع · 1=قيد المراجعة · 2=مدفوعة · 3=مرفوضة */
  status: number;
  kind: number;
  plan: number | null;
  /** معرّف القالب لفواتير القوالب (kind=4) */
  item?: string | null;
  months: number | null;
  storeRef: string | null;
  method: string | null;
  proofKey: string | null;
  voidReason: string | null;
  dueAt: string | null;
  createdAt: string;
}

export const getSubscription = (storeId: string) =>
  apiFetch<Subscription>(`/shop/subscriptions/${storeId}`);

export const getPricing = () => apiFetch<Pricing>("/shop/billing/pricing");

export const listShopInvoices = (storeId: string) =>
  apiFetch<ShopInvoice[]>(`/shop/invoices?storeRef=${storeId}`);

export const createShopInvoice = (input: {
  storeRef: string;
  kind: 0 | 1 | 2 | 3 | 4;
  plan?: "plus" | "pro";
  months?: number;
  /** لفواتير القوالب */
  template?: string;
}) => apiFetch<ShopInvoice>("/shop/invoices", { method: "POST", ...json(input) });

export const submitInvoiceProof = (
  id: string,
  input: { method?: "kuraimi" | "jaib" | "paypal"; proofKey: string },
) =>
  apiFetch<ShopInvoice>(`/shop/invoices/${id}/proof`, {
    method: "POST",
    ...json(input),
  });

// ── التقييمات ────────────────────────────────────────────────────────────

/** 0=قيد المراجعة · 1=منشور · 2=مخفي */
export type ReviewStatus = 0 | 1 | 2;

export interface ShopReview {
  id: string;
  rating: number;
  name: string;
  body: string;
  reply: string;
  status: ReviewStatus;
  createdAt: string;
  product: { id: string; name: string; image: string };
}

export interface ReviewsList {
  reviews: ShopReview[];
  /** عدد كل حالة */
  counts: Partial<Record<ReviewStatus, number>>;
  /** متوسّط المنشور */
  average: number;
}

export const listReviews = (storeId: string, status?: ReviewStatus) =>
  apiFetch<ReviewsList>(`/shop/stores/${storeId}/reviews${status !== undefined ? `?status=${status}` : ""}`);

export const updateReview = (storeId: string, id: string, input: { status?: ReviewStatus; reply?: string }) =>
  apiFetch<ShopReview>(`/shop/stores/${storeId}/reviews/${id}`, { method: "PATCH", ...json(input) });
