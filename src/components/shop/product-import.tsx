"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconDownload, IconFileImport, IconLoader2 } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  createCategory, createProduct, listCategories, updateProduct, type Product, type Store,
} from "@/lib/api/shop";
import { downloadCsv } from "@/lib/shop/csv";
import { CSV_HEADERS, productsToRows, readProducts, type ParseResult } from "@/lib/shop/product-csv";
import { formatNumber } from "@/lib/format";

/** تصدير المنتجات بالصيغة التي يقرؤها الاستيراد */
export function exportProducts(store: Store, products: Product[]) {
  downloadCsv(`${store.slug}-products.csv`, [...CSV_HEADERS], productsToRows(products));
}

/** ملف نموذجي يملؤه التاجر */
function downloadTemplate() {
  downloadCsv("rvios-products-template.csv", [...CSV_HEADERS], [
    ["عطر عود ملكي", 25000, 30000, 10, "عطور", "دار العود", "عود فاخر ثابت", "https://example.com/oud.jpg", "نعم", "", "", ""],
    ["قميص قطن", 8000, "", 4, "ملابس", "", "قطن ١٠٠٪", "", "نعم", "المقاس", "M", "SH-M"],
    ["قميص قطن", 8000, "", 6, "ملابس", "", "قطن ١٠٠٪", "", "نعم", "المقاس", "L", "SH-L"],
  ]);
}

/**
 * استيراد المنتجات من CSV — من متجر آخر أو من Excel. يُقرأ الملف في المتصفح ويُعرض ملخّصه قبل
 * أي كتابة، ثم يُنشأ كل منتج بطلب مستقل (حدّ الباقة يفرضه الخادم ويُذكر في التقرير).
 * المنتج الموجود بالاسم نفسه يُحدَّث سعره وكميته ووصفه — لا يُكرَّر.
 */
