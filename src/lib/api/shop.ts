import { apiFetch, uploadFile } from "./client";

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
  /** تعديلات «شكل المتجر» على القالب الأساسي */
  appearance: { copy?: Record<string, string>; hidden?: string[]; images?: Record<string, string>; fonts?: { display?: string; body?: string }; social?: Record<string, string>; extras?: import("@/components/shop/store-extras-panel").StoreExtras } | null;
  /** يُقفل المحرر بعد كل حفظ أسبوعًا — أو حتى يفتحه فريق RVIOS */
  appearanceLockedUntil: string | null;
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
  /** 0=نشط · 1=موقوف · 2=طلب بانتظار تفعيل فريق المنصة */
  status: number;
  country: string;
  currency: string;
  deliveryFee: number;
  deliveryFreeOver: number;
  /** برنامج المكافآت: ٪ من الطلب المكتمل لرصيد العميل (0 متوقف) */
  loyaltyRate: number;
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
  /** باقة مدفوعة: المتجر طلبٌ يفعّله فريق المنصة بعد الدفع، ومعه فاتورتا الباقة والقالب */
  plan?: "plus" | "pro";
  months?: 1 | 12;
  template?: string;
}

export type UpdateStoreInput = Partial<
  Pick<
    Store,
    | "name" | "tagline" | "about" | "city" | "address" | "hours" | "logo"
    | "banner" | "showcase" | "sector" | "color" | "colorDeep" | "theme"
    | "layout" | "country" | "whatsapp" | "slug" | "deliveryFee"
    | "deliveryFreeOver" | "deliveryNote" | "payNote" | "template" | "loyaltyRate"
  > & { payMethods: string[]; /** نصّ فارغ يحذف النطاق */ customDomain: string }
>;

export interface SlugCheck {
  slug: string;
  ok: boolean;
  reason: string;
  suggestion: string | null;
}

const s = (id: string) => `/shop/stores/${id}`;

// ── توثيق المتجر ──────────────────────────────────────────
/** 0 مسودة · 1 قيد المراجعة · 2 موثَّق · 3 مرفوض */
export type KycStatus = 0 | 1 | 2 | 3;
export type KycDocKind = "id_front" | "id_back" | "selfie" | "cr";
export interface KycDoc { id: string; kind: KycDocKind; size: number; createdAt?: string }
export interface Kyc {
  status: KycStatus | null;
  verified: boolean;
  kind: "person" | "business";
  legalName: string;
  crNumber: string;
  reviewNote: string;
  docs: KycDoc[];
  submittedAt: string | null;
  reviewedAt: string | null;
  keepDays?: number;
}
export const getKyc = (storeId: string) => apiFetch<Kyc>(`${s(storeId)}/kyc`);
export const saveKyc = (storeId: string, input: { kind: "person" | "business"; legalName: string; crNumber?: string }) =>
  apiFetch<Kyc>(`${s(storeId)}/kyc`, { method: "PUT", ...json(input) });
export const uploadKycDoc = (storeId: string, kind: KycDocKind, file: File) => uploadFile<Kyc>(`${s(storeId)}/kyc/docs?kind=${kind}`, file);
export const removeKycDoc = (storeId: string, docId: string) => apiFetch<Kyc>(`${s(storeId)}/kyc/docs/${docId}`, { method: "DELETE" });
export const submitKyc = (storeId: string) => apiFetch<Kyc>(`${s(storeId)}/kyc/submit`, { method: "POST" });
export const kycDocPath = (storeId: string, docId: string) => `${s(storeId)}/kyc/docs/${docId}`;
const json = (body: unknown) => ({ body: JSON.stringify(body) });

// ── المتاجر ───────────────────────────────────────────────
export const listStores = () => apiFetch<StoresResponse>("/shop/stores");

export const getStore = (id: string) =>
  apiFetch<{ store: Store; plan: Plan }>(s(id));

export const createStore = (input: CreateStoreInput) =>
  apiFetch<{ store: Store }>("/shop/stores", { method: "POST", ...json(input) });

export const updateStore = (id: string, input: UpdateStoreInput) =>
  apiFetch<{ store: Store }>(s(id), { method: "PATCH", ...json(input) });

