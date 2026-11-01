"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconArrowRight, IconBrandWhatsapp, IconEyeOff, IconLoader2, IconLock, IconPlus, IconTrash,
} from "@tabler/icons-react";

import { ImageUploadButton } from "@/components/image-uploader";
import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { listProducts, saveAppearance, type Store } from "@/lib/api/shop";
import { teamWhatsapp } from "@/lib/contact";
import { formatDateShort } from "@/lib/format";
import { STOREFRONT_URL, storeUrl } from "@/lib/shop/constants";
import { useStore } from "@/lib/shop/store-context";
import { cn } from "@/lib/utils";

const COLORS = ["#9E2226", "#2F5D50", "#1F4E79", "#7A4B1E", "#5B2A6E", "#A8641B", "#2C2C2C", "#0F766E"];
const CONTACT_TEXT = "مرحبًا فريق RVIOS، أريد تعديل شكل متجري.";

/** نصوص القالب الأساسي: عنوانها ونصّها الابتدائي كما يعرضه المتجر */
const TEXTS: Record<string, { label: string; max: number; long?: boolean }> = {
  h1: { label: "عنوان الواجهة", max: 120 },
  sub: { label: "الوصف تحت العنوان", max: 240, long: true },
  shop: { label: "زر التسوق", max: 40 },
  prods: { label: "عنوان قسم المنتجات", max: 60 },
  story: { label: "عنوان قسم «عن المتجر»", max: 80 },
  storyTxt: { label: "نص «عن المتجر»", max: 600, long: true },
  city: { label: "نص التذييل", max: 80 },
};
/** صور القالب ← حقلها في المتجر */
const IMAGES = { logo: { label: "الشعار", field: "logo" }, heroImg: { label: "صورة الغلاف", field: "banner" }, storyImg: { label: "صورة «عن المتجر»", field: "showcase" } } as const;
type ImageKey = keyof typeof IMAGES;
const isImage = (k: string): k is ImageKey => k in IMAGES;

interface DraftProduct { key: string; id?: string; name: string; price: number; oldPrice: number | null; image: string; categoryId: string | null }
interface Draft { name: string; color: string; logo: string; banner: string; showcase: string; copy: Record<string, string>; hidden: string[] }

const initialDraft = (s: Store): Draft => ({
  name: s.name, color: s.color, logo: s.logo, banner: s.banner, showcase: s.showcase,
  copy: { ...s.appearance?.copy }, hidden: [...(s.appearance?.hidden ?? [])],
});

/** ما يعرضه المتجر لنصٍّ لم يُعدَّل بعد — كما في `mergeStore` بمنصة المتاجر */
function defaultText(k: string, d: Draft, s: Store): string {
  return { h1: d.name, sub: s.tagline, shop: "تسوّق الآن", prods: "منتجاتنا", story: "عن المتجر", storyTxt: s.about, city: s.city }[k] ?? "";
}

