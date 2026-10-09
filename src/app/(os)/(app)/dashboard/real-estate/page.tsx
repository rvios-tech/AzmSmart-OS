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
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconBed,
  IconBath,
  IconMapPin,
  IconCalendarEvent,
  IconClock,
  IconRefresh,
  IconTrophy,
  IconArrowUpRight,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Separator } from "@/components/ui/separator";
import { formatCompact, formatCompactCurrency, formatCurrency } from "@/lib/format";

// --- types -----------------------------------------------------------------

type PropertyType = "فيلا" | "شقة" | "دور" | "تاون هاوس" | "أرض";
type ListingStatus = "معروض للبيع" | "قيد التفاوض" | "مُباع" | "قيد الانتظار";

type Listing = {
  id: string;
  address: string;
  city: string;
  type: PropertyType;
  price: number;
  status: ListingStatus;
  agent: string;
  beds: number;
  baths: number;
  seed: string;
};

type Agent = {
  name: string;
  seed: string;
  deals: number;
  volume: number;
};

type Viewing = {
  id: string;
  property: string;
  client: string;
  date: string;
  time: string;
};

// --- inline demo data (deterministic) --------------------------------------

const PROPERTY_TYPES: PropertyType[] = [
  "فيلا",
  "شقة",
  "دور",
  "تاون هاوس",
  "أرض",
];

const AGENTS: Agent[] = [
  { name: "ريم الدوسري", seed: "Reem", deals: 24, volume: 18_420_000 },
  { name: "خالد القحطاني", seed: "Khalid", deals: 19, volume: 14_180_000 },
  { name: "سارة الراشدي", seed: "Sara", deals: 17, volume: 12_760_000 },
  { name: "ماجد الحربي", seed: "Majed", deals: 14, volume: 9_640_000 },
  { name: "منى الكعبي", seed: "Mona", deals: 11, volume: 7_910_000 },
  { name: "يوسف العتيبي", seed: "Yousef", deals: 9, volume: 6_120_000 },
];

const INITIAL_LISTINGS: Listing[] = [
  { id: "L-1042", address: "فيلا 128، حي الياسمين", city: "الرياض", type: "فيلا", price: 845_000, status: "معروض للبيع", agent: "ريم الدوسري", beds: 4, baths: 3, seed: "Maple" },
  { id: "L-1043", address: "شقة 42، برج الواجهة البحرية", city: "جدة", type: "شقة", price: 612_000, status: "قيد التفاوض", agent: "خالد القحطاني", beds: 2, baths: 2, seed: "Harbor" },
  { id: "L-1044", address: "فيلا 7، حي النرجس", city: "الرياض", type: "فيلا", price: 1_240_000, status: "معروض للبيع", agent: "سارة الراشدي", beds: 5, baths: 4, seed: "Birch" },
  { id: "L-1045", address: "دور 12، أبراج الغروب", city: "الدمام", type: "دور", price: 498_000, status: "قيد الانتظار", agent: "ماجد الحربي", beds: 2, baths: 2, seed: "Sunset" },
  { id: "L-1046", address: "تاون هاوس 19، مجمّع البستان", city: "دبي", type: "تاون هاوس", price: 735_000, status: "مُباع", agent: "منى الكعبي", beds: 3, baths: 3, seed: "Oak" },
  { id: "L-1047", address: "قطعة 8، مخطط الروابي", city: "الخبر", type: "أرض", price: 265_000, status: "معروض للبيع", agent: "يوسف العتيبي", beds: 0, baths: 0, seed: "Cedar" },
  { id: "L-1048", address: "فيلا 214، حي الملقا", city: "الرياض", type: "فيلا", price: 689_000, status: "قيد التفاوض", agent: "ريم الدوسري", beds: 4, baths: 2, seed: "Willow" },
  { id: "L-1049", address: "شقة 5ب، مرسى الخليج", city: "أبوظبي", type: "شقة", price: 920_000, status: "معروض للبيع", agent: "خالد القحطاني", beds: 3, baths: 2, seed: "Marina" },
  { id: "L-1050", address: "دور 51، حي الشاطئ", city: "المنامة", type: "دور", price: 410_000, status: "مُباع", agent: "سارة الراشدي", beds: 1, baths: 1, seed: "Aspen" },
];

