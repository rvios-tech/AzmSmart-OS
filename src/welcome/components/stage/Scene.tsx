"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { StageCfg } from "@/welcome/lib/stage/glass";
import { stage } from "@/welcome/lib/stage/store";

type Props = {
  id?: string;
  /** إعداد الشعار الزجاجي لهذا القسم (للأقسام الداكنة) */
  cfg?: StageCfg;
  /** dark: شفاف فوق المسرح — paper: عاجي — mat: لون مخصص عبر style */
  theme?: "dark" | "paper" | "mat";
  /** للأقسام mat: هل الخلفية داكنة؟ */
  dark?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

const HIDE: StageCfg = { d: { x: 0, y: 0, s: 1 }, hide: true };

/** قسم يوجّه الشعار الزجاجي حين يصل إلى منتصف الشاشة، ويخبر الرأس بلونه */
export function Scene({ id, cfg, theme = "dark", dark = true, className = "", style, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  const opaque = theme !== "dark";
  const light = theme === "paper" || (theme === "mat" && !dark);

  useEffect(() => {
    const el = ref.current!;
    const conf = opaque ? HIDE : cfg ?? { d: { x: 0, y: -9, s: 0.6 }, glow: 0 };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) stage.apply(conf); }, { rootMargin: "-50% 0px -50% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [cfg, opaque]);

  return (
    <section
      ref={ref}
      id={id}
      data-tone={light ? "light" : theme === "mat" ? "dark" : "stage"}
      className={`relative ${theme === "paper" ? "paper paper-theme" : ""} ${theme === "mat" ? (dark ? "mat-dark text-ivory" : "paper-theme text-ink") : ""} ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}
