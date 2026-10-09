"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconSearch,
  IconRefresh,
  IconInbox,
  IconStar,
  IconStarFilled,
  IconSend,
  IconFile,
  IconArchive,
  IconTrash,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconDotsVertical,
  IconPencil,
  IconMail,
} from "@tabler/icons-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Email = {
  id: string;
  sender: string;
  email: string;
  avatar: string;
  subject: string;
  preview: string;
  body: string;
  time: string;
  read: boolean;
  starred: boolean;
  label?: { text: string; className: string };
};

const labels = {
  work: { text: "Work", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  billing: { text: "Billing", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  urgent: { text: "Urgent", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  team: { text: "Team", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

const seedEmails: Email[] = [
  {
    id: "m1",
    sender: "نورة المطيري",
    email: "noura@aldar-alkhaleej.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=1",
    subject: "مراجعة خارطة طريق الربع الثالث — نحتاج رأيك",
    preview: "أهلاً أحمد، أعددت مسودة خارطة الطريق للربع القادم وأودّ سماع ملاحظاتك قبل…",
    body: "أهلاً أحمد،\n\nأعددت مسودة خارطة الطريق للربع القادم وأودّ سماع ملاحظاتك قبل اجتماع القيادة يوم الخميس. المحاور الرئيسية هي تحسين تجربة الإعداد، ومجموعة التحليلات الجديدة، وتجديد مسار الفوترة.\n\nهل يمكنك الاطلاع على المستند المشترك وترك تعليقاتك حيث ترى ثغرات؟ لستُ واثقة تحديداً من ترتيب أعمال التحليلات.\n\nشكراً جزيلاً،\nنورة",
    time: "9:41 ص",
    read: false,
    starred: true,
    label: labels.work,
  },
  {
    id: "m2",
    sender: "بوابة الدفع",
    email: "receipts@payments.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=32",
    subject: "إيصال الدفع من عزم سمارت — 9,000 ر.س",
    preview: "شكراً لدفعتك. إليك إيصال تجديد اشتراكك المؤسسي…",
    body: "شكراً لدفعتك.\n\nإليك إيصال تجديد اشتراكك المؤسسي. خُصم مبلغ 9,000 ر.س من بطاقتك المنتهية بـ 4242 مقابل الباقة السنوية.\n\nيمكنك عرض سجل فواتيرك كاملاً وتنزيله من بوابة الفوترة في أي وقت.\n\n— فريق المدفوعات",
    time: "8:15 ص",
    read: false,
    starred: false,
    label: labels.billing,
  },
  {
    id: "m3",
    sender: "خالد القحطاني",
    email: "khalid@majmoaat-alofoq.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=12",
    subject: "رد: إطلاق بيئة التجريب ناجح ✅",
    preview: "تأكيد — رفعت إصلاح إعادة توجيه المصادقة وكل شيء مستقر الآن في بيئة التجريب…",
    body: "تأكيد — رفعت إصلاح إعادة توجيه المصادقة وكل شيء مستقر الآن في بيئة التجريب.\n\nسأراقب معدلات الأخطاء خلال الساعات القادمة، لكني أرى أننا جاهزون للنقل إلى الإنتاج أول شيء صباح الغد. أخبرني إن أردت التأجيل.\n\nتحياتي،\nخالد",
    time: "Yesterday",
    read: true,
    starred: false,
    label: labels.team,
  },
  {
    id: "m4",
    sender: "هند الزهراني",
    email: "hind@sharikat-alnakheel.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=5",
    subject: "تجديد العقد — مطلوب إجراء",
    preview: "تنتهي اتفاقيتنا الحالية نهاية هذا الشهر، وقد أرفقت الشروط المحدّثة لـ…",
    body: "أهلاً أحمد،\n\nتنتهي اتفاقيتنا الحالية نهاية هذا الشهر، وقد أرفقت الشروط المحدّثة للاثني عشر شهراً القادمة، وهي تتضمن خصم الكمية الذي ناقشناه في مكالمتنا الأخيرة.\n\nأرجو مراجعتها وتوقيعها في الوقت المناسب لك، ويسعدني إجراء مكالمة إن احتاج أي بند إلى توضيح.\n\nمع التحية،\nهند",
    time: "Yesterday",
    read: false,
    starred: true,
    label: labels.urgent,
  },
  {
    id: "m5",
    sender: "GitHub",
    email: "notifications@github.com",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=45",
    subject: "‏[azmsmart/platform] 3 طلبات دمج بانتظار المراجعة",
    preview: "طُلب منك مراجعة طلبات دمج في azmsmart/platform، وأقدمها عمره يومان…",
    body: "طُلب منك مراجعة طلبات الدمج التالية في azmsmart/platform:\n\n• ‏#482 إضافة حد للطلبات في الواجهة البرمجية العامة\n• ‏#485 إعادة هيكلة خطافات الفوترة\n• ‏#487 إصلاح تباين الوضع الليلي في صفحة الإعدادات\n\nأقدمها ينتظر منذ يومين.",
    time: "Yesterday",
    read: true,
    starred: false,
    label: labels.work,
  },
  {
    id: "m6",
    sender: "ماجد الحربي",
    email: "majed@alriyada-solutions.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=13",
    subject: "تسليم تصميم اللوحة الجديدة",
    preview: "ملف Figma جاهز لفريق الهندسة، وقد وثّقت التباعد وأضفت الوضعين…",
    body: "مرحباً بالفريق،\n\nملف Figma جاهز لفريق الهندسة. وثّقت قيم التباعد وأضفت الوضعين النهاري والليلي، إضافة إلى حالات الفراغ والتحميل.\n\nأخبروني إن كان أي شيء غير واضح — سأكون متاحاً طوال فترة العصر.\n\nماجد",
    time: "الإثنين",
    read: true,
    starred: false,
    label: labels.team,
  },
  {
    id: "m7",
    sender: "ريم الدوسري",
    email: "reem@bawabat-alkhaleej.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=9",
    subject: "شكراً على العرض التوضيحي!",
    preview: "استمتعت كثيراً بالجولة أمس، والفريق متحمّس للمضي في تجربة أولية…",
    body: "أهلاً أحمد،\n\nاستمتعت كثيراً بالجولة أمس، والفريق متحمّس للمضي في تجربة أولية داخل إدارة التسويق.\n\nما أفضل خطوة تالية لتجهيز مساحة عمل تجريبية؟ نفضّل البدء قبل نهاية الشهر.\n\nشكراً،\nريم",
    time: "Mon",
    read: true,
    starred: true,
  },
  {
    id: "m8",
    sender: "تنبيهات الأمان",
    email: "security@azmsmart.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=60",
    subject: "تسجيل دخول جديد من Chrome على macOS",
    preview: "لاحظنا تسجيل دخول جديداً إلى حسابك. إن كنت أنت، فلا حاجة لأي إجراء…",
    body: "لاحظنا تسجيل دخول جديداً إلى حسابك من Chrome على macOS في الرياض، السعودية.\n\nإن كنت أنت، فلا حاجة لأي إجراء. وإن لم تتعرّف على هذا النشاط، فأعد تعيين كلمة مرورك فوراً وفعّل التحقق بخطوتين.",
    time: "الأحد",
    read: true,
    starred: false,
    label: labels.urgent,
  },
  {
    id: "m9",
    sender: "يوسف العتيبي",
    email: "yousef@sharikat-alamal.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=15",
    subject: "اكتمل الإعداد 🎉",
    preview: "انتهيت للتو من تجهيز مساحة العمل ودعوة بقية الفريق، وكل شيء يعمل…",
    body: "انتهيت للتو من تجهيز مساحة العمل ودعوة بقية الفريق، وكل شيء يعمل بسلاسة حتى الآن.\n\nسؤال صغير — هل توجد طريقة لاستيراد جهات اتصالنا الحالية دفعة واحدة من ملف CSV؟ لم أجدها في الإعدادات.\n\nشكراً على كل المساعدة في البداية!\nيوسف",
    time: "Sun",
    read: true,
    starred: false,
  },
  {
    id: "m10",
    sender: "نشرة المنتج",
    email: "digest@azmsmart.sa",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=52",
    subject: "جديد هذا الأسبوع في عزم سمارت",
    preview: "أطلقنا هذا الأسبوع العروض المحفوظة وبحثاً أسرع ومركز إشعارات بتصميم جديد…",
    body: "إليك ما أُطلق هذا الأسبوع:\n\n• العروض المحفوظة — ثبّت عوامل التصفية المفضّلة على أي جدول\n• بحث شامل أسرع بثلاث مرات\n• مركز إشعارات بتصميم جديد\n\nاطّلع على سجل التغييرات الكامل وأخبرنا بما تودّ رؤيته لاحقاً.",
    time: "السبت",
    read: true,
    starred: false,
    label: labels.work,
  },
];

const folders = [
  { id: "inbox", name: "البريد الوارد", icon: IconInbox, count: 4 },
  { id: "starred", name: "المميّزة بنجمة", icon: IconStar, count: 4 },
  { id: "sent", name: "المرسلة", icon: IconSend, count: 0 },
  { id: "drafts", name: "المسودات", icon: IconFile, count: 2 },
  { id: "archive", name: "الأرشيف", icon: IconArchive, count: 0 },
  { id: "trash", name: "المهملات", icon: IconTrash, count: 0 },
];

export default function MailPage() {
  const [emails, setEmails] = useState(seedEmails);
  const [folder, setFolder] = useState("inbox");
  const [selectedId, setSelectedId] = useState<string>(seedEmails[0].id);
  const [query, setQuery] = useState("");
  // Mobile master-detail: show the email list first, the reader after tapping.
  const [mobileReadOpen, setMobileReadOpen] = useState(false);

  // Composer state.
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"new" | "reply" | "forward">("new");
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");

  const selected = emails.find((e) => e.id === selectedId) ?? null;

  const visible = emails.filter((e) => {
    if (folder === "starred" && !e.starred) return false;
    if (query && !`${e.sender} ${e.subject} ${e.preview}`.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  function openEmail(id: string) {
    setSelectedId(id);
    setMobileReadOpen(true);
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: true } : e)));
  }

  function toggleStar(id: string) {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e)));
  }

  function markUnread(id: string) {
    setEmails((prev) => prev.map((e) => (e.id === id ? { ...e, read: false } : e)));
    toast.success("تم تحديدها كغير مقروءة");
  }

  function removeEmail(id: string) {
    setEmails((prev) => {
      const next = prev.filter((e) => e.id !== id);
      if (id === selectedId) setSelectedId(next[0]?.id ?? "");
      return next;
    });
  }

  function archiveEmail(id: string) {
    removeEmail(id);
    toast.success("تمت أرشفة المحادثة");
  }

  function deleteEmail(id: string) {
    removeEmail(id);
    toast.success("نُقلت إلى المهملات");
  }

  function openCompose() {
    setComposeMode("new");
    setTo("");
    setSubject("");
    setBodyText("");
    setComposeOpen(true);
  }

  function openReply() {
    if (!selected) return;
    setComposeMode("reply");
    setTo(selected.email);
    setSubject(`Re: ${selected.subject}`);
    setBodyText(`\n\n---\nOn ${selected.time}, ${selected.sender} wrote:\n${selected.body}`);
    setComposeOpen(true);
  }

  function openForward() {
    if (!selected) return;
    setComposeMode("forward");
    setTo("");
    setSubject(`Fwd: ${selected.subject}`);
    setBodyText(
      `\n\n---------- رسالة مُعاد توجيهها ----------\nمن: ${selected.sender} <${selected.email}>\nالموضوع: ${selected.subject}\n\n${selected.body}`,
    );
    setComposeOpen(true);
  }

  function sendMail() {
    if (!to.trim()) {
      toast.error("أضف مستلماً واحداً على الأقل");
      return;
    }
    setComposeOpen(false);
    toast.success("تم إرسال الرسالة", { description: `إلى ${to.trim()}` });
    setTo("");
    setSubject("");
    setBodyText("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">البريد</h1>
        <p className="text-sm text-muted-foreground">
          بريدك الموحّد عبر كل مساحات العمل.
        </p>
      </div>

      <Card className="grid h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden p-0 md:grid-cols-[200px_320px_1fr]">
        {/* Folders */}
        <div className="hidden flex-col gap-4 border-e p-4 md:flex">
          <Button className="w-full gap-2" onClick={openCompose}>
            <IconPencil className="size-4" /> إنشاء رسالة
          </Button>
          <nav className="flex flex-col gap-0.5">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setFolder(f.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/60",
                  folder === f.id ? "bg-muted font-medium" : "text-muted-foreground",
                )}
              >
                <f.icon className="size-4" />
                <span className="flex-1 text-start">{f.name}</span>
                {f.count > 0 && (
                  <span className="text-xs tabular-nums text-muted-foreground">{f.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Email list */}
        <div
          className={cn(
            "min-w-0 flex-col border-e md:flex",
            mobileReadOpen ? "hidden" : "flex"
          )}
        >
          <div className="flex items-center gap-2 border-b p-3">
            <div className="relative flex-1">
              <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في البريد"
                className="ps-9"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                toast.success("تم تحديث البريد الوارد", {
                  description: "لا جديد لديك.",
                })
              }
              aria-label="تحديث"
            >
              <IconRefresh className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y">
              {visible.map((e) => (
                <button
                  key={e.id}
                  onClick={() => openEmail(e.id)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/40",
                    e.id === selectedId && "bg-muted/60",
                  )}
                >
                  <Avatar className="size-9 shrink-0">
                    <AvatarImage src={e.avatar} alt={e.sender} />
                    <AvatarFallback>{e.sender.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!e.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                      <span
                        className={cn(
                          "truncate text-sm",
                          e.read ? "text-foreground" : "font-semibold",
                        )}
                      >
                        {e.sender}
                      </span>
                      <span className="ms-auto shrink-0 text-xs text-muted-foreground">{e.time}</span>
                    </div>
                    <p className={cn("truncate text-sm", !e.read && "font-medium")}>{e.subject}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.preview}</p>
                    {e.label && (
                      <Badge variant="secondary" className={cn("mt-1.5", e.label.className)}>
                        {e.label.text}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
              {visible.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  لا توجد رسائل.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reading pane */}
        <div
          className={cn(
            "min-w-0 flex-col md:flex",
            mobileReadOpen ? "flex" : "hidden"
          )}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-1 border-b p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ms-1 shrink-0 md:hidden"
                  onClick={() => setMobileReadOpen(false)}
                  aria-label="العودة إلى البريد الوارد"
                >
                  <IconArrowLeft className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => archiveEmail(selected.id)}
                  aria-label="أرشفة"
                >
                  <IconArchive className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEmail(selected.id)}
                  aria-label="حذف"
                >
                  <IconTrash className="size-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-5" />
                <Button variant="ghost" size="icon" onClick={openReply} aria-label="رد">
                  <IconArrowBackUp className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={openForward} aria-label="إعادة توجيه">
                  <IconArrowForwardUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ms-auto"
                  onClick={() => toggleStar(selected.id)}
                  aria-label={selected.starred ? "إزالة النجمة" : "تمييز بنجمة"}
                >
                  {selected.starred ? (
                    <IconStarFilled className="size-4 text-amber-500" />
                  ) : (
                    <IconStar className="size-4" />
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="إجراءات إضافية">
                      <IconDotsVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => markUnread(selected.id)}>
                      <IconMail className="size-4" /> تحديد كغير مقروء
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStar(selected.id)}>
                      {selected.starred ? (
                        <IconStarFilled className="size-4" />
                      ) : (
                        <IconStar className="size-4" />
                      )}
                      {selected.starred ? "إزالة النجمة" : "تمييز بنجمة"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => archiveEmail(selected.id)}>
                      <IconArchive className="size-4" /> أرشفة
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => deleteEmail(selected.id)}
                    >
                      <IconTrash className="size-4" /> حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6">
                  <div className="flex items-start gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">{selected.subject}</h2>
                    {selected.label && (
                      <Badge variant="secondary" className={selected.label.className}>
                        {selected.label.text}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarImage src={selected.avatar} alt={selected.sender} />
                      <AvatarFallback>{selected.sender.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{selected.sender}</p>
                      <p className="truncate text-xs text-muted-foreground">{selected.email}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{selected.time}</span>
                  </div>
                  <Separator className="my-5" />
                  <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {selected.body}
                  </div>
                  <Separator className="my-6" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={openReply}>
                      <IconArrowBackUp className="size-4" /> رد
                    </Button>
                    <Button variant="outline" size="sm" onClick={openForward}>
                      <IconArrowForwardUp className="size-4" /> إعادة توجيه
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              اختر رسالة لقراءتها
            </div>
          )}
        </div>
      </Card>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {composeMode === "reply"
                ? "رد"
                : composeMode === "forward"
                  ? "إعادة توجيه"
                  : "رسالة جديدة"}
            </DialogTitle>
            <DialogDescription>
              اكتب رسالتك وأرسلها.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mail-to">إلى</Label>
              <Input
                id="mail-to"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="ahmed@azmsmart.sa"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail-subject">الموضوع</Label>
              <Input
                id="mail-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="الموضوع"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail-body">الرسالة</Label>
              <Textarea
                id="mail-body"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="اكتب رسالتك…"
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={sendMail}>
              <IconSend className="size-4" /> إرسال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
