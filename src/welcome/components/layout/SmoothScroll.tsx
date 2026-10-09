"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { gsap, ScrollTrigger, reducedMotion } from "@/welcome/lib/gsap";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

/** تمرير ناعم بوزن محسوس (Lenis) متزامن مع ScrollTrigger */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);
    if (reducedMotion()) return;
    lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), anchors: { offset: -20 }, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(raf);
    return () => { gsap.ticker.remove(raf); lenis?.destroy(); lenis = null; };
  }, []);

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
    const t = setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
