"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconDeviceFloppy, IconListDetails, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { deleteOptionSet, listOptionSets, saveOptionSet, type OptionSet } from "@/lib/api/shop";

const NONE = "__none__";

/**
 * «خيارات محفوظة» في نموذج المنتج: اختر مجموعة للخيار الأول (وأخرى للثاني إن شئت) فتُولَّد كل
 * التركيبات، أو احفظ خيارات هذا المنتج لتعيد استعمالها. التطبيق يُبقي كمية وسعر ما كان موجودًا.
 */
export function OptionSetsBar({
  storeId,
  opt1,
  opt2,
  rows,
  onApply,
}: {
  storeId: string;
  opt1: string;
  opt2: string;
  rows: { v1: string; v2: string }[];
  onApply: (r: { opt1: string; opt2: string; pairs: { v1: string; v2: string }[] }) => void;
}) {
  const [sets, setSets] = useState<OptionSet[]>([]);
  const [a, setA] = useState(NONE);
  const [b, setB] = useState(NONE);

  useEffect(() => {
    listOptionSets(storeId).then(setSets).catch(() => {});
  }, [storeId]);

  function apply() {
    const s1 = sets.find((s) => s.id === a);
    if (!s1) return;
    const s2 = sets.find((s) => s.id === b);
    const pairs = s1.values.flatMap((v1) => (s2 ? s2.values.map((v2) => ({ v1, v2 })) : [{ v1, v2: "" }]));
    if (pairs.length > 100) return toast.error("تركيبات كثيرة (أكثر من ١٠٠) — اختر مجموعتين أصغر.");
    onApply({ opt1: s1.name, opt2: s2?.name ?? "", pairs });
    toast.success(`أُضيفت ${pairs.length} تركيبة — اكتب كمية كل منها`);
  }

  async function save(name: string, values: string[]) {
    try {
      const s = await saveOptionSet(storeId, { name, values });
      setSets((p) => [...p.filter((x) => x.id !== s.id), s].sort((x, y) => x.name.localeCompare(y.name, "ar")));
      toast.success(`حُفظ «${name}» — تجده في الخيارات المحفوظة لكل منتج`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    }
  }

  async function remove(s: OptionSet) {
    if (!window.confirm(`حذف «${s.name}» من الخيارات المحفوظة؟ المنتجات لا تتأثر.`)) return;
    try {
      await deleteOptionSet(storeId, s.id);
      setSets((p) => p.filter((x) => x.id !== s.id));
      if (a === s.id) setA(NONE);
      if (b === s.id) setB(NONE);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف.");
    }
  }

  const v1 = [...new Set(rows.map((r) => r.v1.trim()).filter(Boolean))];
  const v2 = [...new Set(rows.map((r) => r.v2.trim()).filter(Boolean))];

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium"><IconListDetails className="size-4" /> خيارات محفوظة</p>
      {sets.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={a} onValueChange={setA}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الخيار الأول" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>الخيار الأول…</SelectItem>
              {sets.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.values.length})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={b} onValueChange={setB}>
            <SelectTrigger className="w-40"><SelectValue placeholder="الثاني (اختياري)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>بلا خيار ثانٍ</SelectItem>
              {sets.filter((s) => s.id !== a).map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.values.length})</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" disabled={a === NONE} onClick={apply}>طبّق</Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">احفظ مقاساتك أو ألوانك مرة، وطبّقها على أي منتج بضغطة.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {opt1.trim() && v1.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => void save(opt1.trim(), v1)}>
            <IconDeviceFloppy className="size-4" /> احفظ «{opt1.trim()}» ({v1.length})
          </Button>
        )}
        {opt2.trim() && v2.length > 0 && (
          <Button type="button" size="sm" variant="outline" onClick={() => void save(opt2.trim(), v2)}>
            <IconDeviceFloppy className="size-4" /> احفظ «{opt2.trim()}» ({v2.length})
          </Button>
        )}
        {sets.map((s) => (
          <Button key={s.id} type="button" size="sm" variant="ghost" className="text-muted-foreground" title={s.values.join("، ")} onClick={() => void remove(s)}>
            <IconTrash className="size-3.5" /> {s.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