/** شريط الإعلان والسياسات وزر واتساب ووصف البحث — بلا قفل الأسبوع */
export const saveStoreExtras = (id: string, extras: import("@/components/shop/store-extras-panel").StoreExtras) =>
  apiFetch<{ store: Store }>(`${s(id)}/extras`, { method: "PUT", ...json(extras) });

export interface SaveAppearanceInput {
  name?: string;
  color?: string;
  logo?: string;
  banner?: string;
  showcase?: string;
  copy?: Record<string, string>;
  hidden?: string[];
  images?: Record<string, string>;
  fonts?: { display?: string; body?: string };
  social?: Record<string, string>;
  deleteProducts?: string[];
  products?: { id?: string; name: string; price: number; oldPrice?: number; image?: string }[];
}

export const saveAppearance = (id: string, input: SaveAppearanceInput) =>
  apiFetch<{ store: Store }>(`${s(id)}/appearance`, { method: "PUT", ...json(input) });

/** `confirm` = رابط المتجر — يلزم لحذف المتجر الوحيد */
export const deleteStore = (id: string, confirm?: string) =>
  apiFetch<{ ok: true }>(`${s(id)}${confirm ? `?confirm=${encodeURIComponent(confirm)}` : ""}`, { method: "DELETE" });

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
  costPrice?: number | null;
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
  /** سعر التكلفة — خاص بالتاجر، ٠ يمحوه */
  costPrice?: number;
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
/** 0 قيد التأكيد · 1 مؤكد · 4 قيد التجهيز · 5 تم الشحن · 2 مكتمل · 3 ملغى */
export type OrderStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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
  /** قسيمة الخصم المطبّقة ومبلغها */
  couponCode: string;
  discount: number;
  /** سبب الإلغاء — يراه العميل في تتبّع طلبه */
  cancelReason?: string;
  /** الشحن: الشركة ورقم الشحنة ورابط تتبّعها */
  carrierName?: string;
  trackingNo?: string;
  trackUrl?: string;
  /** ما دفعه العميل من محفظته — جزء من الإجمالي */
  walletPaid?: number;
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
  params: { status?: number; page?: number; q?: string } = {},
) => apiFetch<OrdersResponse>(`${s(storeId)}/orders${orderQuery(params)}`);

export type ExportedOrder = Pick<Order,
  "ref" | "createdAt" | "status" | "payMethod" | "payStatus" | "custName" | "custPhone" | "custAddress"
  | "zoneName" | "note" | "subtotal" | "deliveryFee" | "total"> & Partial<Pick<Order, "couponCode" | "discount">> & { items: { name: string; qty: number }[] };

/** السجل كاملًا بالمرشّح الحالي (حتى ٥٠٠٠ طلب) — للمدير فأعلى */
export const exportOrders = (storeId: string, params: { status?: number; q?: string } = {}) =>
  apiFetch<{ orders: ExportedOrder[]; truncated: boolean }>(`${s(storeId)}/orders/export${orderQuery(params)}`);

function orderQuery(params: { status?: number; page?: number; q?: string }) {
  const q = new URLSearchParams();
  if (params.status !== undefined) q.set("status", String(params.status));
  if (params.page) q.set("page", String(params.page));
  if (params.q?.trim()) q.set("q", params.q.trim());
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export const getOrder = (storeId: string, id: string) =>
  apiFetch<Order>(`${s(storeId)}/orders/${id}`);

export const advanceOrder = (storeId: string, id: string, status: 1 | 2 | 3 | 4 | 5, reason?: string) =>
  apiFetch<Order>(`${s(storeId)}/orders/${id}`, {
    method: "PATCH",
    ...json({ status, ...(reason ? { reason } : {}) }),
  });

/** طلب يدوي (هاتف، واتساب، المحل) — نفس محرك طلب المتجر */
export interface ManualOrderInput {
  lines: { id: string; variantId?: string; qty: number }[];
  name?: string; phone?: string; address?: string; note?: string;
  zoneId?: string; payMethod?: string; coupon?: string;
  deliveryFee?: number; extraDiscount?: number; paid?: boolean; confirm?: boolean;
  /** يُخصم من رصيد مكافآت صاحب الجوال */
  pointsUsed?: number;
}
export const createManualOrder = (storeId: string, input: ManualOrderInput) =>
  apiFetch<Order>(`${s(storeId)}/orders`, { method: "POST", ...json(input) });

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
  /** رصيد المكافآت بعملة المتجر */
  points: number;
  /** رصيد المحفظة بعملة المتجر */
  wallet: number;
  /** له حساب في المتجر (أثبت رقمه برمز) */
  verifiedAt?: string | null;
}

