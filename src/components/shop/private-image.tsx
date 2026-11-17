"use client";

import { useEffect, useState } from "react";
import { IconLoader2, IconPhotoOff } from "@tabler/icons-react";

import { fetchBlobUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/** صورة خاصة (وثيقة توثيق) — تُجلب بالرمز وتُعرض من `blob:` ولا تُخبَّأ */
export function PrivateImage({ path, alt, className, onClick }: { path: string; alt: string; className?: string; onClick?: (url: string) => void }) {
  const [state, setState] = useState<{ path: string; url: string | null; failed: boolean }>({ path, url: null, failed: false });
  useEffect(() => {
    let url: string | null = null;
    let on = true;
    fetchBlobUrl(path).then(
      (u) => { url = u; if (on) setState({ path, url: u, failed: false }); else URL.revokeObjectURL(u); },
      () => on && setState({ path, url: null, failed: true }),
    );
    return () => { on = false; if (url) URL.revokeObjectURL(url); };
  }, [path]);
  const cur = state.path === path ? state : { url: null, failed: false };
  return (
    <div className={cn("flex items-center justify-center overflow-hidden rounded-md border bg-muted", className)}>
      {cur.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cur.url} alt={alt} className={cn("size-full object-contain", onClick && "cursor-zoom-in")} onClick={() => onClick?.(cur.url!)} />
      ) : cur.failed ? <IconPhotoOff className="size-5 text-muted-foreground" /> : <IconLoader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
