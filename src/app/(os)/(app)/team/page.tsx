"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconSearch, IconUserPlus, IconUsers } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  addTeamMember, listTeamMembers, updateTeamMember, type TeamMember,
} from "@/lib/api/workspace";
import { formatDateShort, formatNumber } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/workspace/roles";
import { useWorkspace } from "@/lib/workspace/workspace-context";

export default function TeamPage() {
  const { ctx } = useWorkspace();
  const myRole = ctx?.role ?? 9;
  const canManage = myRole <= 2;

  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ displayName: "", email: "", password: "", role: "8" });

  const load = useCallback(async () => {
    try {
      setMembers((await listTeamMembers()).members);
    } catch (err) {
      setMembers([]);
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل الفريق.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (members ?? []).filter(
      (m) =>
        (roleFilter === "all" || String(m.role) === roleFilter) &&
        (!needle || m.user.displayName.toLowerCase().includes(needle) || m.user.email.toLowerCase().includes(needle)),
    );
  }, [members, q, roleFilter]);

  const active = (members ?? []).filter((m) => m.isActive).length;

  async function patch(m: TeamMember, input: { role?: number; isActive?: boolean }, ok: string) {
    setBusy(m.id);
    try {
      await updateTeamMember(m.id, input);
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await addTeamMember({
        email: form.email.trim(),
        displayName: form.displayName.trim(),
        password: form.password || undefined,
        role: Number(form.role),
      });
      toast.success("أُضيف العضو");
      setOpen(false);
      setForm({ displayName: "", email: "", password: "", role: "8" });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّرت الإضافة.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الفريق" description="أعضاء شركتك وأدوارهم.">
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><IconUserPlus className="size-4" /> إضافة عضو</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={add}>
                <DialogHeader><DialogTitle>إضافة عضو</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم</Label>
                    <Input required minLength={2} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input required type="email" dir="ltr" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة مرور مؤقتة</Label>
                    <Input type="password" dir="ltr" minLength={8} autoComplete="new-password" value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })} />
                    <p className="text-xs text-muted-foreground">للحساب الجديد فقط — إن كان للبريد حساب قائم يُربط به دون تغيير كلمة مروره.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>الدور</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_LABELS.map((l, i) => i >= Math.max(1, myRole) && (
                          <SelectItem key={l} value={String(i)}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={adding}>{adding && <IconLoader2 className="size-4 animate-spin" />} إضافة</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="الأعضاء" value={formatNumber(members?.length ?? 0)} />
        <MetricCard label="نشطون" value={formatNumber(active)} tone="good" />
        <MetricCard label="موقوفون" value={formatNumber((members?.length ?? 0) - active)} />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-xs">
          <IconSearch className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="ps-9" placeholder="ابحث بالاسم أو البريد" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="كل الأدوار" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار</SelectItem>
            {ROLE_LABELS.map((l, i) => <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">العضو</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>آخر دخول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="pe-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {!members && <TableRow><TableCell colSpan={5} className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
              {rows.map((m) => {
                const editable = canManage && m.role !== 0 && (m.role > myRole || myRole === 0);
                return (
                  <TableRow key={m.id}>
                    <TableCell className="ps-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={m.user.avatarUrl ?? undefined} alt={m.user.displayName} />
                          <AvatarFallback>{m.user.displayName.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{m.user.displayName}</p>
                          <p className="truncate text-xs text-muted-foreground" dir="ltr">{m.user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editable ? (
                        <Select value={String(m.role)} disabled={busy === m.id}
                          onValueChange={(v) => void patch(m, { role: Number(v) }, "غُيّر الدور")}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_LABELS.map((l, i) => i >= Math.max(1, myRole) && <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {m.user.lastLoginAt ? formatDateShort(m.user.lastLoginAt) : "—"}
                    </TableCell>
                    <TableCell>
                      {m.isActive
                        ? <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">نشط</Badge>
                        : <Badge variant="secondary" className="bg-rose-500/10 text-rose-600">موقوف</Badge>}
                    </TableCell>
                    <TableCell className="pe-6 text-start">
                      {editable && (
                        <Button size="sm" variant="outline" disabled={busy === m.id}
                          onClick={() => void patch(m, { isActive: !m.isActive }, m.isActive ? "أُوقف العضو" : "أُعيد تفعيله")}>
                          {m.isActive ? "إيقاف" : "تفعيل"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {members && rows.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground"><IconUsers className="mx-auto mb-2 size-6 opacity-50" />لا أعضاء مطابقون.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
