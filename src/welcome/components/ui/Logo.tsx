import { LOGO_PATH } from "@/welcome/lib/stage/logo-path";

export function LogoMark({ className = "", stroke = false }: { className?: string; stroke?: boolean }) {
  return (
    <svg viewBox="0 0 209 114" className={className} aria-hidden="true">
      <path d={LOGO_PATH} fill={stroke ? "none" : "currentColor"} stroke={stroke ? "currentColor" : "none"} strokeWidth={stroke ? 0.8 : 0} strokeLinejoin="round" />
    </svg>
  );
}

/** الشعار + الاسم */
export function Lockup({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} dir="ltr">
      <LogoMark className="h-[19px] w-[35px] text-ruby" />
      <span className="text-[13px] font-medium tracking-[0.34em]">RVIOS</span>
    </span>
  );
}
