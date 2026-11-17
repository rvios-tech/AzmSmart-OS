"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { IconLifebuoy, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { TicketThread } from "@/components/support/ticket-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { platformReply, platformTicket, platformTickets, platformTicketStatus, TICKET_CATEGORY, TICKET_STATUS, type Ticket } from "@/lib/api/support";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** تذاكر دعم التجّار — العاجلة أولًا ثم الأقدم انتظارًا */
function PlatformSupportPageInner() {
  const params = useSearchParams();
  const [tab, setTab] = useState("0");
  const [data, setData] = useState<Awaited<ReturnType<typeof platformTickets>> | null>(null);
  const [current, setCurrent] = useState<Ticket | null>(null);
  const load = useCallback(() => platformTickets(Number(tab)).then(setData, (e) => toast.error(e instanceof ApiError ? e.message : "تعذّر التحميل.")), [tab]);
  useEffect(() => { void platformTickets(Number(tab)).then(setData, () => setData({ tickets: [], counts: {} })); }, [tab]);
  useEffect(() => { const t = params.get("t"); if (t) void platformTicket(t).then(setCurrent, () => {}); }, [params]);

  return (
    <div className="space-y-6">
      <PageHeader title="تذاكر الدعم" description="أسئلة التجّار ومشكلاتهم — العاجلة أولًا، ثم الأطول انتظارًا." />
      <Tabs value={tab} onValueChange={(v) => { setData(null); setTab(v); }}>
        <TabsList>
          <TabsTrigger value="0">بانتظار ردّنا {data?.counts[0] ? <Badge className="ms-1">{formatNumber(data.counts[0])}</Badge> : null}</TabsTrigger>
          <TabsTrigger value="1">بانتظار التاجر</TabsTrigger>
          <TabsTrigger value="2">مغلقة</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-2 px-3">
            {!data && <div className="flex h-24 items-center justify-center"><IconLoader2 className="size-4 animate-spin" /></div>}
            {data?.tickets.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground"><IconLifebuoy className="mx-auto mb-2 size-7 opacity-50" />لا تذاكر هنا.</p>}
            {data?.tickets.map((t) => (
              <button key={t.id} type="button" onClick={() => void platformTicket(t.id).then(setCurrent)}
                className={cn("w-full space-y-1 rounded-lg border p-3 text-start transition-colors hover:bg-muted", current?.id === t.id && "border-primary bg-primary/5", t.priority === 2 && t.status === 0 && "border-rose-500/50")}>
                <div className="flex items-center gap-2"><b className="flex-1 truncate text-sm">{t.subject}</b>{t.priority === 2 && <Badge variant="destructive">عاجلة</Badge>}</div>
                <p className="text-xs text-muted-foreground">{t.organization?.name} · {TICKET_CATEGORY[t.category] ?? t.category} · {formatRelativeTime(t.lastMessageAt)}</p>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card className="min-h-[28rem] lg:col-span-3">
          <CardContent className="h-full">
            {current ? (
              <TicketThread ticket={current} staff
                onReply={async (body) => { const t = await platformReply(current.id, body); setCurrent(t); void load(); return t; }}
                actions={current.status !== 2
                  ? <Button size="sm" variant="outline" onClick={() => void platformTicketStatus(current.id, 2).then((t) => { setCurrent(t); void load(); })}>إغلاق</Button>
                  : <Button size="sm" variant="outline" onClick={() => void platformTicketStatus(current.id, 0).then((t) => { setCurrent(t); void load(); })}>إعادة فتح</Button>} />
            ) : <p className="flex h-full min-h-60 items-center justify-center text-sm text-muted-foreground">اختر تذكرة. حالة كل تذكرة: {TICKET_STATUS[0].staffLabel}، {TICKET_STATUS[1].staffLabel}، {TICKET_STATUS[2].staffLabel}.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** useSearchParams يحتاج حدّ Suspense في البناء */
export default function PlatformSupportPage() {
  return <Suspense><PlatformSupportPageInner /></Suspense>;
}
