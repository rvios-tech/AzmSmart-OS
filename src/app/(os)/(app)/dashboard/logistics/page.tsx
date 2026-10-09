"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Label as ChartLabel,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconPlus,
  IconDownload,
  IconTruck,
  IconTruckDelivery,
  IconRoute,
  IconDotsVertical,
  IconArrowNarrowRight,
  IconCurrentLocation,
  IconRefresh,
  IconClockHour4,
  IconPackage,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber } from "@/lib/format";

// --- types & fake data (inline, deterministic) -----------------------------

type ShipmentStatus =
  | "قيد النقل"
  | "تم التسليم"
  | "متأخرة"
  | "قيد الانتظار"
  | "مرتجعة";

type Shipment = {
  id: string;
  origin: string;
  destination: string;
  driver: string;
  seed: number;
  status: ShipmentStatus;
  eta: string;
};

type FleetStatus = "متاحة" | "في الطريق" | "في الصيانة";

type Vehicle = {
  id: string;
  type: "شاحنة" | "فان" | "مقطورة";
  driver: string;
  status: FleetStatus;
};

const DRIVERS = [
  { name: "ماجد الحربي", seed: 11 },
  { name: "نورة المطيري", seed: 24 },
  { name: "عبدالله الشمري", seed: 32 },
  { name: "سارة الراشدي", seed: 41 },
  { name: "فيصل الغامدي", seed: 8 },
  { name: "هند الزهراني", seed: 15 },
  { name: "خالد القحطاني", seed: 12 },
  { name: "ريم الدوسري", seed: 47 },
];

const seedFor = (name: string) =>
  DRIVERS.find((d) => d.name === name)?.seed ?? 1;

const INITIAL_SHIPMENTS: Shipment[] = [
  { id: "SHP-4821", origin: "الرياض", destination: "الدمام", driver: "ماجد الحربي", seed: 11, status: "قيد النقل", eta: "18 يوليو 2026" },
  { id: "SHP-4822", origin: "جدة", destination: "مكة المكرمة", driver: "نورة المطيري", seed: 24, status: "تم التسليم", eta: "16 يوليو 2026" },
  { id: "SHP-4823", origin: "دبي", destination: "أبوظبي", driver: "عبدالله الشمري", seed: 32, status: "متأخرة", eta: "19 يوليو 2026" },
  { id: "SHP-4824", origin: "الدوحة", destination: "المنامة", driver: "سارة الراشدي", seed: 41, status: "قيد النقل", eta: "20 يوليو 2026" },
  { id: "SHP-4825", origin: "الكويت", destination: "الرياض", driver: "فيصل الغامدي", seed: 8, status: "قيد الانتظار", eta: "21 يوليو 2026" },
  { id: "SHP-4826", origin: "مسقط", destination: "صلالة", driver: "هند الزهراني", seed: 15, status: "قيد النقل", eta: "18 يوليو 2026" },
  { id: "SHP-4827", origin: "الشارقة", destination: "العين", driver: "خالد القحطاني", seed: 12, status: "مرتجعة", eta: "15 يوليو 2026" },
  { id: "SHP-4828", origin: "المدينة المنورة", destination: "ينبع", driver: "ريم الدوسري", seed: 47, status: "تم التسليم", eta: "17 يوليو 2026" },
];

const FLEET: Vehicle[] = [
  { id: "TRK-12", type: "شاحنة", driver: "ماجد الحربي", status: "في الطريق" },
  { id: "VAN-07", type: "فان", driver: "نورة المطيري", status: "متاحة" },
  { id: "SEM-21", type: "مقطورة", driver: "عبدالله الشمري", status: "في الطريق" },
  { id: "TRK-33", type: "شاحنة", driver: "سارة الراشدي", status: "في الصيانة" },
  { id: "VAN-18", type: "فان", driver: "فيصل الغامدي", status: "متاحة" },
  { id: "SEM-09", type: "مقطورة", driver: "هند الزهراني", status: "في الطريق" },
];

