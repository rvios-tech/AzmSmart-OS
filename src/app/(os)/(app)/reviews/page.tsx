"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconStar,
  IconStarFilled,
  IconSearch,
  IconCircleCheck,
  IconMessageReply,
  IconEyeOff,
  IconSend,
  IconMessage2,
  IconLoader2,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import { listReviews, updateReview, type ReviewStatus, type ShopReview, type Store } from "@/lib/api/shop";
import { cn } from "@/lib/utils";
import { formatDateShort, formatNumber } from "@/lib/format";

/**
 * تقييمات منتجات المتجر — من مشترين فعليين (سطر من طلب مكتمل). تُنشر فورًا،
 * وللتاجر الإخفاء والردّ. لا حذف: تقييم المشتري سجلّ، والإخفاء يكفي لإبعاده
 * عن الواجهة دون أن يضيع.
 */
const STATUS: Record<ReviewStatus, { label: string; tone: string }> = {
  1: { label: "منشور", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  0: { label: "قيد المراجعة", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  2: { label: "مخفي", tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
};

const TABS = [
  { value: "all", label: "الكل" },
  { value: "1", label: "منشور" },
  { value: "0", label: "قيد المراجعة" },
  { value: "2", label: "مخفي" },
] as const;
type TabValue = (typeof TABS)[number]["value"];

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} من ٥`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rating ? (
          <IconStarFilled key={i} className={cn("size-3.5 text-amber-500", className)} />
        ) : (
          <IconStar key={i} className={cn("size-3.5 text-muted-foreground/40", className)} />
        )
      )}
    </span>
  );
}

function ReviewsView({ store }: { store: Store }) {
  const [rows, setRows] = useState<ShopReview[] | null>(null);
  const [tab, setTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows((await listReviews(store.id)).reviews);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل التقييمات.");
      setRows([]);
    }
  }, [store.id]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const all = useMemo(() => rows ?? [], [rows]);

  const summary = useMemo(() => {
    const published = all.filter((r) => r.status === 1);
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of published) counts[r.rating] = (counts[r.rating] ?? 0) + 1;
    const avg = published.length ? published.reduce((s, r) => s + r.rating, 0) / published.length : 0;
    return {
      total: all.length,
      published: published.length,
      pending: all.filter((r) => r.status === 0).length,
      hidden: all.filter((r) => r.status === 2).length,
      avg,
      counts,
    };
  }, [all]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((r) => {
      const matchesTab = tab === "all" || r.status === Number(tab);
      const matchesSearch =
        !q || r.name.toLowerCase().includes(q) || r.product.name.toLowerCase().includes(q) || r.body.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [all, tab, search]);

  async function change(id: string, input: { status?: ReviewStatus; reply?: string }, done: string) {
    setBusy(id);
    try {
      const updated = await updateReview(store.id, id, input);
      setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, status: updated.status, reply: updated.reply } : r)) ?? prev);
      toast.success(done);
      return true;
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function openReply(review: ShopReview) {
    setReplyingId(review.id);
    setReplyText(review.reply ?? "");
  }

  async function sendReply(id: string) {
    const text = replyText.trim();
    if (!text) return;
    if (await change(id, { reply: text }, "نُشر ردّك تحت التقييم")) {
      setReplyingId(null);
      setReplyText("");
    }
  }

  const tiles = [
    { label: "الإجمالي", value: summary.total },
    { label: "منشور", value: summary.published },
    { label: "قيد المراجعة", value: summary.pending },
    { label: "مخفي", value: summary.hidden },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="التقييمات" description="آراء من اشتروا فعلًا من متجرك — ردّ عليهم، أو أخفِ ما لا يليق." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{t.label}</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">{formatNumber(t.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 lg:self-start">
          <CardHeader>
            <CardTitle className="text-base">ملخص التقييمات</CardTitle>
            <CardDescription>المنشورة عبر كل المنتجات — كما يراها عملاؤك</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-5xl font-semibold tracking-tight tabular-nums">
                {formatNumber(summary.avg, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <Stars rating={Math.round(summary.avg)} className="size-5" />
              <p className="text-sm text-muted-foreground">من {formatNumber(summary.published)} تقييم منشور</p>
            </div>
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.counts[star] ?? 0;
                const pct = summary.published ? (count / summary.published) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <span className="flex w-8 items-center gap-1 tabular-nums text-muted-foreground">
                      {formatNumber(star)}
                      <IconStarFilled className="size-3 text-amber-500" />
                    </span>
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="w-6 text-end tabular-nums text-muted-foreground">{formatNumber(count)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
                <TabsList>
                  {TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="relative w-full sm:max-w-56">
                <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في التقييمات…" className="ps-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y">
            {rows === null && (
              <div className="py-14 text-center text-muted-foreground"><IconLoader2 className="mx-auto size-6 animate-spin" /></div>
            )}
            {filtered.map((r) => (
              <div key={r.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar className="size-9 shrink-0">
                    <AvatarFallback>{r.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">على {r.product.name}</span>
                      <Badge variant="secondary" className={cn("ms-auto", STATUS[r.status].tone)}>{STATUS[r.status].label}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className="text-xs text-muted-foreground tabular-nums">{formatDateShort(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.body}</p>

                    {r.reply && replyingId !== r.id && (
                      <div className="mt-3 rounded-lg border bg-muted/40 p-3">
                        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                          <IconMessage2 className="size-3.5" /> رد المتجر
                        </p>
                        <p className="text-sm text-muted-foreground">{r.reply}</p>
                      </div>
                    )}

                    {replyingId === r.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder={`رد على ${r.name}…`} rows={3} maxLength={1000} />
                        <div className="flex items-center gap-2">
                          <Button size="sm" disabled={busy === r.id} onClick={() => void sendReply(r.id)}>
                            {busy === r.id ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />} نشر الرد
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setReplyingId(null); setReplyText(""); }}>إلغاء</Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {r.status !== 1 && (
                        <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => void change(r.id, { status: 1 }, "نُشر التقييم في واجهة المتجر")}>
                          <IconCircleCheck className="size-4" /> نشر
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openReply(r)}>
                        <IconMessageReply className="size-4" />
                        {r.reply ? "تعديل الرد" : "رد"}
                      </Button>
                      {r.status !== 2 && (
                        <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => void change(r.id, { status: 2 }, "أُخفي التقييم من واجهة المتجر")}>
                          <IconEyeOff className="size-4" /> إخفاء
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {rows !== null && filtered.length === 0 && (
              <div className="py-14 text-center text-muted-foreground">
                <IconMessage2 className="mx-auto mb-2 size-6 opacity-50" />
                {all.length === 0 ? "لا تقييمات بعد — تصل من عملائك بعد اكتمال طلباتهم." : "لا توجد تقييمات مطابقة للتصفية."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReviewsPage() {
  return <RequireStore>{(store) => <ReviewsView key={store.id} store={store} />}</RequireStore>;
}