export const getCustomerWallet = (storeId: string, customerId: string) =>
  apiFetch<{ customer: { id: string; name: string; phone: string; wallet: number }; history: PointsTx[] }>(`${s(storeId)}/customers/${customerId}/wallet`);
export const adjustCustomerWallet = (storeId: string, customerId: string, amount: number, note?: string) =>
  apiFetch<{ wallet: number }>(`${s(storeId)}/customers/${customerId}/wallet`, { method: "POST", ...json({ amount, note }) });

export type BroadcastAudience = "all" | "buyers" | "returning" | "accounts";
export interface Broadcast { id: string; title: string; body: string; link: string; audience: BroadcastAudience; recipients: number; sent: number; createdAt: string }
export const listBroadcasts = (storeId: string) =>
  apiFetch<{ broadcasts: Broadcast[]; audience: { all: number; accounts: number; buyers: number }; smsAvailable: boolean }>(`${s(storeId)}/broadcasts`);
export const sendBroadcast = (storeId: string, input: { title: string; body: string; link?: string; audience: BroadcastAudience; sms?: boolean }) =>
  apiFetch<Broadcast>(`${s(storeId)}/broadcasts`, { method: "POST", ...json(input) });

export interface PointsTx {
  id: string;
  amount: number;
  /** earn · redeem · revoke · adjust */
  kind: string;
  note: string;
  orderId: string | null;
  createdAt: string;
}
export const getCustomerPoints = (storeId: string, customerId: string) =>
  apiFetch<{ customer: { id: string; name: string; phone: string; points: number }; history: PointsTx[] }>(
    `${s(storeId)}/customers/${customerId}/points`,
  );
export const adjustCustomerPoints = (storeId: string, customerId: string, amount: number, note?: string) =>
  apiFetch<{ points: number }>(`${s(storeId)}/customers/${customerId}/points`, { method: "POST", ...json({ amount, note }) });

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

// ── السلات المتروكة ───────────────────────────────────────
export interface AbandonedCart {
  id: string; phone: string; name: string; subtotal: number; status: 0 | 1;
  items: { productId: string; name: string; qty: number; price: number }[];
  recoveredOrderId: string | null; remindedAt: string | null; updatedAt: string; wa: string;
}
export interface CartsResponse { carts: AbandonedCart[]; stats: { open: number; recovered: number; openValue: number; rate: number } }
export const listCarts = (storeId: string, recovered = false) => apiFetch<CartsResponse>(`${s(storeId)}/carts${recovered ? "?status=1" : ""}`);
export const markCartReminded = (storeId: string, id: string) => apiFetch<{ ok: true }>(`${s(storeId)}/carts/${id}/reminded`, { method: "POST" });
export const deleteCart = (storeId: string, id: string) => apiFetch<{ ok: true }>(`${s(storeId)}/carts/${id}`, { method: "DELETE" });

// ── سلة المحذوفات ─────────────────────────────────────────
export interface TrashItem { id: string; kind: "product"; refId: string; name: string; image: string; deletedAt: string; expiresAt: string }
export const listTrash = (storeId: string) => apiFetch<TrashItem[]>(`${s(storeId)}/trash`);
export const restoreTrash = (storeId: string, id: string) =>
  apiFetch<{ ok: true; productId: string }>(`${s(storeId)}/trash/${id}/restore`, { method: "POST" });
