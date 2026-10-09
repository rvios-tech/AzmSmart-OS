"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconSparkles,
  IconPaperclip,
  IconArrowUp,
  IconCopy,
  IconThumbUp,
  IconThumbDown,
  IconRefresh,
  IconPlus,
  IconMenu2,
  IconMessage,
  IconChevronDown,
  IconCheck,
  IconBulb,
  IconCode,
  IconChartBar,
  IconPencil,
  IconShare3,
  IconWorld,
  IconPhoto,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { currentUser } from "@/data";

// ---------------------------------------------------------------------------
// Static, deterministic content (no Math.random at render)
// ---------------------------------------------------------------------------

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string };

const firstName = currentUser.name.split(" ")[0];

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", tag: "OpenAI", hint: "سريع ومتوازن في كل المهام" },
  { id: "claude-3.5", name: "Claude 3.5 Sonnet", tag: "Anthropic", hint: "الأفضل للكتابة والبرمجة" },
  { id: "gemini", name: "Gemini 1.5 Pro", tag: "Google", hint: "نافذة سياق ضخمة" },
] as const;

const SUGGESTIONS = [
  {
    icon: IconBulb,
    title: "توليد الأفكار",
    prompt: "أعطني 5 أفكار جديدة لتحسين تجربة الإعداد في منتج برمجي موجّه للشركات.",
  },
  {
    icon: IconCode,
    title: "اكتب لي شيفرة",
    prompt: "اكتب خطّاف useDebounce في React بأنواع صريحة مع تنظيف سليم عند إزالة المكوّن.",
  },
  {
    icon: IconChartBar,
    title: "حلّل الأرقام",
    prompt: "لخّص أبرز الاتجاهات في إيرادات الربع الثالث ونبّهني لما يستحق المتابعة.",
  },
  {
    icon: IconPencil,
    title: "صُغ رسالة بريدية",
    prompt: "اكتب رسالة متابعة ودّية وغير ملحّة لعميل انتهت فترته التجريبية للتو.",
  },
] as const;

const HISTORY: { label: string; items: string[] }[] = [
  {
    label: "اليوم",
    items: [
      "إعادة هيكلة وسيط المصادقة",
      "اتجاهات النصوص التسويقية للربع الثالث",
      "اشرح قواعد البيانات المتجهية ببساطة",
    ],
  },
  {
    label: "أمس",
    items: [
      "جولة تحسين استعلامات SQL",
      "سلسلة رسائل الإعداد الأولي",
      "أنماط إدارة الحالة في React",
    ],
  },
  {
    label: "آخر 7 أيام",
    items: [
      "برنامج رحلة — أبها في الربيع",
      "إعداد Docker Compose للتطوير المحلي",
      "ملاحظات على مسودة سيرتي الذاتية",
    ],
  },
];

