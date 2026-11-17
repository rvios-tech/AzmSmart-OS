"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { IconLifebuoy, IconLoader2, IconPlus } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { TicketThread } from "@/components/support/ticket-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { listStores, type Store } from "@/lib/api/shop";
import {
  closeTicket, createTicket, getTicket, listTickets, replyTicket, TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS, type Ticket,
} from "@/lib/api/support";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** الدعم الفني: تذاكر شركتك مع فريق RVIOS */
function SupportPageInner() {
  const params = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [current, setCurrent] = useState<Ticket | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "store", priority: "0", body: "", storeId: "none" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => listTickets().then(setTickets, () => setTickets([])), []);
  const show = useCallback((id: string) => getTicket(id).then(setCurrent, (e) => toast.error(e instanceof ApiError ? e.message : "تعذّر فتح التذكرة.")), []);
  useEffect(() => {
    void listTickets().then(setTickets, () => setTickets([]));
    void listStores().then((r) => setStores(r.stores), () => {});
    const t = params.get("t");
    if (t) void getTicket(t).then(setCurrent, () => {});
  }, [params]);

  async function create() {
    setBusy(true);
    try {
      const t = await createTicket({ subject: form.subject.trim(), category: form.category, priority: Number(form.priority), body: form.body.trim(), ...(form.storeId !== "none" ? { storeId: form.storeId } : {}) });
      toast.success(`فُتحت التذكرة ${t.ref} — يصلك إشعار حين يردّ الفريق`);
      setOpen(false);
      setForm({ subject: "", category: "store", priority: "0", body: "", storeId: "none" });
      await load();
      await show(t.id);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر فتح التذكرة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الدعم الفني" description="تواصل مع فريق RVIOS بتذكرة لكل مشكلة — تتابع الردود هنا ويصلك إشعار بكل ردّ.">
        <Button onClick={() => setOpen(true)}><IconPlus className="size-4" /> تذكرة جديدة</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-2 px-3">
            {!tickets && <div className="flex h-24 items-center justify-center"><IconLoader2 className="size-4 animate-spin" /></div>}
            {tickets?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground"><IconLifebuoy className="mx-auto mb-2 size-7 opacity-50" />لا تذاكر بعد — افتح تذكرة لأي سؤال أو مشكلة.</p>}
            {tickets?.map((t) => (
              <button key={t.id} type="button" onClick={() => void show(t.id)}
                className={cn("w-full space-y-1 rounded-lg border p-3 text-start transition-colors hover:bg-muted", current?.id === t.id && "border-primary bg-primary/5")}>
                <div className="flex items-center gap-2">
                  <b className="flex-1 truncate text-sm">{t.subject}</b>
                  <Badge variant="secondary" className={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground"><span dir="ltr" className="font-mono">{t.ref}</span> · {TICKET_CATEGORY[t.category] ?? t.category}{t.store ? ` · ${t.store.name}` : ""} · {formatRelativeTime(t.lastMessageAt)}</p>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="min-h-[28rem] lg:col-span-3">
          <CardContent className="h-full">
            {current ? (
              <TicketThread ticket={current}
                onReply={async (body) => { const t = await replyTicket(current.id, body); setCurrent(t); void load(); return t; }}
                actions={current.status !== 2 && <Button size="sm" variant="outline" onClick={() => void closeTicket(current.id).then((t) => { setCurrent(t); void load(); })}>إغلاق — حُلّت</Button>} />
            ) : <p className="flex h-full min-h-60 items-center justify-center text-sm text-muted-foreground">اختر تذكرة لعرض المحادثة.</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader><DialogTitle>تذكرة جديدة</DialogTitle><DialogDescription>صف المشكلة بخطواتها — كلما كانت أوضح كان الحل أسرع.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label htmlFor="ts">الموضوع</Label><Input id="ts" maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>النوع</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TICKET_CATEGORY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>الأولوية</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{TICKET_PRIORITY.map((p, i) => <SelectItem key={p} value={String(i)}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            {stores.length > 0 && (
              <div className="space-y-2"><Label>المتجر</Label>
                <Select value={form.storeId} onValueChange={(v) => setForm({ ...form, storeId: v })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">عام</SelectItem>{stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            )}
            <div className="space-y-2"><Label htmlFor="tb">التفاصيل</Label><Textarea id="tb" rows={5} maxLength={4000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button disabled={busy || form.subject.trim().length < 4 || form.body.trim().length < 10} onClick={() => void create()}>{busy && <IconLoader2 className="size-4 animate-spin" />} فتح التذكرة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** useSearchParams يحتاج حدّ Suspense في البناء */
export default function SupportPage() {
  return <Suspense><SupportPageInner /></Suspense>;
}
