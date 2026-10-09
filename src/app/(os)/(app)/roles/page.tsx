"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconMinus } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listTeamMembers } from "@/lib/api/workspace";
import { formatNumber } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/workspace/roles";
import { useWorkspace } from "@/lib/workspace/workspace-context";

/**
 * أقل رقم دور يملك الصلاحية (الأصغر = أعلى). هذه القواعد مرآة لما يفرضه
 * الباكند فعلًا بـ `@RequireRole` — الجدول للشرح، والمنع الفعلي في الخادم.
 */
const CAPABILITIES: { label: string; group: string; minRole: number }[] = [
  { group: "الفريق", label: "عرض الأعضاء", minRole: 9 },
  { group: "الفريق", label: "إضافة عضو وتغيير دوره وإيقافه", minRole: 2 },
  { group: "المتجر", label: "عرض المنتجات والطلبات والتحليلات", minRole: 9 },
  { group: "المتجر", label: "معالجة الطلبات وتحديث المنتجات", minRole: 8 },
  { group: "المتجر", label: "تأكيد الدفع وإدارة الشحن", minRole: 6 },
  { group: "المتجر", label: "إنشاء متجر وتعديل إعداداته وحذفه", minRole: 2 },
  { group: "الاشتراك", label: "ترقية الباقة وشراء الإضافات", minRole: 2 },
  { group: "الشركة", label: "نقل الملكية وحذف الحساب", minRole: 0 },
];

export default function RolesPage() {
  const { ctx } = useWorkspace();
  const [counts, setCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    void (async () => {
      try {
        const { members } = await listTeamMembers();
        const c: Record<number, number> = {};
        for (const m of members) c[m.role] = (c[m.role] ?? 0) + 1;
        setCounts(c);
      } catch {
        /* الصفحة مرجعية — تبقى مفيدة دون الأعداد */
      }
    })();
  }, []);

  const mine = ctx?.role;

  return (
    <div className="space-y-6">
      <PageHeader title="الأدوار والصلاحيات" description="ماذا يستطيع كل دور أن يفعله في شركتك." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {ROLE_LABELS.map((label, i) => (
          <Card key={label} className={mine === i ? "border-primary" : ""}>
            <CardContent className="space-y-1 py-4">
              <p className="font-medium">{label}</p>
              <p className="text-2xl font-semibold tabular-nums">{formatNumber(counts[i] ?? 0)}</p>
              {mine === i && <Badge>دورك</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>مصفوفة الصلاحيات</CardTitle>
          <CardDescription>الدور الأعلى يملك كل ما دونه.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">الصلاحية</TableHead>
                {ROLE_LABELS.map((l) => <TableHead key={l} className="text-center text-xs">{l}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {CAPABILITIES.map((c) => (
                <TableRow key={c.label}>
                  <TableCell className="ps-6">
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.group}</p>
                  </TableCell>
                  {ROLE_LABELS.map((l, i) => (
                    <TableCell key={l} className="text-center">
                      {i <= c.minRole
                        ? <IconCheck className="mx-auto size-4 text-emerald-600" aria-label="مسموح" />
                        : <IconMinus className="mx-auto size-4 text-muted-foreground/40" aria-label="غير مسموح" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
