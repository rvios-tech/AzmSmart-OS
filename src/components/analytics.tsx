import Script from "next/script";

import { GA_IDS, analyticsOn, gtagInit } from "@/lib/analytics";

/** وسم Google — في التخطيطين الجذريين (الترحيبية ولوحة التحكم). */
export function Analytics() {
  if (!analyticsOn) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_IDS[0]}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{gtagInit()}</Script>
    </>
  );
}