function Editor({ store }: { store: Store }) {
  const { reload } = useStore();
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(store));
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [original, setOriginal] = useState<DraftProduct[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [maxProducts, setMaxProducts] = useState<number | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => Date.now());
  const newKey = useRef(0);

  const lockedUntil = store.appearanceLockedUntil && new Date(store.appearanceLockedUntil).getTime() > now ? store.appearanceLockedUntil : null;
  const origin = useMemo(() => new URL(STOREFRONT_URL).origin, []);

  useEffect(() => {
    void (async () => {
      try {
        const r = await listProducts(store.id);
        const rows = r.products.map((p) => ({ key: p.id, id: p.id, name: p.name, price: p.price, oldPrice: p.oldPrice, image: p.images[0] ?? p.image, categoryId: p.categoryId }));
        setProducts(rows);
        setOriginal(rows);
        setMaxProducts(r.capacity.max);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "تعذّر جلب المنتجات.");
      }
    })();
  }, [store.id]);

  const dirty = useMemo(() => {
    const base = initialDraft(store);
    return JSON.stringify(base) !== JSON.stringify(draft) || deleted.length > 0 || JSON.stringify(original) !== JSON.stringify(products);
  }, [store, draft, deleted, original, products]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type === "rv-editor:ready") setReady(true);
      if (e.data?.type === "rv-editor:pick") setSelected(String(e.data.target));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [origin]);

  // كل تعديل يُرسم في المعاينة فورًا — ولا يُحفظ شيء قبل «حفظ التعديلات»
  useEffect(() => {
    if (!ready) return;
    frame.current?.contentWindow?.postMessage({
      type: "rv-editor:draft",
      draft: {
        store: {
          slug: store.slug, name: draft.name, color: draft.color, whatsapp: store.whatsapp, template: "essential", planTier: "free",
          customDomain: null, createdAt: store.createdAt, tagline: store.tagline, about: store.about, city: store.city,
          logo: draft.logo, banner: draft.banner, showcase: draft.showcase, appearance: { copy: draft.copy, hidden: draft.hidden },
        },
        products: products.map((p) => ({ id: p.key, categoryId: p.categoryId, name: p.name, description: "", price: p.price, oldPrice: p.oldPrice, image: p.image })),
      },
    }, origin);
  }, [ready, draft, products, store, origin]);

  const setHidden = useCallback((k: string, hide: boolean) => {
    setDraft((d) => ({ ...d, hidden: hide ? [...new Set([...d.hidden, k])] : d.hidden.filter((x) => x !== k) }));
  }, []);

  function addProduct() {
    const key = `new-${++newKey.current}`;
    setProducts((l) => [...l, { key, name: "منتج جديد", price: 0, oldPrice: null, image: "", categoryId: null }]);
    setSelected(`product:${key}`);
  }

  function removeProduct(key: string) {
    const p = products.find((x) => x.key === key);
    if (p?.id) setDeleted((d) => [...d, p.id!]);
    setProducts((l) => l.filter((x) => x.key !== key));
    setSelected(null);
  }

  async function save() {
    setSaving(true);
    try {
      const changed = products.filter((p) => {
        const was = original.find((o) => o.key === p.key);
        return !was || JSON.stringify(was) !== JSON.stringify(p);
      });
      await saveAppearance(store.id, {
        name: draft.name, color: draft.color, logo: draft.logo, banner: draft.banner, showcase: draft.showcase,
        copy: draft.copy, hidden: draft.hidden, deleteProducts: deleted,
        products: changed.map((p) => {
          const was = original.find((o) => o.key === p.key);
          return { ...(p.id ? { id: p.id } : {}), name: p.name, price: p.price, oldPrice: p.oldPrice ?? 0, ...(was?.image === p.image ? {} : { image: p.image }) };
        }),
      });
      await reload();
      toast.success("حُفظ شكل متجرك");
      setConfirmOpen(false);
      setSelected(null);
      setDeleted([]);
      const r = await listProducts(store.id);
      const rows = r.products.map((p) => ({ key: p.id, id: p.id, name: p.name, price: p.price, oldPrice: p.oldPrice, image: p.images[0] ?? p.image, categoryId: p.categoryId }));
      setProducts(rows);
      setOriginal(rows);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ التعديلات.");
    } finally {
      setSaving(false);
    }
  }

  const contact = () => window.open(teamWhatsapp(CONTACT_TEXT), "_blank", "noopener");
  const samples = products.length === 0;
  const atLimit = maxProducts !== null && products.length >= maxProducts;
  const readOnly = !!lockedUntil;

  return (
    <div className="space-y-4">
      <PageHeader title="شكل المتجر" description="اضغط أي عنصر في المعاينة لتعديله أو حذفه، ثم احفظ التعديلات.">
        <div className="flex gap-2">
          {dirty && !readOnly && (
            <Button variant="ghost" onClick={() => { setDraft(initialDraft(store)); setProducts(original); setDeleted([]); setSelected(null); }}>تجاهل التعديلات</Button>
          )}
          <Button disabled={!dirty || readOnly} onClick={() => setConfirmOpen(true)}>حفظ التعديلات</Button>
        </div>
      </PageHeader>

      {readOnly && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
            <span className="flex items-center gap-2"><IconLock className="size-4" /> عدّلت شكل متجرك مؤخرًا. يُتاح التعديل مجددًا بعد {formatDateShort(lockedUntil!)}، أو بالتواصل مع الفريق.</span>
            <Button size="sm" variant="outline" onClick={contact}><IconBrandWhatsapp className="size-4" /> التواصل مع ريفيوس</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="space-y-3 rounded-xl border bg-card p-4 lg:sticky lg:top-20 lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto">
          {selected ? (
            <>
              <button type="button" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>
                <IconArrowRight className="size-4" /> كل العناصر
              </button>
              <ElementPanel
                key={selected} target={selected} store={store} draft={draft} products={products} readOnly={readOnly} samples={samples}
                onDraft={setDraft} onHide={(k) => { setHidden(k, true); setSelected(null); }} onAdd={addProduct} atLimit={atLimit}
                onProduct={(key, patch) => setProducts((l) => l.map((p) => (p.key === key ? { ...p, ...patch } : p)))}
                onRemoveProduct={removeProduct} onDone={() => setSelected(null)}
              />
            </>
          ) : (
            <>
              <Group title="الهوية">
                <Row label="اسم المتجر" onClick={() => setSelected("name")} />
                <Row label="الشعار" hidden={draft.hidden.includes("logo")} onClick={() => setSelected("logo")} onRestore={() => setHidden("logo", false)} />
                <Row label="لون المتجر" onClick={() => setSelected("color")} />
              </Group>
              <Group title="الواجهة">
                {(["heroImg", "h1", "sub", "shop"] as const).map((k) => (
                  <Row key={k} label={isImage(k) ? IMAGES[k].label : TEXTS[k].label} hidden={draft.hidden.includes(k)} onClick={() => setSelected(k)} onRestore={() => setHidden(k, false)} />
                ))}
              </Group>
              <Group title="المنتجات">
                <Row label={TEXTS.prods.label} hidden={draft.hidden.includes("prods")} onClick={() => setSelected("prods")} onRestore={() => setHidden("prods", false)} />
                {products.map((p) => <Row key={p.key} label={p.name} onClick={() => setSelected(`product:${p.key}`)} />)}
                {samples && <p className="px-2 py-1 text-xs text-muted-foreground">المعروض الآن منتجات توضيحية، تختفي عند إضافة أول منتج لك.</p>}
                <Button size="sm" variant="outline" className="mt-1 w-full" disabled={atLimit || readOnly} onClick={addProduct}><IconPlus className="size-4" /> إضافة منتج</Button>
                {atLimit && <p className="px-2 text-xs text-muted-foreground">بلغت حد منتجات باقتك.</p>}
              </Group>
              <Group title="عن المتجر">
                {(["storyImg", "story", "storyTxt"] as const).map((k) => (
                  <Row key={k} label={isImage(k) ? IMAGES[k].label : TEXTS[k].label} hidden={draft.hidden.includes(k)} onClick={() => setSelected(k)} onRestore={() => setHidden(k, false)} />
                ))}
              </Group>
              <Group title="التذييل">
                <Row label={TEXTS.city.label} hidden={draft.hidden.includes("city")} onClick={() => setSelected("city")} onRestore={() => setHidden("city", false)} />
              </Group>
            </>
          )}
        </aside>

        <div className="overflow-hidden rounded-xl border bg-muted">
          <iframe ref={frame} title="معاينة المتجر" src={`${storeUrl(store.slug)}?editor=1`} className="h-[calc(100svh-9rem)] min-h-[560px] w-full bg-background" />
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حفظ التعديلات</AlertDialogTitle>
            <AlertDialogDescription>
              ستُحفظ التعديلات وتظهر لعملائك، ولن تتمكن من تعديل شكل المتجر مرة أخرى إلا بعد أسبوع أو بالتواصل مع فريق RVIOS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-start">
            <Button disabled={saving} onClick={() => void save()}>
              {saving && <IconLoader2 className="size-4 animate-spin" />} موافق
            </Button>
            <AlertDialogCancel disabled={saving}>إكمال التعديل</AlertDialogCancel>
            <Button variant="outline" disabled={saving} onClick={contact}><IconBrandWhatsapp className="size-4" /> التواصل مع ريفيوس</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1 border-b pb-3 last:border-0 last:pb-0">
      <h3 className="px-2 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, hidden, onClick, onRestore }: { label: string; hidden?: boolean; onClick: () => void; onRestore?: () => void }) {
  if (hidden) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
        <span className="flex min-w-0 items-center gap-1.5 truncate"><IconEyeOff className="size-3.5 shrink-0" /> {label}</span>
        <Button size="sm" variant="ghost" onClick={onRestore}>إرجاع</Button>
      </div>
    );
  }
  return <button type="button" onClick={onClick} className="block w-full truncate rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted">{label}</button>;
}

