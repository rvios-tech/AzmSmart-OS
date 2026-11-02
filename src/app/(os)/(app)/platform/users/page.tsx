"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconBrandGoogle, IconCircleCheck, IconLoader2, IconSearch, IconUsers } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { listPlatformUsers, setPlatformUserRole, type PlatformUser } from "@/lib/api/platform";
import { formatDateShort } from "@/lib/format";
import { useWorkspace } from "@/lib/workspace/workspace-context";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "none", label: "ليس من الفريق" },
  { value: "0", label: "دعم" },
  { value: "1", label: "فوترة" },
  { value: "2", label: "مدير عام" },
];

/** كل حسابات النظام، وصلاحيات فريق المنصة — يمنحها المدير العام وحده (يفرضه الخادم) */
export default function PlatformUsersPage() {
  const { ctx } = useWorkspace();
  const canGrant = ctx?.platformRole === 2;
  const [rows, setRows] = useState<PlatformUser[] | null>(null);
  const [q, setQ] = useState("");
  const [staffOnly, setStaffOnly] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const r = await listPlatformUsers(q.trim() || undefined, staffOnly);
          if (!cancelled) setRows(r);
        } catch (err) {
          if (!cancelled) {
            toast.error(err instanceof ApiError ? err.message : "تعذّر جلب الحسابات.");
            setRows([]);
          }
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, staffOnly]);

  async function setRole(u: PlatformUser, value: string) {
    const role = value === "none" ? null : (Number(value) as 0 | 1 | 2);
    setBusy(u.id);
    try {
      const r = await setPlatformUserRole(u.id, role);
      setRows((prev) => prev?.map((x) => (x.id === u.id ? { ...x, isPlatformStaff: r.isPlatformStaff, platformRole: r.platformRole } : x)) ?? prev);
      toast.success(role === null ? "سُحبت صلاحية فريق المنصة" : "تغيّرت الصلاحية");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تغيير الصلاحية.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الحسابات" description="كل حسابات النظام وشركاتها، وصلاحيات فريق المنصة." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث بالبريد أو الاسم" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <button type="button" onClick={() => setStaffOnly((s) => !s)} aria-pressed={staffOnly}
          className={cn("rounded-full border px-3 py-1.5 text-sm", staffOnly && "border-primary bg-primary/10 font-medium")}>
          فريق المنصة فقط
        </button>
      </div>

      <Card>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">الحساب</TableHead>
                <TableHead>الشركات</TableHead>
                <TableHead>آخر دخول</TableHead>
                <TableHead>التسجيل</TableHead>
                <TableHead className="pe-6">صلاحية المنصة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rows && <TableRow><TableCell colSpan={5} className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
              {rows?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="ps-6">
                    <div className="flex items-center gap-1.5 font-medium">
                      {u.displayName}
                      {u.emailVerifiedAt && <IconCircleCheck className="size-4 text-emerald-600" aria-label="بريد مؤكد" />}
                      {u.google && <IconBrandGoogle className="size-4 text-muted-foreground" aria-label="حساب Google" />}
                    </div>
                    <div className="text-xs text-muted-foreground" dir="ltr">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.companies.slice(0, 3).map((c) => <Badge key={c.id} variant="secondary" className="font-normal">{c.name}</Badge>)}
                      {u.companies.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.lastLoginAt ? formatDateShort(u.lastLoginAt) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateShort(u.createdAt)}</TableCell>
                  <TableCell className="pe-6">
                    {canGrant && u.id !== ctx?.user?.id ? (
                      <Select value={u.isPlatformStaff ? String(u.platformRole ?? 0) : "none"} disabled={busy === u.id} onValueChange={(v) => void setRole(u, v)}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm">{u.isPlatformStaff ? ROLES.find((r) => r.value === String(u.platformRole ?? 0))?.label : "—"}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows && rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground"><IconUsers className="mx-auto mb-2 size-8" />لا حسابات مطابقة.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
