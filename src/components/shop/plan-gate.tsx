"use client";

import Link from "next/link";
import { IconCrown, IconLock } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Store } from "@/lib/api/shop";
import { minPlanFor, usePlans } from "@/lib/shop/plans";

/** هل باقة المتجر فيها الميزة؟ — قبل وصول المزايا من الخادم تُعدّ متاحة (الخادم يحكم على أي حال) */
export const hasFeature = (store: Pick<Store, "features"> | null | undefined, feature: string) => store?.features?.[feature] !== false;

/** بطاقة «رقِّ باقتك» — تُعرض بدل وحدة ليست في باقة المتجر */
export function UpgradeCard({ feature, compact }: { feature: string; compact?: boolean }) {
  const cat = usePlans();
  const f = cat?.features[feature];
  const need = minPlanFor(cat, feature);
  return (
    <Card className="border-dashed border-primary/40 bg-gradient-to-br from-primary/[0.06] to-transparent">
      <CardContent className={compact ? "flex flex-wrap items-center gap-3" : "flex flex-col items-center gap-3 py-12 text-center"}>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><IconLock className="size-6" /></span>
        <div className={compact ? "min-w-0 flex-1" : "max-w-md space-y-1"}>
          <p className="text-lg font-semibold">{f?.label ?? "هذه الميزة"} {need && cat ? <>متاحة من باقة <span className="text-primary">{cat.plans[need].name}</span></> : "في باقة أعلى"}</p>
          {f?.hint && <p className="text-sm text-muted-foreground">{f.hint}</p>}
        </div>
        <Button asChild><Link href="/store/plan"><IconCrown className="size-4" /> قارن الباقات ورقِّ متجرك</Link></Button>
      </CardContent>
    </Card>
  );
}

/** يعرض الوحدة إن كانت في الباقة، وإلا بطاقة الترقية */
export function PlanGate({ store, feature, children }: { store: Store; feature: string; children: React.ReactNode }) {
  return hasFeature(store, feature) ? <>{children}</> : <div className="py-6"><UpgradeCard feature={feature} /></div>;
}