/** لوحة العنصر المختار: التعديل يبقى داخلها حتى «تأكيد» — عندها وحدها يتغيّر المعروض */
function ElementPanel({ target, store, draft, products, readOnly, samples, atLimit, onDraft, onHide, onAdd, onProduct, onRemoveProduct, onDone }: {
  target: string; store: Store; draft: Draft; products: DraftProduct[]; readOnly: boolean; samples: boolean; atLimit: boolean;
  onDraft: React.Dispatch<React.SetStateAction<Draft>>; onHide: (k: string) => void; onAdd: () => void;
  onProduct: (key: string, patch: Partial<DraftProduct>) => void; onRemoveProduct: (key: string) => void; onDone: () => void;
}) {
  if (target === "name") {
    return <TextPanel label="اسم المتجر" max={60} value={draft.name} readOnly={readOnly} onConfirm={(v) => { onDraft((d) => ({ ...d, name: v })); onDone(); }} />;
  }
  if (target === "color") {
    return (
      <div className="space-y-2">
        <h3 className="font-medium">لون المتجر</h3>
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={c} aria-pressed={draft.color === c} disabled={readOnly} style={{ background: c }}
              onClick={() => onDraft((d) => ({ ...d, color: c }))}
              className={cn("size-8 rounded-full ring-offset-2 ring-offset-background", draft.color === c && "ring-2 ring-foreground")} />
          ))}
          <input type="color" aria-label="لون مخصص" disabled={readOnly} value={draft.color} onChange={(e) => onDraft((d) => ({ ...d, color: e.target.value }))} className="size-8 cursor-pointer rounded-full border-0 bg-transparent p-0" />
        </div>
      </div>
    );
  }
  if (isImage(target)) {
    const { label, field } = IMAGES[target];
    return <ImagePanel label={label} storeId={store.id} value={draft[field]} readOnly={readOnly} onConfirm={(url) => { onDraft((d) => ({ ...d, [field]: url })); onDone(); }} onDelete={() => onHide(target)} />;
  }
  if (target in TEXTS) {
    const t = TEXTS[target];
    return (
      <TextPanel label={t.label} max={t.max} long={t.long} value={draft.copy[target] ?? defaultText(target, draft, store)} readOnly={readOnly}
        onConfirm={(v) => { onDraft((d) => ({ ...d, copy: { ...d.copy, [target]: v } })); onDone(); }} onDelete={() => onHide(target)} />
    );
  }
  if (target === "product:sample" || samples) {
    return (
      <div className="space-y-3 text-sm">
        <h3 className="font-medium">منتج توضيحي</h3>
        <p className="text-muted-foreground">هذه منتجات تعرض شكل القالب فقط، وتختفي كلها عند إضافة أول منتج لك.</p>
        <Button size="sm" className="w-full" disabled={readOnly || atLimit} onClick={onAdd}><IconPlus className="size-4" /> إضافة منتج</Button>
      </div>
    );
  }
  const key = target.replace(/^product:/, "");
  const p = products.find((x) => x.key === key);
  if (!p) return <p className="text-sm text-muted-foreground">هذا المنتج غير موجود.</p>;
  return <ProductPanel product={p} storeId={store.id} readOnly={readOnly} onConfirm={(patch) => { onProduct(key, patch); onDone(); }} onRemove={() => onRemoveProduct(key)} />;
}

