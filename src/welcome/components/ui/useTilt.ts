"use client";
import { useEffect, type RefObject } from "react";
import { gsap } from "@/welcome/lib/gsap";

/** إمالة ثلاثية الأبعاد خفيفة مع حركة المؤشر */
export function useTilt(ref: RefObject<HTMLElement | null>, amount = 8) {
  useEffect(() => {
    if (!amount || !matchMedia("(hover:hover)").matches) return;
    const el = ref.current;
    if (!el) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const x = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const y = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      gsap.to(el, { rotateY: x * amount, rotateX: -y * amount, transformPerspective: 1400, duration: 1, ease: "power3" });
    };
    addEventListener("pointermove", move);
    return () => removeEventListener("pointermove", move);
  }, [ref, amount]);
}
