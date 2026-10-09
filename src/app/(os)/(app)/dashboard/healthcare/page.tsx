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
  IconEye,
  IconCalendarEvent,
  IconClock,
  IconX,
  IconStethoscope,
  IconPhoneCall,
  IconRefresh,
  IconUserPlus,
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

// --- demo data (inline, deterministic) -------------------------------------

type Status = "مؤكّد" | "قيد الانتظار" | "تم الحضور" | "ملغى";

type Appointment = {
  id: string;
  patient: string;
  avatar: string;
  doctor: string;
  department: string;
  date: string; // نص معروض، مثل "18 يوليو 2026"
  time: string; // نص معروض، مثل "9:30 ص"
  status: Status;
};

const avatar = (seed: number) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;

// بيانات الأقسام المشتركة تغذّي المخطط الشريطي وأشرطة الإشغال وقائمة
// النافذة، فتبقى كل الواجهات متسقة.
const DEPARTMENTS = [
  { name: "أمراض القلب", color: "var(--chart-1)", appts: 42, load: 78 },
  { name: "طب الأطفال", color: "var(--chart-2)", appts: 38, load: 64 },
  { name: "جراحة العظام", color: "var(--chart-3)", appts: 31, load: 52 },
  { name: "المخ والأعصاب", color: "var(--chart-4)", appts: 24, load: 41 },
  { name: "الطب العام", color: "var(--chart-5)", appts: 47, load: 88 },
] as const;

const DEPT_DOCTOR: Record<string, string> = {
  "أمراض القلب": "د. عبدالله الشمري",
  "طب الأطفال": "د. نورة المطيري",
  "جراحة العظام": "د. ماجد الحربي",
  "المخ والأعصاب": "د. سارة الراشدي",
  "الطب العام": "د. عمر الهاشمي",
};

// زيارات المرضى الأسبوعية خلال آخر 12 أسبوعاً من عام 2026.
const VISITS = [
  { week: "27 أبريل", outpatient: 412, inpatient: 96 },
  { week: "4 مايو", outpatient: 438, inpatient: 102 },
  { week: "11 مايو", outpatient: 401, inpatient: 88 },
  { week: "18 مايو", outpatient: 469, inpatient: 110 },
  { week: "25 مايو", outpatient: 452, inpatient: 105 },
  { week: "1 يونيو", outpatient: 498, inpatient: 118 },
  { week: "8 يونيو", outpatient: 521, inpatient: 124 },
  { week: "15 يونيو", outpatient: 486, inpatient: 112 },
  { week: "22 يونيو", outpatient: 544, inpatient: 131 },
  { week: "29 يونيو", outpatient: 567, inpatient: 138 },
  { week: "6 يوليو", outpatient: 592, inpatient: 142 },
  { week: "13 يوليو", outpatient: 618, inpatient: 149 },
];

const STAFF = [
  { name: "د. عبدالله الشمري", specialty: "أمراض القلب", seed: 12, onCall: true },
  { name: "د. نورة المطيري", specialty: "طب الأطفال", seed: 24, onCall: false },
  { name: "د. ماجد الحربي", specialty: "جراحة العظام", seed: 31, onCall: true },
  { name: "د. سارة الراشدي", specialty: "المخ والأعصاب", seed: 45, onCall: false },
  { name: "د. عمر الهاشمي", specialty: "الطب العام", seed: 7, onCall: false },
  { name: "د. هند الزهراني", specialty: "أمراض القلب", seed: 53, onCall: true },
];

