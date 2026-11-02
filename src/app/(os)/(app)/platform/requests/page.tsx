"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconBrandWhatsapp, IconInbox, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { activateStoreRequest, listStoreRequests, rejectStoreRequest, type StoreRequest } from "@/lib/api/platform";
import { formatBilling, formatDateShort, formatNumber } from "@/lib/format";
import { PLAN_LABEL, templateName } from "@/lib/shop/constants";

const PLAN_OF_CODE = ["basic", "plus", "pro"] as const;

/** الباقة والمدة والقالب كما في فواتير الطلب */
function describe(r: StoreRequest) {
  const sub = r.invoices.find((i) => i.kind === 0);
  const plan = sub?.plan != null ? PLAN_LABEL[PLAN_OF_CODE[sub.plan] ?? "basic"] : "—";
  const months = sub?.months === 12 ? "سنوي" : "شهري";
  return { plan: `${plan} · ${months}`, template: templateName(r.template) };
}

/**
 * طلبات المتاجر بالباقات المدفوعة: محجوزة لا يراها الزوّار حتى يستلم الفريق الدفع ويفعّلها —
 * فتعمل الباقة والقالب المطلوبان — أو يرفضها فيُحذف الطلب ويتحرر رابطه.
 */
export default function StoreRequestsPage() {
  const [rows, setRows] = useState<StoreRequest[] | null>(null);
  const [acting, setActing] = useState<{ row: StoreRequest; kind: "activate" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await listStoreRequests());
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر جلب الطلبات.");
      setRows([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await listStoreRequests();
        if (!cancelled) setRows(r);
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof ApiError ? err.message : "تعذّر جلب الطلبات.");
          setRows([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm() {
    if (!acting) return;
    setBusy(true);
    try {
      if (acting.kind === "activate") {
        await activateStoreRequest(acting.row.id, note.trim() || undefined);
        toast.success(`فُعّل متجر ${acting.row.name}`);
      } else {
        await rejectStoreRequest(acting.row.id, note.trim() || undefined);
        toast.success("رُفض الطلب وحُذف");
      }
      setActing(null);
      setNote("");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تنفيذ الإجراء.");
    } finally {
      setBusy(false);
    }
  }

  const contact = (r: StoreRequest) =>
    `https://wa.me/${r.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`مرحبًا، معك فريق RVIOS بخصوص طلب متجرك «${r.name}».`)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="طلبات المتاجر" description="متاجر بباقات مدفوعة تنتظر الدفع والتفعيل — لا يراها الزوّار قبل التفعيل." />

      <Card>
        <CardContent className="overflow-x-auto px-0">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">المتجر</TableHead>
                <TableHead>صاحب الطلب</TableHead>
                <TableHead>الباقة</TableHead>
                <TableHead>القالب</TableHead>
                <TableHead>الإجمالي</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="pe-6">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!rows && <TableRow><TableCell colSpan={7} className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></TableCell></TableRow>}
              {rows?.map((r) => {
                const d = describe(r);
                return (
                  <TableRow key={r.id}>
                    <TableCell className="ps-6">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{r.slug}</div>
                    </TableCell>
                    <TableCell>
                      <div>{r.owner?.displayName ?? r.company.name}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr">{r.owner?.email}</div>
                    </TableCell>
                    <TableCell>{d.plan}</TableCell>
                    <TableCell>{d.template}</TableCell>
                    <TableCell className="tabular-nums">{formatBilling(r.total, r.invoices[0]?.currency ?? "USD")}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDateShort(r.createdAt)}</TableCell>
                    <TableCell className="pe-6">
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => { setNote(""); setActing({ row: r, kind: "activate" }); }}>تفعيل</Button>
                        <Button size="sm" variant="outline" onClick={() => { setNote(""); setActing({ row: r, kind: "reject" }); }}>رفض</Button>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={contact(r)} target="_blank" rel="noopener noreferrer" aria-label="واتساب صاحب الطلب"><IconBrandWhatsapp className="size-4" /></a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {rows && rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-muted-foreground"><IconInbox className="mx-auto mb-2 size-8" />لا طلبات بانتظار التفعيل.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {rows && rows.length > 0 && (
        <p className="text-xs text-muted-foreground">{formatNumber(rows.length)} طلب بانتظار التفعيل. الإجمالي محسوب من فواتير الطلب، وتراها كاملة في صفحة الفواتير.</p>
      )}

      <AlertDialog open={!!acting} onOpenChange={(o) => !o && !busy && setActing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{acting?.kind === "activate" ? `تفعيل متجر ${acting.row.name}` : `رفض طلب ${acting?.row.name ?? ""}`}</AlertDialogTitle>
            <AlertDialogDescription>
              {acting?.kind === "activate"
                ? "تُسجَّل فواتير الطلب مدفوعة فتعمل الباقة والقالب المطلوبان، ويظهر المتجر لزوّاره فورًا."
                : "تُرفض فواتير الطلب ويُحذف المتجر المحجوز نهائيًا، ويصير رابطه متاحًا لغيره."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="note">{acting?.kind === "activate" ? "مرجع الدفع (اختياري)" : "سبب الرفض (اختياري)"}</Label>
            <Input id="note" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} placeholder={acting?.kind === "activate" ? "رقم الحوالة" : "لم يُستكمل الدفع"} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>إلغاء</AlertDialogCancel>
            <Button variant={acting?.kind === "reject" ? "destructive" : "default"} disabled={busy} onClick={() => void confirm()}>
              {busy && <IconLoader2 className="size-4 animate-spin" />}
              {acting?.kind === "activate" ? "تفعيل المتجر" : "رفض وحذف"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
