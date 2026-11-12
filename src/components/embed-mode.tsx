"use client";

import { useEffect } from "react";

/**
 * وضع «داخل التطبيق»: تطبيق RVIOS يفتح محرر شكل المتجر في متصفح مدمج بـ`?embed=1`
 * (ويحفظ `rv_embed` في التخزين). يُخفى إطار اللوحة — الشريط الجانبي والرأس — فيبقى
 * المحرر وحده بعرض الجوال. الإخفاء بالأنماط في `globals.css` على `html[data-embed]`.
 */
export function EmbedMode() {
  useEffect(() => {
    let on = false;
    try {
      const q = new URLSearchParams(window.location.search).get("embed");
      if (q === "1") window.localStorage.setItem("rv_embed", "1");
      if (q === "0") window.localStorage.removeItem("rv_embed");
      on = q === "1" || window.localStorage.getItem("rv_embed") === "1";
    } catch {}
    if (on) document.documentElement.dataset.embed = "1";
  }, []);
  return null;
}
