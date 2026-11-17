"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconArrowDown, IconArrowUp, IconExternalLink, IconLayoutGrid, IconLoader2, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api/client";
import {
  createSection, deleteSection, listCategories, listProducts, listSections, reorderSections, updateSection,
  type Category, type Product, type Section, type SectionInput, type SectionSource, type Store,
} from "@/lib/api/shop";
import { formatNumber } from "@/lib/format";
import { storeUrl } from "@/lib/shop/constants";

const SOURCES: { value: SectionSource; label: string; hint: string }[] = [
  { value: "best", label: "الأكثر مبيعًا", hint: "من طلبات آخر ٩٠ يومًا" },
  { value: "new", label: "الأحدث", hint: "آخر ما أضفته" },
  { value: "sale", label: "العروض", hint: "ما له سعر قبل الخصم" },
  { value: "category", label: "تصنيف", hint: "تصنيف وفروعه" },
  { value: "brand", label: "علامة تجارية", hint: "كل منتجات علامة" },
  { value: "manual", label: "اختيار يدوي", hint: "منتجات تختارها بنفسك" },
];
const labelOf = (s: SectionSource) => SOURCES.find((x) => x.value === s)?.label ?? s;

function SectionDialog({
  open, onOpenChange, editing, store, products, cats, onSaved,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; editing: Section | null; store: Store;
  products: Product[]; cats: Category[]; onSaved: () => void;
}) {
  const [title, setTitle] = useState(""); const [subtitle, setSubtitle] = useState("");
  const [source, setSource] = useState<SectionSource>("best"); const [ref, setRef] = useState("");
  const [ids, setIds] = useState<string[]>([]); const [layout, setLayout] = useState<"grid" | "row">("grid");
  const [limit, setLimit] = useState("8"); const [q, setQ] = useState(""); const [saving, setSaving] = useState(false);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand.trim()).filter(Boolean))].sort(), [products]);

  useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? ""); setSubtitle(editing?.subtitle ?? ""); setSource(editing?.source ?? "best");
    setRef(editing?.ref ?? ""); setIds(editing?.productIds ?? []); setLayout((editing?.layout as "grid" | "row") ?? "grid");
    setLimit(String(editing?.limit ?? 8)); setQ("");
  }, [open, editing]);

  async function save() {
    const input: SectionInput = { title: title.trim(), subtitle: subtitle.trim(), source, ref, productIds: ids, layout, limit: Math.min(24, Math.max(2, Number(limit) || 8)) };
    setSaving(true);
    try {
      if (editing) await updateSection(store.id, editing.id, input);
      else await createSection(store.id, input);
      toast.success("حُفظ القسم — يظهر في رئيسية متجرك");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  const shown = products.filter((p) => p.live && (!q.trim() || p.name.includes(q.trim())));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل القسم" : "قسم جديد"}</DialogTitle>
          <DialogDescription>يظهر في رئيسية متجرك تحت تصميم القالب، ببطاقة منتجات القالب نفسه.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label htmlFor="t">العنوان</Label><Input id="t" maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="الأكثر طلبًا هذا الأسبوع" /></div>
          <div className="space-y-2"><Label htmlFor="st">سطر تحته (اختياري)</Label><Input id="st" maxLength={120} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>المنتجات من</Label>
              <Select value={source} onValueChange={(v) => { setSource(v as SectionSource); setRef(""); }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label} — {s.hint}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الشكل</Label>
              <Select value={layout} onValueChange={(v) => setLayout(v as "grid" | "row")}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="grid">شبكة</SelectItem><SelectItem value="row">شريط يمرّ أفقيًا</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {source === "category" && (
            <Select value={ref} onValueChange={setRef}>
              <SelectTrigger className="w-full"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          )}
          {source === "brand" && (
            brands.length ? (
              <Select value={ref} onValueChange={setRef}>
                <SelectTrigger className="w-full"><SelectValue placeholder="اختر العلامة" /></SelectTrigger>
                <SelectContent>{brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            ) : <p className="text-sm text-muted-foreground">لا علامات تجارية في منتجاتك بعد — أضفها من صفحة المنتج.</p>
          )}
          {source === "manual" && (
            <div className="space-y-2">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث في منتجاتك…" />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {shown.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-sm hover:bg-muted">
                    <Checkbox checked={ids.includes(p.id)} onCheckedChange={(c) => setIds((x) => (c ? [...x, p.id].slice(0, 24) : x.filter((y) => y !== p.id)))} />
                    {p.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{formatNumber(ids.length)} مختار — يظهر بترتيب اختيارك.</p>
            </div>
          )}
          {source !== "manual" && (
            <div className="space-y-2"><Label htmlFor="l">عدد المنتجات</Label><Input id="l" type="number" min={2} max={24} value={limit} onChange={(e) => setLimit(e.target.value)} className="w-28" /></div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button disabled={saving || !title.trim()} onClick={() => void save()}>{saving && <IconLoader2 className="size-4 animate-spin" />} حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionsView({ store }: { store: Store }) {
  const [rows, setRows] = useState<Section[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);

  const load = useCallback(async () => {
    try { setRows(await listSections(store.id)); } catch (err) { toast.error(err instanceof ApiError ? err.message : "تعذّر التحميل."); setRows([]); }
  }, [store.id]);
  useEffect(() => {
    void load();
    listProducts(store.id).then((r) => setProducts(r.products)).catch(() => {});
    listCategories(store.id).then(setCats).catch(() => {});
  }, [store.id, load]);

  async function move(i: number, d: -1 | 1) {
    if (!rows) return;
    const next = [...rows]; [next[i], next[i + d]] = [next[i + d], next[i]];
    setRows(next);
    try { setRows(await reorderSections(store.id, next.map((s) => s.id))); } catch { void load(); }
  }

  async function act(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast.success(ok); void load(); } catch (err) { toast.error(err instanceof ApiError ? err.message : "تعذّر التنفيذ."); }
  }

  const detail = (s: Section) =>
    s.source === "category" ? cats.find((c) => c.id === s.ref)?.name ?? "تصنيف محذوف"
      : s.source === "brand" ? s.ref
        : s.source === "manual" ? `${formatNumber(s.productIds.length)} منتج` : `حتى ${formatNumber(s.limit)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="أقسام الرئيسية" description="أقسام منتجات تظهر في رئيسية متجرك تحت تصميم القالب — بالترتيب الذي تختاره.">
        <Button variant="outline" asChild><a href={storeUrl(store.slug)} target="_blank" rel="noopener"><IconExternalLink className="size-4" /> معاينة</a></Button>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><IconPlus className="size-4" /> قسم جديد</Button>
      </PageHeader>
      {!rows && <div className="flex h-40 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      {rows?.length === 0 && (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <IconLayoutGrid className="mx-auto mb-2 size-7 opacity-50" />
          لا أقسام بعد. ابدأ بـ«الأكثر مبيعًا» أو «العروض» — تظهر وحدها حين يكون فيها منتجات.
        </CardContent></Card>
      )}
      <div className="grid gap-3">
        {rows?.map((s, i) => (
          <Card key={s.id} className={s.active ? undefined : "opacity-60"}>
            <CardContent className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <Button size="icon" variant="ghost" className="size-7" disabled={i === 0} onClick={() => void move(i, -1)} aria-label="أعلى"><IconArrowUp className="size-4" /></Button>
                <Button size="icon" variant="ghost" className="size-7" disabled={i === rows.length - 1} onClick={() => void move(i, 1)} aria-label="أسفل"><IconArrowDown className="size-4" /></Button>
              </div>
              <div className="min-w-48 flex-1">
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{labelOf(s.source)} · {detail(s)} · {s.layout === "row" ? "شريط" : "شبكة"}</p>
              </div>
              <Badge variant="secondary">{s.active ? "ظاهر" : "مخفي"}</Badge>
              <Switch checked={s.active} onCheckedChange={(c) => void act(() => updateSection(store.id, s.id, { active: c }), c ? "ظهر القسم" : "أُخفي القسم")} />
              <Button size="icon" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }} aria-label="تعديل"><IconPencil className="size-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="حذف"
                onClick={() => { if (window.confirm(`حذف قسم «${s.title}»؟`)) void act(() => deleteSection(store.id, s.id), "حُذف القسم"); }}>
                <IconTrash className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <SectionDialog open={open} onOpenChange={setOpen} editing={editing} store={store} products={products} cats={cats} onSaved={() => void load()} />
    </div>
  );
}

export default function SectionsPage() {
  return <RequireStore>{(store) => <SectionsView store={store} />}</RequireStore>;
}
