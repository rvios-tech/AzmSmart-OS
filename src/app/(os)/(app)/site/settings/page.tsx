"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconPlus, IconLoader2, IconAlertTriangle, IconSettings2, IconPencil } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { listSettings, upsertSetting, type CmsSetting } from "@/lib/api/cms";

export default function SiteSettingsPage() {
  const [rows, setRows] = useState<CmsSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const [editingKey, setEditingKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listSettings()
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "تعذّر تحميل الإعدادات."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function openCreate() {
    setKey("");
    setValue("");
    setLabel("");
    setEditingKey(false);
    setDialogOpen(true);
  }

  function openEdit(setting: CmsSetting) {
    setKey(setting.key);
    setValue(setting.value);
    setLabel(setting.label ?? "");
    setEditingKey(true);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await upsertSetting({ key, value, label: label || undefined });
      setRows((prev) => {
        const exists = prev.some((s) => s.id === updated.id);
        return exists ? prev.map((s) => (s.id === updated.id ? updated : s)) : [...prev, updated];
      });
      toast.success("تم الحفظ");
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ الإعداد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="إعدادات الموقع" description="قيم عامة يستخدمها الموقع الرئيسي — الشعار، روابط التواصل، وما شابه.">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <IconPlus className="size-4" /> إعداد جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingKey ? "تعديل إعداد" : "إعداد جديد"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key">المفتاح</Label>
                  <Input id="key" dir="ltr" value={key} onChange={(e) => setKey(e.target.value)} placeholder="site.tagline" disabled={editingKey} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="label">التسمية (اختياري)</Label>
                  <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="شعار الموقع" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">القيمة</Label>
                  <Textarea id="value" value={value} onChange={(e) => setValue(e.target.value)} rows={3} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <IconLoader2 className="size-4 animate-spin" />}
                  حفظ
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">المفتاح</TableHead>
                <TableHead>التسمية</TableHead>
                <TableHead>القيمة</TableHead>
                <TableHead className="w-10 pe-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" /> جارٍ التحميل…
                </TableCell></TableRow>
              )}
              {!loading && error && (
                <TableRow><TableCell colSpan={4} className="py-12 text-center text-destructive">
                  <IconAlertTriangle className="mx-auto mb-2 size-6" /> {error}
                </TableCell></TableRow>
              )}
              {!loading && !error && rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="ps-6 font-mono text-sm" dir="ltr">{s.key}</TableCell>
                  <TableCell className="text-muted-foreground">{s.label ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">{s.value}</TableCell>
                  <TableCell className="pe-6">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(s)}>
                      <IconPencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && !error && rows.length === 0 && (
                <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  <IconSettings2 className="mx-auto mb-2 size-6 opacity-50" /> لا توجد إعدادات بعد.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
