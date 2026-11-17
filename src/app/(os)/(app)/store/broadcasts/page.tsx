"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IconBellRinging, IconLoader2, IconSend } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { listBroadcasts, sendBroadcast, type BroadcastAudience, type Store } from "@/lib/api/shop";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const AUDIENCE: Record<BroadcastAudience, string> = { all: "كل العملاء", buyers: "من اشترى منك", returning: "العملاء العائدون", accounts: "من لهم حساب في متجرك" };

function BroadcastsView({ store }: { store: Store }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof listBroadcasts>> | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [audience, setAudience] = useState<BroadcastAudience>("all");
  const [sms, setSms] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = () => listBroadcasts(store.id).then(setData, (e) => toast.error(e instanceof ApiError ? e.message : "تعذّر التحميل."));
  useEffect(() => { void listBroadcasts(store.id).then(setData, () => setData({ broadcasts: [], audience: { all: 0, accounts: 0, buyers: 0 }, smsAvailable: false })); }, [store.id]);

  const count = data ? (audience === "accounts" ? data.audience.accounts : audience === "buyers" || audience === "returning" ? data.audience.buyers : data.audience.all) : 0;

  async function send() {
    if (!window.confirm(`إرسال «${title.trim()}» إلى ${AUDIENCE[audience]}؟`)) return;
    setBusy(true);
    try {
      const b = await sendBroadcast(store.id, { title: title.trim(), body: body.trim(), audience, ...(link.trim() ? { link: link.trim() } : {}), ...(sms ? { sms: true } : {}) });
      toast.success(`وصل إلى ${formatNumber(b.recipients)} عميل`);
      setTitle(""); setBody(""); setLink(""); setSms(false);
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر الإرسال.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="إشعارات العملاء" description="أرسل عرضًا أو خبرًا لعملائك — يظهر في حساباتهم بمتجرك، وبرسالة جوال حين يُربط مزوّد الرسائل. حتى ٥ إشعارات في اليوم." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>إشعار جديد</CardTitle><CardDescription>تصل أيضًا إشعارات تلقائية بحالة كل طلب ورصيد المحفظة.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="bt">العنوان</Label><Input id="bt" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="تخفيضات نهاية الأسبوع" /></div>
            <div className="space-y-2"><Label htmlFor="bb">النص</Label><Textarea id="bb" rows={3} maxLength={500} value={body} onChange={(e) => setBody(e.target.value)} placeholder="خصم ٢٠٪ على كل المنتجات حتى الأحد" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>إلى</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as BroadcastAudience)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(AUDIENCE) as BroadcastAudience[]).map((k) => <SelectItem key={k} value={k}>{AUDIENCE[k]}</SelectItem>)}</SelectContent>
                </Select>
                {data && <p className="text-xs text-muted-foreground">{audience === "returning" ? `من بين ${formatNumber(count)} مشترٍ` : `${formatNumber(count)} عميل`}</p>}
              </div>
              <div className="space-y-2"><Label htmlFor="bl">رابط داخل المتجر (اختياري)</Label><Input id="bl" dir="ltr" maxLength={200} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/shop" /></div>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <Checkbox className="mt-0.5" checked={sms} disabled={!data?.smsAvailable} onCheckedChange={(v) => setSms(v === true)} />
              <span>أرسله أيضًا برسالة إلى جوالاتهم{data && !data.smsAvailable && <span className="block text-xs text-muted-foreground">يُفعَّل حين تربط المنصة مزوّد الرسائل.</span>}</span>
            </label>
            <Button disabled={busy || title.trim().length < 2 || body.trim().length < 2 || !count} onClick={() => void send()}>
              {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />} إرسال
            </Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>المُرسَلة</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {!data && <div className="flex h-24 items-center justify-center"><IconLoader2 className="size-4 animate-spin" /></div>}
            {data?.broadcasts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground"><IconBellRinging className="mx-auto mb-2 size-6 opacity-50" />لم ترسل إشعارًا بعد.</p>}
            {data?.broadcasts.map((b) => (
              <div key={b.id} className="space-y-1 rounded-md border p-3 text-sm">
                <div className="flex items-center gap-2"><b className="flex-1 truncate">{b.title}</b><span className="text-xs text-muted-foreground">{formatRelativeTime(b.createdAt)}</span></div>
                <p className="line-clamp-2 text-muted-foreground">{b.body}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{AUDIENCE[b.audience]}</Badge>
                  <Badge variant="outline">{formatNumber(b.recipients)} عميل</Badge>
                  {b.sent > 0 && <Badge variant="outline">{formatNumber(b.sent)} رسالة جوال</Badge>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function BroadcastsPage() {
  return <RequireStore allowSuspended>{(store) => <BroadcastsView store={store} />}</RequireStore>;
}