function TextPanel({ label, value, max, long, readOnly, onConfirm, onDelete }: {
  label: string; value: string; max: number; long?: boolean; readOnly: boolean; onConfirm: (v: string) => void; onDelete?: () => void;
}) {
  const [v, setV] = useState(value);
  const clean = v.trim();
  return (
    <div className="space-y-3">
      <Label htmlFor="edit-text">{label}</Label>
      {long
        ? <Textarea id="edit-text" rows={5} maxLength={max} disabled={readOnly} value={v} onChange={(e) => setV(e.target.value)} />
        : <Input id="edit-text" maxLength={max} disabled={readOnly} value={v} onChange={(e) => setV(e.target.value)} />}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" disabled={readOnly || clean.length < 1} onClick={() => onConfirm(clean)}>تأكيد</Button>
        {onDelete && <Button size="sm" variant="outline" disabled={readOnly} onClick={onDelete}><IconTrash className="size-4" /> حذف</Button>}
      </div>
    </div>
  );
}

function ImagePanel({ label, storeId, value, readOnly, onConfirm, onDelete }: {
  label: string; storeId: string; value: string; readOnly: boolean; onConfirm: (url: string) => void; onDelete: () => void;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const shown = pending ?? value;
  return (
    <div className="space-y-3">
      <h3 className="font-medium">{label}</h3>
      {shown ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shown} alt="" className="aspect-video w-full rounded-lg bg-muted object-cover" />
      ) : (
        <p className="grid aspect-video place-items-center rounded-lg bg-muted px-4 text-center text-xs text-muted-foreground">تُعرض صورة القالب الافتراضية</p>
      )}
      {pending && <Badge variant="secondary">صورة جديدة — اضغط «تأكيد» لعرضها</Badge>}
      <div className="flex flex-wrap gap-2">
        {!readOnly && <ImageUploadButton storeId={storeId} label="تغيير" onUploaded={setPending} />}
        {pending && <Button size="sm" onClick={() => onConfirm(pending)}>تأكيد</Button>}
        <Button size="sm" variant="outline" disabled={readOnly} onClick={onDelete}><IconTrash className="size-4" /> حذف</Button>
      </div>
    </div>
  );
}

