"use client";
import { useEffect, useRef, useState } from "react";
import { content } from "@/welcome/lib/content";
import { useLang } from "@/welcome/components/i18n/LangProvider";
import { useTilt } from "@/welcome/components/ui/useTilt";

const icons = [
  "M3 4h2l2.5 11h11L21 7H6.5M9 20a1 1 0 100-2 1 1 0 000 2M18 20a1 1 0 100-2 1 1 0 000 2",
  "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  "M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8",
  "M3 20h18M6 16V9M11 16V5M16 16v-4M21 16v-7",
  "M12 12a4 4 0 100-8 4 4 0 000 8M4 21c1-4 4-6 8-6s7 2 8 6",
  "M7 3h7l5 5v13H7zM14 3v5h5M10 17v-3M13 17v-5M16 17v-2",
];

/** لوحة تحكم AzmSmart الزجاجية. active اختياري للتحكم من الخارج */
export function Dashboard({ active, onChange, chips = true, tilt = true, className = "" }: {
  active?: number; onChange?: (i: number) => void; chips?: boolean; tilt?: boolean; className?: string;
}) {
  const lang = useLang();
  const { dashData, modules } = content(lang).azm;
  const [inner, setInner] = useState(0);
  const m = active ?? inner;
  const [shown, setShown] = useState(m);
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, tilt ? 7 : 0);

  // الخفوت مشتقّ: الوحدة المختارة لم تُعرض بعد ← تخفت اللوحة، ثم تُبدَّل بعد ٢٤٠ م.ث
  const fading = m !== shown;
  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setShown(m), 240);
    return () => clearTimeout(t);
  }, [m, fading]);

  const d = dashData[shown];
  const f = fading ? "out" : "";

  return (
    <div className={className}>
      <div ref={ref} className="dash glass" role="img" aria-label={`AzmSmart — ${dashData[m].t}`}>
        <aside>
          <span className="az">AZ</span>
          {icons.map((p, i) => <i key={i} className={i === m ? "on" : ""}><svg viewBox="0 0 24 24"><path d={p} /></svg></i>)}
        </aside>
        <div className="main">
          <div className="flex items-center justify-between gap-2.5">
            <h4 className={`fade serif text-[21px] ${f}`}>{d.t}</h4>
            <span className="text-[11px] text-mist">{lang === "ar" ? "متجر السعيد للعطور" : "Al-Saeed Perfumes"}</span>
          </div>
          <div className={`kpis fade ${f}`}>
            {d.k.map(([a, b]) => <div className="kpi" key={a}><span>{a}</span><b>{b}</b></div>)}
          </div>
          <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-[1.3fr_1fr]">
            <div className="pnl">
              <span className={`fade ${f}`}>{d.c}</span>
              <div className="bars">{dashData[m].b.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
            </div>
            <div className="pnl side">
              <span>{lang === "ar" ? "آخر التحديثات" : "Latest updates"}</span>
              <ul className={`dlist fade ${f}`}>
                {d.l.map((row) => <li key={row[0]}><span>{row[0]}</span><em className={row[2] ? "r" : ""}>{row[1]}</em></li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
      {chips && (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={lang === "ar" ? "وحدات النظام" : "System modules"}>
          {modules.map((mod, i) => (
            <button key={mod.key} className="opt" aria-pressed={i === m} onClick={() => { setInner(i); onChange?.(i); }}>{mod.title}</button>
          ))}
        </div>
      )}
    </div>
  );
}
