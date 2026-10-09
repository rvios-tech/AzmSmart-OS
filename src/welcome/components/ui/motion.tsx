"use client";
import { useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, reducedMotion } from "@/welcome/lib/gsap";

type Base = { className?: string; style?: CSSProperties; children?: ReactNode };

/**
 * عنوان يُكشف سطراً سطراً من خلف قناع.
 * immediate: يبدأ فور التحميل (للأبطال)، وإلا عند ظهوره في الشاشة.
 */
export function Lines({
  lines, as: Tag = "h2", className = "", immediate = false, delay = 0,
}: { lines: ReactNode[]; as?: ElementType; className?: string; immediate?: boolean; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    const spans = ref.current!.querySelectorAll(".mask > span");
    gsap.from(spans, {
      yPercent: 110, rotate: 1.5, duration: 1.4, stagger: 0.1, ease: "expo.out", delay,
      scrollTrigger: immediate ? undefined : { trigger: ref.current, start: "top 88%", once: true },
    });
  }, { scope: ref });
  return (
    <Tag ref={ref} className={className}>
      {lines.map((l, i) => (
        <span key={i} className="mask"><span>{l}</span></span>
      ))}
    </Tag>
  );
}

/** عناصر تصعد وتظهر بهدوء عند دخولها الشاشة */
export function Rise({ as: Tag = "div", className, style, children, delay = 0, immediate = false, stagger = 0.08 }: Base & { as?: ElementType; delay?: number; immediate?: boolean; stagger?: number }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    const el = ref.current!;
    const targets = el.querySelectorAll(":scope > [data-rise]");
    gsap.from(targets.length ? targets : el, {
      y: 28, opacity: 0, duration: 1.3, ease: "expo.out", delay, stagger,
      scrollTrigger: immediate ? undefined : { trigger: el, start: "top 90%", once: true },
    });
  }, { scope: ref });
  return <Tag ref={ref} className={className} style={style}>{children}</Tag>;
}

/** ستارة تكشف الصورة من الأسفل مع تقريب خفيف */
export function Curtain({ className = "", style, children, from = "bottom" }: Base & { from?: "bottom" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    const el = ref.current!;
    const inner = el.firstElementChild as HTMLElement | null;
    const start = from === "bottom" ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 0% 100%)";
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    tl.fromTo(el, { clipPath: start }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut" });
    if (inner) tl.fromTo(inner, { scale: 1.18 }, { scale: 1, duration: 2, ease: "expo.out" }, 0.1);
  }, { scope: ref });
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

/** انزياح عمودي بطيء مرتبط بالتمرير */
export function Parallax({ className, style, children, amount = 12 }: Base & { amount?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.fromTo(ref.current, { yPercent: amount }, {
      yPercent: -amount, ease: "none",
      scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: true },
    });
  }, { scope: ref });
  return <div ref={ref} className={className} style={style}>{children}</div>;
}

/** نص تمتلئ كلماته بالتدريج مع التمرير */
export function FillWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    gsap.to(ref.current!.querySelectorAll(".w"), {
      opacity: 1, stagger: 0.12, ease: "none",
      scrollTrigger: { trigger: ref.current, start: "top 80%", end: "bottom 50%", scrub: true },
    });
  }, { scope: ref });
  return (
    <p ref={ref} className={`fill-words ${className}`}>
      {text.split(/\s+/).map((w, i) => (
        <span key={i} className="w">{w} </span>
      ))}
    </p>
  );
}
