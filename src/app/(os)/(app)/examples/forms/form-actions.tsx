"use client";

import { toast } from "sonner";
import { IconDeviceFloppy, IconFilter, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

export function SaveFooter({ saveLabel = "حفظ التغييرات" }: { saveLabel?: string }) {
  return (
    <CardFooter className="justify-end gap-2">
      <Button variant="outline" onClick={() => toast("تم تجاهل التغييرات")}>
        إلغاء
      </Button>
      <Button
        onClick={() =>
          toast.success("Saved", {
            description: "تم حفظ تغييراتك.",
          })
        }
      >
        <IconDeviceFloppy className="size-4" /> {saveLabel}
      </Button>
    </CardFooter>
  );
}

export function FilterActions() {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() =>
          toast.success("تم تطبيق التصفية", {
            description: "تم تحديث القائمة.",
          })
        }
      >
        <IconFilter className="size-4" /> تطبيق
      </Button>
      <Button variant="ghost" onClick={() => toast("تمت إعادة ضبط التصفية")}>
        <IconRefresh className="size-4" /> إعادة الضبط
      </Button>
    </div>
  );
}
