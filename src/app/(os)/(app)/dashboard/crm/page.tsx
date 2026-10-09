"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  IconDownload,
  IconPlus,
  IconDotsVertical,
  IconRefresh,
  IconPhoto,
  IconReportAnalytics,
  IconArrowRight,
  IconTrophy,
  IconTrash,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { RevenueAreaChart } from "@/components/charts/revenue-area-chart";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  customers,
  currentUser,
  recentActivity,
  type StatCard as StatCardType,
} from "@/data";
import { formatCurrency } from "@/lib/format";

const stats: StatCardType[] = [
  { label: "العملاء المحتملون", value: "1,284", change: 6.9, trend: "up", hint: "مقارنة بالشهر الماضي" },
  { label: "الصفقات المكسوبة", value: "342", change: 11.2, trend: "up", hint: "مقارنة بالشهر الماضي" },
  { label: "قيمة خط الصفقات", value: "1.42 مليون ر.س", change: 8.4, trend: "up", hint: "مقارنة بالشهر الماضي" },
  { label: "معدل الكسب", value: "26.6%", change: 1.7, trend: "down", hint: "مقارنة بالشهر الماضي" },
];

const stages = [
  { key: "Lead", label: "عميل محتمل", accent: "bg-slate-500" },
  { key: "Qualified", label: "مؤهّل", accent: "bg-sky-500" },
  { key: "Proposal", label: "عرض مقدَّم", accent: "bg-amber-500" },
  { key: "Won", label: "مكسوبة", accent: "bg-emerald-500" },
] as const;

type Stage = (typeof stages)[number]["key"];

type Deal = {
  id: string;
  company: string;
  owner: string;
  avatar: string;
  amount: number;
  stage: Stage;
};

// Derive initial deals from customers, distributed deterministically across stages.
const initialDeals: Deal[] = customers.slice(0, 24).map((c, i) => ({
  id: c.id,
  company: c.company,
  owner: c.name,
  avatar: c.avatar,
  amount: 4200 + ((i * 2137) % 82000),
  stage: stages[i % stages.length].key,
}));

