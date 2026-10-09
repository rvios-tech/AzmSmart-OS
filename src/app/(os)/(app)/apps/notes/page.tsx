"use client";

import { useMemo, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconNotes,
  IconBriefcase,
  IconUser,
  IconBulb,
  IconArchive,
  IconPin,
  IconPinnedFilled,
  IconTrash,
  IconPalette,
  IconDots,
  IconSquare,
  IconSquareCheck,
  IconTag,
  IconClock,
  IconShare3,
  IconArrowLeft,
} from "@tabler/icons-react";

import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/format";

type NoteColor = "blue" | "violet" | "emerald" | "amber" | "rose" | "slate";
type FolderId = "work" | "personal" | "ideas" | "archive";

type ChecklistItem = { id: string; text: string; done: boolean };

type Note = {
  id: string;
  title: string;
  preview: string;
  folder: FolderId;
  color: NoteColor;
  tags: string[];
  date: string;
  edited: string;
  pinned: boolean;
  body: string[];
  checklist?: { heading: string; items: ChecklistItem[] };
};

const colorMeta: Record<
  NoteColor,
  { dot: string; badge: string; bar: string; label: string }
> = {
  blue: {
    dot: "bg-blue-500",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    bar: "bg-blue-500",
    label: "أزرق",
  },
  violet: {
    dot: "bg-violet-500",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    bar: "bg-violet-500",
    label: "بنفسجي",
  },
  emerald: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    label: "أخضر",
  },
  amber: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    label: "كهرماني",
  },
  rose: {
    dot: "bg-rose-500",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    bar: "bg-rose-500",
    label: "وردي",
  },
  slate: {
    dot: "bg-slate-500",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    bar: "bg-slate-500",
    label: "رمادي",
  },
};

const folders = [
  { id: "all", label: "كل الملاحظات", icon: IconNotes },
  { id: "work", label: "العمل", icon: IconBriefcase },
  { id: "personal", label: "شخصي", icon: IconUser },
  { id: "ideas", label: "أفكار", icon: IconBulb },
  { id: "archive", label: "الأرشيف", icon: IconArchive },
] as const;

type NavId = (typeof folders)[number]["id"];

