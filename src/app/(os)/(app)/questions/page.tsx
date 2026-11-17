"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { IconEye, IconEyeOff, IconLoader2, IconMessageQuestion, IconSend, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { answerQuestion, deleteQuestion, listQuestions, type Question, type QuestionsResponse, type Store } from "@/lib/api/shop";
import { formatNumber, formatRelativeTime } from "@/lib/format";

const STATUS = [
  { value: 0, label: "بانتظار الإجابة", tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { value: 1, label: "منشور", tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { value: 2, label: "مخفي", tone: "bg-slate-500/10 text-slate-500" },
] as const;

function QuestionCard({ q, store, onChange }: { q: Question; store: Store; onChange: () => void }) {
  const [answer, setAnswer] = useState(q.answer);
  const [busy, setBusy] = useState(false);
  const st = STATUS[q.status] ?? STATUS[0];

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {q.product.image ? <img src={q.product.image} alt="" className="size-8 rounded object-cover" /> : null}
          <b>{q.product.name}</b>
          <Badge variant="secondary" className={st.tone}>{st.label}</Badge>
          <span className="ms-auto text-xs text-muted-foreground">{q.name || "زائر"} · {formatRelativeTime(q.createdAt)}</span>
        </div>
        <p className="font-medium">{q.question}</p>
        <Textarea rows={2} maxLength={1000} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="اكتب إجابتك — تظهر للجميع في صفحة المنتج" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy || !answer.trim() || (answer.trim() === q.answer && q.status === 1)}
            onClick={() => void run(() => answerQuestion(store.id, q.id, { answer: answer.trim() }), "نُشرت الإجابة في صفحة المنتج")}>
            {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />} {q.status === 1 ? "تحديث الإجابة" : "إجابة ونشر"}
          </Button>
          {q.status === 1 && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => answerQuestion(store.id, q.id, { status: 2 }), "أُخفي من صفحة المنتج")}>
              <IconEyeOff className="size-4" /> إخفاء
            </Button>
          )}
          {q.status === 2 && q.answer && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(() => answerQuestion(store.id, q.id, { status: 1 }), "أُعيد نشره")}>
              <IconEye className="size-4" /> إعادة النشر
            </Button>
          )}
          <Button size="sm" variant="ghost" className="ms-auto text-destructive" disabled={busy}
            onClick={() => { if (window.confirm("حذف السؤال نهائيًا؟")) void run(() => deleteQuestion(store.id, q.id), "حُذف السؤال"); }}>
            <IconTrash className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionsView({ store }: { store: Store }) {
  const [status, setStatus] = useState("0");
  const [data, setData] = useState<QuestionsResponse | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await listQuestions(store.id, status === "all" ? undefined : Number(status)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل الأسئلة.");
    }
  }, [store.id, status]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  const c = (v: number) => data?.counts?.[v] ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="أسئلة العملاء" description="أسئلة زوار متجرك عن المنتجات — إجابتك تُنشر في صفحة المنتج وتقنع المتردد التالي." />
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="h-auto flex-wrap">
          {STATUS.map((s) => <TabsTrigger key={s.value} value={String(s.value)}>{s.label} ({formatNumber(c(s.value))})</TabsTrigger>)}
          <TabsTrigger value="all">الكل</TabsTrigger>
        </TabsList>
      </Tabs>
      {!data && <div className="flex h-40 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>}
      {data && data.questions.length === 0 && (
        <Card><CardContent className="py-14 text-center text-muted-foreground">
          <IconMessageQuestion className="mx-auto mb-2 size-7 opacity-50" />
          {status === "0" ? "لا أسئلة تنتظر إجابتك." : "لا أسئلة هنا."}
        </CardContent></Card>
      )}
      <div className="grid gap-4">
        {data?.questions.map((q) => <QuestionCard key={q.id + q.status + q.answer} q={q} store={store} onChange={() => void load()} />)}
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return <RequireStore allowSuspended>{(store) => <QuestionsView store={store} />}</RequireStore>;
}