const INITIAL_VIEWINGS: Viewing[] = [
  { id: "V-1", property: "فيلا 128، حي الياسمين", client: "دانة النعيمي", date: "18 يوليو 2026", time: "10:00 ص" },
  { id: "V-2", property: "شقة 42، برج الواجهة البحرية", client: "سعد المري", date: "18 يوليو 2026", time: "2:30 م" },
  { id: "V-3", property: "فيلا 7، حي النرجس", client: "نورة المطيري", date: "19 يوليو 2026", time: "11:15 ص" },
  { id: "V-4", property: "شقة 5ب، مرسى الخليج", client: "علي الجابري", date: "20 يوليو 2026", time: "4:00 م" },
  { id: "V-5", property: "فيلا 214، حي الملقا", client: "لمى الفلاسي", date: "21 يوليو 2026", time: "9:30 ص" },
];

// Sales volume closed per month across 2026 (dollars).
const SALES_VOLUME = [
  { month: "يناير", value: 2_140_000 },
  { month: "فبراير", value: 2_580_000 },
  { month: "مارس", value: 3_120_000 },
  { month: "أبريل", value: 2_860_000 },
  { month: "مايو", value: 3_610_000 },
  { month: "يونيو", value: 4_240_000 },
  { month: "يوليو", value: 3_920_000 },
];

const TYPE_COLORS: Record<PropertyType, string> = {
  "فيلا": "var(--chart-1)",
  "شقة": "var(--chart-2)",
  "دور": "var(--chart-3)",
  "تاون هاوس": "var(--chart-4)",
  "أرض": "var(--chart-5)",
};

