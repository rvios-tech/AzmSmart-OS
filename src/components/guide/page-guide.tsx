"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  IconBrandWhatsapp, IconChartBar, IconCheck, IconClick, IconCrown, IconDeviceMobile, IconEye, IconHelpCircle, IconInbox,
  IconLayoutDashboard, IconLock, IconMenu2, IconPalette, IconPhoto, IconPlus, IconReceipt, IconBuildingStore, IconTags,
  IconUpload, IconUsers, IconHeadset, IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { guideFor, type Guide } from "./guides";

const ICONS: Record<string, typeof IconHelpCircle> = {
  layout: IconLayoutDashboard, menu: IconMenu2, device: IconDeviceMobile, photo: IconPhoto, tags: IconTags, eye: IconEye,
  receipt: IconReceipt, whatsapp: IconBrandWhatsapp, check: IconCheck, click: IconClick, plus: IconPlus, lock: IconLock,
  crown: IconCrown, upload: IconUpload, store: IconBuildingStore, palette: IconPalette, users: IconUsers, chart: IconChartBar,
  inbox: IconInbox, support: IconHeadset,
};

const KEY = (id: string) => `rv_guide_${id}`;
const OPEN_EVENT = "rv:guide-open";

/** يفتح إرشاد الصفحة الحالية من أي مكان (زرّ «؟» في الرأس) */
export function openPageGuide() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** يمحو ما رآه المستخدم فتظهر الإرشادات من جديد */
export function resetGuides() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("rv_guide_")).forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/**
 * نافذة الإرشاد: تُركَّب مرة في تخطيط اللوحة، وتعرض خطوات الصفحة الحالية أول زيارة لها.
 * بطاقة بخطوات تُقلَّب، رأسها متدرّج بلون الهوية، وتُغلق بـ«فهمت» أو Esc.
 */
export function PageGuide() {
  const path = usePathname();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [i, setI] = useState(0);

  const close = useCallback(() => {
    if (guide) {
      try {
        localStorage.setItem(KEY(guide.id), "1");
      } catch {}
    }
    setGuide(null);
  }, [guide]);

  // أول زيارة للصفحة
  useEffect(() => {
    const g = guideFor(path);
    if (!g) return;
    let seen = false;
    try {
      seen = localStorage.getItem(KEY(g.id)) === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => {
      setI(0);
      setGuide(g);
    }, 900);
    return () => clearTimeout(t);
  }, [path]);

  // «؟» في الرأس
  useEffect(() => {
    const open = () => {
      const g = guideFor(window.location.pathname);
      if (g) {
        setI(0);
        setGuide(g);
      }
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  useEffect(() => {
    if (!guide) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setI((x) => Math.min(guide.steps.length - 1, x + 1));
      if (e.key === "ArrowRight") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [guide, close]);

  if (!guide) return null;
  const step = guide.steps[i];
  const Icon = ICONS[step.icon] ?? IconHelpCircle;
  const last = i === guide.steps.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 backdrop-blur-[2px] animate-in fade-in sm:items-center" onClick={(e) => e.target === e.currentTarget && close()}>
      <div role="dialog" aria-modal="true" aria-label={guide.title} className="w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl animate-in slide-in-from-bottom-6 zoom-in-95 duration-300">
        <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#D12F36] via-[#8E1A1F] to-[#3B0B0D]">
          <span className="absolute -top-12 -end-10 size-44 rounded-full bg-white/10" />
          <span className="absolute -bottom-16 -start-8 size-36 rounded-full bg-amber-300/10" />
          <span className="absolute top-3 start-4 text-xs font-semibold text-white/70">{guide.title}</span>
          <button onClick={close} className="absolute top-2 end-2 rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="إغلاق">
            <IconX className="size-4" />
          </button>
          <div key={i} className="flex size-20 items-center justify-center rounded-full border border-white/30 bg-white/15 animate-in zoom-in-50 duration-300">
            <Icon className="size-9 text-white" stroke={1.6} />
          </div>
        </div>
        <div key={`t${i}`} className="space-y-2 px-6 pt-5 animate-in fade-in slide-in-from-left-2 duration-300">
          <h3 className="text-xl font-bold">{step.title}</h3>
          <p className="leading-7 text-muted-foreground">{step.body}</p>
        </div>
        <div className="flex items-center gap-2 px-6 pb-5 pt-5">
          <div className="flex gap-1.5">
            {guide.steps.map((_, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`الخطوة ${k + 1}`} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-primary" : "w-1.5 bg-primary/25")} />
            ))}
          </div>
          <div className="ms-auto flex gap-2">
            {!last && (
              <Button variant="ghost" size="sm" onClick={close}>
                تخطٍّ
              </Button>
            )}
            <Button size="sm" onClick={() => (last ? close() : setI(i + 1))}>
              {last ? "فهمت، لنبدأ" : "التالي"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** زرّ «؟» — يظهر في الصفحات التي لها إرشاد */
export function GuideButton({ className }: { className?: string }) {
  const path = usePathname();
  if (!guideFor(path)) return null;
  return (
    <Button variant="ghost" size="icon" className={className} onClick={openPageGuide} aria-label="كيف أستخدم هذه الصفحة؟" title="كيف أستخدم هذه الصفحة؟">
      <IconHelpCircle className="size-5" />
    </Button>
  );
}
