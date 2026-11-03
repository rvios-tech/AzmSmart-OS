import * as React from "react";

const noop = () => () => {};

function detect() {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/**
 * Detects whether the current device is an Apple platform (Mac / iOS) so
 * keyboard hints can show the right modifier — ⌘ on Mac, Ctrl on Windows/Linux.
 * The server snapshot is `true`; the client corrects it right after hydration.
 */
export function useIsMac() {
  return React.useSyncExternalStore(noop, detect, () => true);
}