// ردود جاهزة متعددة الفقرات تُعرض بالتناوب بترتيب ثابت.
const REPLIES: string[] = [
  `سؤال ممتاز — إليك الطريقة التي أقترحها.

من المفيد تقسيم الأمر إلى مراحل واضحة حتى لا يفوتك شيء:

1. **حدّد الهدف.** اكتب النتيجة الوحيدة التي تريدها فعلاً قبل أي خطوة أخرى.
2. **ارسم القيود.** دوّن ما هو ثابت — المواعيد والواجهات وبنية البيانات — مقابل ما يبقى مرناً.
3. **ابنِ أصغر نسخة.** أنشئ أنحف شريحة تثبت أن الفكرة تعمل من طرف إلى طرف.

بعد إرساء هذا الأساس، كرّر العمل في دورات قصيرة وقِس النتائج أولاً بأول. وهذه أمور أنصح بمراقبتها:

- اجعل كل تغيير صغيراً بما يكفي لفهمه في جلسة واحدة
- دوّن افتراضاتك كي تعود إليها لاحقاً
- أطلق مبكراً لمستخدمين حقيقيين ودع ملاحظاتهم توجّه الخطوة التالية

هل تريد أن أحوّل هذا إلى خطة ملموسة لحالتك تحديداً؟`,

  `بالتأكيد — إليك نسخة نظيفة وجاهزة للإنتاج يمكنك استخدامها مباشرة.

الفكرة الأساسية هي إبقاء المنطق **نقيّاً وقابلاً للتنبؤ**: بلا آثار جانبية خفية، وكل شيء سهل الاختبار بمعزل عن غيره. عالجت أيضاً الحالات الحدّية التي ستواجهها فعلاً — المدخلات الفارغة، والتحديثات المتسارعة، والتنظيف عند إزالة المكوّن.

ملاحظتان حول المفاضلات:

- الأولوية هنا لوضوح الشيفرة على التحسينات الدقيقة، وهو الخيار الصحيح لمعظم التطبيقات.
- إن وقع هذا في مسار كثيف التنفيذ، فيمكنك تخزين النتيجة مؤقتاً كي لا تُحسب في كل إعادة عرض.

أخبرني بإطار العمل الذي تستخدمه وسأكيّفها تماماً لبيئتك.`,

  `إليك الخلاصة أولاً، ثم التفاصيل.

**في سطر واحد:** الاتجاه صحي ومتسارع، لكن النمو مركّز في عدد محدود من الشرائح بدل أن يكون موزعاً بالتساوي.

وبالتفصيل:

- **الإيرادات** ارتفعت ارتفاعاً ملموساً مقارنة بالربع السابق، مدفوعة أساساً بالتوسّع داخل الحسابات القائمة.
- **عدد العملاء الجدد** ثابت، ما يشير إلى استقرار أعلى القمع مع تحسّن في تحقيق الدخل.
- **معدل الإلغاء** انخفض قليلاً، وهي إشارة جيدة إلى أن جهود الاحتفاظ الأخيرة بدأت تؤتي ثمارها.

الأمر الوحيد الذي أنصح بمراقبته هو خطر التركّز: إذا كان عدد قليل من الحسابات يقود معظم النمو، فقد يكفي إلغاء واحد لقلب نتيجة الربع كاملاً. ويسعدني نمذجة هذا السيناريو إن كان مفيداً.`,

  `تم — إليك مسودة يمكنك إرسالها كما هي أو تعديلها.

حافظت على نبرة **ودّية وغير ملحّة**، وبدأت بالقيمة لا بالطلب المباشر، وتركت لهم خطوة تالية واحدة واضحة وسهلة. فالناس يستجيبون لطلب صغير محدد أكثر بكثير من طلب مفتوح.

وإن أردت، أستطيع إعداد نسختين إضافيتين — واحدة أقصر للقرّاء المستعجلين وأخرى أكثر رسمية — لتختبر أيّهما أفضل أثراً.`,
];

// ---------------------------------------------------------------------------
// عارض نصوص منسّقة خفيف (عريض + قوائم نقطية ورقمية)
// ---------------------------------------------------------------------------

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

