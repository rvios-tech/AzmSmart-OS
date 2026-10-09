"use client";
import { useRef } from "react";
import { gsap, useGSAP, reducedMotion } from "@/welcome/lib/gsap";

import { useLang } from "@/welcome/components/i18n/LangProvider";



const ar = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة"];

export function Steps({ items }: { items: { title: string; desc: string }[] }) {
  const lang = useLang();
  const ref = useRef<HTMLOListElement>(null);
  useGSAP(() => {
    if (reducedMotion()) return;
    const mob = innerWidth <= 900;
    gsap.to(ref.current!.querySelector(".pl"), {
      [mob ? "scaleY" : "scaleX"]: 1, ease: "none",
      scrollTrigger: { trigger: ref.current, start: "top 78%", end: "bottom 55%", scrub: true },
    });
    gsap.from(ref.current!.querySelectorAll("li"), {
      opacity: 0, y: 24, duration: 1.2, stagger: 0.12, ease: "expo.out",
      scrollTrigger: { trigger: ref.current, start: "top 80%", once: true },
    });
  }, { scope: ref });
  return (
    <ol ref={ref} className="steps" style={{ ["--cols" as string]: items.length }}>
      <i className="pl" aria-hidden="true" />
      {items.map((s, i) => (
        <li key={s.title}><span className="n">{lang === "ar" ? `المرحلة ${ar[i]}` : `Phase ${String(i + 1).padStart(2, "0")}`}</span><h3>{s.title}</h3><p>{s.desc}</p></li>
      ))}
    </ol>
  );
}
