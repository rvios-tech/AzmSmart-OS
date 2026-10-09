import type { Lang } from "@/welcome/lib/i18n/config";

export const site = {
  name: "RVIOS Technologies",
  short: "RVIOS",
  url: "https://rvios.com",
  email: "hello@rvios.com",
  whatsapp: "967739008083",
  whatsappDisplay: "+967 739 008 083",
  social: [
    { label: "Instagram", href: "https://instagram.com/0xo_0o" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/rayash-albureihi-0ba32a404" },
  ],
};

export const siteText = {
  ar: {
    tagline: "نبني الأنظمة. نطوّر الحلول. نمكّن الأعمال.",
    description:
      "RVIOS Technologies — نصمّم ونطوّر المواقع الإلكترونية والأنظمة وتطبيقات الويب والمتاجر الإلكترونية وصفحات الهبوط، ونتولى صيانتها وتطويرها. ومن منتجاتنا RVIOS StoreOS وAzmSmart وAZM.",
    city: "صنعاء، اليمن",
    wa: "مرحباً RVIOS، أود الحديث عن مشروع",
  },
  en: {
    tagline: "We build systems. We engineer solutions. We empower businesses.",
    description:
      "RVIOS Technologies designs and develops websites, web systems and apps, online stores and landing pages — and keeps them maintained and growing. Our products include RVIOS StoreOS, AzmSmart and AZM.",
    city: "Sana'a, Yemen",
    wa: "Hello RVIOS, I'd like to talk about a project",
  },
} satisfies Record<Lang, Record<string, string>>;

export const waLink = (lang: Lang, text?: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text ?? siteText[lang].wa)}`;
