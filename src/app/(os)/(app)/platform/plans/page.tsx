"use client";

import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconDeviceFloppy, IconLoader2, IconPlus, IconRestore, IconX } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch, ApiError } from "@/lib/api/client";
import { formatBilling } from "@/lib/format";
import { PLAN_ORDER, periodLabel, type PlanCode, type PlansCatalog } from "@/lib/shop/plans";

const LIMITS: { key: "products" | "imagesPerProduct" | "variantsPerProduct" | "coupons"; label: string; nullable: boolean }[] = [
  { key: "products", label: "المنتجات", nullable: true },
  { key: "imagesPerProduct", label: "صور المنتج", nullable: false },
  { key: "variantsPerProduct", label: "خيارات المنتج", nullable: true },
  { key: "coupons", label: "القسائم المفعّلة", nullable: true },
];

/** الباقات الأربع: الأسعار لكل فترة، والحدود، والمزايا — تسري على كل المتاجر خلال دقيقة */
export default function PlatformPlansPage() {
  const [cfg, setCfg] = useState<PlansCatalog | null>(null);
  const [period, setPeriod] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { void apiFetch<PlansCatalog>("/platform/plans").then(setCfg, (e) => toast.error(e instanceof ApiError ? e.message : "تعذّر التحميل.")); }, []);
  if (!cfg) return <div className="flex h-60 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>;

  const change = (fn: (c: PlansCatalog) => void) => { const next = structuredClone(cfg); fn(next); setCfg(next); setDirty(true); };
  const groups = [...new Set(Object.values(cfg.features).map((f) => f.group))];

  async function save(reset = false) {
    if (reset && !window.confirm("إعادة الباقات إلى الإعداد الافتراضي؟ تسري على كل المتاجر.")) return;
    setBusy(true);
    try {
      const body = { currency: cfg!.currency, periods: cfg!.periods, plans: cfg!.plans };
      const r = await apiFetch<PlansCatalog>("/platform/plans", reset ? { method: "DELETE" } : { method: "PUT", body: JSON.stringify(body) });
      setCfg(r);
      setDirty(false);
      toast.success(reset ? "أُعيدت الباقات للافتراضي" : "حُفظت الباقات — تسري على كل المتاجر خلال دقيقة");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الباقات" description="أسعار الاشتراك لكل فترة، وحدود كل باقة ومزاياها. يراها التاجر في «الباقة والاشتراك» داخل لوحته فقط، ويحكم بها الخادم في كل وحدة.">
        <Button variant="outline" disabled={busy} onClick={() => void save(true)}><IconRestore className="size-4" /> الافتراضي</Button>
        <Button disabled={busy || !dirty} onClick={() => void save()}>{busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconDeviceFloppy className="size-4" />} حفظ</Button>
      </PageHeader>

      <Card>
        <CardHeader><CardTitle>فترات الاشتراك</CardTitle><CardDescription>حتى ٤ فترات بالأشهر — لكل باقة سعر لكل فترة. العملة {cfg.currency}.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {cfg.periods.map((m) => (
            <span key={m} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
              {periodLabel(m)}
              {cfg.periods.length > 1 && <button type="button" aria-label="حذف" onClick={() => change((c) => { c.periods = c.periods.filter((x) => x !== m); })}><IconX className="size-3.5" /></button>}
            </span>
          ))}
          {cfg.periods.length < 4 && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Math.trunc(Number(period)); if (n >= 1 && n <= 24 && !cfg.periods.includes(n)) { change((c) => { c.periods = [...c.periods, n].sort((a, b) => a - b); }); setPeriod(""); } }}>
              <Input type="number" min={1} max={24} className="w-24" placeholder="أشهر" value={period} onChange={(e) => setPeriod(e.target.value)} />
              <Button type="submit" variant="outline" size="icon" aria-label="إضافة فترة"><IconPlus className="size-4" /></Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {PLAN_ORDER.map((code) => {
          const p = cfg.plans[code];
          return (
            <Card key={code}>
              <CardHeader className="space-y-3">
                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground">اسم الباقة ({code})</Label>
                  <Input value={p.name} maxLength={30} onChange={(e) => change((c) => { c.plans[code].name = e.target.value; })} />
                  <Input value={p.tagline} maxLength={80} placeholder="سطر تعريفي" onChange={(e) => change((c) => { c.plans[code].tagline = e.target.value; })} />
                </div>
                <label className="flex items-center justify-between text-sm">«الأكثر اختيارًا»<Switch checked={p.highlight} onCheckedChange={(v) => change((c) => { for (const k of PLAN_ORDER) c.plans[k].highlight = v && k === code; })} /></label>
              </CardHeader>
              <CardContent className="space-y-4">
                {code !== "basic" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">السعر ({cfg.currency})</p>
                    {cfg.periods.map((m) => (
                      <div key={m} className="flex items-center gap-2">
                        <span className="w-20 text-sm text-muted-foreground">{periodLabel(m)}</span>
                        <Input type="number" min={0} className="flex-1" value={p.prices[m] ?? ""}
                          onChange={(e) => change((c) => { const v = Math.trunc(Number(e.target.value)); if (v > 0) c.plans[code].prices[m] = v; else delete c.plans[code].prices[m]; })} />
                      </div>
                    ))}
                    {cfg.periods.map((m) => p.prices[m] ? <p key={m} className="text-xs text-muted-foreground">{periodLabel(m)}: {formatBilling(Math.round(p.prices[m] / m), cfg.currency)} شهريًا</p> : null)}
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">الحدود <span className="text-xs font-normal text-muted-foreground">(فارغ = بلا حد)</span></p>
                  {LIMITS.map((l) => (
                    <div key={l.key} className="flex items-center gap-2">
                      <span className="w-24 text-sm text-muted-foreground">{l.label}</span>
                      <Input type="number" min={l.nullable ? 0 : 1} className="flex-1" value={p.limits[l.key] ?? ""} placeholder={l.nullable ? "بلا حد" : ""}
                        onChange={(e) => change((c) => { const raw = e.target.value.trim(); (c.plans[code].limits as unknown as Record<string, number | null>)[l.key] = raw === "" && l.nullable ? null : Math.max(l.nullable ? 0 : 1, Math.trunc(Number(raw) || 0)); })} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>المزايا</CardTitle><CardDescription>ما يُفتح في كل باقة — الوحدة المقفلة تظهر للتاجر ببطاقة «رقِّ باقتك»، ويرفضها الخادم.</CardDescription></CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow><TableHead className="ps-6">الميزة</TableHead>{PLAN_ORDER.map((c) => <TableHead key={c} className="text-center">{cfg.plans[c].name}</TableHead>)}</TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <Fragment key={g}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40"><TableCell colSpan={5} className="ps-6 text-xs font-semibold text-muted-foreground">{g}</TableCell></TableRow>
                  {Object.entries(cfg.features).filter(([, f]) => f.group === g).map(([k, f]) => (
                    <TableRow key={k}>
                      <TableCell className="ps-6"><p>{f.label}</p><p className="text-xs text-muted-foreground">{f.hint}</p></TableCell>
                      {PLAN_ORDER.map((c: PlanCode) => (
                        <TableCell key={c} className="text-center">
                          <Checkbox checked={cfg.plans[c].features[k] === true} onCheckedChange={(v) => change((x) => { x.plans[c].features[k] = v === true; })} aria-label={`${f.label} في ${cfg.plans[c].name}`} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
