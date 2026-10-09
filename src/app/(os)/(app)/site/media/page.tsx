"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconPlus,
  IconLoader2,
  IconAlertTriangle,
  IconPhoto,
  IconTrash,
  IconCopy,
  IconFile,
  IconUpload,
  IconVideo,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { formatFileSize } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImage } from "@/lib/api/uploads";
import {
  createMedia,
  deleteMedia,
  listMedia,
  MEDIA_TYPE,
  MEDIA_TYPE_LABELS,
  type CmsMedia,
  type MediaType,
} from "@/lib/api/cms";

export default function SiteMediaPage() {
  const [rows, setRows] = useState<CmsMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [type, setType] = useState<string>(String(MEDIA_TYPE.IMAGE));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    listMedia()
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "تعذّر تحميل الوسائط."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const filename = url.split("/").pop() || "file";
      const created = await createMedia({
        url,
        filename,
        originalName: filename,
        mimeType: Number(type) === MEDIA_TYPE.VIDEO ? "video/mp4" : Number(type) === MEDIA_TYPE.DOCUMENT ? "application/pdf" : "image/jpeg",
        size: 0,
        type: Number(type) as MediaType,
      });
      setRows((prev) => [created, ...prev]);
      setUrl("");
      setDialogOpen(false);
      toast.success("تمت إضافة الوسيط");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إضافة الوسيط.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return toast.error("الصيغة غير مدعومة — استخدم JPG أو PNG أو WebP أو GIF");
    if (file.size > MAX_IMAGE_BYTES) return toast.error("الصورة أكبر من ٥ ميغابايت");
    setUploading(true);
    try {
      const up = await uploadImage(file);
      const created = await createMedia({
        url: up.url,
        filename: up.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        type: MEDIA_TYPE.IMAGE,
      });
      setRows((prev) => [created, ...prev]);
      toast.success("تم رفع الصورة");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر رفع الصورة.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMedia(id);
      setRows((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف الوسيط.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="مكتبة الوسائط" description="الصور والملفات المستخدَمة في محتوى الموقع.">
        <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => void handleFile(e)} />
        <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />} رفع صورة
        </Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><IconPlus className="size-4" /> إضافة برابط</Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>إضافة وسيط بالرابط</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  للفيديو والمستندات، أو لصورة مرفوعة مسبقًا على مساحة خارجية.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="url">الرابط</Label>
                  <Input id="url" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://cdn.rvios.com/images/x.jpg" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">النوع</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={String(MEDIA_TYPE.IMAGE)}>صورة</SelectItem>
                      <SelectItem value={String(MEDIA_TYPE.VIDEO)}>فيديو</SelectItem>
                      <SelectItem value={String(MEDIA_TYPE.DOCUMENT)}>مستند</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving && <IconLoader2 className="size-4 animate-spin" />} إضافة
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {loading && (
        <Card><CardContent className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <IconLoader2 className="size-6 animate-spin" /> جارٍ التحميل…
        </CardContent></Card>
      )}
      {!loading && error && (
        <Card><CardContent className="flex items-center justify-center gap-2 py-16 text-destructive">
          <IconAlertTriangle className="size-6" /> {error}
        </CardContent></Card>
      )}
      {!loading && !error && rows.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <IconPhoto className="size-7 opacity-50" /><p>لا توجد وسائط بعد.</p>
        </CardContent></Card>
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((m) => (
            <Card key={m.id} className="overflow-hidden pt-0">
              <div className="flex h-32 items-center justify-center bg-muted">
                {m.type === MEDIA_TYPE.IMAGE ? (
                  // eslint-disable-next-line @next/next/no-img-element -- روابط خارجية عشوائية، لا يمكن استخدام next/image بدون تهيئة كل مجال
                  <img src={m.url} alt={m.originalName} className="h-full w-full object-cover" />
                ) : m.type === MEDIA_TYPE.VIDEO ? (
                  <IconVideo className="size-8 text-muted-foreground" />
                ) : (
                  <IconFile className="size-8 text-muted-foreground" />
                )}
              </div>
              <CardContent className="space-y-2">
                <p className="truncate text-sm font-medium">{m.originalName}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{MEDIA_TYPE_LABELS[m.type]}</span>
                  <span>{m.size > 0 ? formatFileSize(m.size) : "—"}</span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 px-2 text-xs"
                    onClick={() => {
                      navigator.clipboard?.writeText(m.url);
                      toast.success("تم نسخ الرابط");
                    }}
                  >
                    <IconCopy className="size-3.5" /> نسخ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(m.id)}
                  >
                    <IconTrash className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        name="الوسيط"
        onConfirm={() => {
          if (deleteId) void handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
