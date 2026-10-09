"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  IconArrowUpRight,
  IconDownload,
  IconPlus,
  IconDotsVertical,
  IconRefresh,
  IconPhoto,
  IconReportAnalytics,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart";
import { CategoryBarChart } from "@/components/charts/category-bar-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ecommerceStats, orders, topProducts } from "@/data";
import { formatCurrency, formatNumber } from "@/lib/format";

function ChartMenu({ title }: { title: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconDotsVertical className="size-4" />
          <span className="sr-only">خيارات {title}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() =>
            toast.success(`تم تحديث ${title}`, {
              description: "تُعرض أحدث البيانات المتاحة.",
            })
          }
        >
          <IconRefresh className="size-4" /> تحديث
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            toast.success("تم تصدير المخطط", {
              description: `حُفظ ${title} كصورة PNG.`,
            })
          }
        >
          <IconPhoto className="size-4" /> تنزيل صورة PNG
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            toast("جارٍ فتح التقرير الكامل", {
              description: `يجري إعداد تقرير مفصّل عن ${title}.`,
            })
          }
        >
          <IconReportAnalytics className="size-4" /> عرض التقرير الكامل
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const funnel = [
  { label: "الزيارات", value: 94271, pct: 100 },
  { label: "مشاهدات المنتجات", value: 41800, pct: 44 },
  { label: "الإضافة للسلة", value: 12640, pct: 13 },
  { label: "إتمام الشراء", value: 4820, pct: 5 },
  { label: "الشراء", value: 3210, pct: 3 },
];

export default function EcommercePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="التجارة الإلكترونية"
        description="أداء المتجر والمبيعات والتنفيذ في لمحة واحدة."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.success("تم التصدير إلى CSV", {
              description: "جارٍ تنزيل تقرير المتجر.",
            })
          }
        >
          <IconDownload className="size-4" /> تصدير
        </Button>
        <Button size="sm" asChild>
          <Link href="/products/new">
            <IconPlus className="size-4" /> إضافة منتج
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ecommerceStats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الإيرادات والأرباح</CardTitle>
            <CardDescription>الأداء الشهري خلال العام الماضي</CardDescription>
            <CardAction>
              <ChartMenu title="الإيرادات والأرباح" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>المبيعات حسب الفئة</CardTitle>
            <CardDescription>حصة كل فئة من إيرادات هذا الشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarChart />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>أحدث الطلبات</CardTitle>
            <CardDescription>آخر المعاملات في متجرك</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders">
                  عرض الكل <IconArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="pe-6 text-end">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 7).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="ps-6 font-medium tabular-nums">
                      {o.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarImage src={o.avatar} alt={o.customer} />
                          <AvatarFallback>{o.customer.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">{o.customer}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="pe-6 text-end font-medium tabular-nums">
                      ${o.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أفضل المنتجات</CardTitle>
            <CardDescription>الأكثر مبيعاً حسب الإيرادات هذا الشهر</CardDescription>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {topProducts
              .map((p) => ({ ...p, revenue: p.price * p.sold }))
              .sort((a, b) => b.revenue - a.revenue)
              .map((p, i) => {
              const trend = [18.2, 12.4, 9.6, 6.1, 4.3][i] ?? 3;
              return (
                <div
                  key={p.id}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  <span className="w-4 shrink-0 text-center text-sm font-medium text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    width={40}
                    height={40}
                    className="size-10 shrink-0 rounded-md border bg-muted object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.category} · {formatNumber(p.sold)} مبيعة
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(p.revenue)}
                    </p>
                    <p className="text-xs font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
                      +{trend}%
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>مسار التحويل</CardTitle>
          <CardDescription>
            من أول زيارة حتى إتمام الشراء هذا الشهر
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {funnel.map((f) => (
            <div
              key={f.label}
              className="rounded-lg border bg-card p-4"
            >
              <p className="text-sm text-muted-foreground">{f.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                {formatNumber(f.value)}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Progress value={f.pct} className="h-1.5" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {f.pct}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "مدفوع": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "معلق": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "مسترد": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    "فاشل": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };
  return (
    <Badge variant="secondary" className={map[status]}>
      {status}
    </Badge>
  );
}
