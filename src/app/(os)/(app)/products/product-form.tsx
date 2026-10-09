"use client";

import { useEffect, useState } from "react";
import { IconLoader2, IconPlus, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageDropzone, ImageUploadButton } from "@/components/image-uploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  listCategories, type Category, type Product, type ProductInput, type Store,
} from "@/lib/api/shop";

interface VariantRow {
  id?: string;
  v1: string;
  v2: string;
  price: string;
  qty: string;
  sku: string;
  image: string;
  live: boolean;
}

const NONE = "__none__";
const toRow = (v: Product["variants"][number]): VariantRow => ({
  id: v.id, v1: v.v1, v2: v.v2, price: v.price === null ? "" : String(v.price),
  qty: String(v.qty), sku: v.sku, image: v.image ?? "", live: v.live,
});

/**
 * نموذج منتج مشترك بين الإنشاء والتعديل. المعرض والخيارات تُرسَل كاملة
 * (استبدال لا دمج)، والكمية تُدار من الخيارات حين توجد.
 */
export function ProductForm({
  store,
  initial,
  submitLabel,
  saving,
  onSubmit,
}: {
  store: Store;
  initial?: Product;
  submitLabel: string;
  saving: boolean;
  onSubmit: (input: ProductInput) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? NONE);
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [oldPrice, setOldPrice] = useState(initial?.oldPrice ? String(initial.oldPrice) : "");
  const [qty, setQty] = useState(String(initial?.qty ?? 0));
  const [lowStock, setLowStock] = useState(String(initial?.lowStock ?? 0));
  const [live, setLive] = useState(initial?.live ?? true);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [newImage, setNewImage] = useState("");
  const [opt1, setOpt1] = useState(initial?.opt1Name ?? "");
  const [opt2, setOpt2] = useState(initial?.opt2Name ?? "");
  const [variants, setVariants] = useState<VariantRow[]>((initial?.variants ?? []).map(toRow));
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listCategories(store.id);
        if (!cancelled) setCats(res);
      } catch {
        // التصنيفات اختيارية — يبقى النموذج صالحًا بدونها.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const hasVariants = variants.length > 0;
  const money = store.currency;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const int = (v: string) => Math.max(0, Math.trunc(Number(v) || 0));
    const input: ProductInput = {
      name: name.trim(),
      summary: summary.trim(),
      description: description.trim(),
      brand: brand.trim(),
      categoryId: categoryId === NONE ? null : categoryId,
      price: int(price),
      oldPrice: int(oldPrice),
      lowStock: int(lowStock),
      live,
      images,
      opt1Name: opt1.trim(),
      opt2Name: opt2.trim(),
      variants: variants
        .filter((v) => v.v1.trim() || v.v2.trim())
        .map((v) => ({
          id: v.id, v1: v.v1.trim(), v2: v.v2.trim(),
          price: v.price === "" ? null : int(v.price),
          qty: int(v.qty), sku: v.sku.trim(), image: v.image.trim(), live: v.live,
        })),
    };
    // الكمية تُدار من الخيارات حين توجد — لا نرسل رقمًا قديمًا يدوس المجموع
    if (!hasVariants) input.qty = int(qty);
    void onSubmit(input);
  }

  function addImage() {
    const url = newImage.trim();
    if (!url) return;
    setImages((prev) => [...prev, url]);
    setNewImage("");
  }

  const setVariant = (i: number, patch: Partial<VariantRow>) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader><CardTitle>المعلومات الأساسية</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنتج</Label>
              <Input id="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">وصف مختصر</Label>
              <Input id="summary" maxLength={120} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">الوصف الكامل</Label>
              <Textarea id="desc" rows={5} maxLength={1200} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">الماركة (اختياري)</Label>
                <Input id="brand" maxLength={60} value={brand} onChange={(e) => setBrand(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>بلا تصنيف</SelectItem>
                    {cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الصور</CardTitle>
            <CardDescription>
              الأولى هي الغلاف. الحدّ في باقتك: {store.plan === "basic" ? "صورة واحدة" : store.plan === "plus" ? "٤ صور" : "١٠ صور"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {images.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((url, i) => (
                  <li key={url + i} className="group relative overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="aspect-square w-full object-cover" />
                    <button type="button" aria-label="حذف الصورة"
                      onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                      className="absolute end-1 top-1 rounded-md bg-background/90 p-1 opacity-0 shadow group-hover:opacity-100">
                      <IconTrash className="size-4" />
                    </button>
                    {i === 0 && <span className="absolute start-1 bottom-1 rounded bg-primary px-1.5 text-[10px] text-primary-foreground">الغلاف</span>}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2">
              <ImageUploadButton label="رفع صورة" storeId={store.id} onUploaded={(url) => setImages((prev) => [...prev, url])} />
              <Input dir="ltr" className="min-w-48 flex-1" placeholder="أو الصق رابط صورة" value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }} />
              <Button type="button" variant="outline" onClick={addImage}><IconPlus className="size-4" /> إضافة الرابط</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الخيارات (مقاسات وألوان)</CardTitle>
            <CardDescription>حين توجد خيارات يصير المخزون والسعر لكل خيار، وتُحسب كمية المنتج من مجموعها. صورة الخيار (مثل لون القطعة) تظهر في واجهة المتجر عند اختياره.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="o1">اسم الخيار الأول</Label>
                <Input id="o1" maxLength={24} placeholder="المقاس" value={opt1} onChange={(e) => setOpt1(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o2">اسم الخيار الثاني</Label>
                <Input id="o2" maxLength={24} placeholder="اللون" value={opt2} onChange={(e) => setOpt2(e.target.value)} />
              </div>
            </div>

            {variants.map((v, i) => (
              <div key={v.id ?? i} className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-8">
                <ImageDropzone storeId={store.id} value={v.image} onChange={(url) => setVariant(i, { image: url })} className="size-10" />
                <Input placeholder={opt1 || "الأول"} value={v.v1} onChange={(e) => setVariant(i, { v1: e.target.value })} className="sm:col-span-1" />
                <Input placeholder={opt2 || "الثاني"} value={v.v2} onChange={(e) => setVariant(i, { v2: e.target.value })} />
                <Input type="number" min={0} placeholder="السعر (اختياري)" value={v.price} onChange={(e) => setVariant(i, { price: e.target.value })} />
                <Input type="number" min={0} placeholder="الكمية" value={v.qty} onChange={(e) => setVariant(i, { qty: e.target.value })} />
                <Input placeholder="SKU" dir="ltr" value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} />
                <div className="flex items-center justify-center gap-2 text-xs">
                  <Switch checked={v.live} onCheckedChange={(c) => setVariant(i, { live: c })} /> معروض
                </div>
                <Button type="button" variant="ghost" size="icon" aria-label="حذف الخيار"
                  onClick={() => setVariants((p) => p.filter((_, idx) => idx !== i))}>
                  <IconTrash className="size-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm"
              onClick={() => setVariants((p) => [...p, { v1: "", v2: "", price: "", qty: "0", sku: "", image: "", live: true }])}>
              <IconPlus className="size-4" /> إضافة خيار
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>التسعير والمخزون</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">السعر ({money})</Label>
              <Input id="price" type="number" min={0} required value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="old">السعر قبل الخصم ({money})</Label>
              <Input id="old" type="number" min={0} value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">الكمية</Label>
              <Input id="qty" type="number" min={0} disabled={hasVariants}
                value={hasVariants ? String(variants.reduce((a, v) => a + (v.live ? Number(v.qty) || 0 : 0), 0)) : qty}
                onChange={(e) => setQty(e.target.value)} />
              {hasVariants && <p className="text-xs text-muted-foreground">مجموع كميات الخيارات المعروضة.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="low">تنبيه المخزون عند</Label>
              <Input id="low" type="number" min={0} value={lowStock} onChange={(e) => setLowStock(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="live">معروض في المتجر</Label>
                <p className="text-xs text-muted-foreground">أوقفه لإخفاء المنتج دون حذفه.</p>
              </div>
              <Switch id="live" checked={live} onCheckedChange={setLive} />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <IconLoader2 className="size-4 animate-spin" />} {submitLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
