import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/** عرض الشاشة يُقرأ من المتصفح مباشرة؛ الخادم يرسم نسخة الحاسوب */
export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, () => window.innerWidth < MOBILE_BREAKPOINT, () => false)
}