const seedNotes: Note[] = [
  {
    id: "n1",
    title: "خارطة طريق المنتج للربع الثالث",
    preview:
      "ثلاثة رهانات لهذا الربع: تجربة الإعداد، ومجموعة التحليلات، وتجديد الفوترة. ابدأ بقائمة التحقق.",
    folder: "work",
    color: "blue",
    tags: ["خارطة طريق", "تخطيط"],
    date: "15 يوليو",
    edited: "عُدّلت في 15 يوليو 2026 · 2:14 م",
    pinned: true,
    body: [
      "نضع ثلاثة رهانات هذا الربع، وكل واحد منها يجب أن يكون قابلاً للقياس بنهاية سبتمبر، ولكل قائد فريق نصيب واضح من العمل.",
      "تجربة الإعداد هي أكبر رافعة لدينا؛ فمعدل التفعيل في الأسبوع الأول ظل ثابتاً لربعين متتاليين. وإن رفعته قائمة التحقق الجديدة وجولة المنتج خمس نقاط فقط، فسيتحسّن كل ما يليه.",
      "التحليلات هي الميزة التي تطلبها كبرى حساباتنا باستمرار، ونسخة الفوترة الثانية تفتح الباب أمام التسعير بالاستهلاك، وهو ما يفتح بدوره سوق المؤسسات.",
    ],
    checklist: {
      heading: "قبل اجتماع القيادة",
      items: [
        { id: "c1", text: "إعداد مسودة لوحة مسار التفعيل", done: true },
        { id: "c2", text: "تأكيد الجدول الزمني لترحيل الفوترة", done: true },
        { id: "c3", text: "مواءمة التسعير مع الإدارة المالية", done: false },
        { id: "c4", text: "مشاركة المستند لتلقي الملاحظات", done: false },
      ],
    },
  },
  {
    id: "n2",
    title: "قائمة إطلاق تطبيق الجوال v2",
    preview:
      "كل ما يجب أن يكتمل قبل تفعيل الإطلاق. مراجعة متجر التطبيقات هي أطول مرحلة.",
    folder: "work",
    color: "emerald",
    tags: ["launch", "mobile"],
    date: "14 يوليو",
    edited: "عُدّلت في 14 يوليو 2026 · 6:02 م",
    pinned: true,
    body: [
      "الموعد المستهدف هو الثامن والعشرون. مراجعة متجر التطبيقات هي أطول مرحلة، لذا يجب رفع الإصدار في الثاني والعشرين كحد أقصى لترك هامش لإعادة المراجعة.",
      "أعدّ فريق التسويق مسودة الإعلان، ولا ينقصنا سوى لقطات الشاشة النهائية بعد اكتمال الحالات الفارغة.",
    ],
    checklist: {
      heading: "شروط الإطلاق",
      items: [
        { id: "c1", text: "معدل الجلسات الخالية من الأعطال فوق 99.5%", done: true },
        { id: "c2", text: "اختبار وضع العمل دون اتصال على iOS وAndroid", done: true },
        { id: "c3", text: "رفع الإصدار لمراجعة متجر التطبيقات", done: false },
        { id: "c4", text: "جدولة الإطلاق التدريجي (10% ← 100%)", done: false },
        { id: "c5", text: "تحديث مقالات مركز المساعدة", done: false },
      ],
    },
  },
  {
    id: "n3",
    title: "اجتماع ثنائي مع نورة — نظام التصميم",
    preview:
      "تقترح نورة توحيد مجموعة الأيقونات وإلغاء قيم التباعد الفردية. اتفقنا على دراسة الأمر في الدورة القادمة.",
    folder: "work",
    color: "violet",
    tags: ["design", "1:1"],
    date: "12 يوليو",
    edited: "عُدّلت في 12 يوليو 2026 · 11:30 ص",
    pinned: false,
    body: [
      "أثارت نورة أننا نحمل مكتبتَي أيقونات وكمّاً من قيم التباعد الفردية، ما يبطئ بناء كل شاشة جديدة ويخلق تبايناً خفياً في الوضع الليلي.",
      "اتفقنا على دراسة التوحيد في الدورة القادمة: اختيار مجموعة أيقونات واحدة، وتقنين سلّم التباعد، وتوثيقهما في Storybook. وستعمل مع ريم على المراجعة.",
      "متابعة مطلوبة: أخذ رأي عبدالله في تكلفة ترحيل واجهات Android القديمة.",
    ],
  },
  {
    id: "n4",
    title: "عطلة نهاية أسبوع في أبها",
    preview:
      "برنامج مبدئي للرحلة — الطبيعة صباحاً، والمطاعم مساءً، ويوم كامل في السودة.",
    folder: "personal",
    color: "rose",
    tags: ["travel", "japan"],
    date: "9 يوليو",
    edited: "عُدّلت في 9 يوليو 2026 · 9:48 م",
    pinned: false,
    body: [
      "اجعل الصباح للمواقع الطبيعية قبل ازدحامها، ثم خصّص العصر للتجوّل والقهوة. والمساء للمطاعم — سوق الثلاثاء وشارع الفن.",
      "احجز يوماً كاملاً للسودة: تلفريك الجبل أولاً، ثم متنزه القرود وغداء هادئ على حافة الوادي.",
    ],
    checklist: {
      heading: "للحجز",
      items: [
        { id: "c1", text: "نزل جبلي لليلتين في السودة", done: true },
        { id: "c2", text: "استئجار سيارة لسبعة أيام", done: false },
        { id: "c3", text: "حجز عشاء — مطعم تراثي", done: false },
      ],
    },
  },
  {
    id: "n5",
    title: "قائمة القراءة",
    preview:
      "كتب مؤجّلة لبقية العام، مع محاولة التناوب بين رواية وكتاب معرفي.",
    folder: "personal",
    color: "amber",
    tags: ["books"],
    date: "6 يوليو",
    edited: "عُدّلت في 6 يوليو 2026 · 8:15 ص",
    pinned: false,
    body: [
      "الخطة بسيطة: رواية ثم كتاب معرفي بالتناوب كي لا تتحوّل القراءة إلى واجب. وإن لم يشدّك الكتاب حتى الصفحة الخمسين، فاتركه دون تأنيب.",
    ],
    checklist: {
      heading: "قائمة الانتظار",
      items: [
        { id: "c1", text: "موسم الهجرة إلى الشمال — الطيب صالح", done: true },
        { id: "c2", text: "التفكير في الأنظمة — دونيلا ميدوز", done: false },
        { id: "c3", text: "مدن الملح — عبدالرحمن منيف", done: false },
        { id: "c4", text: "تصميم الأشياء اليومية — دونالد نورمان", done: false },
      ],
    },
  },
  {
    id: "n6",
    title: "فكرة تطبيق: مؤقّت تركيز أهدأ",
    preview:
      "ليس نسخة أخرى من بومودورو. أصوات محيطة، وبدايات جلسات متدرّجة، وبلا شعور بالذنب من انقطاع السلسلة.",
    folder: "ideas",
    color: "violet",
    tags: ["side-project", "product"],
    date: "4 يوليو",
    edited: "عُدّلت في 4 يوليو 2026 · 10:22 م",
    pinned: false,
    body: [
      "معظم تطبيقات التركيز تعاقبك بسلاسل متتالية ومؤقّتات قاسية. الرهان المعاكس: مؤقّت يدخلك بهدوء، ويُخفي الواجهة تدريجياً، ولا يلومك على يوم فائت.",
      "الدورة الأساسية: نقرة واحدة للبدء، ونغمة خفيفة للانتهاء، ومراجعة أسبوعية هادئة. وكل ما عدا ذلك اختياري. وما لا يمكن شرحه في جملة واحدة لا يُطلق.",
    ],
  },
  {
    id: "n7",
    title: "مسودات مقالات المدونة",
    preview:
      "عناوين غير مكتملة لمدونة الهندسة، وأقربها للجاهزية مقال الوضع الليلي.",
    folder: "ideas",
    color: "blue",
    tags: ["writing", "engineering"],
    date: "1 يوليو",
    edited: "عُدّلت في 1 يوليو 2026 · 4:41 م",
    pinned: false,
    body: [
      "بضع أفكار مقالات تستحق التطوير. مقال الوضع الليلي هو الأقرب للجاهزية، فلديّ بالفعل لقطات قبل وبعد وجدول الرموز اللونية.",
    ],
    checklist: {
      heading: "عناوين مرشّحة",
      items: [
        { id: "c1", text: "تصميم وضع ليلي مقروء فعلاً", done: false },
        { id: "c2", text: "كيف قلّصنا حجم الحزمة الأولية إلى النصف", done: false },
        { id: "c3", text: "دليل عملي لأعلام الميزات", done: false },
      ],
    },
  },
  {
    id: "n8",
    title: "ملاحظات مراجعة دورة قديمة",
    preview:
      "مراجعة مؤرشفة لأعمال الفوترة في الربع الأول، محتفظ بها من أجل البنود التي لم تُغلق.",
    folder: "archive",
    color: "slate",
    tags: ["retro"],
    date: "28 مارس",
    edited: "عُدّلت في 28 مارس 2026 · 3:05 م",
    pinned: false,
    body: [
      "مراجعة دورة الفوترة في الربع الأول، وتستحق الحفظ لأن بعض بنودها ما زالت مفتوحة وتتكرر باستمرار.",
      "ما نجح: تم الترحيل دون توقف للخدمة. وما لم ينجح: قلّلنا من تقدير إعادة محاولات خطافات الويب وخسرنا يومين بسبب اختبارات غير مستقرة.",
    ],
  },
];

