"use client";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * نافذة تأكيد الحذف. يتحكم المستدعي في `open`/`onOpenChange` (مثلاً عنصر
 * قائمة منسدلة يضبط open=true). تُنفّذ `onConfirm` عملية الحذف الفعلية،
 * ويُعرض إشعار نجاح تلقائياً.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  name = "العنصر",
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: () => void;
  name?: string;
  description?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف {name}؟</AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              `سيؤدي هذا إلى حذف ${name} نهائياً. لا يمكن التراجع عن هذا الإجراء.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={() => {
              onConfirm?.();
              toast.success(`تم حذف ${name}`, {
                description: "تم حذف السجل بنجاح.",
              });
            }}
          >
            حذف
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
