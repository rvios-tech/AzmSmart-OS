"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getTheme, onTheme, setTheme, type Theme } from "@/welcome/lib/theme";
import { getLenis } from "./SmoothScroll";

/** أقسام الصفحة الترحيبية — روابط داخل الصفحة */
const NAV = [
  { href: "#azm-flow", label: "كيف يعمل" },
  { href: "#azm-modules", label: "الوحدات" },
  { href: "#azm-sectors", label: "لمن" },
  { href: "#azm-faq", label: "أسئلة شائعة" },
];

function ThemeIcon({ theme }: { theme: Theme }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.5]" aria-hidden="true">
      {theme === "dark" ? (
        <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" strokeLinejoin="round" />
      ) : (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** شعار عزم سمارت + الاسم */
export function AzmLockup() {
  return (
    <span className="inline-flex items-center gap-3" dir="ltr">
      <Image src="/brand/azmsmart-mark.svg" alt="" width={32} height={29} className="h-[29px] w-[32px]" priority />
      <span className="yap text-[15px] tracking-[0.08em]">AzmSmart</span>
    </span>
  );
}

/**
 * رأس الصفحة الترحيبية — بتصميم رأس موقع RVIOS (زجاجي، يختفي عند النزول،
 * ويتلوّن حسب القسم تحته)، لكن روابطه أقسام هذه الصفحة، وزرّاه يدخلان النظام.
 */
export function Header() {
  const [tone, setTone] = useState<"stage" | "light" | "dark">("stage");
  const [theme, setThemeState] = useState<Theme>("dark");
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);

  // الثيم من التخزين بعد التركيب لا أثناء التصيير — الخادم لا يرى localStorage
  useEffect(() => { queueMicrotask(() => setThemeState(getTheme())); return onTheme(setThemeState); }, []);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > 300 && y > last.current + 4);
      if (y < last.current - 4 || y < 300) setHidden(false);
      last.current = y;
      const els = document.elementsFromPoint(window.innerWidth / 2, 44);
      const sec = els.map((e) => e.closest("[data-tone]")).find(Boolean) as HTMLElement | undefined;
      setTone((sec?.dataset.tone as "stage" | "light" | "dark") ?? "stage");
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const l = getLenis();
    if (open) { l?.stop(); document.body.style.overflow = "hidden"; }
    else { l?.start(); document.body.style.overflow = ""; }
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  const ink = !open && (tone === "light" || (tone === "stage" && theme === "light"));
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 px-[var(--pad)] pt-4 transition-transform duration-700 [transition-timing-function:var(--ease-out)] ${hidden && !open ? "-translate-y-[130%]" : ""}`}
      >
        <div
          className={`mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-6 rounded-full ps-6 pe-3 transition-[background,border-color,box-shadow,color] duration-500 lg:ps-8 ${
            ink ? "text-[#171717]" : "text-[#FAF8ED]"
          } ${
            scrolled && !open
              ? ink
                ? "border border-[#171717]/10 bg-[#FCFBF7]/72 shadow-[0_20px_50px_-30px_rgba(23,23,23,.4)] backdrop-blur-xl"
                : "border border-[#FAF8ED]/10 bg-[#0E0D0D]/45 shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_20px_60px_-30px_rgba(0,0,0,.8)] backdrop-blur-xl"
              : "border border-transparent"
          }`}
        >
          <a href="#top" aria-label="AzmSmart — أعلى الصفحة" className="shrink-0"><AzmLockup /></a>
          <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="أقسام الصفحة">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="py-2 text-[14px] opacity-65 transition-opacity duration-300 hover:opacity-100">{n.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="ibtn" aria-label={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}>
              <ThemeIcon theme={theme} />
            </button>
            <Link href="/demo" className="hidden px-3 text-[14px] opacity-80 transition-opacity hover:opacity-100 md:inline">جرّب العرض</Link>
            <Link href="/login" className="hidden px-3 text-[14px] opacity-80 transition-opacity hover:opacity-100 sm:inline">دخول</Link>
            <Link href="/register" className={`btn ms-1 hidden h-11 px-6 text-[14px] sm:inline-flex ${ink ? "" : "btn-gold"}`}>ابدأ مجاناً</Link>
            <button className="ibtn lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="menu" aria-label={open ? "إغلاق" : "القائمة"}>
              <span className="grid w-5 gap-[6px]">
                <i className={`h-px bg-current transition-transform duration-500 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
                <i className={`h-px bg-current transition-transform duration-500 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="menu"
        className={`mat-dark fixed inset-0 z-40 flex flex-col justify-between bg-[#0E0D0D] px-[var(--pad)] pt-32 pb-10 text-ivory transition-[clip-path,visibility] duration-[900ms] [transition-timing-function:var(--ease)] ${
          open ? "visible [clip-path:inset(0)]" : "invisible [clip-path:inset(0_0_100%_0)]"
        }`}
      >
        <nav aria-label="القائمة">
          <ol className="grid gap-1">
            {NAV.map((n, i) => (
              <li key={n.href} className="overflow-hidden">
                <a
                  href={n.href} onClick={() => setOpen(false)}
                  className={`h2 block !leading-[1.3] text-ivory transition-[transform,opacity] duration-700 [transition-timing-function:var(--ease-out)] ${open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}`}
                  style={{ transitionDelay: open ? `${120 + i * 60}ms` : "0ms" }}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex flex-wrap gap-3 border-t border-hair pt-6">
          <Link href="/register" className="btn btn-gold">ابدأ مجاناً</Link>
          <Link href="/login" className="btn">دخول</Link>
          <Link href="/demo" className="btn">جرّب العرض التجريبي</Link>
        </div>
      </div>
    </>
  );
}