export function ProductImport({
  store, products, open, onOpenChange, onDone,
}: {
  store: Store;
  products: Product[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: () => void;
}) {
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [update, setUpdate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [report, setReport] = useState<{ created: number; updated: number; failed: { line: number; message: string }[] } | null>(null);

  async function pick(f: File | undefined) {
    setReport(null);
    if (!f) return;
    setFileName(f.name);
    setParsed(readProducts(await f.text()));
  }

  async function run() {
    if (!parsed?.rows.length) return;
    setBusy(true);
    setDone(0);
    const failed: { line: number; message: string }[] = [];
    let created = 0;
    let updated = 0;
    try {
      // التصنيفات بالاسم: الموجود يُستعمل، والجديد يُنشأ مرة واحدة
      const cats = new Map((await listCategories(store.id)).map((c) => [c.name.trim(), c.id]));
      const byName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p]));
      for (const r of parsed.rows) {
        try {
          let categoryId: string | null | undefined;
          if (r.category) {
            if (!cats.has(r.category)) cats.set(r.category, (await createCategory(store.id, { name: r.category.slice(0, 60) })).id);
            categoryId = cats.get(r.category);
          }
          const existing = byName.get(r.name.toLowerCase());
          if (existing && update) {
            // تحديث آمن: لا تُمسّ الخيارات والصور القائمة
            await updateProduct(store.id, existing.id, {
              price: r.input.price, ...(r.input.oldPrice ? { oldPrice: r.input.oldPrice } : {}),
              ...(existing.hasVariants ? {} : { qty: r.input.qty }),
              ...(r.input.description ? { description: r.input.description } : {}),
              ...(r.input.brand ? { brand: r.input.brand } : {}),
              ...(categoryId ? { categoryId } : {}),
              live: r.input.live,
            });
            updated++;
          } else if (!existing) {
            await createProduct(store.id, { ...r.input, ...(categoryId ? { categoryId } : {}) });
            created++;
          } else {
            failed.push({ line: r.line, message: `«${r.name}» موجود — فعّل «تحديث الموجود»` });
          }
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : "تعذّر";
          failed.push({ line: r.line, message: `«${r.name}»: ${msg}` });
          // حدّ الباقة: لا فائدة من محاولة الباقي
          if (err instanceof ApiError && err.status === 409 && JSON.stringify(err.details ?? "").includes("PLAN_LIMIT")) {
            failed.push({ line: r.line, message: "توقف الاستيراد عند حد منتجات الباقة" });
            break;
          }
        }
        setDone((d) => d + 1);
      }
      setReport({ created, updated, failed });
      if (created || updated) {
        toast.success(`استُورد ${formatNumber(created)} منتج جديد${updated ? ` وحُدّث ${formatNumber(updated)}` : ""}`);
        onDone();
      }
    } finally {
      setBusy(false);
    }
  }

  const total = parsed?.rows.length ?? 0;
  const variants = parsed?.rows.reduce((a, r) => a + (r.input.variants?.length ?? 0), 0) ?? 0;
  const dupes = parsed?.rows.filter((r) => products.some((p) => p.name.trim().toLowerCase() === r.name.toLowerCase())).length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) { setParsed(null); setReport(null); setFileName(""); } } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>استيراد منتجات من ملف CSV</DialogTitle>
          <DialogDescription>
            من Excel أو من متجرك القديم. سطر لكل منتج، وللمنتج ذي الخيارات سطر لكل خيار بالاسم نفسه.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button variant="link" className="h-auto p-0" onClick={downloadTemplate}>
            <IconDownload className="size-4" /> نزّل ملفًا نموذجيًا بالأعمدة
          </Button>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm hover:bg-muted/50">
            <IconFileImport className="size-7 text-muted-foreground" />
            <span>{fileName || "اختر ملف CSV"}</span>
            <input type="file" accept=".csv,text/csv" className="hidden" disabled={busy} onChange={(e) => void pick(e.target.files?.[0])} />
          </label>

          {parsed?.missingHeaders.length ? (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              لم أجد عمود: {parsed.missingHeaders.join("، ")}. الصف الأول يجب أن يكون عناوين الأعمدة.
            </p>
          ) : parsed && !report && (
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <p><b>{formatNumber(total)}</b> منتج{variants ? <> · <b>{formatNumber(variants)}</b> خيار</> : null}{dupes ? <> · <b>{formatNumber(dupes)}</b> موجود بالاسم</> : null}</p>
              {parsed.errors.length > 0 && (
                <ul className="max-h-24 list-inside list-disc overflow-y-auto text-xs text-amber-600">
                  {parsed.errors.map((e, i) => <li key={i}>سطر {formatNumber(e.line)}: {e.message}</li>)}
                </ul>
              )}
              {dupes > 0 && (
                <label className="flex items-center justify-between gap-3 pt-1">
                  <span>تحديث الموجود (السعر والكمية والوصف)</span>
                  <Switch checked={update} onCheckedChange={setUpdate} disabled={busy} />
                </label>
              )}
            </div>
          )}

          {busy && (
            <div className="space-y-1">
              <Progress value={total ? (done / total) * 100 : 0} />
              <p className="text-xs text-muted-foreground">{formatNumber(done)} / {formatNumber(total)}</p>
            </div>
          )}

          {report && (
            <div className="space-y-1 rounded-lg bg-muted p-3 text-sm">
              <p>جديد: <b>{formatNumber(report.created)}</b> · محدّث: <b>{formatNumber(report.updated)}</b> · تعذّر: <b>{formatNumber(report.failed.length)}</b></p>
              {report.failed.length > 0 && (
                <ul className="max-h-32 list-inside list-disc overflow-y-auto text-xs text-destructive">
                  {report.failed.map((e, i) => <li key={i}>سطر {formatNumber(e.line)}: {e.message}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>إغلاق</Button>
          {!report && (
            <Button disabled={busy || !total || !!parsed?.missingHeaders.length} onClick={() => void run()}>
              {busy && <IconLoader2 className="size-4 animate-spin" />} استيراد {total ? formatNumber(total) : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
