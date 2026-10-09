"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconCopy,
  IconTrash,
  IconTable,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { DataTable, SortableHeader } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { customers, type Customer } from "@/data";
import { formatCurrency } from "@/lib/format";

const statusStyles: Record<Customer["status"], string> = {
  "نشط": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "غير نشط": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  "معلق": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const planStyles: Record<Customer["plan"], string> = {
  "مجاني": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  "احترافي": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "مؤسسي": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

function makeColumns(
  onDelete: (customer: Customer) => void
): ColumnDef<Customer>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="تحديد الكل"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.name}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} title="الاسم" />,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarImage src={c.avatar} alt={c.name} />
            <AvatarFallback>{initials(c.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              href={`/customers/${c.id}`}
              className="font-medium hover:underline"
            >
              {c.name}
            </Link>
            <p className="truncate text-xs text-muted-foreground">{c.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "company",
    header: "الشركة",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.company}</span>
    ),
  },
  {
    accessorKey: "plan",
    header: "الباقة",
    cell: ({ row }) => (
      <Badge variant="secondary" className={planStyles[row.original.plan]}>
        {row.original.plan}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "الحالة",
    cell: ({ row }) => (
      <Badge variant="secondary" className={statusStyles[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "spent",
    header: ({ column }) => (
      <div className="flex justify-end">
        <SortableHeader column={column} title="إجمالي الإنفاق" />
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-end font-medium tabular-nums">
        {formatCurrency(row.original.spent)}
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: "الموقع",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.location}</span>
    ),
  },
  {
    accessorKey: "joined",
    header: ({ column }) => <SortableHeader column={column} title="تاريخ الانضمام" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.joined}
      </span>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const c = row.original;
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <IconDotsVertical className="size-4" />
                <span className="sr-only">فتح القائمة</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/customers/${c.id}`}>
                  <IconEye className="size-4" /> عرض
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/customers/${c.id}/edit`}>
                  <IconPencil className="size-4" /> تعديل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  navigator.clipboard?.writeText(c.id);
                  toast.success("تم نسخ معرّف العميل", { description: c.id });
                }}
              >
                <IconCopy className="size-4" /> نسخ المعرّف
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  onDelete(c);
                  toast.success("تم حذف العميل", {
                    description: `تمت إزالة ${c.name}.`,
                  });
                }}
              >
                <IconTrash className="size-4" /> حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
  ];
}

export default function DataTableExamplePage() {
  const [data, setData] = useState<Customer[]>(customers);
  const columns = useMemo(
    () =>
      makeColumns((customer) =>
        setData((prev) => prev.filter((c) => c.id !== customer.id))
      ),
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="جدول البيانات"
        description="جدول قابل لإعادة الاستخدام مع الترتيب وإظهار الأعمدة وتحديد الصفوف والبحث والتقسيم إلى صفحات — مبني على TanStack Table."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconTable className="size-4" /> العملاء
          </CardTitle>
          <CardDescription>
            اضغط على ترويسة عمود للترتيب، واستخدم قائمة الأعمدة لإظهارها أو
            إخفائها، وحدّد الصفوف بمربعات الاختيار، وابحث بالاسم. المكوّن نفسه
            <span className="font-medium text-foreground"> DataTable </span>
            يشغّل كل قائمة في هذا النظام.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data}
            searchKey="name"
            searchPlaceholder="ابحث في العملاء…"
          />
        </CardContent>
      </Card>
    </div>
  );
}