const TOP_ROUTES = [
  { from: "الرياض", to: "الدمام", loads: 428, pct: 92 },
  { from: "جدة", to: "مكة المكرمة", loads: 356, pct: 78 },
  { from: "دبي", to: "أبوظبي", loads: 312, pct: 68 },
  { from: "الدوحة", to: "المنامة", loads: 274, pct: 60 },
  { from: "مسقط", to: "صلالة", loads: 198, pct: 44 },
];

const DELIVERIES = [
  { day: "10 يوليو", delivered: 182, delayed: 14 },
  { day: "11 يوليو", delivered: 196, delayed: 11 },
  { day: "12 يوليو", delivered: 168, delayed: 18 },
  { day: "13 يوليو", delivered: 204, delayed: 9 },
  { day: "14 يوليو", delivered: 221, delayed: 12 },
  { day: "15 يوليو", delivered: 210, delayed: 16 },
  { day: "16 يوليو", delivered: 234, delayed: 8 },
  { day: "17 يوليو", delivered: 248, delayed: 13 },
];

const STATUS_BREAKDOWN = [
  { status: "قيد النقل", count: 486, fill: "var(--chart-1)" },
  { status: "تم التسليم", count: 612, fill: "var(--chart-2)" },
  { status: "متأخرة", count: 74, fill: "var(--chart-3)" },
  { status: "قيد الانتظار", count: 92, fill: "var(--chart-4)" },
  { status: "مرتجعة", count: 20, fill: "var(--chart-5)" },
];

const STATS = [
  { label: "الشحنات النشطة", value: "1,284", change: 4.2, trend: "up" as const, hint: "18 شحنة أُرسلت اليوم" },
  { label: "التسليم في الموعد", value: "94.6%", change: 1.8, trend: "up" as const, hint: "مقابل 92.8% الشهر الماضي" },
  { label: "استغلال الأسطول", value: "82%", change: 3.1, trend: "up" as const, hint: "142 مركبة نشطة من 173" },
  { label: "تكلفة الوقود", value: "48,920 ر.س", change: 2.4, trend: "down" as const, hint: "بمتوسط 2.33 ر.س لكل لتر · يوليو" },
];