export const purgeTrash = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/trash/${id}`, { method: "DELETE" });
export const emptyTrash = (storeId: string) => apiFetch<{ ok: true; deleted: number }>(`${s(storeId)}/trash`, { method: "DELETE" });

// ── أقسام الرئيسية ────────────────────────────────────────
export type SectionSource = "best" | "new" | "sale" | "category" | "brand" | "manual";
export interface Section {
  id: string; title: string; subtitle: string; source: SectionSource; ref: string; productIds: string[];
  layout: "grid" | "row"; limit: number; sort: number; active: boolean;
}
export type SectionInput = Partial<Omit<Section, "id" | "sort">>;
export const listSections = (storeId: string) => apiFetch<Section[]>(`${s(storeId)}/sections`);
export const createSection = (storeId: string, input: SectionInput) =>
  apiFetch<Section>(`${s(storeId)}/sections`, { method: "POST", ...json(input) });
export const updateSection = (storeId: string, id: string, input: SectionInput) =>
  apiFetch<Section>(`${s(storeId)}/sections/${id}`, { method: "PATCH", ...json(input) });
export const reorderSections = (storeId: string, ids: string[]) =>
  apiFetch<Section[]>(`${s(storeId)}/sections/reorder`, { method: "POST", ...json({ ids }) });
export const deleteSection = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/sections/${id}`, { method: "DELETE" });

// ── الخيارات المحفوظة ─────────────────────────────────────
export interface OptionSet { id: string; name: string; values: string[] }
export const listOptionSets = (storeId: string) => apiFetch<OptionSet[]>(`${s(storeId)}/option-sets`);
export const saveOptionSet = (storeId: string, input: { name: string; values: string[] }) =>
  apiFetch<OptionSet>(`${s(storeId)}/option-sets`, { method: "POST", ...json(input) });
export const deleteOptionSet = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/option-sets/${id}`, { method: "DELETE" });

// ── المرتجعات ─────────────────────────────────────────────
/** 0 طلب العميل · 1 مقبول · 2 مرفوض · 3 مكتمل */
export interface ReturnRow {
  id: string; reason: string; status: 0 | 1 | 2 | 3; refund: number; restock: boolean; note: string;
  source: "customer" | "merchant"; createdAt: string;
  order: { id: string; ref: string; total: number; custName: string; custPhone: string; createdAt: string; items: { name: string; variant: string; qty: number; price: number }[] };
}
export interface ReturnsResponse { returns: ReturnRow[]; counts: Record<number, number> }
export const listReturns = (storeId: string, status?: number) =>
  apiFetch<ReturnsResponse>(`${s(storeId)}/returns${status !== undefined ? `?status=${status}` : ""}`);
export const updateReturn = (storeId: string, id: string, input: { status?: 1 | 2 | 3; refund?: number; restock?: boolean; note?: string; toWallet?: boolean }) =>
  apiFetch<ReturnRow>(`${s(storeId)}/returns/${id}`, { method: "PATCH", ...json(input) });
export const createReturn = (storeId: string, input: { orderId: string; reason?: string; refund?: number; restock?: boolean; complete?: boolean }) =>
  apiFetch<ReturnRow>(`${s(storeId)}/returns`, { method: "POST", ...json(input) });

// ── أسئلة المنتجات ────────────────────────────────────────
/** 0 بانتظار الإجابة · 1 منشور · 2 مخفي */
export interface Question {
  id: string; name: string; question: string; answer: string; status: 0 | 1 | 2;
  createdAt: string; answeredAt: string | null;
  product: { id: string; name: string; image: string };
}
export interface QuestionsResponse { questions: Question[]; counts: Record<number, number> }
export const listQuestions = (storeId: string, status?: number) =>
  apiFetch<QuestionsResponse>(`${s(storeId)}/questions${status !== undefined ? `?status=${status}` : ""}`);
export const answerQuestion = (storeId: string, id: string, input: { answer?: string; status?: 0 | 1 | 2 }) =>
  apiFetch<Question>(`${s(storeId)}/questions/${id}`, { method: "PATCH", ...json(input) });
export const deleteQuestion = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/questions/${id}`, { method: "DELETE" });

// ── جاهزية المتجر ─────────────────────────────────────────
export interface ReadinessTask { key: string; title: string; hint: string; done: boolean; link: string }
export interface Readiness { percent: number; done: number; total: number; next: string | null; tasks: ReadinessTask[] }
export const getReadiness = (storeId: string) => apiFetch<Readiness>(`${s(storeId)}/readiness`);

// ── قسائم الخصم ───────────────────────────────────────────
/** percent: نسبة (بسقف اختياري) · amount: مبلغ ثابت · ship: توصيل مجاني */
export type CouponKind = "percent" | "amount" | "ship";

