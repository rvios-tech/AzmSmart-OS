"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconPlus,
  IconDownload,
  IconDotsVertical,
  IconUserCircle,
  IconUserPlus,
  IconUsers,
  IconMessage,
  IconCheck,
  IconBriefcase,
  IconCalendarEvent,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
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
import type { StatCard as StatCardType } from "@/data";
import { formatNumber, pluralize } from "@/lib/format";

// --- بيانات توضيحية (مضمّنة وثابتة) ----------------------------------------

const DEPARTMENTS = [
  "الهندسة",
  "المبيعات",
  "التسويق",
  "الدعم",
  "العمليات",
  "التصميم",
] as const;
type Department = (typeof DEPARTMENTS)[number];

type EmploymentType = "دوام كامل" | "عقد" | "تدريب";
type TimeOffType = "إجازة" | "مرضية" | "عن بُعد";

type Hire = {
  id: string;
  name: string;
  role: string;
  dept: Department;
  start: string;
  type: EmploymentType;
  avatar: string;
};

type TimeOff = {
  id: string;
  name: string;
  type: TimeOffType;
  dates: string;
  avatar: string;
  approved: boolean;
};

const avatarUrl = (seed: number) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;

// Headcount across the months of 2026 (area trend).
const HEADCOUNT_GROWTH = [
  { month: "يناير", headcount: 248 },
  { month: "فبراير", headcount: 256 },
  { month: "مارس", headcount: 261 },
  { month: "أبريل", headcount: 270 },
  { month: "مايو", headcount: 279 },
  { month: "يونيو", headcount: 288 },
  { month: "يوليو", headcount: 294 },
];

const CHART_TOKENS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// Headcount by department (bar breakdown). Sums to the current headcount.
const DEPARTMENT_HEADCOUNT = [
  { name: "الهندسة", value: 96 },
  { name: "المبيعات", value: 58 },
  { name: "الدعم", value: 44 },
  { name: "التسويق", value: 34 },
  { name: "العمليات", value: 34 },
  { name: "التصميم", value: 28 },
].map((d, i) => ({ ...d, fill: CHART_TOKENS[i % CHART_TOKENS.length] }));

const INITIAL_HIRES: Hire[] = [
  { id: "EMP-8041", name: "ريم الدوسري", role: "مهندسة واجهات أولى", dept: "الهندسة", start: "14 يوليو 2026", type: "دوام كامل", avatar: avatarUrl(21) },
  { id: "EMP-8039", name: "ماجد الحربي", role: "مسؤول حسابات", dept: "المبيعات", start: "9 يوليو 2026", type: "دوام كامل", avatar: avatarUrl(34) },
  { id: "EMP-8036", name: "نورة المطيري", role: "مصممة منتجات", dept: "التصميم", start: "2 يوليو 2026", type: "دوام كامل", avatar: avatarUrl(5) },
  { id: "EMP-8031", name: "عبدالله الشمري", role: "أخصائي دعم فني", dept: "الدعم", start: "24 يونيو 2026", type: "عقد", avatar: avatarUrl(12) },
  { id: "EMP-8028", name: "هند الزهراني", role: "محللة تسويق", dept: "التسويق", start: "18 يونيو 2026", type: "دوام كامل", avatar: avatarUrl(45) },
  { id: "EMP-8024", name: "فيصل الغامدي", role: "مهندس DevOps", dept: "الهندسة", start: "11 يونيو 2026", type: "عقد", avatar: avatarUrl(8) },
  { id: "EMP-8019", name: "دانة النعيمي", role: "متدربة موارد بشرية", dept: "العمليات", start: "3 يونيو 2026", type: "تدريب", avatar: avatarUrl(52) },
  { id: "EMP-8015", name: "خالد القحطاني", role: "مهندس خلفية", dept: "الهندسة", start: "27 مايو 2026", type: "دوام كامل", avatar: avatarUrl(17) },
];

const PIPELINE = [
  { stage: "تقدّموا للوظيفة", count: 482, color: "var(--chart-1)" },
  { stage: "الفرز الأولي", count: 214, color: "var(--chart-2)" },
  { stage: "المقابلة", count: 96, color: "var(--chart-3)" },
  { stage: "عرض العمل", count: 32, color: "var(--chart-4)" },
  { stage: "تم التوظيف", count: 12, color: "var(--chart-5)" },
];

const INITIAL_TIMEOFF: TimeOff[] = [
  { id: "TO-1", name: "سارة الراشدي", type: "إجازة", dates: "21 – 28 يوليو 2026", avatar: avatarUrl(9), approved: false },
  { id: "TO-2", name: "أحمد العمري", type: "مرضية", dates: "17 – 18 يوليو 2026", avatar: avatarUrl(14), approved: false },
  { id: "TO-3", name: "منى الكعبي", type: "عن بُعد", dates: "20 – 24 يوليو 2026", avatar: avatarUrl(27), approved: false },
  { id: "TO-4", name: "عمر الهاشمي", type: "إجازة", dates: "3 – 10 أغسطس 2026", avatar: avatarUrl(33), approved: false },
];

