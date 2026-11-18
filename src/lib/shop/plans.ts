"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api/client";

/** الباقات الأربع كما يضبطها فريق المنصة — الأسعار لكل فترة بالريال، والحدود، والمزايا */
export const PLAN_ORDER = ["basic", "plus", "pro", "max"] as const;
export type PlanCode = (typeof PLAN_ORDER)[number];

export interface PlanLimits {
  products: number | null;
  imagesPerProduct: number;
  variantsPerProduct: number | null;
  subcategories: boolean;
  extraThemes: boolean;
  coupons: number | null;
}
export interface PlanInfo {
  name: string;
  tagline: string;
  highlight: boolean;
  prices: Record<string, number>;
  limits: PlanLimits;
  features: Record<string, boolean>;
}
export interface PlansCatalog {
  currency: string;
  periods: number[];
  plans: Record<PlanCode, PlanInfo>;
  features: Record<string, { label: string; group: string; hint: string }>;
  order: PlanCode[];
}

let cache: Promise<PlansCatalog> | null = null;
export const loadPlans = (fresh = false) => {
  if (!cache || fresh) cache = apiFetch<PlansCatalog>("/billing/plans").catch((e) => { cache = null; throw e; });
  return cache;
};

/** كتالوج الباقات مخبّأً للجلسة — للبطاقات المقفلة وصفحة الباقات */
export function usePlans() {
  const [data, setData] = useState<PlansCatalog | null>(null);
  useEffect(() => {
    let on = true;
    loadPlans().then((d) => on && setData(d), () => {});
    return () => { on = false; };
  }, []);
  return data;
}

/** أدنى باقة فيها الميزة */
export const minPlanFor = (cat: PlansCatalog | null, feature: string): PlanCode | null =>
  cat ? PLAN_ORDER.find((c) => cat.plans[c]?.features[feature]) ?? null : null;

/** الصفحة ← الميزة التي تقفلها (القائمة الجانبية تضع عليها قفلًا) */
export const FEATURE_OF_URL: Record<string, string> = {
  "/carts": "abandonedCarts",
  "/returns": "returns",
  "/orders/new": "manualOrders",
  "/shipping/carriers": "carriers",
  "/store/broadcasts": "broadcasts",
  "/reports/insights": "advancedReports",
  "/reports/visitors": "advancedReports",
  "/ai": "merchantAI",
};

export const periodLabel = (m: number) => (m === 12 ? "سنة" : m === 1 ? "شهر" : m === 2 ? "شهران" : m <= 10 ? `${m} أشهر` : `${m} شهرًا`);
