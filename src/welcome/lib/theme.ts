"use client";
export type Theme = "dark" | "light";

export const getTheme = (): Theme =>
  typeof document !== "undefined" && document.documentElement.dataset.theme === "light" ? "light" : "dark";

/** يبدّل الثيم ويحفظه ويبلّغ المسرح ثلاثي الأبعاد */
export function setTheme(t: Theme) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("rv-theme", t); } catch {}
  window.dispatchEvent(new CustomEvent("rv-theme", { detail: t }));
}

export function onTheme(cb: (t: Theme) => void) {
  const h = (e: Event) => cb((e as CustomEvent<Theme>).detail);
  window.addEventListener("rv-theme", h);
  return () => window.removeEventListener("rv-theme", h);
}
