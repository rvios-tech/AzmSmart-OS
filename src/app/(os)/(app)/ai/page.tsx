"use client";

import * as React from "react";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconAlertTriangle, IconArrowUp, IconChartBar, IconCopy, IconDots, IconMenu2, IconMessage, IconPencil,
  IconPlayerStopFilled, IconPlus, IconRefresh, IconSparkles, IconSpeakerphone, IconTag, IconTrash, IconTrendingUp,
  IconBulb, IconTruckDelivery, IconSearch, IconFileDescription, IconMessageReply, IconFileText,
} from "@tabler/icons-react";

import { RequireStore } from "@/components/require-store";
import { Markdown } from "@/components/ai/markdown";
import { MarketingWriter, PolicyWriter, ProductWriter, ReplyWriter, SeoAssistant, copyText } from "@/components/ai/ai-tools";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError } from "@/lib/api/client";
import {
  deleteAiConversation, getAiConversation, getAiStatus, listAiConversations, renameAiConversation, streamAiChat,
  type AiConversationSummary, type AiMessage, type AiMode, type AiStatus,
} from "@/lib/api/ai";
import type { Store } from "@/lib/api/shop";
import { formatDate, formatNumber } from "@/lib/format";
import { useIdentity } from "@/lib/workspace/use-identity";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────────────────
   RVIOS AI — مساحة عمل المساعد. مبنية على صفحة «المساعد الذكي» في القالب نفسه
   (السجل، المحادثة، المحرّر) لكن على بيانات حقيقية: محادثات محفوظة في الخادم،
   ردود من Gemini تصل بثًّا، وأرقام المتجر الفعلية في وضع التحليلات.
   ───────────────────────────────────────────────────────────────────────── */

const MAX_CHARS = 4000;
type Tab = "chat" | "product" | "marketing" | "seo" | "reply" | "policy";
const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "chat", label: "المحادثة", icon: IconMessage },
  { id: "product", label: "كاتب المنتجات", icon: IconFileDescription },
  { id: "marketing", label: "المسوّق", icon: IconSpeakerphone },
  { id: "seo", label: "الظهور في البحث", icon: IconSearch },
  { id: "reply", label: "الرد على العملاء", icon: IconMessageReply },
  { id: "policy", label: "صفحات المتجر", icon: IconFileText },
];

const SUGGEST: Record<AiMode, { icon: React.ComponentType<{ className?: string }>; title: string; prompt: string }[]> = {
  chat: [
    { icon: IconBulb, title: "خطة لزيادة المبيعات", prompt: "اقترح خطة عملية من ٥ خطوات لزيادة مبيعات متجري هذا الشهر، مناسبة لمنتجاتي الحالية." },
    { icon: IconTag, title: "تسعير وعروض", prompt: "كيف أصمم عرضًا أو باقة من منتجاتي ترفع متوسط قيمة الطلب دون أن أخسر من هامش ربحي؟" },
    { icon: IconTruckDelivery, title: "التوصيل والدفع", prompt: "ما أفضل إعداد لمناطق التوصيل وحد التوصيل المجاني وطرق الدفع لمتجري؟ اشرح الخطوات في اللوحة." },
    { icon: IconSpeakerphone, title: "أفكار محتوى", prompt: "أعطني ١٠ أفكار منشورات لإنستغرام وتيك توك لمنتجاتي هذا الأسبوع." },
  ],
  insights: [
    { icon: IconChartBar, title: "كيف كان أدائي؟", prompt: "حلّل أداء متجري في آخر ٣٠ يومًا مقارنة بالفترة السابقة، وما أهم ثلاث ملاحظات؟" },
    { icon: IconTrendingUp, title: "المنتجات الرابحة", prompt: "ما أكثر منتجاتي مبيعًا وما الذي يجب أن أفعله بالمنتجات التي لا تُباع؟" },
    { icon: IconAlertTriangle, title: "ما الذي يحتاج انتباهي؟", prompt: "ما المشكلات في متجري الآن (مخزون، منتجات بلا وصف أو صور، إلغاءات) وما أولوية إصلاحها؟" },
    { icon: IconBulb, title: "فرص التحسين", prompt: "من بيانات متجري الفعلية، ما أكبر ثلاث فرص لرفع التحويل والمبيعات؟" },
  ],
};

