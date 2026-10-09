import { uploadFile } from "./client";

export interface UploadedImage {
  url: string;
  name: string;
  size: number;
  mime: string;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * يرفع صورة إلى شركتي ويرجع رابطها العام. `storeId` يضعها في مجلد ذلك المتجر
 * في التخزين السحابي (صور المنتجات والشعار والإيصالات) بدل مجلد الشركة العام.
 */
export function uploadImage(file: File, storeId?: string): Promise<UploadedImage> {
  const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
  return uploadFile<UploadedImage>(`/uploads${q}`, file);
}
