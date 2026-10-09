"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconLock } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { updateStore, type Store } from "@/lib/api/shop";
import { useStore } from "@/lib/shop/store-context";

/** المضيف الذي تشير إليه سجلات DNS للتاجر — حيث تُنشر منصة المتاجر */
const DNS_TARGET = process.env.NEXT_PUBLIC_STOREFRONT_CNAME ?? "rvios.store";

/**
 * النطاق الخاص لواجهة المتجر (mystore.com بدل الرابط على rvios.store) — ميزة
 * الباقات المدفوعة. الخادم يطبّع ما يكتبه التاجر (بلا https ولا www ولا مسار)
 * ويرفض المحجوز والمأخوذ، ومنصة المتاجر تحلّ المضيف إلى المتجر في كل طلب.
 */
export function DomainCard({ store }: { store: Store }) {
  const { reload } = useStore();
  const locked = store.plan === "basic";
  const [value, setValue] = useState(store.savedCustomDomain ?? "");
  const [busy, setBusy] = useState(false);

  async function save(domain: string) {
    setBusy(true);
    try {
      const { store: next } = await updateStore(store.id, { customDomain: domain });
      setValue(next.savedCustomDomain ?? "");
      await reload();
      toast.success(domain ? "حُفظ النطاق — يعمل حين تنتشر سجلات DNS" : "أُزيل النطاق الخاص");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ النطاق.");
    } finally {
      setBusy(false);
    }
  }

  const dirty = value.trim() !== (store.savedCustomDomain ?? "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          النطاق الخاص
          {store.customDomain && <Badge variant="secondary">مفعّل</Badge>}
          {locked && <Badge variant="outline"><IconLock className="size-3" /> باقة مدفوعة</Badge>}
        </CardTitle>
        <CardDescription>اجعل متجرك يفتح على نطاقك أنت، مثل mystore.com.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {locked ? (
          <p className="text-sm text-muted-foreground">
            النطاق الخاص متاح في باقتي الاحترافية والأعمال.{" "}
            <Link href="/store/plan" className="font-medium text-primary underline-offset-4 hover:underline">رقِّ باقتك</Link>
            {store.savedCustomDomain && <> — نطاقك المحفوظ <span dir="ltr">{store.savedCustomDomain}</span> يعود للعمل فور الترقية.</>}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="custom-domain">النطاق</Label>
              <div className="flex flex-wrap gap-2">
                <Input
                  id="custom-domain" dir="ltr" className="min-w-0 flex-1" maxLength={253}
                  value={value} onChange={(e) => setValue(e.target.value)} placeholder="mystore.com"
                />
                <Button type="button" disabled={busy || !dirty || !value.trim()} onClick={() => void save(value)}>
                  {busy && <IconLoader2 className="size-4 animate-spin" />} حفظ النطاق
                </Button>
                {store.savedCustomDomain && (
                  <Button type="button" variant="outline" disabled={busy} onClick={() => void save("")}>إزالة</Button>
                )}
              </div>
            </div>
            <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">من لوحة مسجّل النطاق أضف:</p>
              <table className="w-full text-start" dir="ltr">
                <thead className="text-xs text-muted-foreground">
                  <tr><th className="py-1 text-start font-normal">Type</th><th className="py-1 text-start font-normal">Name</th><th className="py-1 text-start font-normal">Value</th></tr>
                </thead>
                <tbody className="font-mono">
                  <tr><td className="py-1">CNAME</td><td className="py-1">www</td><td className="py-1">{DNS_TARGET}</td></tr>
                  <tr><td className="py-1">ALIAS / CNAME</td><td className="py-1">@</td><td className="py-1">{DNS_TARGET}</td></tr>
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground">
                إن لم يدعم مسجّلك ALIAS على النطاق الجذر فاكتفِ بسجل www. انتشار السجلات قد يأخذ حتى يومين،
                ويبقى رابط متجرك الحالي يعمل في كل الأحوال.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
