"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconArrowDown, IconArrowUp, IconLoader2, IconPlus, IconRestore, IconTrash } from "@tabler/icons-react";

import { PayAccounts } from "@/components/pay-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { PayAccount, PayProvider } from "@/lib/api/platform-ops";

type Row = PayAccount;

/**
 * حسابات الاستلام التي يراها العملاء في صفحة «طرق الدفع» وفي فواتيرهم.
 * تُحفظ القائمة كاملة بترتيبها (`pay.accounts`)، و«استعادة الافتراضي» يعيد حسابات الكريمي وجيب وجوالي.
 */
export function PayAccountsEditor({
  initial,
  providers,
  onSaved,
}: {
  initial: PayAccount[];
  providers: PayProvider[];
  onSaved: (accounts: PayAccount[]) => void;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [saving, setSaving] = useState(false);
  const meta = (id: string) => providers.find((p) => p.id === id);

  const set = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const n = [...r];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  async function save(values: Row[] | null) {
    setSaving(true);
    try {
      const s = await apiFetch<{ accounts: PayAccount[] }>("/platform/settings", {
        method: "PATCH",
        body: JSON.stringify({
          values: {
            "pay.accounts": values?.map(({ id, provider, title, holder, number, currency, qr, note, enabled }) => ({ id, provider, title, holder, number, currency, qr, note, enabled })) ?? null,
          },
        }),
      });
      setRows(s.accounts);
      onSaved(s.accounts);
      toast.success(values ? "حُفظت حسابات الدفع" : "عادت الحسابات الافتراضية");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  const preview = rows.filter((r) => r.enabled).map((r) => ({ ...r, providerName: meta(r.provider)?.name, kind: meta(r.provider)?.kind, color: meta(r.provider)?.color }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>حسابات الدفع</CardTitle>
        <CardDescription>
          تظهر للعملاء في صفحة «طرق الدفع» على منصة المتاجر وفي صفحة الباقة والفواتير داخل حساباتهم: رقم الحساب أو المحفظة مع زر النسخ ورمز QR.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.id || i} className="space-y-3 rounded-xl border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="size-3 rounded-full" style={{ background: meta(r.provider)?.color ?? "#999" }} />
              <b className="text-sm">{meta(r.provider)?.name ?? r.provider}</b>
              <span className="text-xs text-muted-foreground">{r.title}</span>
              <label className="ms-auto flex items-center gap-1.5 text-xs">
                <Checkbox checked={r.enabled} onCheckedChange={(c) => set(i, { enabled: !!c })} /> ظاهر للعملاء
              </label>
              <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => move(i, -1)} aria-label="لأعلى"><IconArrowUp className="size-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="size-7" onClick={() => move(i, 1)} aria-label="لأسفل"><IconArrowDown className="size-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="size-7 text-destructive" onClick={() => setRows((x) => x.filter((_, k) => k !== i))} aria-label="حذف"><IconTrash className="size-4" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">المزوّد</Label>
                <Select value={r.provider} onValueChange={(p) => set(i, { provider: p })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{providers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">عنوان البطاقة</Label>
                <Input value={r.title} maxLength={80} onChange={(e) => set(i, { title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">رقم الحساب / المحفظة</Label>
                <Input dir="ltr" className="font-mono" value={r.number} maxLength={60} onChange={(e) => set(i, { number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">العملة</Label>
                <Select value={r.currency || "none"} onValueChange={(c) => set(i, { currency: (c === "none" ? "" : c) as Row["currency"] })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    <SelectItem value="YER">ريال يمني</SelectItem>
                    <SelectItem value="USD">دولار أمريكي</SelectItem>
                    <SelectItem value="SAR">ريال سعودي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">اسم صاحب الحساب</Label>
                <Input value={r.holder} maxLength={80} onChange={(e) => set(i, { holder: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">صورة رمز QR (رابط https أو /pay/…)</Label>
                <Input dir="ltr" value={r.qr} maxLength={600} placeholder="/pay/jaib-qr.png" onChange={(e) => set(i, { qr: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label className="text-xs">ملاحظة للعميل</Label>
                <Input value={r.note} maxLength={300} onChange={(e) => set(i, { note: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRows((r) => [...r, { id: "", provider: "kuraimi", title: "", holder: "", number: "", currency: "", qr: "", note: "", enabled: true }])}
          >
            <IconPlus className="size-4" /> حساب جديد
          </Button>
          <Button type="button" variant="ghost" disabled={saving} onClick={() => void save(null)}>
            <IconRestore className="size-4" /> استعادة الافتراضي
          </Button>
          <Button type="button" className="ms-auto" disabled={saving} onClick={() => void save(rows)}>
            {saving && <IconLoader2 className="size-4 animate-spin" />} حفظ الحسابات
          </Button>
        </div>
        {preview.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <div className="text-xs font-medium text-muted-foreground">معاينة كما يراها العميل</div>
            <PayAccounts accounts={preview} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
