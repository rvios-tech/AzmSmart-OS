"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCategory, IconLoader2, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  createCategory, deleteCategory, listCategories, updateCategory, type Category, type Store,
} from "@/lib/api/shop";
import { formatNumber } from "@/lib/format";

const ROOT = "__root__";

function CategoriesView({ store }: { store: Store }) {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [parent, setParent] = useState(ROOT);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await listCategories(store.id);
        if (!cancelled) setCats(res);
      } catch (err) {
        if (!cancelled) {
          setCats([]);
          toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل التصنيفات.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const c = await createCategory(store.id, { name: name.trim(), ...(parent !== ROOT ? { parentId: parent } : {}) });
      setCats((p) => [...(p ?? []), { ...c, count: 0 }]);
      setName("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إضافة التصنيف.");
    } finally {
      setAdding(false);
    }
  }

  async function rename(c: Category) {
    const next = window.prompt("اسم التصنيف", c.name)?.trim();
    if (!next || next === c.name) return;
    try {
      const u = await updateCategory(store.id, c.id, { name: next });
      setCats((p) => p?.map((x) => (x.id === c.id ? { ...x, name: u.name } : x)) ?? p);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التعديل.");
    }
  }

  async function remove(c: Category) {
    if (!window.confirm(`حذف «${c.name}»؟ منتجاته تبقى بلا تصنيف.`)) return;
    try {
      await deleteCategory(store.id, c.id);
      setCats((p) => p?.filter((x) => x.id !== c.id) ?? p);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف.");
    }
  }

  const nameOf = (id: string | null) => cats?.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader title="التصنيفات" description="نظّم منتجاتك ليجدها عميلك أسرع." />

      <Card>
        <CardContent>
          <form onSubmit={add} className="flex flex-col gap-3 sm:flex-row">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="اسم التصنيف الجديد" className="sm:max-w-xs" />
            <Select value={parent} onValueChange={setParent}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ROOT}>تصنيف رئيسي</SelectItem>
                {cats?.filter((c) => !c.parentId).map((c) => <SelectItem key={c.id} value={c.id}>فرعي من: {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={adding || !name.trim()}>
              {adding ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlus className="size-4" />} إضافة
            </Button>
          </form>
          {parent !== ROOT && store.plan === "basic" && (
            <p className="mt-2 text-xs text-amber-600">التصنيفات الفرعية متاحة في الباقتين الاحترافية والأعمال.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">التصنيف</TableHead>
                <TableHead>الأب</TableHead>
                <TableHead>المنتجات</TableHead>
                <TableHead className="pe-6 text-start">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!cats && <TableRow><TableCell colSpan={4} className="py-10 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
              {cats?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="ps-6 font-medium">{c.parentId ? "↳ " : ""}{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.parentId ? nameOf(c.parentId) : "—"}</TableCell>
                  <TableCell className="tabular-nums">{formatNumber(c.count)}</TableCell>
                  <TableCell className="pe-6 text-start">
                    <Button variant="ghost" size="icon" aria-label="تعديل" onClick={() => void rename(c)}><IconPencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="حذف" onClick={() => void remove(c)}><IconTrash className="size-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {cats && cats.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground"><IconCategory className="mx-auto mb-2 size-6 opacity-50" />لا تصنيفات بعد.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CategoriesPage() {
  return <RequireStore>{(store) => <CategoriesView store={store} />}</RequireStore>;
}
