"use client";
import { content } from "@/welcome/lib/content";
import { useLang } from "@/welcome/components/i18n/LangProvider";

/** مسار البيانات: نقطة ذهبية تسري بين المراحل */
export function Flow() {
  const { flow } = content(useLang()).azm;
  return (
    <div className="relative mt-16">
      <div className="absolute top-[22px] right-0 left-0 hidden h-px bg-ivory/15 md:block">
        <i className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_20px_5px_rgba(224,176,98,.55)] [animation:travel_4.5s_linear_infinite]" />
      </div>
      <ol className="grid gap-10 md:grid-cols-5 md:gap-6">
        {flow.map((f, i) => (
          <li key={f.title} className="relative">
            <span className="latin relative z-10 grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-obsidian text-[12px] text-gold">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="serif mt-6 text-[26px]">{f.title}</h3>
            <p className="mt-1.5 text-[15px] text-mist">{f.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