const colorChoices: NoteColor[] = [
  "blue",
  "violet",
  "emerald",
  "amber",
  "rose",
  "slate",
];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(seedNotes);
  const [folder, setFolder] = useState<NavId>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(seedNotes[0].id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Mobile master-detail: show the notes list first, the editor after tapping one.
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // New-note dialog state.
  const [composeOpen, setComposeOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFolder, setNewFolder] = useState<FolderId>("work");
  const [newBody, setNewBody] = useState("");

  function createNote() {
    const t = newTitle.trim() || "ملاحظة بلا عنوان";
    const bodyText = newBody.trim();
    const now = new Date();
    const note: Note = {
      id: `n-${Date.now()}`,
      title: t,
      preview: bodyText ? bodyText.slice(0, 120) : "ملاحظة فارغة — ابدأ الكتابة…",
      folder: newFolder,
      color: "blue",
      tags: [],
      date: formatDateShort(now),
      edited: `عُدّلت في ${formatDateShort(now)} · الآن`,
      pinned: false,
      body: bodyText
        ? bodyText.split("\n\n").map((p) => p.trim()).filter(Boolean)
        : ["ابدأ كتابة ملاحظتك هنا…"],
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    setFolder(newFolder);
    setComposeOpen(false);
    setNewTitle("");
    setNewBody("");
    setNewFolder("work");
    toast.success("تم إنشاء الملاحظة", { description: t });
  }

  function archiveNote(id: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, folder: "archive" } : n)),
    );
    toast.success("تمت أرشفة الملاحظة");
  }

  function shareNote(note: Note) {
    const link = `https://azmsmart.sa/notes/${note.id}`;
    navigator.clipboard
      ?.writeText(link)
      .then(() => toast.success("تم نسخ الرابط", { description: link }))
      .catch(() => toast.error("تعذّر نسخ الرابط"));
  }

  const counts = useMemo(() => {
    const base = { all: 0, work: 0, personal: 0, ideas: 0, archive: 0 };
    for (const n of notes) {
      base[n.folder] += 1;
      if (n.folder !== "archive") base.all += 1;
    }
    return base;
  }, [notes]);

  const visible = useMemo(() => {
    let list = notes.filter((n) =>
      folder === "all" ? n.folder !== "archive" : n.folder === folder,
    );
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.preview.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return list.slice().sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return 0;
    });
  }, [notes, folder, query]);

  const selected = notes.find((n) => n.id === selectedId) ?? visible[0] ?? null;

  function togglePin(id: string) {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );
  }

  function setColor(id: string, color: NoteColor) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)));
  }

  function toggleCheck(noteId: string, itemId: string) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId && n.checklist
          ? {
              ...n,
              checklist: {
                ...n.checklist,
                items: n.checklist.items.map((it) =>
                  it.id === itemId ? { ...it, done: !it.done } : it,
                ),
              },
            }
          : n,
      ),
    );
  }

  function deleteNote(id: string) {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (id === selectedId && next.length) setSelectedId(next[0].id);
      return next;
    });
  }

  const tagCloud = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) n.tags.forEach((t) => set.add(t));
    return Array.from(set).slice(0, 8);
  }, [notes]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">الملاحظات</h1>
        <p className="text-sm text-muted-foreground">
          دوّن أفكارك وخططك وقوائم مهامك في مكان واحد.
        </p>
      </div>

      <Card className="grid h-[calc(100vh-11rem)] grid-cols-1 overflow-hidden p-0 md:grid-cols-[220px_320px_1fr]">
        {/* LEFT: folders + tags */}
        <div className="hidden flex-col gap-4 border-e p-4 lg:flex">
          <Button className="w-full gap-2" onClick={() => setComposeOpen(true)}>
            <IconPlus className="size-4" /> ملاحظة جديدة
          </Button>

          <nav className="flex flex-col gap-0.5">
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setFolder(f.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-muted/60",
                  folder === f.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <f.icon className="size-4" />
                <span className="flex-1 text-start">{f.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {counts[f.id]}
                </span>
              </button>
            ))}
          </nav>

          <Separator />

          <div className="space-y-2">
            <p className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground">
              <IconTag className="size-3.5" /> الوسوم
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tagCloud.map((t) => (
                <button
                  key={t}
                  onClick={() => setQuery(t)}
                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MIDDLE: note list */}
        <div
          className={cn(
            "min-w-0 flex-col border-e md:flex",
            mobileDetailOpen ? "hidden" : "flex",
          )}
        >
          <div className="flex items-center gap-2 border-b p-3">
            <div className="relative flex-1">
              <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في الملاحظات"
                className="ps-9"
              />
            </div>
            <Button
              size="icon"
              className="shrink-0 md:hidden"
              onClick={() => setComposeOpen(true)}
              aria-label="ملاحظة جديدة"
            >
              <IconPlus className="size-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {visible.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setSelectedId(n.id);
                    setMobileDetailOpen(true);
                  }}
                  className={cn(
                    "flex w-full flex-col gap-1 px-4 py-3 text-start transition-colors hover:bg-muted/40",
                    n.id === selected?.id && "bg-muted/60",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        colorMeta[n.color].dot,
                      )}
                    />
                    <span className="flex-1 truncate text-sm font-medium">
                      {n.title}
                    </span>
                    {n.pinned && (
                      <IconPinnedFilled className="size-3.5 shrink-0 text-amber-500" />
                    )}
                  </div>
                  <p className="line-clamp-2 ps-4 text-xs text-muted-foreground">
                    {n.preview}
                  </p>
                  <span className="ps-4 text-[11px] text-muted-foreground tabular-nums">
                    {n.date}
                  </span>
                </button>
              ))}
              {visible.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  لا توجد ملاحظات.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* RIGHT: reader / editor */}
        <div
          className={cn(
            "min-w-0 flex-col md:flex",
            mobileDetailOpen ? "flex" : "hidden",
          )}
        >
          {selected ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b p-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="-ms-1 me-0.5 shrink-0 md:hidden"
                  onClick={() => setMobileDetailOpen(false)}
                  aria-label="العودة إلى الملاحظات"
                >
                  <IconArrowLeft className="size-5" />
                </Button>
                <span
                  className={cn(
                    "me-1 h-5 w-1 rounded-full",
                    colorMeta[selected.color].bar,
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {folders.find((f) => f.id === selected.folder)?.label ??
                    "الملاحظات"}
                </span>
                <div className="ms-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePin(selected.id)}
                    aria-label={selected.pinned ? "إلغاء التثبيت" : "تثبيت"}
                  >
                    {selected.pinned ? (
                      <IconPinnedFilled className="size-4 text-amber-500" />
                    ) : (
                      <IconPin className="size-4" />
                    )}
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="لون الملاحظة">
                        <IconPalette className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuLabel>اللون</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="grid grid-cols-6 gap-1.5 p-1.5">
                        {colorChoices.map((c) => (
                          <button
                            key={c}
                            onClick={() => setColor(selected.id, c)}
                            aria-label={colorMeta[c].label}
                            className={cn(
                              "size-5 rounded-full ring-offset-2 ring-offset-popover transition-shadow hover:ring-2 hover:ring-ring",
                              colorMeta[c].dot,
                              selected.color === c && "ring-2 ring-ring",
                            )}
                          />
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="مشاركة"
                    onClick={() => shareNote(selected)}
                  >
                    <IconShare3 className="size-4" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="المزيد">
                        <IconDots className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => togglePin(selected.id)}>
                        <IconPin className="size-4" />
                        {selected.pinned ? "إلغاء تثبيت الملاحظة" : "تثبيت الملاحظة"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => archiveNote(selected.id)}>
                        <IconArchive className="size-4" /> أرشفة
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <IconTrash className="size-4" /> حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Separator
                    orientation="vertical"
                    className="mx-1 hidden h-5 md:block"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:inline-flex"
                    onClick={() => setDeleteOpen(true)}
                    aria-label="حذف الملاحظة"
                  >
                    <IconTrash className="size-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="mx-auto max-w-2xl space-y-5 p-6 md:p-8">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {selected.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <IconClock className="size-3.5" /> {selected.edited}
                    </span>
                    <span className="tabular-nums">
                      {wordCount(selected)} words
                    </span>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    {selected.body.map((p, i) => (
                      <p
                        key={i}
                        className="text-sm leading-relaxed text-foreground/90"
                      >
                        {p}
                      </p>
                    ))}
                  </div>

                  {selected.checklist && (
                    <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm font-medium">
                        {selected.checklist.heading}
                      </p>
                      <ul className="space-y-1.5">
                        {selected.checklist.items.map((it) => (
                          <li key={it.id}>
                            <button
                              onClick={() => toggleCheck(selected.id, it.id)}
                              className="flex w-full items-center gap-2.5 text-start text-sm"
                            >
                              {it.done ? (
                                <IconSquareCheck className="size-4 shrink-0 text-primary" />
                              ) : (
                                <IconSquare className="size-4 shrink-0 text-muted-foreground" />
                              )}
                              <span
                                className={cn(
                                  it.done &&
                                    "text-muted-foreground line-through",
                                )}
                              >
                                {it.text}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />

                  <div className="flex flex-wrap items-center gap-2">
                    {selected.tags.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className={colorMeta[selected.color].badge}
                      >
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              اختر ملاحظة لقراءتها
            </div>
          )}
        </div>
      </Card>

      {selected && (
        <DeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          name={selected.title}
          description="ستُحذف هذه الملاحظة نهائياً. لا يمكن التراجع عن هذا الإجراء."
          onConfirm={() => deleteNote(selected.id)}
        />
      )}

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ملاحظة جديدة</DialogTitle>
            <DialogDescription>دوّن فكرة أو خطة جديدة.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">العنوان</Label>
              <Input
                id="note-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="ملاحظة بلا عنوان"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-body">الملاحظة</Label>
              <Textarea
                id="note-body"
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="ابدأ الكتابة…"
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>المجلد</Label>
              <Select
                value={newFolder}
                onValueChange={(v) => setNewFolder(v as FolderId)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {folders
                    .filter((f) => f.id !== "all")
                    .map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={createNote}>إنشاء الملاحظة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function wordCount(note: Note) {
  const bodyWords = note.body.join(" ").trim().split(/\s+/).length;
  const listWords = note.checklist
    ? note.checklist.items.reduce(
        (sum, it) => sum + it.text.trim().split(/\s+/).length,
        0,
      )
    : 0;
  return bodyWords + listWords;
}