const STATS: StatCardType[] = [
  { label: "عدد الموظفين", value: "294", change: 3.5, trend: "up", hint: "12 تعييناً جديداً هذا الربع" },
  { label: "الوظائف الشاغرة", value: "18", change: 5.0, trend: "up", hint: "6 وظائف في المرحلة الأخيرة" },
  { label: "معدل دوران الموظفين", value: "4.2%", change: 0.6, trend: "down", hint: "آخر 12 شهراً" },
  { label: "متوسط مدة الخدمة", value: "3.4 سنة", change: 2.1, trend: "up", hint: "ارتفاعاً من 3.2 سنة" },
];

const growthConfig = {
  headcount: { label: "عدد الموظفين", color: "var(--chart-1)" },
} satisfies ChartConfig;

const deptConfig = {
  value: { label: "الموظفون", color: "var(--chart-1)" },
} satisfies ChartConfig;

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// yyyy-mm-dd ← "14 يوليو 2026" دون المساس بالمناطق الزمنية.
function formatDate(value: string) {
  const [y, m, d] = value.split("-");
  if (!y || !m || !d) return value;
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

const EMPLOYMENT_BADGE: Record<EmploymentType, string> = {
  "دوام كامل": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "عقد": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "تدريب": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const TIMEOFF_BADGE: Record<TimeOffType, string> = {
  "إجازة": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "مرضية": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "عن بُعد": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

// --- الصفحة ----------------------------------------------------------------

export default function HRPage() {
  const [hires, setHires] = useState<Hire[]>(INITIAL_HIRES);
  const [timeOff, setTimeOff] = useState<TimeOff[]>(INITIAL_TIMEOFF);

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [dept, setDept] = useState<Department>("الهندسة");
  const [type, setType] = useState<EmploymentType>("دوام كامل");
  const [start, setStart] = useState("2026-07-17");

  const nextSeed = useRef(70);
  const nextId = useRef(8042);

  const pipelineTop = PIPELINE[0].count;
  const deptTotal = useMemo(
    () => DEPARTMENT_HEADCOUNT.reduce((s, d) => s + d.value, 0),
    []
  );

  function handleExport() {
    toast.success("بدأ التصدير", {
      description: "يجري إعداد تقرير الموظفين (CSV) للتنزيل.",
    });
  }

  function resetForm() {
    setName("");
    setRole("");
    setDept("الهندسة");
    setType("دوام كامل");
    setStart("2026-07-17");
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanRole = role.trim();
    if (!cleanName) return toast.error("أدخل اسم الموظف");
    if (!cleanRole) return toast.error("أدخل المسمى الوظيفي");

    const seed = nextSeed.current++;
    const hire: Hire = {
      id: `EMP-${nextId.current++}`,
      name: cleanName,
      role: cleanRole,
      dept,
      type,
      start: formatDate(start),
      avatar: avatarUrl(seed),
    };
    setHires((prev) => [hire, ...prev]);
    setAddOpen(false);
    resetForm();
    toast.success("تمت إضافة الموظف", {
      description: `انضم ${cleanName} إلى ${dept} بمسمى ${cleanRole}.`,
    });
  }

  function approveTimeOff(item: TimeOff) {
    setTimeOff((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, approved: true } : t))
    );
    toast.success("تم اعتماد الإجازة", {
      description: `${item.name} · ${item.type} (${item.dates}).`,
    });
  }

  const pendingTimeOff = timeOff.filter((t) => !t.approved).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الموارد البشرية"
        description="عدد الموظفين والتوظيف وعمليات الموارد البشرية."
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" /> تصدير
        </Button>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <IconPlus className="size-4" /> إضافة موظف
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نمو عدد الموظفين</CardTitle>
            <CardDescription>إجمالي الموظفين خلال عام 2026</CardDescription>
            <CardAction>
              <Badge
                variant="secondary"
                className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <IconUsers className="size-3.5" /> +18.5% منذ بداية العام
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={growthConfig}
              className="aspect-auto h-[280px] w-full"
            >
              <AreaChart
                data={HEADCOUNT_GROWTH}
                margin={{ left: 4, right: 8, top: 8 }}
              >
                <defs>
                  <linearGradient id="fillHeadcount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
          reversed
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <YAxis
          orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                  domain={["dataMin - 12", "dataMax + 8"]}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(v) =>
                        pluralize(Number(v), "موظف", "موظفان", "موظفًا")
                      }
                    />
                  }
                />
                <Area
                  dataKey="headcount"
                  type="monotone"
                  fill="url(#fillHeadcount)"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الموظفون حسب القسم</CardTitle>
            <CardDescription>{deptTotal} employees across 6 teams</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={deptConfig}
              className="aspect-auto h-[280px] w-full"
            >
              <BarChart
                data={DEPARTMENT_HEADCOUNT}
                layout="vertical"
                margin={{ left: 20, right: 8, top: 4, bottom: 4 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis
          reversed type="number" tickLine={false} axisLine={false} hide />
                <YAxis
          orientation="right"
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={82}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(v, n) => `${n}  ${v}`}
                    />
                  }
                />
                <Bar dataKey="value" radius={[4, 0, 0, 4]}>
                  {DEPARTMENT_HEADCOUNT.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>أحدث التعيينات</CardTitle>
            <CardDescription>الأحدث انضماماً إلى الفريق</CardDescription>
            <CardAction>
              <Badge variant="secondary" className="tabular-nums">
                {hires.length} total
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الموظف</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>تاريخ البدء</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead className="pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hires.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="ps-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={h.avatar} alt={h.name} />
                          <AvatarFallback>{h.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium whitespace-nowrap">{h.name}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {h.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {h.dept}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                      {h.start}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={EMPLOYMENT_BADGE[h.type]}
                      >
                        {h.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="pe-6 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="size-4" />
                            <span className="sr-only">{h.name} actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              toast(`Opening ${h.name}'s profile`, {
                                description: `${h.role} · ${h.dept}`,
                              })
                            }
                          >
                            <IconUserCircle className="size-4" /> عرض الملف الشخصي
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              toast.success("بدأت المحادثة", {
                                description: `مسودة الرسالة إلى ${h.name} جاهزة.`,
                              })
                            }
                          >
                            <IconMessage className="size-4" /> الرسالة
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              toast("أُسند إلى برنامج الإعداد", {
                                description: `أُضيف ${h.name} إلى قائمة اليوم الأول.`,
                              })
                            }
                          >
                            <IconBriefcase className="size-4" /> بدء الإعداد
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>مسار التوظيف</CardTitle>
              <CardDescription>المرشحون حسب المرحلة هذا الربع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {PIPELINE.map((s) => {
                const pct = Math.round((s.count / pipelineTop) * 100);
                return (
                  <div key={s.stage} className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="font-medium">{s.stage}</span>
                      <span className="ms-auto tabular-nums text-muted-foreground">
                        {formatNumber(s.count)}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>طلبات الإجازات</CardTitle>
              <CardDescription>
                {pendingTimeOff > 0
                  ? `${pendingTimeOff} awaiting your approval`
                  : "لا طلبات معلّقة"}
              </CardDescription>
              <CardAction>
                <IconCalendarEvent className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-1">
              {timeOff.map((t, i) => (
                <div key={t.id}>
                  {i > 0 && <Separator className="my-1" />}
                  <div className="flex items-center gap-3 py-1.5">
                    <Avatar className="size-9">
                      <AvatarImage src={t.avatar} alt={t.name} />
                      <AvatarFallback>{t.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <Badge
                          variant="secondary"
                          className={TIMEOFF_BADGE[t.type]}
                        >
                          {t.type}
                        </Badge>
                      </div>
                      <p className="truncate text-xs text-muted-foreground tabular-nums">
                        {t.dates}
                      </p>
                    </div>
                    {t.approved ? (
                      <Badge
                        variant="secondary"
                        className="shrink-0 gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      >
                        <IconCheck className="size-3.5" /> معتمدة
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => approveTimeOff(t)}
                      >
                        اعتماد
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add employee dialog */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) resetForm();
        }}
      >
        <DialogContent>
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>إضافة موظف</DialogTitle>
              <DialogDescription>
                أنشئ سجلاً لعضو فريق جديد، وسيظهر في أعلى قائمة أحدث
                التعيينات.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emp-name">الاسم الكامل</Label>
                <Input
                  id="emp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سعد المري"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-role">الدور</Label>
                <Input
                  id="emp-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="مثال: مدير منتج"
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emp-dept">القسم</Label>
                  <Select
                    value={dept}
                    onValueChange={(v) => setDept(v as Department)}
                  >
                    <SelectTrigger id="emp-dept" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emp-type">نوع التعاقد</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as EmploymentType)}
                  >
                    <SelectTrigger id="emp-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="دوام كامل">دوام كامل</SelectItem>
                      <SelectItem value="عقد">عقد</SelectItem>
                      <SelectItem value="تدريب">تدريب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-start">تاريخ البدء</Label>
                <Input
                  id="emp-start"
                  type="date"
                  value={start}
                  min="2026-01-01"
                  max="2026-12-31"
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  إلغاء
                </Button>
              </DialogClose>
              <Button type="submit">
                <IconUserPlus className="size-4" /> إضافة موظف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