const STATUS_BADGE: Record<ListingStatus, string> = {
  "معروض للبيع": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "قيد التفاوض": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "قيد الانتظار": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  "مُباع": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

// أعداد الغرف الافتراضية لأي عرض جديد، بحسب نوع العقار.
const TYPE_DEFAULTS: Record<PropertyType, { beds: number; baths: number }> = {
  "فيلا": { beds: 3, baths: 2 },
  "شقة": { beds: 2, baths: 1 },
  "دور": { beds: 1, baths: 1 },
  "تاون هاوس": { beds: 3, baths: 2 },
  "أرض": { beds: 0, baths: 0 },
};

// --- دوال مساعدة -----------------------------------------------------------

const salesConfig = {
  value: { label: "المبيعات", color: "var(--chart-1)" },
} satisfies ChartConfig;

const typeConfig = {
  value: { label: "العروض" },
} satisfies ChartConfig;

const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
const propertyUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`;

const fmtFull = (n: number) => formatCurrency(Math.round(n));
const fmtCompact = (n: number) => formatCompactCurrency(n);

// --- page ------------------------------------------------------------------

export default function RealEstatePage() {
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [addOpen, setAddOpen] = useState(false);

  const [address, setAddress] = useState("");
  const [ptype, setPtype] = useState<PropertyType>("فيلا");
  const [price, setPrice] = useState("");
  const [agent, setAgent] = useState<string>(AGENTS[0].name);

  const nextId = useRef(1);

  const activeCount = useMemo(
    () => listings.filter((l) => l.status === "معروض للبيع").length,
    [listings]
  );
  const underOfferCount = useMemo(
    () => listings.filter((l) => l.status === "قيد التفاوض").length,
    [listings]
  );
  const avgPrice = useMemo(
    () =>
      listings.length
        ? listings.reduce((s, l) => s + l.price, 0) / listings.length
        : 0,
    [listings]
  );

  const salesThisMonth = SALES_VOLUME[SALES_VOLUME.length - 1].value;

  const typeBreakdown = useMemo(
    () =>
      PROPERTY_TYPES.map((t) => ({
        name: t,
        value: listings.filter((l) => l.type === t).length,
        fill: TYPE_COLORS[t],
      })).filter((d) => d.value > 0),
    [listings]
  );

  const stats = [
    {
      label: "العروض النشطة",
      value: String(activeCount),
      change: 6.4,
      trend: "up" as const,
      hint: "معروضة حالياً في السوق",
    },
    {
      label: "قيد التفاوض",
      value: String(underOfferCount),
      change: 3.1,
      trend: "up" as const,
      hint: "قيد التفاوض حالياً",
    },
    {
      label: "متوسط السعر",
      value: fmtCompact(avgPrice),
      change: 2.8,
      trend: "up" as const,
      hint: "لجميع العروض",
    },
    {
      label: "المبيعات (هذا الشهر)",
      value: fmtCompact(salesThisMonth),
      change: 11.2,
      trend: "up" as const,
      hint: "يوليو 2026",
    },
  ];

  const agentByName = useMemo(
    () => Object.fromEntries(AGENTS.map((a) => [a.name, a])),
    []
  );

  function openAdd() {
    setAddress("");
    setPtype("فيلا");
    setPrice("");
    setAgent(AGENTS[0].name);
    setAddOpen(true);
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const addr = address.trim();
    const value = Math.max(0, Number(price) || 0);
    if (!addr) return toast.error("أدخل عنوان العقار");
    if (value <= 0) return toast.error("أدخل السعر المطلوب");
    const defaults = TYPE_DEFAULTS[ptype];
    const listing: Listing = {
      id: `L-N${nextId.current++}`,
      address: addr,
      city: "عرض جديد",
      type: ptype,
      price: value,
      status: "معروض للبيع",
      agent,
      beds: defaults.beds,
      baths: defaults.baths,
      seed: addr.replace(/\s+/g, "-").slice(0, 24) || "new",
    };
    setListings((prev) => [listing, ...prev]);
    setAddOpen(false);
    toast.success("تمت إضافة العرض", {
      description: `عُرض ${addr} بسعر ${fmtFull(value)}.`,
    });
  }

  function handleExport() {
    toast.success("بدأ التصدير", {
      description: `يجري تجهيز ${listings.length} عرضاً في ملف CSV.`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="العقارات"
        description="العروض والصفقات وأداء الوسطاء."
      >
        <Button variant="outline" size="sm" onClick={handleExport}>
          <IconDownload className="size-4" /> تصدير
        </Button>
        <Button size="sm" onClick={openAdd}>
          <IconPlus className="size-4" /> إضافة عرض
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales volume trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>حجم المبيعات</CardTitle>
            <CardDescription>قيمة الصفقات المغلقة شهرياً خلال 2026</CardDescription>
            <CardAction>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                <IconArrowUpRight className="size-3.5" /> 11.2%
              </span>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={salesConfig}
              className="aspect-auto h-[280px] w-full"
            >
              <AreaChart data={SALES_VOLUME} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
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
                  width={48}
                  domain={[0, "dataMax + 500000"]}
                  tickFormatter={(v) => formatCompact(v)}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(v) => fmtFull(Number(v))}
                    />
                  }
                />
                <Area
                  dataKey="value"
                  type="monotone"
                  fill="url(#fillSales)"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Listings by type donut */}
        <Card>
          <CardHeader>
            <CardTitle>العروض حسب النوع</CardTitle>
            <CardDescription>توزيع المحفظة العقارية</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartContainer
              config={typeConfig}
              className="mx-auto aspect-square h-[220px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(v, name) =>
                        `${name}  ${v} listing${Number(v) === 1 ? "" : "s"}`
                      }
                    />
                  }
                />
                <Pie
                  data={typeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  strokeWidth={4}
                  paddingAngle={2}
                >
                  <ChartLabel
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-semibold"
                            >
                              {listings.length}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 20}
                              className="fill-muted-foreground text-xs"
                            >
                              العروض
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="space-y-2.5">
              {typeBreakdown.map((t) => (
                <div key={t.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.fill }}
                  />
                  <span className="font-medium">{t.name}</span>
                  <span className="ms-auto text-muted-foreground tabular-nums">
                    {((t.value / listings.length) * 100).toFixed(0)}%
                  </span>
                  <span className="w-8 text-end font-medium tabular-nums">
                    {t.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings table */}
      <Card>
        <CardHeader>
          <CardTitle>العروض</CardTitle>
          <CardDescription>{listings.length} properties on the books</CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                toast.success("تم تحديث العروض", {
                  description: "تُعرض أحدث بيانات السوق.",
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
                <TableHead className="ps-6">العقار</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead className="text-end">السعر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>الوسيط</TableHead>
                <TableHead className="text-end">غرف النوم / دورات المياه</TableHead>
                <TableHead className="pe-6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => {
                const ag = agentByName[l.agent];
                return (
                  <TableRow key={l.id}>
                    <TableCell className="ps-6">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={propertyUrl(l.seed)}
                          alt={l.address}
                          className="size-10 shrink-0 rounded-md border bg-muted object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium whitespace-nowrap">
                            {l.address}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                            <IconMapPin className="size-3" /> {l.city}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-slate-500/10 text-slate-600 dark:text-slate-400"
                      >
                        {l.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end font-medium tabular-nums whitespace-nowrap">
                      {fmtFull(l.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={STATUS_BADGE[l.status]}
                      >
                        {l.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          <AvatarImage
                            src={avatarUrl(ag?.seed ?? l.agent)}
                            alt={l.agent}
                          />
                          <AvatarFallback>{l.agent.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm whitespace-nowrap">
                          {l.agent}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-end tabular-nums whitespace-nowrap">
                      {l.type === "أرض" ? (
                        <span className="text-muted-foreground">n/a</span>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-2.5 text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <IconBed className="size-4" /> {l.beds}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <IconBath className="size-4" /> {l.baths}
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pe-6 text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="size-4" />
                            <span className="sr-only">{l.address} actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              toast("جارٍ فتح العرض", {
                                description: l.address,
                              })
                            }
                          >
                            <IconEye className="size-4" /> عرض
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              toast("تعديل العرض", {
                                description: `${l.address} · ${fmtFull(l.price)}`,
                              })
                            }
                          >
                            <IconPencil className="size-4" /> تعديل
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() =>
                              toast.success("تم جدولة المعاينة", {
                                description: `احجز معاينة لـ ${l.address}.`,
                              })
                            }
                          >
                            <IconCalendarEvent className="size-4" /> جدولة معاينة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top agents */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>أفضل الوسطاء</CardTitle>
            <CardDescription>مرتّبون حسب حجم الصفقات المغلقة هذا الربع</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {AGENTS.map((a, i) => (
              <div
                key={a.name}
                className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                    i === 0
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i === 0 ? <IconTrophy className="size-3.5" /> : i + 1}
                </span>
                <Avatar>
                  <AvatarImage src={avatarUrl(a.seed)} alt={a.name} />
                  <AvatarFallback>{a.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-muted-foreground tabular-nums">
                    {a.deals} deals closed
                  </p>
                </div>
                <span className="shrink-0 text-end text-sm font-medium tabular-nums">
                  {fmtCompact(a.volume)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming viewings */}
        <Card>
          <CardHeader>
            <CardTitle>المعاينات القادمة</CardTitle>
            <CardDescription>جولات المعاينة المجدولة</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {INITIAL_VIEWINGS.map((v, i) => (
              <div key={v.id}>
                {i > 0 && <Separator className="my-1" />}
                <button
                  type="button"
                  onClick={() =>
                    toast("تفاصيل المعاينة", {
                      description: `${v.property} · ${v.client}`,
                    })
                  }
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted/50"
                >
                  <span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-md border bg-muted/40 text-[10px] leading-none text-muted-foreground">
                    <IconCalendarEvent className="size-4 text-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{v.property}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.client}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-xs font-medium whitespace-nowrap">
                      {v.date}
                    </p>
                    <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground tabular-nums">
                      <IconClock className="size-3" /> {v.time}
                    </p>
                  </div>
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add listing dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>إضافة عرض</DialogTitle>
              <DialogDescription>
                اعرض عقاراً جديداً في السوق، وسيظهر بحالة «معروض للبيع».
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="add-address">العنوان</Label>
                <Input
                  id="add-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: فيلا 128، حي الياسمين"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-type">النوع</Label>
                  <Select
                    value={ptype}
                    onValueChange={(v) => setPtype(v as PropertyType)}
                  >
                    <SelectTrigger id="add-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-price">السعر (ر.س)</Label>
                  <Input
                    id="add-price"
                    type="number"
                    min={0}
                    step={1000}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="750000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-agent">وسيط العرض</Label>
                <Select value={agent} onValueChange={setAgent}>
                  <SelectTrigger id="add-agent" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((a) => (
                      <SelectItem key={a.name} value={a.name}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  إلغاء
                </Button>
              </DialogClose>
              <Button type="submit">
                <IconPlus className="size-4" /> إضافة عرض
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