export interface Coupon {
  id: string;
  code: string;
  kind: CouponKind;
  value: number;
  minSubtotal: number;
  maxDiscount: number;
  /** 0 = بلا حد */
  usageLimit: number;
  /** لكل رقم جوال — 0 = بلا حد */
  perCustomer: number;
  used: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  note: string;
  label: string;
  /** أثرها: الطلبات غير الملغاة بها، ومجموع ما خُصم، وإجمالي تلك الطلبات */
  orders: number;
  discounted: number;
  revenue: number;
  createdAt: string;
}

export interface CouponsResponse {
  coupons: Coupon[];
  /** المفعّلة معًا في الباقة — null بلا حد */
  limit: number | null;
  plan: string;
  planName: string;
  currency: string;
}

export type CouponInput = Partial<Pick<Coupon,
  "code" | "kind" | "value" | "minSubtotal" | "maxDiscount" | "usageLimit" | "perCustomer" | "active" | "note">> & {
  startsAt?: string | null;
  endsAt?: string | null;
};

export const listCoupons = (storeId: string) => apiFetch<CouponsResponse>(`${s(storeId)}/coupons`);

export const createCoupon = (storeId: string, input: CouponInput) =>
  apiFetch<Coupon>(`${s(storeId)}/coupons`, { method: "POST", ...json(input) });

export const updateCoupon = (storeId: string, id: string, input: CouponInput) =>
  apiFetch<Coupon>(`${s(storeId)}/coupons/${id}`, { method: "PATCH", ...json(input) });

export const deleteCoupon = (storeId: string, id: string) =>
  apiFetch<{ ok: true }>(`${s(storeId)}/coupons/${id}`, { method: "DELETE" });

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
    /** null حين لا تكلفة معروفة لأسطره */
    profit?: number | null;
  }>;
  /** ربح المنتجات من الأسطر معروفة التكلفة، وهامشه، ونسبة المبيعات التي تغطيها التكلفة */
  profit?: { amount: number; margin: number; coverage: number };
  customers: { buyers: number; returning: number; newBuyers: number };
  lowStock: LowStockItem[];
}

export const getOverview = (storeId: string) =>
  apiFetch<Overview>(`${s(storeId)}/overview`);

export interface Carrier { id: string; name: string; trackUrl: string; phone: string; active: boolean; orders: number }
export type CarrierInput = { name: string; trackUrl?: string; phone?: string; active?: boolean };
export const listCarriers = (storeId: string) => apiFetch<{ carriers: Carrier[] }>(`${s(storeId)}/carriers`);
export const createCarrier = (storeId: string, input: CarrierInput) => apiFetch<Carrier>(`${s(storeId)}/carriers`, { method: "POST", ...json(input) });
export const updateCarrier = (storeId: string, id: string, input: Partial<CarrierInput>) =>
  apiFetch<Carrier>(`${s(storeId)}/carriers/${id}`, { method: "PATCH", ...json(input) });
export const deleteCarrier = (storeId: string, id: string) => apiFetch<{ ok: true }>(`${s(storeId)}/carriers/${id}`, { method: "DELETE" });
export const setOrderShipping = (storeId: string, orderId: string, input: { carrierId?: string | null; trackingNo?: string }) =>
  apiFetch<{ carrierName: string; trackingNo: string; trackUrl: string }>(`${s(storeId)}/orders/${orderId}/shipping`, { method: "PATCH", ...json(input) });

export interface VisitorsReport {
  range: { days: number; from: string; to: string };
  totals: { visitors: number; views: number; avgDaily: number; pagesPerVisit: number };
  series: Array<{ day: string; visitors: number; views: number }>;
  devices: Record<string, number>;
  /** ٢٤ خانة بتوقيت بلد المتجر */
  hours: number[];
  /** الأحد أولًا */
  weekdays: number[];
  pages: Array<{ path: string; views: number; name: string | null }>;
  sources: Array<{ source: string; visitors: number }>;
}
export const getVisitors = (storeId: string, days = 30) =>
  apiFetch<VisitorsReport>(`${s(storeId)}/analytics/visitors?days=${days}`);

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
  /** حسابات الاستلام المعلنة (الكريمي، جيب، جوالي…) */
  accounts?: import("./platform-ops").PayAccount[];
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
  input: { method?: string; proofKey: string },
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
