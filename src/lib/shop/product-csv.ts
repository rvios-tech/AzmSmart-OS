import type { Product, ProductInput } from "@/lib/api/shop";

/**
 * استيراد المنتجات وتصديرها بملف CSV — صيغة واحدة للاتجاهين (التصدير ثم الاستيراد يعيد المتجر كما هو).
 * سطر لكل منتج، والمنتج ذو الخيارات سطر لكل خيار بالاسم نفسه. العناوين بالعربية أو الإنجليزية،
 * والفاصل «,» أو «;» (Excel العربي يحفظ بـ «;»).
 */
export const CSV_HEADERS = [
  "الاسم", "السعر", "السعر قبل الخصم", "الكمية", "التصنيف", "العلامة التجارية", "الوصف", "الصورة", "ظاهر", "اسم الخيار", "الخيار", "SKU",
] as const;

type Field = "name" | "price" | "oldPrice" | "qty" | "category" | "brand" | "description" | "image" | "live" | "optName" | "opt" | "sku";

const ALIASES: Record<Field, string[]> = {
  name: ["الاسم", "اسم المنتج", "name", "title", "product", "product name"],
  price: ["السعر", "price", "sale price"],
  oldPrice: ["السعر قبل الخصم", "السعر الأصلي", "old price", "old_price", "compare at price", "compare_at_price", "regular price"],
  qty: ["الكمية", "المخزون", "qty", "quantity", "stock", "inventory"],
  category: ["التصنيف", "الفئة", "القسم", "category", "type"],
  brand: ["العلامة التجارية", "العلامة", "الماركة", "brand", "vendor"],
  description: ["الوصف", "description", "body", "details"],
  image: ["الصورة", "رابط الصورة", "image", "image url", "image_url", "image src"],
  live: ["ظاهر", "منشور", "الحالة", "live", "visible", "published", "status"],
  optName: ["اسم الخيار", "option name", "option1 name", "option_name"],
  opt: ["الخيار", "option", "option value", "option1 value", "option_value", "variant"],
  sku: ["sku", "رمز المنتج", "رمز sku", "الرمز"],
};

/** CSV كما في RFC 4180: اقتباس مزدوج، وسطور داخل الخانة، و"" للاقتباس */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

const num = (v: string) => {
  // أرقام عربية-هندية وفواصل آلاف
  const s = v.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[,٬\s]/g, "").replace(/٫/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : NaN;
};
const truthy = (v: string) => !/^(0|no|false|لا|مخفي|غير ظاهر|draft|hidden)$/i.test(v.trim());
/** تزيل فاصلة الحماية التي يضيفها التصدير قبل ما يبدأ بـ = + - @ */
const clean = (v: string) => v.replace(/^'(?=[=+\-@])/, "").trim();

export interface ImportRow {
  line: number;
  input: ProductInput;
  category: string;
  /** للمطابقة مع منتج قائم بالاسم */
  name: string;
}
export interface ParseResult {
  rows: ImportRow[];
  errors: { line: number; message: string }[];
  missingHeaders: string[];
}

export function readProducts(text: string): ParseResult {
  const table = parseCsv(text);
  if (!table.length) return { rows: [], errors: [{ line: 1, message: "الملف فارغ" }], missingHeaders: [] };
  const head = table[0].map((h) => h.trim().toLowerCase());
  const col = Object.fromEntries(
    (Object.keys(ALIASES) as Field[]).map((f) => [f, head.findIndex((h) => ALIASES[f].some((a) => a.toLowerCase() === h))]),
  ) as Record<Field, number>;
  const missingHeaders = (["name", "price"] as Field[]).filter((f) => col[f] < 0).map((f) => ALIASES[f][0]);
  if (missingHeaders.length) return { rows: [], errors: [], missingHeaders };

  const errors: ParseResult["errors"] = [];
  const groups = new Map<string, ImportRow>();
  const order: ImportRow[] = [];
  table.slice(1).forEach((r, i) => {
    const line = i + 2;
    const get = (f: Field) => (col[f] >= 0 ? clean(r[col[f]] ?? "") : "");
    const name = get("name");
    if (!name) return errors.push({ line, message: "بلا اسم" });
    const price = num(get("price"));
    if (!(price >= 0)) return errors.push({ line, message: `«${name}»: السعر غير صالح` });
    const qtyRaw = get("qty");
    const qty = qtyRaw ? num(qtyRaw) : 0;
    const opt = get("opt");
    const key = name.toLowerCase();

    if (opt && groups.has(key)) {
      // خيار إضافي لمنتج قرأناه: يُضاف إلى خياراته
      const g = groups.get(key)!;
      g.input.variants!.push({ v1: opt.slice(0, 60), v2: "", qty: qty >= 0 ? qty : 0, sku: get("sku").slice(0, 60), live: true, price: price !== g.input.price ? price : null });
      return;
    }
    const old = num(get("oldPrice"));
    const image = get("image");
    const row: ImportRow = {
      line,
      name,
      category: get("category"),
      input: {
        name: name.slice(0, 120),
        price,
        ...(old > price ? { oldPrice: old } : {}),
        qty: qty >= 0 ? qty : 0,
        brand: get("brand").slice(0, 60),
        description: get("description").slice(0, 5000),
        live: get("live") ? truthy(get("live")) : true,
        ...(/^https:\/\/\S+$/.test(image) ? { images: [image] } : {}),
        ...(opt ? { opt1Name: (get("optName") || "الخيار").slice(0, 30), variants: [{ v1: opt.slice(0, 60), v2: "", qty: qty >= 0 ? qty : 0, sku: get("sku").slice(0, 60), live: true, price: null }] } : {}),
      },
    };
    if (image && !row.input.images) errors.push({ line, message: `«${name}»: رابط الصورة ليس https — أُهمل` });
    groups.set(key, row);
    order.push(row);
  });
  return { rows: order, errors, missingHeaders: [] };
}

/** منتجات المتجر بالصيغة نفسها — سطر لكل خيار */
export function productsToRows(products: Product[]): Array<Array<string | number>> {
  const out: Array<Array<string | number>> = [];
  for (const p of products) {
    const base = [p.name, p.price, p.oldPrice ?? "", p.qty, p.categoryName, p.brand, p.description, p.images[0] ?? p.image ?? "", p.live ? "نعم" : "لا"];
    if (p.hasVariants && p.variants.length) {
      for (const v of p.variants) {
        out.push([p.name, v.price ?? p.price, p.oldPrice ?? "", v.qty, p.categoryName, p.brand, p.description, p.images[0] ?? p.image ?? "", p.live ? "نعم" : "لا", p.opt1Name, [v.v1, v.v2].filter(Boolean).join(" / "), v.sku]);
      }
    } else out.push([...base, "", "", ""]);
  }
  return out;
}