const SEED_APPOINTMENTS: Appointment[] = [
  { id: "AP-2041", patient: "منى الكعبي", avatar: avatar(3), doctor: "د. عبدالله الشمري", department: "أمراض القلب", date: "18 يوليو 2026", time: "9:00 ص", status: "مؤكّد" },
  { id: "AP-2042", patient: "سعد المري", avatar: avatar(9), doctor: "د. نورة المطيري", department: "طب الأطفال", date: "18 يوليو 2026", time: "9:30 ص", status: "تم الحضور" },
  { id: "AP-2043", patient: "دانة النعيمي", avatar: avatar(17), doctor: "د. ماجد الحربي", department: "جراحة العظام", date: "18 يوليو 2026", time: "10:15 ص", status: "قيد الانتظار" },
  { id: "AP-2044", patient: "يوسف العتيبي", avatar: avatar(22), doctor: "د. سارة الراشدي", department: "المخ والأعصاب", date: "19 يوليو 2026", time: "11:00 ص", status: "مؤكّد" },
  { id: "AP-2045", patient: "فاطمة البلوشي", avatar: avatar(28), doctor: "د. عمر الهاشمي", department: "الطب العام", date: "19 يوليو 2026", time: "1:30 م", status: "مؤكّد" },
  { id: "AP-2046", patient: "إبراهيم الكندي", avatar: avatar(34), doctor: "د. هند الزهراني", department: "أمراض القلب", date: "20 يوليو 2026", time: "2:00 م", status: "ملغى" },
  { id: "AP-2047", patient: "لمى الفلاسي", avatar: avatar(41), doctor: "د. نورة المطيري", department: "طب الأطفال", date: "20 يوليو 2026", time: "3:15 م", status: "قيد الانتظار" },
  { id: "AP-2048", patient: "علي الجابري", avatar: avatar(48), doctor: "د. ماجد الحربي", department: "جراحة العظام", date: "21 يوليو 2026", time: "9:45 ص", status: "مؤكّد" },
];

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const STATUS_CLS: Record<Status, string> = {
  "مؤكّد": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "تم الحضور": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "قيد الانتظار": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "ملغى": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function formatTime(t: string) {
  const [h, min] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return t;
  const ampm = h >= 12 ? "م" : "ص";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(min).padStart(2, "0")} ${ampm}`;
}

// --- charts (inline recharts) ----------------------------------------------

const visitsConfig = {
  outpatient: { label: "عيادات خارجية", color: "var(--chart-1)" },
  inpatient: { label: "تنويم", color: "var(--chart-2)" },
} satisfies ChartConfig;

function PatientVisitsChart() {
  return (
    <ChartContainer config={visitsConfig} className="aspect-auto h-[280px] w-full">
      <AreaChart data={VISITS} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillOutpatient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillInpatient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          reversed
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={24}
          interval="preserveStartEnd"
        />
        <YAxis
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={36}
          domain={[0, "dataMax + 120"]}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Area
          dataKey="outpatient"
          type="monotone"
          fill="url(#fillOutpatient)"
          stroke="var(--chart-1)"
          strokeWidth={2}
          stackId="v"
        />
        <Area
          dataKey="inpatient"
          type="monotone"
          fill="url(#fillInpatient)"
          stroke="var(--chart-2)"
          strokeWidth={2}
          stackId="v"
        />
      </AreaChart>
    </ChartContainer>
  );
}

const deptConfig = {
  appts: { label: "المواعيد" },
} satisfies ChartConfig;

function DepartmentBarChart() {
  const data = DEPARTMENTS.map((d) => ({ dept: d.name, appts: d.appts, fill: d.color }));
  return (
    <ChartContainer config={deptConfig} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 4, top: 4 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis
          reversed type="number" hide />
        <YAxis
          orientation="right"
          type="category"
          dataKey="dept"
          tickLine={false}
          axisLine={false}
          width={82}
          tickMargin={4}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="appts" radius={5} barSize={22}>
          {data.map((d) => (
            <Cell key={d.dept} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// --- page ------------------------------------------------------------------

export default function HealthcarePage() {
  const [appointments, setAppointments] = useState<Appointment[]>(SEED_APPOINTMENTS);

  const [open, setOpen] = useState(false);
  const [patient, setPatient] = useState("");
  const [dept, setDept] = useState("أمراض القلب");
  const [date, setDate] = useState("2026-07-22");
  const [time, setTime] = useState("09:30");
  const nextId = useRef(2049);

  const stats = useMemo(() => {
    const added = appointments.length - SEED_APPOINTMENTS.length;
    return [
      {
        label: "مرضى اليوم",
        value: "148",
        change: 6.2,
        trend: "up" as const,
        hint: "مقابل 139 أمس",
      },
      {
        label: "المواعيد",
        value: String(72 + added),
        change: 3.1,
        trend: "up" as const,
        hint: "مجدولة اليوم",
      },
      {
        label: "إشغال الأسرّة",
        value: "84%",
        change: 2.4,
        trend: "down" as const,
        hint: "212 سريراً من 252",
      },
      {
        label: "الإيرادات",
        value: "486 ألف ر.س",
        change: 9.4,
        trend: "up" as const,
        hint: "يوليو 2026، حتى تاريخه",
      },
    ];
  }, [appointments.length]);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = patient.trim();
    if (!name) {
      toast.error("أدخل اسم المريض للمتابعة");
      return;
    }
    if (!date || !time) {
      toast.error("اختر تاريخ الزيارة ووقتها");
      return;
    }
    const appt: Appointment = {
      id: `AP-${nextId.current++}`,
      patient: name,
      avatar: avatar((name.charCodeAt(0) + name.length * 7) % 70),
      doctor: DEPT_DOCTOR[dept] ?? "د. عمر الهاشمي",
      department: dept,
      date: formatDate(date),
      time: formatTime(time),
      status: "مؤكّد",
    };
    setAppointments((prev) => [appt, ...prev]);
    setOpen(false);
    setPatient("");
    toast.success("تم حجز الموعد", {
      description: `${name} مع ${appt.doctor} يوم ${appt.date} الساعة ${appt.time}.`,
    });
  }

  const totalAppts = DEPARTMENTS.reduce((s, d) => s + d.appts, 0);
  const onCall = STAFF.filter((s) => s.onCall).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الرعاية الصحية"
        description="المرضى والمواعيد وعمليات العيادة في لمحة واحدة."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.success("بدأ التصدير", {
              description: "سيبدأ تنزيل تقرير العيادة بعد قليل.",
            })
          }
        >
          <IconDownload className="size-4" /> تصدير
        </Button>
        <Button size="sm" onClick={() => setOpen(true)}>
          <IconPlus className="size-4" /> موعد جديد
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>زيارات المرضى</CardTitle>
            <CardDescription>حجم العيادات الخارجية والتنويم خلال آخر 12 أسبوعاً</CardDescription>
            <CardAction>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} />
                  عيادات خارجية
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: "var(--chart-2)" }} />
                  تنويم
                </span>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <PatientVisitsChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المواعيد حسب القسم</CardTitle>
            <CardDescription>
              <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
                {totalAppts}
              </span>{" "}
              booked this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentBarChart />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>المواعيد القادمة</CardTitle>
            <CardDescription>الزيارات القادمة في جميع الأقسام</CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  toast.success("تم تحديث الجدول", {
                    description: "تُعرض أحدث الحجوزات.",
                  })
                }
              >
                <IconRefresh className="size-4" /> تحديث
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">المريض</TableHead>
                  <TableHead>الطبيب</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>التاريخ والوقت</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="ps-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={a.avatar} alt={a.patient} />
                          <AvatarFallback>{a.patient.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium whitespace-nowrap">{a.patient}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{a.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {a.doctor}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{a.department}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      <span className="font-medium">{a.date}</span>
                      <span className="text-muted-foreground"> · {a.time}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={STATUS_CLS[a.status]}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pe-6 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="size-4" />
                            <span className="sr-only">{a.patient} actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              toast("جارٍ فتح ملف المريض", {
                                description: `${a.patient} · ${a.department}`,
                              })
                            }
                          >
                            <IconEye className="size-4" /> عرض
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              toast.success("تم طلب إعادة الجدولة", {
                                description: `سنراسل ${a.patient} بمواعيد جديدة.`,
                              })
                            }
                          >
                            <IconCalendarEvent className="size-4" /> إعادة جدولة
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              toast("تم إلغاء الموعد", {
                                description: `أُزيل ${a.id} من الجدول.`,
                              })
                            }
                          >
                            <IconX className="size-4" /> إلغاء الزيارة
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
              <CardTitle>الكادر المناوب</CardTitle>
              <CardDescription>{onCall} clinicians on call right now</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0.5">
              {STAFF.map((s) => (
                <div
                  key={s.name}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={avatar(s.seed)} alt={s.name} />
                    <AvatarFallback>{s.name.slice(4, 6)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <IconStethoscope className="size-3.5" /> {s.specialty}
                    </p>
                  </div>
                  {s.onCall ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      <IconPhoneCall className="size-3" /> مناوب
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-slate-500/10 text-slate-600 dark:text-slate-400"
                    >
                      متاح
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إشغال الأقسام</CardTitle>
              <CardDescription>نسبة استغلال الطاقة الاستيعابية حالياً</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DEPARTMENTS.map((d) => (
                <div key={d.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span
                      className={`font-medium tabular-nums ${
                        d.load >= 85
                          ? "text-rose-600 dark:text-rose-400"
                          : d.load >= 70
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                      }`}
                    >
                      {d.load}%
                    </span>
                  </div>
                  <Progress value={d.load} className="h-1.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New appointment dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>موعد جديد</DialogTitle>
              <DialogDescription>
                احجز موعداً للمريض في جدول العيادة، ويُسنَد الطبيب تلقائياً حسب
                القسم.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="appt-patient">اسم المريض</Label>
                <div className="relative">
                  <IconUserPlus className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="appt-patient"
                    value={patient}
                    onChange={(e) => setPatient(e.target.value)}
                    placeholder="مثال: سعد المري"
                    className="ps-9"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appt-dept">القسم</Label>
                <Select value={dept} onValueChange={setDept}>
                  <SelectTrigger id="appt-dept" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        <span className="size-2.5 rounded-full" style={{ background: d.color }} />
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assigned to {DEPT_DOCTOR[dept]}.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appt-date">التاريخ</Label>
                  <div className="relative">
                    <IconCalendarEvent className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="appt-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appt-time">الوقت</Label>
                  <div className="relative">
                    <IconClock className="absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="appt-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="ps-9"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  إلغاء
                </Button>
              </DialogClose>
              <Button type="submit">
                <IconCalendarEvent className="size-4" /> حجز موعد
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
