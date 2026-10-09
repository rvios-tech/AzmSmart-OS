"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, reducedMotion } from "@/welcome/lib/gsap";
import { LogoMark } from "@/welcome/components/ui/Logo";
import { isFirstVisit } from "@/welcome/lib/session";

/** أول زيارة فقط: يُرسم الشعار بخط ذهبي، ثم يتبدد ليظهر الشعار الزجاجي */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!isFirstVisit() || reducedMotion()) { queueMicrotask(() => setShow(false)); return; }
    document.body.classList.add("busy");
    const path = ref.current!.querySelector("path")!;
    path.setAttribute("pathLength", "1");
    const tl = gsap.timeline({ onComplete: () => { document.body.classList.remove("busy"); setShow(false); } });
    tl.fromTo(path, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" })
      .from(ref.current!.querySelector("p"), { opacity: 0, y: 8, duration: 0.8, ease: "power2.out" }, 0.5)
      .to(ref.current!.querySelector("svg"), { scale: 1.08, opacity: 0, duration: 0.8, ease: "power2.in" }, 1.55)
      .to(ref.current!.querySelector("p"), { opacity: 0, duration: 0.5 }, 1.55)
      .to(ref.current, { opacity: 0, duration: 0.7, ease: "power2.inOut" }, 1.85);
    return () => { tl.kill(); document.body.classList.remove("busy"); };
  }, []);

  if (!show) return null;
  return (
    <div ref={ref} aria-hidden="true" className="fixed inset-0 z-[90] grid place-items-center bg-obsidian">
      <div className="grid place-items-center gap-8">
        <LogoMark stroke className="w-[min(36vw,260px)] text-gold" />
        <p className="latin text-[11px] tracking-[0.5em] text-ivory/50">AZMSMART · RVIOS</p>
      </div>
    </div>
  );
}
