"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconCheck, IconLoader2, IconRosetteDiscountCheck, IconX } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { PrivateImage } from "@/components/shop/private-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { storeUrl } from "@/lib/shop/constants";
import { ApiError } from "@/lib/api/client";
import { decideKyc, listKycRequests, platformKycDocPath, type KycRequest } from "@/lib/api/platform-ops";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const DOC_LABEL: Record<string, string> = { id_front: "وجه الهوية", id_back: "ظهر الهوية", selfie: "مع الهوية", cr: "السجل التجاري" };

function RequestCard({ r, onDone, onZoom }: { r: KycRequest; onDone: () => void; onZoom: (u: string) => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function decide(approve: boolean) {
    if (!approve && note.trim().length < 3) return toast.error("اكتب للتاجر سبب الرفض وما يصحّحه.");
    setBusy(true);
    try {
      await decideKyc(r.id, approve, note.trim() || undefined);
      toast.success(approve ? `وُثّق ${r.store.name}` : "أُعيد الطلب للتاجر");
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر الحفظ.");
      setBusy(false);
    }
  }
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <b>{r.store.name}</b>
          <a href={storeUrl(r.store.slug)} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:underline" dir="ltr">{r.store.slug}</a>
          <span className="text-xs text-muted-foreground">· {r.store.organization.name}</span>
          {r.submittedAt && <span className="ms-auto text-xs text-muted-foreground">{formatRelativeTime(r.submittedAt)}</span>}
        </div>
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          <div><dt className="text-xs text-muted-foreground">النوع</dt><dd>{r.kind === "business" ? "منشأة" : "فرد"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">الاسم الرسمي</dt><dd className="font-medium">{r.legalName}</dd></div>
          {r.kind === "business" && <div><dt className="text-xs text-muted-foreground">السجل التجاري</dt><dd dir="ltr" className="text-start">{r.crNumber}</dd></div>}
        </dl>
        {r.docs.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {r.docs.map((d) => (
              <div key={d.id} className="space-y-1">
                <PrivateImage path={platformKycDocPath(r.id, d.id)} alt={DOC_LABEL[d.kind]} className="aspect-[3/2] w-full" onClick={onZoom} />
                <p className="text-xs text-muted-foreground">{DOC_LABEL[d.kind] ?? d.kind}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">حُذفت الصور بعد مهلة الحفظ.</p>}
        {r.status === 1 ? (
          <div className="space-y-2">
            <Textarea rows={2} maxLength={400} placeholder="ملاحظة للتاجر — مطلوبة عند الرفض (ما الذي يصحّحه)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-2">
              <Button disabled={busy} className="bg-emerald-600 hover:bg-emerald-700" onClick={() => void decide(true)}>{busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconCheck className="size-4" />} توثيق المتجر</Button>
              <Button disabled={busy} variant="outline" className="text-destructive" onClick={() => void decide(false)}><IconX className="size-4" /> رفض مع ملاحظة</Button>
            </div>
          </div>
        ) : r.reviewNote ? <p className="text-sm text-muted-foreground">الملاحظة: {r.reviewNote}</p> : null}
      </CardContent>
    </Card>
  );
}

/** طلبات توثيق المتاجر — مراجعة الوثائق ومنح الشارة */
export default function PlatformVerificationPage() {
  const [tab, setTab] = useState("1");
  const [data, setData] = useState<Awaited<ReturnType<typeof listKycRequests>> | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const load = useCallback(() => listKycRequests(Number(tab)).then(setData, (e) => toast.error(e instanceof ApiError ? e.message : "تعذّر التحميل.")), [tab]);
  useEffect(() => { void listKycRequests(Number(tab)).then(setData, () => setData({ requests: [], counts: {} })); }, [tab]);

  return (
    <div className="space-y-6">
      <PageHeader title="طلبات التوثيق" description="راجع وثائق التاجر ثم وثّق المتجر أو أعد الطلب بملاحظة. الصور تُحذف تلقائيًا بعد ٣٠ يومًا من القرار." />
      <Tabs value={tab} onValueChange={(v) => { setData(null); setTab(v); }}>
        <TabsList>
          <TabsTrigger value="1">بانتظار المراجعة {data?.counts[1] ? <Badge className="ms-1">{formatNumber(data.counts[1])}</Badge> : null}</TabsTrigger>
          <TabsTrigger value="2">موثَّقة</TabsTrigger>
          <TabsTrigger value="3">مرفوضة</TabsTrigger>
        </TabsList>
      </Tabs>
      {!data && <div className="flex h-40 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      {data?.requests.length === 0 && (
        <Card><CardContent className="py-14 text-center text-muted-foreground"><IconRosetteDiscountCheck className="mx-auto mb-2 size-7 opacity-50" />لا طلبات هنا.</CardContent></Card>
      )}
      <div className="grid gap-4">
        {data?.requests.map((r) => <RequestCard key={r.id} r={r} onDone={() => void load()} onZoom={setZoom} />)}
      </div>
      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-md" />
        </div>
      )}
    </div>
  );
}
