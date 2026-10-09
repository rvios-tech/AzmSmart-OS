"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconPencil, IconDotsVertical, IconCopy, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";
import { ApiError } from "@/lib/api/client";
import { deleteClient } from "@/lib/api/clients";

export function CustomerActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    try {
      await deleteClient(id);
      router.push("/customers");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف العميل.");
    }
  }

  return (
    <>
      <Button variant="outline" asChild>
        <Link href={`/customers/${id}/edit`}>
          <IconPencil className="size-4" /> تعديل
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="size-9">
            <IconDotsVertical className="size-4" />
            <span className="sr-only">إجراءات إضافية</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard?.writeText(id);
              toast.success("تم نسخ معرّف العميل", { description: id });
            }}
          >
            <IconCopy className="size-4" /> نسخ المعرّف
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setOpen(true)}>
            <IconTrash className="size-4" /> حذف
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteDialog
        open={open}
        onOpenChange={setOpen}
        name={name}
        description={`سيؤدي هذا إلى حذف ${name} نهائياً. لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={() => void handleDelete()}
      />
    </>
  );
}
