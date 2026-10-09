"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconDotsVertical,
  IconHistory,
  IconKey,
  IconLoader2,
  IconPlus,
  IconRefresh,
  IconSend,
  IconTrash,
  IconWebhook,
} from "@tabler/icons-react";

import { DeleteDialog } from "@/components/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import {
  createWebhook, deleteWebhook, listWebhookDeliveries, listWebhookEvents, listWebhooks, redeliverWebhook,
  rotateWebhookSecret, testWebhook, updateWebhook,
  type Webhook, type WebhookDelivery, type WebhookEventDef,
} from "@/lib/api/developers";
import { formatDateTime, formatNumber, formatRelativeTime } from "@/lib/format";

const fail = (err: unknown, fallback: string) => toast.error(err instanceof ApiError ? err.message : fallback);

async function copy(text: string) {
  try {
    await navigator.clipboard?.writeText(text);
    toast.success("نُسخ");
  } catch {
    toast.error("تعذّر النسخ — انسخه يدويًا.");
  }
}

function DeliveryBadge({ d }: { d: WebhookDelivery }) {
  if (d.status === 1) return <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">نجح {d.responseCode}</Badge>;
  if (d.status === 2) return <Badge variant="secondary" className="bg-rose-500/10 text-rose-600 dark:text-rose-400">فشل نهائيًا</Badge>;
  if (d.attempts === 0) return <Badge variant="secondary">قيد الإرسال</Badge>;
  return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">سيُعاد</Badge>;
}

/** يعرض السرّ مرة واحدة مع طريقة التحقق من التوقيع عند المستقبِل. */
function SecretReveal({ secret }: { secret: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
        <code className="flex-1 overflow-x-auto font-mono text-xs" dir="ltr">{secret}</code>
        <Button size="sm" variant="outline" onClick={() => void copy(secret)}><IconCopy className="size-4" /> نسخ</Button>
      </div>
      <p className="text-xs text-muted-foreground">
        تحقّق من كل طلب يصلك: الترويسة <code className="font-mono">X-Azm-Signature</code> بصيغة{" "}
        <code className="font-mono" dir="ltr">t=…,v1=…</code>، و<code className="font-mono">v1</code> هو HMAC-SHA256 بهذا السرّ على النص{" "}
        <code className="font-mono" dir="ltr">{"`${t}.${body}`"}</code>. ارفض أي طلب لا يطابق، أو طابعه الزمني أقدم من ٥ دقائق.
      </p>
    </div>
  );
}

