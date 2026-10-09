"use client";
import { useState } from "react";
import { content } from "@/welcome/lib/content";
import { useLang } from "@/welcome/components/i18n/LangProvider";
import { Dashboard } from "./Dashboard";

export function AzmModules() {
  const lang = useLang();
  const { modules } = content(lang).azm;
  const [m, setM] = useState(0);
  return (
    <div className="mt-16 grid items-start gap-12 lg:grid-cols-[1fr_1.25fr]">
      <ul className="border-t border-hair">
        {modules.map((mod, i) => (
          <li key={mod.key} className="border-b border-hair">
            <button onClick={() => setM(i)} onMouseEnter={() => setM(i)} aria-expanded={i === m} className="w-full py-5 text-start">
              <span className="flex items-baseline justify-between gap-4">
                <span className={`serif text-[clamp(26px,2.3vw,34px)] text-ivory transition-opacity duration-500 ${i === m ? "" : "opacity-35"}`}>{mod.title}</span>
                {lang === "ar" && <span className={`latin text-[11px] tracking-wider transition-colors ${i === m ? "text-gold" : "text-ivory/30"}`}>{mod.latin}</span>}
              </span>
              <span className={`grid transition-[grid-template-rows] duration-700 [transition-timing-function:var(--ease-out)] ${i === m ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <span className="overflow-hidden">
                  <span className="block pt-3 text-[15px] text-mist">{mod.desc}</span>
                  <span className="flex flex-wrap gap-x-5 gap-y-1 pt-4 text-[13px] text-gold/90">{mod.points.map((p) => <span key={p}>{p}</span>)}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="lg:sticky lg:top-[18vh]"><Dashboard active={m} onChange={setM} chips={false} /></div>
    </div>
  );
}