function ChartMenu({ title }: { title: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <IconDotsVertical className="size-4" />
          <span className="sr-only">خيارات {title}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
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

export default function CrmPage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [addOpen, setAddOpen] = useState(false);
  const [addStage, setAddStage] = useState<Stage>("Lead");
  const nextId = useRef(1);

  const dealsForStage = (stage: Stage) => deals.filter((d) => d.stage === stage);
  const stageValue = (stage: Stage) =>
    dealsForStage(stage).reduce((a, d) => a + d.amount, 0);

  function openAdd(stage: Stage) {
    setAddStage(stage);
    setAddOpen(true);
  }

  function handleAddDeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const company = (data.get("company") as string)?.trim() || "شركة جديدة";
    const owner = (data.get("owner") as string)?.trim() || currentUser.name;
    const amount = Math.max(0, Math.round(Number(data.get("amount")) || 0));
    const stage = (data.get("stage") as Stage) || "Lead";
    const deal: Deal = {
      id: `DEAL-${nextId.current++}`,
      company,
      owner,
      avatar: currentUser.avatar,
      amount,
      stage,
    };
    setDeals((prev) => [deal, ...prev]);
    setAddOpen(false);
    toast.success("تمت إضافة الصفقة", {
      description: `${company} — أُضيف ${formatCurrency(amount)} إلى ${stage}.`,
    });
  }

  function moveForward(id: string) {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = stages.findIndex((s) => s.key === d.stage);
        if (idx >= stages.length - 1) {
          toast("الصفقة في المرحلة الأخيرة بالفعل", {
            description: `${d.company} في ${stages[idx].label}.`,
          });
          return d;
        }
        const next = stages[idx + 1];
        toast.success("تم نقل الصفقة", {
          description: `نُقلت ${d.company} إلى ${next.label}.`,
        });
        return { ...d, stage: next.key };
      })
    );
  }

  function markWon(id: string) {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (d.stage === "Won") {
          toast("الصفقة مكسوبة بالفعل", { description: d.company });
          return d;
        }
        toast.success("تم كسب الصفقة 🎉", {
          description: `${d.company} — ${formatCurrency(d.amount)}.`,
        });
        return { ...d, stage: "Won" };
      })
    );
  }

  function deleteDeal(id: string) {
    const deal = deals.find((d) => d.id === id);
    setDeals((prev) => prev.filter((d) => d.id !== id));
    if (deal) {
      toast.success("تمت إزالة الصفقة", { description: deal.company });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة العملاء"
        description="تابع العملاء المحتملين والصفقات وعلاقات العملاء."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            toast.success("تم التصدير إلى CSV", {
              description: "جارٍ تنزيل خط الصفقات.",
            })
          }
        >
          <IconDownload className="size-4" /> تصدير
        </Button>
        <Button size="sm" onClick={() => openAdd("Lead")}>
          <IconPlus className="size-4" /> إضافة صفقة
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>خط الصفقات</CardTitle>
          <CardDescription>الفرص المفتوحة حسب المرحلة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4">
            {stages.map((stage) => {
              const stageDeals = dealsForStage(stage.key);
              return (
                <div
                  key={stage.key}
                  className="flex w-72 shrink-0 flex-col gap-3 md:w-auto"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className={`size-2.5 rounded-full ${stage.accent}`} />
                      {stage.label}
                      <span className="text-muted-foreground">
                        {stageDeals.length}
                      </span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        ${(stageValue(stage.key) / 1000).toFixed(0)}k
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => openAdd(stage.key)}
                      >
                        <IconPlus className="size-4" />
                        <span className="sr-only">Add deal to {stage.label}</span>
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {stageDeals.map((d) => (
                      <div
                        key={d.id}
                        className="rounded-lg border bg-card p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium">
                            {d.company}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(d.amount)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="-me-1 size-6"
                                >
                                  <IconDotsVertical className="size-4" />
                                  <span className="sr-only">إجراءات الصفقة</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onSelect={() => moveForward(d.id)}
                                >
                                  <IconArrowRight className="size-4" /> Move
                                  forward
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => markWon(d.id)}>
                                  <IconTrophy className="size-4" /> تحديد كمكسوبة
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onSelect={() => deleteDeal(d.id)}
                                >
                                  <IconTrash className="size-4" /> حذف
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="size-5">
                            <AvatarImage src={d.avatar} alt={d.owner} />
                            <AvatarFallback>{d.owner.slice(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="truncate text-xs text-muted-foreground">
                            {d.owner}
                          </span>
                        </div>
                      </div>
                    ))}
                    {stageDeals.length === 0 && (
                      <button
                        type="button"
                        onClick={() => openAdd(stage.key)}
                        className="rounded-lg border border-dashed p-3 text-start text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                      >
                        لا توجد صفقات بعد — أضف واحدة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>نظرة على الإيرادات</CardTitle>
            <CardDescription>إيرادات الصفقات المكسوبة خلال العام الماضي</CardDescription>
            <CardAction>
              <ChartMenu title="نظرة على الإيرادات" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <RevenueAreaChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>سجل النشاط</CardTitle>
            <CardDescription>آخر التحديثات من فريقك</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-5 border-s ps-6">
              {recentActivity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -start-[31px] top-0.5">
                    <Avatar className="size-6 ring-4 ring-background">
                      <AvatarImage src={a.avatar} alt={a.user} />
                      <AvatarFallback>{a.user.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  </span>
                  <p className="text-sm">
                    <span className="font-medium">{a.user}</span> {a.action}{" "}
                    {a.target && <span className="font-medium">{a.target}</span>}
                  </p>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>أحدث جهات الاتصال</CardTitle>
          <CardDescription>أحدث من أُضيفوا إلى نظام إدارة العملاء</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.slice(0, 9).map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Avatar className="size-9">
                <AvatarImage src={c.avatar} alt={c.name} />
                <AvatarFallback>{c.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.company}
                </p>
              </div>
              <ContactStatusBadge status={c.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <form onSubmit={handleAddDeal}>
            <DialogHeader>
              <DialogTitle>إضافة صفقة</DialogTitle>
              <DialogDescription>
                أنشئ فرصة جديدة وأضفها إلى خط صفقاتك.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deal-company">الشركة</Label>
                <Input
                  id="deal-company"
                  name="company"
                  placeholder="مثال: دار الخليج للتقنية"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deal-owner">مسؤول الصفقة</Label>
                <Input
                  id="deal-owner"
                  name="owner"
                  placeholder="مثال: نورة المطيري"
                  defaultValue={currentUser.name}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deal-amount">المبلغ (ر.س)</Label>
                  <Input
                    id="deal-amount"
                    name="amount"
                    type="number"
                    min={0}
                    step={100}
                    placeholder="25000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal-stage">المرحلة</Label>
                  <Select name="stage" value={addStage} onValueChange={(v) => setAddStage(v as Stage)}>
                    <SelectTrigger id="deal-stage" className="w-full">
                      <SelectValue placeholder="اختر المرحلة" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s.key} value={s.key}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <IconPlus className="size-4" /> إضافة صفقة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "نشط": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "معلق": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "غير نشط": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };
  return (
    <Badge variant="secondary" className={map[status]}>
      {status}
    </Badge>
  );
}
