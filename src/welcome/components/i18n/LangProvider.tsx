"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Lang } from "@/welcome/lib/i18n/config";

const Ctx = createContext<Lang>("ar");
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}
export const useLang = () => useContext(Ctx);
