"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconArrowBackUp, IconLoader2, IconTrash, IconTrashX } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { emptyTrash, listTrash, purgeTrash, restoreTrash, type Store, type TrashItem } from "@/lib/api/shop";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const daysLeft = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

function TrashView({ store }: { store: Store }) {
  const [rows, setRows] = useState<TrashItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setRows(await listTrash(store.id)); } catch (err) { toast.error(err instanceof ApiError ? err.message : "تعذّر التحميل."); setRows([]); }
  }, [store.id]);
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(id);
    try { await fn(); toast.success(ok); await load(); } catch (err) { toast.error(err instanceof ApiError ? err.message : "تعذّر التنفيذ."); } finally { setBusy(null); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="سلة المحذوفات" description="المنتجات المحذوفة تبقى هنا ٣٠ يومًا بصورها وخياراتها وتقييماتها — تستعيدها كما كانت.">
        {!!rows?.length && (
          <Button variant="outline" className="text-destructive" disabled={busy !== null}
            onClick={() => { if (window.confirm(`حذف ${formatNumber(rows.length)} عنصر نهائيًا؟ لا يمكن التراجع.`)) void act("all", () => emptyTrash(store.id), "أُفرغت السلة"); }}>
            <IconTrashX className="size-4" /> إفراغ السلة
          </Button>
        )}
      </PageHeader>
      {!rows && <div className="flex h-40 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      {rows?.length === 0 && (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <IconTrash className="mx-auto mb-2 size-7 opacity-50" /> السلة فارغة.
        </CardContent></Card>
      )}
      <div className="grid gap-3">
        {rows?.map((t) => (
          <Card key={t.id}>
            <CardContent className="flex flex-wrap items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {t.image ? <img src={t.image} alt="" className="size-12 rounded object-cover" /> : <span className="size-12 rounded bg-muted" />}
              <div className="min-w-40 flex-1">
                <p className="font-medium">{t.name || "منتج"}</p>
                <p className="text-xs text-muted-foreground">حُذف {formatRelativeTime(t.deletedAt)} · يُحذف نهائيًا بعد {formatNumber(daysLeft(t.expiresAt))} يومًا</p>
              </div>
              <Button size="sm" disabled={busy !== null} onClick={() => void act(t.id, () => restoreTrash(store.id, t.id), "استُعيد المنتج كما كان")}>
                {busy === t.id ? <IconLoader2 className="size-4 animate-spin" /> : <IconArrowBackUp className="size-4" />} استعادة
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" disabled={busy !== null}
                onClick={() => { if (window.confirm(`حذف «${t.name}» نهائيًا؟ لا يمكن التراجع.`)) void act(t.id, () => purgeTrash(store.id, t.id), "حُذف نهائيًا"); }}>
                <IconTrash className="size-4" /> حذف نهائي
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function TrashPage() {
  return <RequireStore allowSuspended>{(store) => <TrashView store={store} />}</RequireStore>;
}
