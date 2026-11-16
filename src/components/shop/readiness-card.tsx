"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronDown, IconCircleCheckFilled, IconCircleDashed, IconRocket } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getReadiness, type Readiness } from "@/lib/api/shop";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * «جاهزية متجرك»: نسبة الإنجاز والمهمة التالية، والقائمة كاملة عند الطلب. المهام يحسبها الخادم من
 * بيانات المتجر نفسها فتُنجَز وحدها. تختفي البطاقة حين يكتمل كل شيء.
 */
export function ReadinessCard({ storeId }: { storeId: string }) {
  const [r, setR] = useState<Readiness | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let on = true;
    getReadiness(storeId).then((x) => on && setR(x)).catch(() => {});
    return () => {
      on = false;
    };
  }, [storeId]);

  if (!r || r.percent >= 100) return null;
  const next = r.tasks.find((t) => t.key === r.next);

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex size-16 shrink-0 items-center justify-center">
            <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-muted" strokeWidth="3.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-primary transition-all" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={`${(r.percent / 100) * 97.4} 97.4`} />
            </svg>
            <span className="absolute text-sm font-bold tabular-nums">{formatNumber(r.percent)}٪</span>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold"><IconRocket className="size-4 text-primary" /> جاهزية متجرك</p>
            <p className="text-sm text-muted-foreground">
              {formatNumber(r.done)} من {formatNumber(r.total)} — {next ? <>التالي: <b className="text-foreground">{next.title}</b></> : "أحسنت!"}
            </p>
            <Progress value={r.percent} className="h-1.5 sm:hidden" />
          </div>
          <div className="flex gap-2">
            {next && <Button asChild size="sm"><Link href={next.link}>ابدأ الآن</Link></Button>}
            <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              كل المهام <IconChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
            </Button>
          </div>
        </div>
        {open && (
          <ul className="grid gap-1.5 border-t pt-3 sm:grid-cols-2">
            {r.tasks.map((t) => (
              <li key={t.key}>
                <Link href={t.link} className={cn("flex items-start gap-2 rounded-md p-2 text-sm hover:bg-muted", t.done && "opacity-60")}>
                  {t.done
                    ? <IconCircleCheckFilled className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    : <IconCircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
                  <span>
                    <span className={cn("block font-medium", t.done && "line-through")}>{t.title}</span>
                    {!t.done && <span className="block text-xs text-muted-foreground">{t.hint}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
