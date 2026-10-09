"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconLoader2, IconLock } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { createShopInvoice, getPricing, updateStore, type Pricing, type Store } from "@/lib/api/shop";
import { formatBilling } from "@/lib/format";
import { STORE_TEMPLATES, TEMPLATE_TIER_LABEL, type TemplateTier } from "@/lib/shop/constants";
import { useStore } from "@/lib/shop/store-context";
import { cn } from "@/lib/utils";

/** نسبة سعر قوالب التوقيع في باقة الأعمال — مرآة `BIZ_SIGNATURE_RATE` في الخادم للعرض فقط */
const BIZ_SIGNATURE_RATE = 0.6;

/**
 * سعر القالب لهذا المتجر — للعرض فقط؛ الخادم يحسبه من جديد عند إصدار الفاتورة.
 * `null` = لا تسمح به الباقة، و`0` = متاح بلا شراء.
 */
function costOf(tier: TemplateTier, plan: Store["plan"], base: number): number | null {
  if (tier === "free") return 0;
  if (plan === "basic") return null;
  if (plan === "pro") return tier === "standard" ? 0 : Math.round(base * BIZ_SIGNATURE_RATE);
  return base;
}

/**
 * قالب واجهة المتجر في منصة المتاجر (RVIOS StoreOS): الحالي، والمملوك يُبدَّل
 * إليه فورًا، والمتاح للباقة بلا شراء، والمدفوع يُشترى دفعة واحدة بفاتورة
 * تُدفع وتُرفق إيصالها من صفحة الاشتراك — ويتفعّل القالب برفع الإيصال.
 */
export function TemplatePicker({ store }: { store: Store }) {
  const { reload } = useStore();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setPricing(await getPricing());
      } catch {
        /* الأسعار للعرض — بدونها تبقى القوالب قابلة للاختيار */
      }
    })();
  }, []);

  const price = (id: string) => pricing?.templates?.find((t) => t.id === id)?.price ?? 0;
  const currency = pricing?.currency ?? "USD";

  async function use(id: string) {
    setBusy(id);
    try {
      await updateStore(store.id, { template: id });
      await reload();
      toast.success("تغيّر قالب واجهة متجرك");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تغيير القالب.");
    } finally {
      setBusy(null);
    }
  }

  async function buy(id: string) {
    setBusy(id);
    try {
      await createShopInvoice({ storeRef: store.id, kind: 4, template: id });
      toast.success("أُنشئت فاتورة القالب — حوّل المبلغ وأرفق الإيصال من صفحة الاشتراك", {
        action: { label: "الاشتراك", onClick: () => (window.location.href = "/store/plan") },
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء الفاتورة.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>قالب الواجهة</CardTitle>
        <CardDescription>
          شكل متجرك في RVIOS StoreOS. القالب المملوك تبدّل إليه متى شئت، والمدفوع يُشترى مرة واحدة.
          {store.plan === "basic" && (
            <> القوالب المدفوعة تحتاج باقة مدفوعة — <Link href="/store/plan" className="text-primary underline underline-offset-4">رقِّ باقتك</Link>.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STORE_TEMPLATES.map((t) => {
            const current = store.template === t.id;
            const owned = t.tier === "free" || store.ownedTemplates.includes(t.id);
            const cost = owned ? 0 : costOf(t.tier, store.plan, price(t.id));
            return (
              <li
                key={t.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border p-3",
                  current && "border-primary bg-primary/5",
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium">{t.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="font-normal">{TEMPLATE_TIER_LABEL[t.tier]}</Badge>
                    {t.tier !== "free" && store.ownedTemplates.includes(t.id) && <span>مملوك</span>}
                    {!owned && cost === 0 && <span>مشمول في باقتك</span>}
                  </div>
                </div>
                {current ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-primary"><IconCheck className="size-4" /> الحالي</span>
                ) : cost === null ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><IconLock className="size-3.5" /> باقة مدفوعة</span>
                ) : cost === 0 ? (
                  <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void use(t.id)}>
                    {busy === t.id ? <IconLoader2 className="size-4 animate-spin" /> : "استخدم"}
                  </Button>
                ) : (
                  <Button size="sm" disabled={busy !== null} onClick={() => void buy(t.id)}>
                    {busy === t.id ? <IconLoader2 className="size-4 animate-spin" /> : `اشترِ ${formatBilling(cost, currency)}`}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
