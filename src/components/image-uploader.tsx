"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconPhotoPlus, IconUpload } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, uploadImage } from "@/lib/api/uploads";

function validate(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "الصيغة غير مدعومة — استخدم JPG أو PNG أو WebP أو GIF";
  if (file.size > MAX_IMAGE_BYTES) return "الصورة أكبر من ٥ ميغابايت";
  return null;
}

/**
 * زر رفع صورة واحدة من الجهاز — يرفعها للباكند ويعيد رابطها العام عبر
 * `onUploaded`. لا حالة له عن نتيجة الرفع؛ المستدعي يقرّر أين يضع الرابط
 * (معرض منتج، شعار متجر، صورة شخصية…).
 */
export function ImageUploadButton({
  onUploaded,
  label = "رفع من الجهاز",
  variant = "outline",
  size = "sm",
  storeId,
}: {
  onUploaded: (url: string) => void;
  /** يضع الصورة في مجلد هذا المتجر في التخزين */
  storeId?: string;
  label?: string;
  variant?: "outline" | "default" | "ghost" | "secondary";
  size?: "sm" | "default" | "icon";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = validate(file);
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      const up = await uploadImage(file, storeId);
      onUploaded(up.url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر رفع الصورة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => void onFile(e)} />
      <Button type="button" variant={variant} size={size} disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />} {label}
      </Button>
    </>
  );
}

/**
 * منطقة إسقاط/نقر لصورة واحدة (شعار، غلاف، صورة شخصية…) — تعرض المعاينة
 * الحالية وتستبدلها برفع جديد.
 */
export function ImageDropzone({
  value,
  onChange,
  aspect = "aspect-square",
  className = "",
  storeId,
}: {
  value: string;
  /** يضع الصورة في مجلد هذا المتجر في التخزين */
  storeId?: string;
  onChange: (url: string) => void;
  aspect?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = validate(file);
    if (problem) return toast.error(problem);
    setBusy(true);
    try {
      const up = await uploadImage(file, storeId);
      onChange(up.url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر رفع الصورة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={busy}
      className={`relative flex ${aspect} w-full items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/50 ${className}`}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="hidden" onChange={(e) => void onFile(e)} />
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-full w-full object-cover" />
      ) : (
        <IconPhotoPlus className="size-6 opacity-60" />
      )}
      {busy && (
        <span className="absolute inset-0 flex items-center justify-center bg-background/70">
          <IconLoader2 className="size-5 animate-spin" />
        </span>
      )}
    </button>
  );
}