function DeliveriesDialog({ hook, onClose }: { hook: Webhook | null; onClose: () => void }) {
  const [rows, setRows] = useState<WebhookDelivery[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hook) return;
    try {
      setRows(await listWebhookDeliveries(hook.id));
    } catch (err) {
      setRows([]);
      fail(err, "تعذّر تحميل السجل.");
    }
  }, [hook]);

  useEffect(() => {
    void (async () => {
      setRows(null);
      await load();
    })();
  }, [load]);

  async function redeliver(d: WebhookDelivery) {
    setBusy(d.id);
    try {
      const r = await redeliverWebhook(d.id);
      if (r.status === 1) toast.success(`أُعيد الإرسال — ردّ ${r.responseCode}`);
      else toast.error(r.error ?? "فشل الإرسال");
      await load();
    } catch (err) {
      fail(err, "تعذّرت إعادة الإرسال.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={hook !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>سجل الإرسال</DialogTitle>
          <DialogDescription dir="ltr" className="truncate text-start font-mono text-xs">{hook?.url}</DialogDescription>
        </DialogHeader>
        {!rows ? (
          <div className="py-10 text-center"><IconLoader2 className="mx-auto size-5 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">لا إرسالات بعد — جرّب «إرسال حدث تجريبي».</p>
        ) : (
          <div className="divide-y rounded-md border">
            {rows.map((d) => (
              <div key={d.id} className="space-y-2 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="font-mono text-xs" dir="ltr">{d.event}</code>
                  <DeliveryBadge d={d} />
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(d.attempts)} محاولة · {formatRelativeTime(d.createdAt)}
                  </span>
                  <div className="ms-auto flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setOpen(open === d.id ? null : d.id)}>
                      {open === d.id ? "إخفاء" : "الحمولة"}
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy === d.id} onClick={() => void redeliver(d)}>
                      {busy === d.id ? <IconLoader2 className="size-4 animate-spin" /> : <IconRefresh className="size-4" />} إعادة
                    </Button>
                  </div>
                </div>
                {d.error && <p className="text-xs text-destructive">{d.error}</p>}
                {d.status === 0 && d.attempts > 0 && d.nextAttemptAt && (
                  <p className="text-xs text-muted-foreground">المحاولة التالية {formatDateTime(d.nextAttemptAt)}</p>
                )}
                {open === d.id && (
                  <pre className="max-h-64 overflow-auto rounded bg-muted p-3 text-start font-mono text-[11px]" dir="ltr">
                    {JSON.stringify(d.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** خطافات الويب: إشعار نظامك الخارجي فور وقوع حدث في متجرك، موقَّعًا ومع إعادة محاولة. */
export function WebhooksSection() {
  const [hooks, setHooks] = useState<Webhook[] | null>(null);
  const [events, setEvents] = useState<WebhookEventDef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  const [logFor, setLogFor] = useState<Webhook | null>(null);
  const [deleting, setDeleting] = useState<Webhook | null>(null);

  const load = useCallback(async () => {
    try {
      const [h, e] = await Promise.all([listWebhooks(), listWebhookEvents()]);
      setHooks(h);
      setEvents(e);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تحميل الخطافات.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const label = (id: string) => events.find((e) => e.id === id)?.label ?? id;

  function openCreate() {
    setUrl("");
    setPicked(events[0] ? [events[0].id] : []);
    setRevealed(null);
    setCreateOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!picked.length) return toast.error("اختر حدثًا واحدًا على الأقل");
    setCreating(true);
    try {
      const h = await createWebhook({ url: url.trim(), events: picked });
      setRevealed(h.secret);
      await load();
    } catch (err) {
      fail(err, "تعذّر إنشاء نقطة النهاية.");
    } finally {
      setCreating(false);
    }
  }

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  const toggle = (h: Webhook, isActive: boolean) =>
    act(h.id, async () => {
      try {
        await updateWebhook(h.id, { isActive });
        await load();
        toast.success(isActive ? "فُعّلت نقطة النهاية" : "عُطّلت نقطة النهاية");
      } catch (err) {
        fail(err, "تعذّر التحديث.");
      }
    });

  const test = (h: Webhook) =>
    act(h.id, async () => {
      try {
        const d = await testWebhook(h.id);
        if (d.status === 1) toast.success(`وصل الحدث التجريبي — ردّ ${d.responseCode}`);
        else toast.error(d.error ?? "لم يصل الحدث التجريبي");
        await load();
      } catch (err) {
        fail(err, "تعذّر الإرسال.");
      }
    });

  const rotate = (h: Webhook) =>
    act(h.id, async () => {
      try {
        const r = await rotateWebhookSecret(h.id);
        setRevealed(r.secret);
        setCreateOpen(true);
        await load();
      } catch (err) {
        fail(err, "تعذّر تدوير السرّ.");
      }
    });

  async function doDelete() {
    if (!deleting) return;
    try {
      await deleteWebhook(deleting.id);
      await load();
      toast.success("حُذفت نقطة النهاية");
    } catch (err) {
      fail(err, "تعذّر الحذف.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IconWebhook className="size-5" /> خطافات الويب</CardTitle>
          <CardDescription>
            نرسل إلى عنوانك طلب POST موقَّعًا فور وقوع الحدث، ونعيد المحاولة ٥ مرات خلال نحو ٨ ساعات إن لم يردّ خادمك بـ2xx.
          </CardDescription>
          <CardAction>
            <Button size="sm" variant="outline" onClick={openCreate}><IconPlus className="size-4" /> إضافة نقطة نهاية</Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">العنوان</TableHead>
                  <TableHead>الأحداث</TableHead>
                  <TableHead>مفعّلة</TableHead>
                  <TableHead>آخر إرسال</TableHead>
                  <TableHead className="w-10 pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hooks && !error && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                )}
                {error && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-destructive"><IconAlertTriangle className="mx-auto mb-2 size-6" />{error}</TableCell></TableRow>
                )}
                {hooks?.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="ps-6">
                      <code className="block max-w-72 truncate font-mono text-xs" dir="ltr">{h.url}</code>
                      <span className="font-mono text-[11px] text-muted-foreground" dir="ltr">{h.secretHint}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-72 flex-wrap gap-1">
                        {h.events.map((e) => <Badge key={e} variant="secondary" className="text-[11px]" title={e}>{label(e)}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch checked={h.isActive} disabled={busy === h.id} onCheckedChange={(v) => void toggle(h, v)} aria-label="تفعيل" />
                    </TableCell>
                    <TableCell className="text-sm">
                      {h.lastDeliveryAt ? (
                        <div className="space-y-0.5">
                          <span className={h.lastStatus && h.lastStatus >= 200 && h.lastStatus < 300 ? "text-emerald-600" : "text-destructive"}>
                            {h.lastStatus ? `ردّ ${h.lastStatus}` : "لم يردّ"}
                          </span>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(h.lastDeliveryAt)}</p>
                          {h.failureCount > 0 && <p className="text-xs text-amber-600">{formatNumber(h.failureCount)} إخفاق متتالٍ</p>}
                          {!h.isActive && h.failureCount > 0 && <p className="text-xs text-destructive">عُطّلت تلقائيًا بعد إخفاقات متكررة</p>}
                        </div>
                      ) : <span className="text-muted-foreground">لم يُرسل شيء بعد</span>}
                    </TableCell>
                    <TableCell className="pe-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8" disabled={busy === h.id}>
                            {busy === h.id ? <IconLoader2 className="size-4 animate-spin" /> : <IconDotsVertical className="size-4" />}
                            <span className="sr-only">إجراءات</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => void test(h)}><IconSend className="size-4" /> إرسال حدث تجريبي</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setLogFor(h)}><IconHistory className="size-4" /> سجل الإرسال</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => void rotate(h)}><IconKey className="size-4" /> تدوير سرّ التوقيع</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(h)}><IconTrash className="size-4" /> حذف</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {hooks && hooks.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground"><IconWebhook className="mx-auto mb-2 size-6 opacity-50" />لا نقاط نهاية بعد.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setRevealed(null); }}>
        <DialogContent className="sm:max-w-lg">
          {revealed ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><IconCircleCheck className="size-5 text-emerald-500" /> سرّ التوقيع</DialogTitle>
                <DialogDescription>انسخه الآن — لن يظهر كاملًا مرة أخرى. تحتاجه في خادمك للتحقق من أن الطلب منّا.</DialogDescription>
              </DialogHeader>
              <SecretReveal secret={revealed} />
              <DialogFooter>
                <Button onClick={() => { setCreateOpen(false); setRevealed(null); }}><IconCheck className="size-4" /> حفظتُه، إغلاق</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={submitCreate}>
              <DialogHeader>
                <DialogTitle>نقطة نهاية جديدة</DialogTitle>
                <DialogDescription>عنوان https عام على خادمك يستقبل طلبات POST بصيغة JSON.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="hook-url">العنوان</Label>
                  <Input id="hook-url" dir="ltr" required maxLength={500} placeholder="https://example.com/webhooks/azm" value={url} onChange={(e) => setUrl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الأحداث</Label>
                  {events.map((ev) => (
                    <label key={ev.id} className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm">
                      <Checkbox className="mt-0.5" checked={picked.includes(ev.id)}
                        onCheckedChange={(c) => setPicked((p) => (c === true ? [...new Set([...p, ev.id])] : p.filter((x) => x !== ev.id)))} />
                      <span>
                        {ev.label}
                        <code className="block font-mono text-[11px] text-muted-foreground" dir="ltr">{ev.id}</code>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={creating}>{creating && <IconLoader2 className="size-4 animate-spin" />} إضافة</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeliveriesDialog hook={logFor} onClose={() => setLogFor(null)} />

      <DeleteDialog
        open={deleting !== null}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        name="نقطة النهاية"
        description={deleting ? `لن يصل ${deleting.url} أي حدث بعد الآن، ويُحذف سجلها.` : undefined}
        onConfirm={() => void doDelete()}
      />
    </>
  );
}