function AiAvatar({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center justify-center rounded-lg bg-gradient-to-br from-primary via-[var(--chart-3)] to-[var(--chart-5)] text-primary-foreground shadow-sm", className)}>
      <IconSparkles className="size-4" />
    </span>
  );
}

function IconAction({ label, icon: Icon, onClick, disabled }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void; disabled?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onClick} disabled={disabled} className="size-7 text-muted-foreground hover:text-foreground">
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** تجميع السجل: اليوم، أمس، آخر ٧ أيام، ثم بالشهر */
function groupByDay(list: AiConversationSummary[]) {
  const day = 86_400_000;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  const groups: { label: string; items: AiConversationSummary[] }[] = [];
  const push = (label: string, c: AiConversationSummary) => {
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(c);
    else groups.push({ label, items: [c] });
  };
  for (const c of list) {
    const t = new Date(c.updatedAt).getTime();
    if (t >= t0) push("اليوم", c);
    else if (t >= t0 - day) push("أمس", c);
    else if (t >= t0 - 6 * day) push("آخر ٧ أيام", c);
    else push("أقدم", c);
  }
  return groups;
}

function Workspace({ store }: { store: Store }) {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (TABS.some((t) => t.id === params.get("tab")) ? params.get("tab") : "chat") as Tab;
  const setTab = (t: Tab) => router.replace(t === "chat" ? "/ai" : `/ai?tab=${t}`, { scroll: false });

  const { name } = useIdentity();
  const firstName = name.split(/\s+/)[0] ?? "";

  const [status, setStatus] = useState<AiStatus | null>(null);
  const [list, setList] = useState<AiConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<AiMode>("chat");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [renaming, setRenaming] = useState<AiConversationSummary | null>(null);
  const [renameText, setRenameText] = useState("");
  const [deleting, setDeleting] = useState<AiConversationSummary | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  /** معرّفات مؤقتة للرسائل قبل أن يعيد الخادم معرّفاتها */
  const seqRef = useRef(0);
  const endRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const refreshList = useCallback(async () => {
    try {
      setList(await listAiConversations(store.id));
    } catch {
      /* السجل ثانوي — تبقى المحادثة الحالية تعمل */
    }
  }, [store.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [s, l] = await Promise.all([getAiStatus(store.id), listAiConversations(store.id)]);
        if (!cancelled) {
          setStatus(s);
          setList(l);
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof ApiError ? e.message : "تعذّر تحميل المساعد.");
      }
    })();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [store.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth", block: "end" });
  }, [messages, streaming]);

  const ready = status?.ready ?? true;
  const exhausted = !!status && status.limit > 0 && status.used >= status.limit;
  const onUsed = (used: number, limit: number) => setStatus((s) => (s ? { ...s, used, limit } : s));

  function newChat(m: AiMode = "chat") {
    abortRef.current?.abort();
    setActiveId(null);
    setTitle("");
    setMode(m);
    setMessages([]);
    setInput("");
    setRailOpen(false);
    if (tab !== "chat") setTab("chat");
    setTimeout(() => taRef.current?.focus(), 0);
  }

  async function open(c: AiConversationSummary) {
    if (streaming) return;
    setRailOpen(false);
    setActiveId(c.id);
    setTitle(c.title);
    setMode(c.mode);
    setLoadingConv(true);
    try {
      const conv = await getAiConversation(store.id, c.id);
      setMessages(conv.messages);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر فتح المحادثة.");
      setActiveId(null);
      setMessages([]);
    } finally {
      setLoadingConv(false);
    }
  }

  /** يرسل رسالة أو يعيد توليد آخر رد، ويبني الرد في الواجهة كلما وصل منه جزء */
  async function run(opts: { message?: string; regenerate?: boolean }) {
    if (streaming) return;
    const text = opts.message?.trim() ?? "";
    if (!opts.regenerate && !text) return;
    const seq = ++seqRef.current;
    const tempUser = `u-${seq}`;
    const tempModel = `m-${seq}`;
    const now = new Date().toISOString();
    const snapshot = messages;
    setMessages((prev) => {
      let base = prev;
      if (opts.regenerate) {
        const last = base[base.length - 1];
        if (last?.role === "model") base = base.slice(0, -1);
      }
      return [
        ...base,
        ...(opts.regenerate ? [] : [{ id: tempUser, role: "user" as const, content: text, status: "ok" as const, createdAt: now }]),
        { id: tempModel, role: "model" as const, content: "", status: "streaming" as const, createdAt: now },
      ];
    });
    if (!opts.regenerate) setInput("");
    setStreaming(true);
    const ac = new AbortController();
    abortRef.current = ac;
    let convId = activeId;

    const patchModel = (fn: (m: AiMessage) => AiMessage) =>
      setMessages((prev) => prev.map((m) => (m.id === tempModel ? fn(m) : m)));

    try {
      await streamAiChat(
        store.id,
        { conversationId: activeId ?? undefined, message: opts.regenerate ? undefined : text, mode: activeId ? undefined : mode, regenerate: opts.regenerate || undefined },
        (ev) => {
          switch (ev.type) {
            case "start":
              convId = ev.conversationId;
              setActiveId(ev.conversationId);
              if (ev.userMessageId) setMessages((prev) => prev.map((m) => (m.id === tempUser ? { ...m, id: ev.userMessageId! } : m)));
              break;
            case "delta":
              patchModel((m) => ({ ...m, content: m.content + ev.text }));
              break;
            case "title":
              setTitle(ev.title);
              break;
            case "done":
              patchModel((m) => ({ ...m, id: ev.messageId, status: ev.status }));
              setStatus((s) => (s ? { ...s, used: ev.used, limit: ev.limit } : s));
              break;
            case "error":
              patchModel((m) => ({ ...m, id: ev.messageId ?? m.id, status: "error", content: m.content }));
              toast.error(ev.message);
              break;
          }
        },
        ac.signal,
      );
      // بث انتهى دون «done» ولا «error» (انقطع الاتصال): ما وصل يبقى ويُعلَّم
      setMessages((prev) => prev.map((m) => (m.status === "streaming" ? { ...m, status: m.content ? "stopped" : "error" } : m)));
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        setMessages((prev) => prev.map((m) => (m.status === "streaming" ? { ...m, status: "stopped" } : m)));
      } else {
        // رُفض قبل البث (حصّة، صلاحية…): تعود المحادثة كما كانت والنص إلى المحرّر
        setMessages(snapshot);
        if (!opts.regenerate) setInput(text);
        toast.error(e instanceof ApiError ? e.message : "تعذّر الإرسال.");
        if (e instanceof ApiError && e.status === 429) void getAiStatus(store.id).then(setStatus).catch(() => undefined);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      if (convId) void refreshList();
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  async function doRename() {
    if (!renaming) return;
    const t = renameText.trim();
    if (!t) return;
    try {
      const r = await renameAiConversation(store.id, renaming.id, t);
      setList((prev) => prev.map((c) => (c.id === r.id ? { ...c, title: r.title } : c)));
      if (activeId === r.id) setTitle(r.title);
      setRenaming(null);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّرت إعادة التسمية.");
    }
  }

  async function doDelete() {
    if (!deleting) return;
    try {
      await deleteAiConversation(store.id, deleting.id);
      setList((prev) => prev.filter((c) => c.id !== deleting.id));
      if (activeId === deleting.id) newChat();
      toast.success("حُذفت المحادثة");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "تعذّر الحذف.");
    } finally {
      setDeleting(null);
    }
  }

  const lastModel = [...messages].reverse().find((m) => m.role === "model");
  const usage = status && status.limit > 0 ? (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" title={`تتجدد في ${formatDate(status.resetsAt)}`}>
      <span className="tabular-nums">{formatNumber(status.used)} / {formatNumber(status.limit)}</span>
      <Progress value={Math.min(100, (status.used / status.limit) * 100)} className="h-1.5 w-20" />
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AiAvatar className="size-10 rounded-xl [&_svg]:size-5" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">RVIOS AI</h1>
            <p className="text-sm text-muted-foreground">مساعدك الذكي لإدارة «{store.name}» وتنميته</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {usage}
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="h-auto flex-wrap">
              {TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                  <t.icon className="size-4" /> <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {!ready && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <IconAlertTriangle className="size-4 shrink-0" /> المساعد الذكي غير مفعّل بعد على هذا الخادم — تواصل مع فريق RVIOS.
        </div>
      )}

      {tab !== "chat" ? (
        <Card className="p-4 sm:p-6">
          {tab === "product" && <ProductWriter storeId={store.id} ready={ready && !exhausted} onUsed={onUsed} />}
          {tab === "marketing" && <MarketingWriter storeId={store.id} ready={ready && !exhausted} onUsed={onUsed} />}
          {tab === "seo" && <SeoAssistant storeId={store.id} ready={ready && !exhausted} onUsed={onUsed} />}
          {tab === "reply" && <ReplyWriter storeId={store.id} ready={ready && !exhausted} onUsed={onUsed} />}
          {tab === "policy" && <PolicyWriter storeId={store.id} ready={ready && !exhausted} onUsed={onUsed} />}
          <p className="mt-6 text-xs text-muted-foreground">RVIOS AI يقترح ولا ينفّذ: راجع النص ثم انسخه إلى المتجر بنفسك.</p>
        </Card>
      ) : (
        <div className="h-[calc(100vh-14rem)] min-h-[30rem]">
          <Card className="relative flex h-full flex-row gap-0 overflow-hidden p-0">
            <button
              type="button"
              aria-label="إغلاق السجل"
              className={cn("absolute inset-0 z-10 bg-black/40 transition-opacity duration-300 md:hidden", railOpen ? "opacity-100" : "pointer-events-none opacity-0")}
              onClick={() => setRailOpen(false)}
            />
            {/* السجل */}
            <aside
              className={cn(
                "absolute inset-y-0 start-0 z-20 flex w-72 flex-col border-e bg-card shadow-xl transition-transform duration-300 ease-in-out",
                "md:static md:z-auto md:w-64 md:bg-muted/30 md:shadow-none md:transition-none",
                // الإخفاء للجوال وحده: `rtl:translate-x-full` كان يغلب `md:translate-x-0` فيُخرج السجل من البطاقة على الحاسوب
                !railOpen && "max-md:ltr:-translate-x-full max-md:rtl:translate-x-full",
              )}
            >
              <div className="space-y-2 p-3">
                <Button onClick={() => newChat("chat")} className="w-full gap-2" variant="outline">
                  <IconPlus className="size-4" /> محادثة جديدة
                </Button>
                <Button onClick={() => newChat("insights")} className="w-full gap-2" variant="ghost">
                  <IconChartBar className="size-4" /> تحليل أداء متجري
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {list.length === 0 ? (
                  <p className="px-5 py-6 text-center text-xs text-muted-foreground">محادثاتك تُحفظ هنا ولا يراها غيرك.</p>
                ) : (
                  <div className="space-y-4 px-3 py-2">
                    {groupByDay(list).map((g) => (
                      <div key={g.label} className="space-y-1">
                        <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">{g.label}</p>
                        {g.items.map((c) => (
                          <div key={c.id} className={cn("group flex items-center rounded-lg transition-colors hover:bg-muted", activeId === c.id && "bg-muted font-medium")}>
                            <button type="button" onClick={() => void open(c)} className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-start text-sm" disabled={streaming}>
                              {c.mode === "insights" ? <IconChartBar className="size-4 shrink-0 text-primary" /> : <IconMessage className="size-4 shrink-0 text-muted-foreground" />}
                              <span className="min-w-0 flex-1 truncate" dir="auto">{c.title || "محادثة جديدة"}</span>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="me-1 size-7 opacity-60 group-hover:opacity-100" aria-label="خيارات المحادثة">
                                  <IconDots className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => { setRenaming(c); setRenameText(c.title); }}><IconPencil className="size-4" /> إعادة التسمية</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(c)}><IconTrash className="size-4" /> حذف</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* المحادثة */}
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setRailOpen(true)} aria-label="سجل المحادثات">
                  <IconMenu2 className="size-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" dir="auto">{title || (activeId ? "…" : mode === "insights" ? "تحليل أداء المتجر" : "محادثة جديدة")}</p>
                  <p className="truncate text-xs text-muted-foreground">{mode === "insights" ? "يقرأ أرقام متجرك الفعلية لآخر ٦٠ يومًا" : "مساعد التجارة والتسويق والمنتجات"}</p>
                </div>
                {mode === "insights" && <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary"><IconChartBar className="size-3.5" /> تحليلات</Badge>}
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {loadingConv ? (
                  <div className="m-auto flex items-center gap-2 text-sm text-muted-foreground"><IconRefresh className="size-4 animate-spin" /> جارٍ فتح المحادثة…</div>
                ) : messages.length ? (
                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
                    {messages.map((m) =>
                      m.role === "user" ? (
                        <div key={m.id} className="flex justify-end">
                          <div dir="auto" className="max-w-[85%] rounded-2xl rounded-ee-sm bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                        </div>
                      ) : (
                        <div key={m.id} className="flex gap-3">
                          <AiAvatar className="mt-0.5 size-8 shrink-0" />
                          <div className="min-w-0 flex-1 space-y-2">
                            {m.status === "streaming" && !m.content ? (
                              <div className="flex items-center gap-1.5 pt-2.5" aria-label="يكتب">
                                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                                <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
                              </div>
                            ) : (
                              <Markdown text={m.content} className={cn(m.status === "streaming" && "[&>*:last-child]:after:ms-0.5 [&>*:last-child]:after:inline-block [&>*:last-child]:after:h-4 [&>*:last-child]:after:w-1.5 [&>*:last-child]:after:animate-pulse [&>*:last-child]:after:bg-primary [&>*:last-child]:after:align-middle [&>*:last-child]:after:content-['']")} />
                            )}
                            {m.status === "stopped" && <p className="text-xs text-muted-foreground">أُوقف الرد.</p>}
                            {m.status === "error" && <p className="flex items-center gap-1 text-xs text-destructive"><IconAlertTriangle className="size-3.5" /> لم يكتمل الرد.</p>}
                            {m.status !== "streaming" && (
                              <div className="-ms-1.5 flex items-center gap-0.5">
                                {m.content && <IconAction label="نسخ" icon={IconCopy} onClick={() => copyText(m.content)} />}
                                {m.id === lastModel?.id && <IconAction label="إعادة التوليد" icon={IconRefresh} onClick={() => void run({ regenerate: true })} disabled={streaming || !ready || exhausted} />}
                              </div>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                    <div ref={endRef} />
                  </div>
                ) : (
                  <div className="m-auto flex w-full max-w-2xl flex-col items-center px-4 py-8 text-center">
                    <AiAvatar className="mb-5 size-14 rounded-2xl [&_svg]:size-7" />
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {mode === "insights" ? "اسألني عن أداء متجرك" : `كيف أساعدك اليوم${firstName ? ` يا ${firstName}` : ""}؟`}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {mode === "insights" ? "أقرأ أرقام متجرك الفعلية — المبيعات والطلبات والمنتجات — وأفصل بينها وبين اقتراحاتي." : "اسأل عن متجرك ومنتجاتك وتسويقك، أو ابدأ بأحد هذه الاقتراحات."}
                    </p>
                    <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                      {SUGGEST[mode].map((s) => (
                        <button
                          key={s.title}
                          type="button"
                          disabled={!ready || exhausted}
                          onClick={() => void run({ message: s.prompt })}
                          className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-start transition-colors hover:border-primary/30 hover:bg-muted/50 disabled:opacity-50"
                        >
                          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><s.icon className="size-4" /></span>
                          <span className="text-sm font-medium">{s.title}</span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">{s.prompt}</span>
                        </button>
                      ))}
                    </div>
                    {mode === "chat" && (
                      <button type="button" onClick={() => newChat("insights")} className="mt-5 text-xs font-medium text-primary hover:underline">أو حلّل أداء متجري بأرقامه الفعلية ←</button>
                    )}
                  </div>
                )}
              </div>

              {/* المحرّر */}
              <div className="px-4 pb-4">
                <div className="mx-auto w-full max-w-3xl">
                  {exhausted && (
                    <p className="mb-2 rounded-lg bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
                      استُهلكت حصّة هذا الشهر ({formatNumber(status!.limit)} طلب) — تتجدد في {formatDate(status!.resetsAt)}، أو رقِّ باقتك من «الاشتراك».
                    </p>
                  )}
                  <div className="rounded-2xl border bg-background shadow-lg shadow-black/5 ring-1 ring-foreground/5 transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
                    <Textarea
                      ref={taRef}
                      // فارغًا يتبع اتجاه اللوحة (العنصر النائب عربي)، ومع الكتابة يتبع لغة التاجر
                      dir={input ? "auto" : "rtl"}
                      value={input}
                      maxLength={MAX_CHARS}
                      disabled={!ready || exhausted}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          void run({ message: input });
                        }
                      }}
                      placeholder={mode === "insights" ? "اسأل عن مبيعاتك وطلباتك ومنتجاتك…" : "اكتب سؤالك لـ RVIOS AI…"}
                      rows={1}
                      className="max-h-44 min-h-11 resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
                    />
                    <div className="flex items-center gap-2 px-3 pb-2.5">
                      <span className="text-[11px] text-muted-foreground">Enter للإرسال · Shift+Enter لسطر جديد</span>
                      {input.length > MAX_CHARS * 0.8 && <span className="text-[11px] tabular-nums text-muted-foreground">{formatNumber(input.length)}/{formatNumber(MAX_CHARS)}</span>}
                      <div className="ms-auto">
                        {streaming ? (
                          <Button size="icon" variant="secondary" className="size-8 rounded-lg" onClick={stop} aria-label="إيقاف الرد">
                            <IconPlayerStopFilled className="size-4" />
                          </Button>
                        ) : (
                          <Button size="icon" className="size-8 rounded-lg" disabled={!input.trim() || !ready || exhausted} onClick={() => void run({ message: input })} aria-label="إرسال">
                            <IconArrowUp className="size-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    RVIOS AI يقترح ولا ينفّذ شيئًا في متجرك، وقد يخطئ — راجع المعلومات المهمة قبل اعتمادها.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <AlertDialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إعادة تسمية المحادثة</AlertDialogTitle>
            <AlertDialogDescription>اسم يسهّل عليك إيجادها لاحقًا.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input dir="auto" value={renameText} maxLength={80} onChange={(e) => setRenameText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void doRename()} autoFocus />
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); void doRename(); }} disabled={!renameText.trim()}>حفظ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المحادثة؟</AlertDialogTitle>
            <AlertDialogDescription>تُحذف «{deleting?.title || "محادثة جديدة"}» ورسائلها نهائيًا.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void doDelete()}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AiPage() {
  return (
    <RequireStore allowSuspended>
      {(store) => (
        <Suspense>
          <Workspace store={store} />
        </Suspense>
      )}
    </RequireStore>
  );
}
