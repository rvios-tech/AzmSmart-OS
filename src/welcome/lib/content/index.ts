import type { Lang } from "@/welcome/lib/i18n/config";
import * as arProducts from "./products";
import * as enProducts from "./en/products";
import * as arAzm from "./azm";
import * as enAzm from "./en/azm";

/**
 * محتوى الصفحة الترحيبية — منقول من موقع RVIOS الرئيسي (`F:\rvios-web`)
 * حيث صُمّمت الصفحة أولًا. الوحدات والأسئلة والقطاعات هنا، ومنتجات RVIOS
 * الأخرى للتذييل.
 */
export type { Product } from "./products";

const packs = {
  ar: { products: arProducts.products, azm: arAzm },
  en: { products: enProducts.products, azm: enAzm },
};

export const content = (lang: Lang) => packs[lang];
