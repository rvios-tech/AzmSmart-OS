"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconLoader2, IconTrash } from "@tabler/icons-react";

import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { deleteStore, type Store } from "@/lib/api/shop";
import { useStore } from "@/lib/shop/store-context";

/** حذف المتجر نهائيًا — بكتابة رابطه للتأكيد، كي لا يُفقد متجر عامل بنقرة */
export function DeleteStoreCard({ store }: { store: Store }) {
  const router = useRouter();
  const { reload } = useStore();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await deleteStore(store.id, store.slug);
      await reload();
      toast.success(`حُذف متجر ${store.name}`);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف المتجر.");
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>حذف المتجر</CardTitle>
        <CardDescription>
          يُحذف المتجر بمنتجاته وطلباته وصوره نهائيًا ولا يمكن استرجاعه، ويتوقف رابطه. الاشتراك المدفوع لا يُسترد.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={() => { setTyped(""); setOpen(true); }}>
          <IconTrash className="size-4" /> حذف المتجر
        </Button>
      </CardContent>

      <AlertDialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {store.name} نهائيًا؟</AlertDialogTitle>
            <AlertDialogDescription>للتأكيد اكتب رابط المتجر كما هو.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-slug">رابط المتجر: <b dir="ltr">{store.slug}</b></Label>
            <Input id="confirm-slug" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <Button variant="destructive" disabled={busy || typed.trim() !== store.slug} onClick={() => void remove()}>
              {busy && <IconLoader2 className="size-4 animate-spin" />} حذف نهائي
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