function ProductPanel({ product, storeId, readOnly, onConfirm, onRemove }: {
  product: DraftProduct; storeId: string; readOnly: boolean; onConfirm: (patch: Partial<DraftProduct>) => void; onRemove: () => void;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [old, setOld] = useState(product.oldPrice ? String(product.oldPrice) : "");
  const [image, setImage] = useState(product.image);
  const priceN = Number(price);
  const oldN = Number(old);
  const ok = name.trim().length >= 1 && Number.isInteger(priceN) && priceN >= 0 && (old === "" || (Number.isInteger(oldN) && oldN >= 0));
  return (
    <div className="space-y-3">
      <h3 className="font-medium">المنتج</h3>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="aspect-square w-full rounded-lg bg-muted object-cover" />
      )}
      {!readOnly && <ImageUploadButton storeId={storeId} label={image ? "تغيير الصورة" : "رفع صورة"} onUploaded={setImage} />}
      <div className="space-y-2"><Label htmlFor="p-name">الاسم</Label><Input id="p-name" maxLength={100} disabled={readOnly} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2"><Label htmlFor="p-price">السعر</Label><Input id="p-price" dir="ltr" inputMode="numeric" disabled={readOnly} value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="p-old">السعر قبل الخصم</Label><Input id="p-old" dir="ltr" inputMode="numeric" disabled={readOnly} value={old} onChange={(e) => setOld(e.target.value)} /></div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" disabled={readOnly || !ok} onClick={() => onConfirm({ name: name.trim(), price: priceN, oldPrice: oldN > 0 ? oldN : null, image })}>تأكيد</Button>
        <Button size="sm" variant="outline" disabled={readOnly} onClick={onRemove}><IconTrash className="size-4" /> حذف المنتج</Button>
      </div>
    </div>
  );
}

function Unavailable() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6 text-sm">
        <p>تعديل شكل المتجر بنفسك متاح للمتجر المجاني على القالب الأساسي. لتعديل قالبك الحالي تواصل مع فريق RVIOS.</p>
        <Button variant="outline" onClick={() => window.open(teamWhatsapp(CONTACT_TEXT), "_blank", "noopener")}>
          <IconBrandWhatsapp className="size-4" /> التواصل مع ريفيوس
        </Button>
      </CardContent>
    </Card>
  );
}

export default function StoreAppearancePage() {
  return (
    <RequireStore>
      {(store) => (store.plan === "basic" && store.template === "essential"
        ? <Editor key={store.id} store={store} />
        : <div className="space-y-4"><PageHeader title="شكل المتجر" /><Unavailable /></div>)}
    </RequireStore>
  );
}
