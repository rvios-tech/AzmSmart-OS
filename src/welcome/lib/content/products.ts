import { AZMSMART_URL, STOREOS_URL, contactUrl } from "./links";

export type Product = {
  slug: string;
  name: string;
  role: string;
  desc: string;
  href: string;
  cta: string;
  tone: string;
};

export const products: Product[] = [
  {
    slug: "storeos",
    name: "RVIOS StoreOS",
    role: "نظام تشغيل المتاجر الإلكترونية",
    desc: "أنشئ متجرك الإلكتروني بنفسك، أدِر منتجاتك وطلباتك من مكان واحد، وشارك رابط متجرك الخاص مع عملائك.",
    href: STOREOS_URL,
    cta: "أنشئ متجرك",
    tone: "#D8373D",
  },
  {
    slug: "azmsmart",
    name: "RVIOS OS",
    role: "نظام ذكي لإدارة الأعمال",
    desc: "المبيعات والمخزون والعملاء والمالية والموارد البشرية في نظام واحد مترابط، مصمم للشركات والمتاجر.",
    href: AZMSMART_URL,
    cta: "استكشف RVIOS OS",
    tone: "#E0B062",
  },
  {
    slug: "azm",
    name: "تطبيق RVIOS",
    role: "تطبيق المتاجر والأعمال",
    desc: "أدِر متجرك وأعمالك من جوالك: الطلبات والمنتجات والعملاء، وتنبيهات فورية وقرارات في أي وقت ومن أي مكان.",
    href: contactUrl("azm"),
    cta: "اطلب عرضاً",
    tone: "#C8A45D",
  },
];
