"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconBell, IconBuildingStore, IconChecks, IconLoader2, IconMail, IconPalette, IconReceipt,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listAlerts, readAlert, readAllAlerts, type PlatformAlert } from "@/lib/api/platform-ops";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON: Record<string, typeof IconBell> = {
  store_request: IconBuildingStore,
  store_created: IconBuildingStore,
  invoice_proof: IconReceipt,
  custom_store: IconPalette,
  contact: IconMail,
};

/** صندوق تنبيهات الفريق المشترك — ما يُعالَج هنا يُعلَّم للجميع وفي تطبيق RVOS. */
export default function PlatformAlertsPage() {
  const router = useRouter();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof listAlerts>> | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await listAlerts(unreadOnly));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحميل.");
    }
  }, [unreadOnly]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function open(a: PlatformAlert) {
    if (!a.readAt) void readAlert(a.id).catch(() => undefined);
    if (a.link) router.push(a.link);
    else setData((d) => (d ? { ...d, items: d.items.map((x) => (x.id === a.id ? { ...x, readAt: new Date().toISOString() } : x)) } : d));
  }

  return (
    <div className="space-y-6">
      <PageHeader title="التنبيهات" description="طلبات المتاجر وإيصالات الدفع وطلبات التصميم ورسائل الموقع — صندوق واحد للفريق.">
        <div className="flex gap-2">
          <Button variant={unreadOnly ? "default" : "outline"} size="sm" onClick={() => setUnreadOnly((v) => !v)}>غير المقروءة فقط</Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || !data?.unread}
            onClick={async () => {
              setBusy(true);
              try {
                await readAllAlerts();
                await load();
              } finally {
                setBusy(false);
              }
            }}
          >
            <IconChecks className="size-4" /> تعليم الكل مقروءًا
          </Button>
        </div>
      </PageHeader>
      {!data && <div className="py-16 text-center"><IconLoader2 className="mx-auto size-6 animate-spin" /></div>}
      {data && data.items.length === 0 && (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14 text-muted-foreground"><IconBell className="size-8" /> لا تنبيهات.</CardContent></Card>
      )}
      <div className="space-y-2">
        {data?.items.map((a) => {
          const Icon = ICON[a.kind] ?? IconBell;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => void open(a)}
              className={cn("flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-start transition hover:border-primary", !a.readAt && "border-primary/40 bg-primary/5")}
            >
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", a.readAt ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex items-center gap-2">
                  <b className="truncate">{a.title}</b>
                  {!a.readAt && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  <span className="ms-auto shrink-0 text-xs text-muted-foreground">{formatRelativeTime(a.createdAt)}</span>
                </span>
                {a.body && <span className="block whitespace-pre-line text-sm text-muted-foreground">{a.body}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
