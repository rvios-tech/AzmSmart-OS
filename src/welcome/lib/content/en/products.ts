import { AZMSMART_URL, STOREOS_URL, contactUrl } from "../links";

import type { Product } from "../products";

export const products: Product[] = [
  {
    slug: "storeos",
    name: "RVIOS StoreOS",
    role: "The operating system for online stores",
    desc: "Build your online store yourself, manage products and orders in one place, and share your own store link with customers.",
    href: STOREOS_URL,
    cta: "Create your store",
    tone: "#D8373D",
  },
  {
    slug: "azmsmart",
    name: "AzmSmart",
    role: "Smart business management system",
    desc: "Sales, inventory, customers, finance, and HR in one connected system, designed for companies and retailers.",
    href: AZMSMART_URL,
    cta: "Explore AzmSmart",
    tone: "#E0B062",
  },
  {
    slug: "azm",
    name: "AZM",
    role: "Business management app",
    desc: "Keep track of your business from your phone with AZM: daily KPIs, instant alerts, and decisions anytime, anywhere.",
    href: contactUrl("azm"),
    cta: "Request a demo",
    tone: "#C8A45D",
  },
];
