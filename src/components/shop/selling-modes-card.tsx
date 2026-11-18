"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconBuildingWarehouse, IconLock, IconSparkles } from "@tabler/icons-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import { updateStore, type Store } from "@/lib/api/shop";
import { useStore } from "@/lib/shop/store-context";
import { minPlanFor, usePlans } from "@/lib/shop/plans";
import { hasFeature } from "./plan-gate";

const MODES = [
  {
    key: "aiAssistant" as const, feature: "storeAI", icon: IconSparkles,
    title: "المساعد الذكي للمتسوّقين",
    desc: "مساعد في متجرك يجيب عملاءك ويقترح عليهم المنتج المناسب من منتجاتك، ويضيفه إلى السلة — على مدار الساعة.",
  },
  {
    key: "wholesale" as const, feature: "wholesale", icon: IconBuildingWarehouse,
    title: "وضع الجملة (بلا أسعار)",
    desc: "تختفي الأسعار من متجرك: يتصفح العميل المنتجات بكل تفاصيلها، ويحدد الكميات، ويرسل «طلب تسعير» يصل إلى طلباتك فتتواصل معه.",
  },
];

/** أوضاع البيع المتقدّمة — كل واحد ميزة باقة، ويُحفظ فور تبديله */
export function SellingModesCard({ store }: { store: Store }) {
  const { reload } = useStore();
  const cat = usePlans();
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(key: "aiAssistant" | "wholesale", on: boolean) {
    setBusy(key);
    try {
      await updateStore(store.id, { [key]: on });
      await reload();
      toast.success(on ? "فُعّل — يظهر في متجرك الآن" : "أُوقف");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر الحفظ.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>أوضاع البيع</CardTitle>
        <CardDescription>مزايا تغيّر طريقة البيع في متجرك.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {MODES.map((m) => {
          const ok = hasFeature(store, m.feature);
          const need = minPlanFor(cat, m.feature);
          return (
            <div key={m.key} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><m.icon className="size-5" /></span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{m.title}</p>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
                {!ok && (
                  <Link href="/store/plan" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    <IconLock className="size-3.5" /> متاحة من باقة {need && cat ? cat.plans[need].name : "أعلى"} — قارن الباقات
                  </Link>
                )}
              </div>
              <Switch checked={!!store[m.key] && ok} disabled={!ok || busy === m.key} onCheckedChange={(v) => void toggle(m.key, v)} aria-label={m.title} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