const shipmentBadge: Record<ShipmentStatus, string> = {
  "قيد النقل": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "تم التسليم": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "متأخرة": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "قيد الانتظار": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "مرتجعة": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const fleetBadge: Record<FleetStatus, { cls: string; dot: string }> = {
  "متاحة": { cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  "في الطريق": { cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400", dot: "bg-sky-500" },
  "في الصيانة": { cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
};

const vehicleIcon: Record<Vehicle["type"], typeof IconTruck> = {
  "شاحنة": IconTruck,
  "فان": IconTruckDelivery,
  "مقطورة": IconPackage,
};

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function formatEta(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const deliveriesConfig = {
  delivered: { label: "تم التسليم", color: "var(--chart-1)" },
  delayed: { label: "متأخرة", color: "var(--chart-3)" },
} satisfies ChartConfig;

const statusConfig = {
  count: { label: "الشحنات" },
  "قيد النقل": { label: "قيد النقل", color: "var(--chart-1)" },
  "تم التسليم": { label: "تم التسليم", color: "var(--chart-2)" },
  "متأخرة": { label: "متأخرة", color: "var(--chart-3)" },
  "قيد الانتظار": { label: "قيد الانتظار", color: "var(--chart-4)" },
  "مرتجعة": { label: "مرتجعة", color: "var(--chart-5)" },
} satisfies ChartConfig;

// --- inline charts ---------------------------------------------------------

function DeliveriesChart() {
  return (
    <ChartContainer config={deliveriesConfig} className="aspect-auto h-[280px] w-full">
      <AreaChart data={DELIVERIES} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="fillDelivered" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="fillDelayed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          reversed dataKey="day" tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} />
        <YAxis
          orientation="right" tickLine={false} axisLine={false} tickMargin={8} width={36} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Area dataKey="delivered" type="monotone" fill="url(#fillDelivered)" stroke="var(--chart-1)" strokeWidth={2} stackId="a" />
        <Area dataKey="delayed" type="monotone" fill="url(#fillDelayed)" stroke="var(--chart-3)" strokeWidth={2} stackId="a" />
      </AreaChart>
    </ChartContainer>
  );
}

function StatusDonut({ total }: { total: number }) {
  return (
    <ChartContainer config={statusConfig} className="mx-auto aspect-square h-[220px]">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel formatter={(v, name) => `${name}  ${formatNumber(Number(v))}`} />}
        />
        <Pie data={STATUS_BREAKDOWN} dataKey="count" nameKey="status" innerRadius={62} strokeWidth={4} paddingAngle={2}>
          <ChartLabel
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-semibold">
                      {formatNumber(total)}
                    </tspan>
                    <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-xs">
                      الشحنات
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

// --- page ------------------------------------------------------------------

export default function LogisticsPage() {
  const [shipments, setShipments] = useState<Shipment[]>(INITIAL_SHIPMENTS);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [driver, setDriver] = useState("");
  const [eta, setEta] = useState("2026-07-24");
  const nextId = useRef(4829);

  const statusTotal = useMemo(
    () => STATUS_BREAKDOWN.reduce((s, r) => s + r.count, 0),
    []
  );

  function resetForm() {
    setOrigin("");
    setDestination("");
    setDriver("");
    setEta("2026-07-24");
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const from = origin.trim();
    const to = destination.trim();
    if (!from || !to) return toast.error("أدخل نقطة الانطلاق والوجهة");
    if (!driver) return toast.error("أسند سائقاً للمتابعة");
    const ship: Shipment = {
      id: `SHP-${nextId.current++}`,
      origin: from,
      destination: to,
      driver,
      seed: seedFor(driver),
      status: "قيد الانتظار",
      eta: formatEta(eta),
    };
    setShipments((prev) => [ship, ...prev]);
    setOpen(false);
    resetForm();
    toast.success("تم إنشاء الشحنة", {
      description: `${ship.id} · من ${from} إلى ${to}، وأُسندت إلى ${driver}.`,
    });
  }

  function handleExport() {
    toast.success("بدأ التصدير", {
      description: `يجري تجهيز ${shipments.length} شحنة في ملف CSV.`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="اللوجستيك"
        description="الشحنات والأسطول وأداء التسليم لحظة بلحظة."
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" /> تصدير
        </Button>
        <Button size="sm" onClick={() => setOpen(true)}>
          <IconPlus className="size-4" /> شحنة جديدة
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
            <CardTitle>عمليات التسليم</CardTitle>
            <CardDescription>المسلَّم مقابل المتأخر خلال آخر 8 أيام</CardDescription>
            <CardAction>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
                  تم التسليم
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-3)" }} />
                  متأخرة
                </span>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <DeliveriesChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حالة الشحنات</CardTitle>
            <CardDescription>توزيع الشحنات النشطة على مستوى الأسطول</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusDonut total={statusTotal} />
            <div className="space-y-2.5">
              {STATUS_BREAKDOWN.map((r) => (
                <div key={r.status} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.fill }} />
                  <span className="font-medium">{r.status}</span>
                  <span className="ms-auto text-muted-foreground tabular-nums">
                    {((r.count / statusTotal) * 100).toFixed(1)}%
                  </span>
                  <span className="w-12 text-end font-medium tabular-nums">
                    {formatNumber(r.count)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الشحنات النشطة</CardTitle>
          <CardDescription>الحمولات الجارية عبر الشبكة</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toast.success("تم تحديث الشحنات", {
                  description: "تُعرض أحدث بيانات التتبّع.",
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
                <TableHead className="ps-6">الشحنة</TableHead>
                <TableHead>المسار</TableHead>
                <TableHead>السائق</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الوصول المتوقع</TableHead>
                <TableHead className="pe-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shipments.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="ps-6 font-medium tabular-nums whitespace-nowrap">
                    {s.id}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="font-medium">{s.origin}</span>
                      <IconArrowNarrowRight className="size-4 shrink-0 text-muted-foreground" />
                      <span className="font-medium">{s.destination}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${s.seed}`}
                          alt={s.driver}
                        />
                        <AvatarFallback>{initials(s.driver)}</AvatarFallback>
                      </Avatar>
                      <span className="whitespace-nowrap">{s.driver}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={shipmentBadge[s.status]}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums whitespace-nowrap">
                    {s.eta}
                  </TableCell>
                  <TableCell className="pe-6 text-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDotsVertical className="size-4" />
                          <span className="sr-only">{s.id} actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{s.id}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            toast(`Tracking ${s.id}`, {
                              description: `${s.origin} to ${s.destination} · ETA ${s.eta}.`,
                            })
                          }
                        >
                          <IconCurrentLocation className="size-4" /> تتبّع
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            toast.success("تم طلب تحديث الحالة", {
                              description: `تم تنبيه السائق ${s.driver} بخصوص ${s.id}.`,
                            })
                          }
                        >
                          <IconRefresh className="size-4" /> تحديث الحالة
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>حالة الأسطول</CardTitle>
            <CardDescription>المركبات والسائقون المسندون</CardDescription>
            <CardAction>
              <Badge variant="secondary" className="bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {FLEET.filter((v) => v.status === "في الطريق").length} في الطريق
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-1">
            {FLEET.map((v) => {
              const VIcon = vehicleIcon[v.type];
              const badge = fleetBadge[v.status];
              return (
                <div
                  key={v.id}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <VIcon className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium tabular-nums">
                      {v.id}
                      <span className="ms-2 text-xs font-normal text-muted-foreground">
                        {v.type}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{v.driver}</p>
                  </div>
                  <Badge variant="secondary" className={`gap-1.5 ${badge.cls}`}>
                    <span className={`size-1.5 rounded-full ${badge.dot}`} />
                    {v.status}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أكثر المسارات ازدحاماً</CardTitle>
            <CardDescription>حسب حجم الحمولة هذا الشهر</CardDescription>
            <CardAction>
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconRoute className="size-4.5" />
              </span>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {TOP_ROUTES.map((r) => (
              <div key={`${r.from}-${r.to}`} className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium">{r.from}</span>
                  <IconArrowNarrowRight className="size-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium">{r.to}</span>
                  <span className="ms-auto text-muted-foreground tabular-nums">
                    {formatNumber(r.loads)} حمولة
                  </span>
                </div>
                <Progress value={r.pct} className="h-1.5" />
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <IconClockHour4 className="size-4" /> متوسط زمن النقل
              </span>
              <span className="font-medium tabular-nums">2.4 يوم</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New shipment dialog */}
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>شحنة جديدة</DialogTitle>
              <DialogDescription>
                أنشئ حمولة وأسندها إلى سائق متاح.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ship-origin">نقطة الانطلاق</Label>
                  <Input
                    id="ship-origin"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="الرياض"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ship-destination">الوجهة</Label>
                  <Input
                    id="ship-destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="الدمام"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-driver">السائق</Label>
                <Select value={driver} onValueChange={setDriver}>
                  <SelectTrigger id="ship-driver" className="w-full">
                    <SelectValue placeholder="أسند سائقاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRIVERS.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        <Avatar className="size-5">
                          <AvatarImage
                            src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${d.seed}`}
                            alt={d.name}
                          />
                          <AvatarFallback>{initials(d.name)}</AvatarFallback>
                        </Avatar>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ship-eta">موعد الوصول المتوقع</Label>
                <Input
                  id="ship-eta"
                  type="date"
                  value={eta}
                  min="2026-07-17"
                  onChange={(e) => setEta(e.target.value)}
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
                <IconTruckDelivery className="size-4" /> إنشاء شحنة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