function RichText({ text }: { text: string }) {
  const blocks = text.split("\n\n");
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isBullet = lines.every((l) => l.startsWith("- "));
        const isNumbered = lines.every((l) => /^\d+\.\s/.test(l));

        if (isBullet) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[0.5rem] size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <span>{inline(l.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (isNumbered) {
          return (
            <ol key={i} className="space-y-2">
              {lines.map((l, j) => {
                const m = l.match(/^(\d+)\.\s(.*)$/);
                return (
                  <li key={j} className="flex gap-3">
                    <span className="mt-px flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium tabular-nums text-muted-foreground">
                      {m ? m[1] : j + 1}
                    </span>
                    <span>{inline(m ? m[2] : l)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return <p key={i}>{inline(block)}</p>;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function AiAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-lg bg-gradient-to-br from-[var(--chart-1)] via-[var(--chart-3)] to-[var(--chart-5)] text-white shadow-sm",
        className,
      )}
    >
      <IconSparkles className="size-4" />
    </span>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
  active,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            "size-7 text-muted-foreground hover:text-foreground",
            active && "text-foreground",
          )}
        >
          <Icon className="size-4" />
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [modelId, setModelId] = useState<(typeof MODELS)[number]["id"]>(
    "gpt-4o",
  );
  // Mobile: the history rail slides in as an overlay.
  const [railOpen, setRailOpen] = useState(false);

  const replyIndex = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const activeModel = MODELS.find((m) => m.id === modelId)!;
  const hasMessages = messages.length > 0;

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  function send(raw: string) {
    const text = raw.trim();
    if (!text || isTyping) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: text },
    ]);
    setInput("");

    const reply = REPLIES[replyIndex.current % REPLIES.length];
    replyIndex.current += 1;
    setIsTyping(true);

    timerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: reply },
      ]);
      setIsTyping(false);
    }, 1200);
  }

  function regenerate(id: string) {
    if (isTyping) return;
    const reply = REPLIES[replyIndex.current % REPLIES.length];
    replyIndex.current += 1;
    setIsTyping(true);
    timerRef.current = setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, content: reply } : m)),
      );
      setIsTyping(false);
    }, 1000);
  }

  function newChat() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setRailOpen(false);
    replyIndex.current = 0;
    taRef.current?.focus();
  }

  function copy(text: string) {
    navigator.clipboard
      ?.writeText(text)
      .then(() => toast.success("نُسخ إلى الحافظة"))
      .catch(() => toast.error("تعذّر النسخ"));
  }

  function shareChat() {
    navigator.clipboard
      ?.writeText("https://azmsmart.sa/ai/share/demo")
      .then(() => toast.success("نُسخ رابط المشاركة إلى الحافظة"))
      .catch(() => toast.error("تعذّر النسخ"));
  }

  return (
    <div className="h-[calc(100vh-9rem)]">
      <Card className="relative flex h-full flex-row gap-0 overflow-hidden p-0">
        {/* Mobile backdrop for the history rail (fades in/out) */}
        <button
          type="button"
          aria-label="إغلاق السجل"
          className={cn(
            "absolute inset-0 z-10 bg-black/40 transition-opacity duration-300 md:hidden",
            railOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          onClick={() => setRailOpen(false)}
        />
        {/* ---------------------------------------------------------------- */}
        {/* الشريط الجانبي (يبدأ من جهة بداية السطر)                           */}
        {/* ---------------------------------------------------------------- */}
        <aside
          className={cn(
            "absolute inset-y-0 start-0 z-20 flex w-72 flex-col border-e bg-card shadow-xl transition-transform duration-300 ease-in-out",
            "md:static md:z-auto md:w-64 md:translate-x-0 md:bg-muted/30 md:shadow-none md:transition-none",
            // الشريط مثبّت عند بداية السطر، فينزلق خارجاً باتجاه البداية.
            railOpen
              ? "translate-x-0"
              : "ltr:-translate-x-full rtl:translate-x-full"
          )}
        >
          <div className="flex items-center gap-2 px-4 py-3.5">
            <AiAvatar className="size-8" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold tracking-tight">
                مساعد عزم الذكي
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                مساحة عمل المساعد
              </p>
            </div>
          </div>

          <div className="px-3 pb-2">
            <Button
              onClick={newChat}
              className="w-full gap-2"
              variant="outline"
            >
              <IconPlus className="size-4" /> محادثة جديدة
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 px-3 py-2">
              {HISTORY.map((group) => (
                <div key={group.label} className="space-y-1">
                  <p className="px-2 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  {group.items.map((title, i) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        setRailOpen(false);
                        toast(`Opened “${title}”`, {
                          description: "المحادثات المحفوظة غير مخزّنة في النسخة التجريبية.",
                        });
                      }}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm transition-colors hover:bg-muted",
                        group.label === "اليوم" &&
                          i === 0 &&
                          "bg-muted font-medium",
                      )}
                    >
                      <IconMessage className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{title}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <Separator />
          <div className="flex items-center gap-2.5 p-3">
            <Avatar className="size-8">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium">{currentUser.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                الباقة المجانية
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-[11px] text-emerald-600 dark:text-emerald-400"
            >
              مجاني
            </Badge>
          </div>
        </aside>

        {/* ---------------------------------------------------------------- */}
        {/* Center — conversation                                            */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setRailOpen(true)}
              aria-label="سجل المحادثات"
            >
              <IconMenu2 className="size-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium tracking-tight">
                {hasMessages ? messages[0].content : "محادثة جديدة"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {activeModel.name}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="hidden gap-1 bg-emerald-500/10 text-emerald-600 sm:flex dark:text-emerald-400"
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              متصل
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={shareChat}
            >
              <IconShare3 className="size-4" />
              <span className="hidden sm:inline">مشاركة</span>
            </Button>
          </div>

          {/* Thread / empty state */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {hasMessages ? (
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
                {messages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-ee-sm bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-3">
                      <AiAvatar className="mt-0.5 size-8 shrink-0" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <RichText text={m.content} />
                        <div className="-ms-1.5 flex items-center gap-0.5">
                          <IconAction
                            label="نسخ"
                            icon={IconCopy}
                            onClick={() => copy(m.content)}
                          />
                          <IconAction
                            label="رد جيد"
                            icon={IconThumbUp}
                            onClick={() => toast.success("شكراً على ملاحظتك")}
                          />
                          <IconAction
                            label="رد غير مناسب"
                            icon={IconThumbDown}
                            onClick={() =>
                              toast("سُجّلت ملاحظتك", {
                                description: "سنستفيد منها في تحسين الردود.",
                              })
                            }
                          />
                          <IconAction
                            label="إعادة التوليد"
                            icon={IconRefresh}
                            onClick={() => regenerate(m.id)}
                          />
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {isTyping && (
                  <div className="flex gap-3">
                    <AiAvatar className="mt-0.5 size-8 shrink-0" />
                    <div className="flex items-center gap-1.5 pt-2.5">
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/60" />
                    </div>
                  </div>
                )}

                <div ref={endRef} />
              </div>
            ) : (
              <div className="m-auto flex w-full max-w-2xl flex-col items-center px-4 py-8 text-center">
                <AiAvatar className="mb-5 size-14 rounded-2xl [&_svg]:size-7" />
                <h1 className="text-3xl font-semibold tracking-tight">
                  How can I help you, {firstName}?
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  اسأل عن أي شيء، أو ابدأ بأحد هذه الاقتراحات.
                </p>

                <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => send(s.prompt)}
                      className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-start transition-colors hover:border-foreground/20 hover:bg-muted/50"
                    >
                      <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-background">
                        <s.icon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {s.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="px-4 pb-4">
            <div className="mx-auto w-full max-w-3xl">
              <div className="rounded-2xl border bg-background shadow-lg shadow-black/5 ring-1 ring-foreground/5 transition-shadow focus-within:ring-2 focus-within:ring-ring/40">
                <Textarea
                  ref={taRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !e.nativeEvent.isComposing
                    ) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  placeholder={`Message ${activeModel.name}…`}
                  rows={1}
                  className="max-h-44 min-h-11 resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
                <div className="flex items-center gap-1 px-2.5 pb-2.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        onClick={() =>
                          toast("إرفاق ملف", {
                            description: "رفع الملفات غير متاح في النسخة التجريبية.",
                          })
                        }
                      >
                        <IconPaperclip className="size-4" />
                        <span className="sr-only">إرفاق ملف</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>إرفاق ملف</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground"
                        onClick={() =>
                          toast("إضافة صورة", {
                            description: "رفع الصور غير متاح في النسخة التجريبية.",
                          })
                        }
                      >
                        <IconPhoto className="size-4" />
                        <span className="sr-only">إضافة صورة</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>إضافة صورة</TooltipContent>
                  </Tooltip>

                  {/* Model selector */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2 text-muted-foreground"
                      >
                        <IconSparkles className="size-4" />
                        <span className="text-xs font-medium">
                          {activeModel.name}
                        </span>
                        <IconChevronDown className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64">
                      <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconWorld className="size-3.5" /> اختر النموذج
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {MODELS.map((m) => (
                        <DropdownMenuItem
                          key={m.id}
                          onSelect={() => setModelId(m.id)}
                          className="flex items-start gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {m.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {m.tag}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {m.hint}
                            </p>
                          </div>
                          {m.id === modelId && (
                            <IconCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="ms-auto">
                    <Button
                      size="icon"
                      className="size-8 rounded-lg"
                      disabled={!input.trim() || isTyping}
                      onClick={() => send(input)}
                    >
                      <IconArrowUp className="size-4" />
                      <span className="sr-only">إرسال</span>
                    </Button>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                قد يخطئ مساعد عزم الذكي. تحقّق من المعلومات المهمة قبل الاعتماد
                عليها.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
