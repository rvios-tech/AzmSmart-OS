"use client";
import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * رابط الصفحة الترحيبية — مسارات عزم سمارت بلا بادئة لغة (الدخول، التسجيل)،
 * والروابط المطلقة (موقع RVIOS، StoreOS) تمرّ كما هي.
 */
export function L({ href, ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  return <Link href={href} {...rest} />;
}
