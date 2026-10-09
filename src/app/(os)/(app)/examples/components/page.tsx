import {
  IconPlus,
  IconDownload,
  IconTrash,
  IconArrowRight,
  IconCircleCheck,
  IconInfoCircle,
  IconAlertTriangle,
  IconSettings,
  IconStar,
  IconUsers,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { team } from "@/data";

export const metadata = { title: "عناصر الواجهة" };

const statusBadges = [
  { label: "Active", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { label: "Pending", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { label: "Failed", cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { label: "Info", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { label: "Beta", cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { label: "Draft", cls: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
];

const progressRows = [
  { label: "المساحة المستخدمة", value: 72 },
  { label: "الإعداد الأولي", value: 45 },
  { label: "حصة الواجهة البرمجية", value: 91 },
];

const faqs = [
  {
    q: "كيف تُحتسب الفوترة؟",
    a: "تُفوتر الباقات شهرياً لكل مقعد نشط، ويُحتسب الاستخدام الزائد عن حدود باقتك ويُضاف إلى الفاتورة التالية.",
  },
  {
    q: "هل يمكنني تغيير الباقة في أي وقت؟",
    a: "نعم. تُطبَّق الترقيات فوراً، بينما يسري التخفيض مع بداية دورة الفوترة التالية دون أي غرامة.",
  },
  {
    q: "هل تقدّمون فترة تجريبية مجانية؟",
    a: "تبدأ كل مساحة عمل بتجربة احترافية لمدة 14 يوماً، ولا تُطلب بطاقة ائتمان حتى تقرر الاستمرار في الباقة.",
  },
];

export default function ComponentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="عناصر الواجهة"
        description="معرض للّبنات الأساسية المستخدمة في هذا النظام."
      />

      {/* Buttons — full width */}
      <Card>
        <CardHeader>
          <CardTitle>الأزرار</CardTitle>
          <CardDescription>الأنماط والأحجام والأيقونات والحالات.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Row label="الأنماط">
            <Button>أساسي</Button>
            <Button variant="secondary">ثانوي</Button>
            <Button variant="outline">محدّد</Button>
            <Button variant="ghost">شفاف</Button>
            <Button variant="destructive">تدميري</Button>
            <Button variant="link">رابط</Button>
          </Row>
          <Separator />
          <Row label="الأحجام">
            <Button size="sm">صغير</Button>
            <Button size="default">افتراضي</Button>
            <Button size="lg">كبير</Button>
            <Button size="icon" aria-label="الإعدادات">
              <IconSettings />
            </Button>
          </Row>
          <Separator />
          <Row label="مع أيقونات">
            <Button>
              <IconPlus className="size-4" /> مشروع جديد
            </Button>
            <Button variant="outline">
              <IconDownload className="size-4" /> تصدير
            </Button>
            <Button variant="secondary">
              متابعة <IconArrowRight className="size-4" />
            </Button>
            <Button variant="destructive">
              <IconTrash className="size-4" /> حذف
            </Button>
          </Row>
          <Separator />
          <Row label="معطّل">
            <Button disabled>أساسي</Button>
            <Button variant="outline" disabled>
              محدّد
            </Button>
            <Button variant="ghost" disabled>
              شفاف
            </Button>
          </Row>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>الشارات</CardTitle>
            <CardDescription>الأنماط الأساسية وألوان الحالات.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>افتراضي</Badge>
              <Badge variant="secondary">ثانوي</Badge>
              <Badge variant="outline">محدّد</Badge>
              <Badge variant="destructive">تدميري</Badge>
              <Badge variant="ghost">شفاف</Badge>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {statusBadges.map((b) => (
                <Badge key={b.label} variant="secondary" className={b.cls}>
                  {b.label}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <IconCircleCheck /> موثّق
              </Badge>
              <Badge
                variant="secondary"
                className="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              >
                <IconStar /> احترافي
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Avatars */}
        <Card>
          <CardHeader>
            <CardTitle>الصور الرمزية</CardTitle>
            <CardDescription>الأحجام والبدائل النصية والمجموعات المتراكبة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar size="sm">
                <AvatarImage src={team[0].avatar} alt={team[0].name} />
                <AvatarFallback>أع</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src={team[1].avatar} alt={team[1].name} />
                <AvatarFallback>سر</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarImage src={team[2].avatar} alt={team[2].name} />
                <AvatarFallback>عش</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback>نم</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback className="bg-violet-500/15 text-violet-600 dark:text-violet-400">
                  <IconUsers className="size-5" />
                </AvatarFallback>
              </Avatar>
            </div>
            <Separator />
            <AvatarGroup>
              {team.slice(0, 5).map((m) => (
                <Avatar key={m.id}>
                  <AvatarImage src={m.avatar} alt={m.name} />
                  <AvatarFallback>{m.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
              ))}
              <AvatarGroupCount>+{team.length - 5}</AvatarGroupCount>
            </AvatarGroup>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>التنبيهات</CardTitle>
            <CardDescription>إعلامية وناجحة وتدميرية.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <IconInfoCircle />
              <AlertTitle>صيانة مجدولة</AlertTitle>
              <AlertDescription>
                We&apos;ll be performing upgrades on Sunday at 02:00 UTC. Expect
                brief downtime.
              </AlertDescription>
            </Alert>
            <Alert className="border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
              <IconCircleCheck />
              <AlertTitle>اكتمل النسخ الاحتياطي</AlertTitle>
              <AlertDescription className="text-emerald-700/80 dark:text-emerald-400/80">
                تمت مزامنة 2,318 سجلاً بنجاح.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <IconAlertTriangle />
              <AlertTitle>فشل الدفع</AlertTitle>
              <AlertDescription>
                رُفضت بطاقتك. حدّث بيانات الفوترة لإبقاء اشتراكك فعّالاً.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>نسبة الإنجاز</CardTitle>
            <CardDescription>أشرطة تقدّم محدّدة مع تسميات.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {progressRows.map((p) => (
              <div key={p.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {p.value}%
                  </span>
                </div>
                <Progress value={p.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>التبويبات</CardTitle>
            <CardDescription>التنقّل بين عروض مترابطة.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                <TabsTrigger value="analytics">التحليلات</TabsTrigger>
                <TabsTrigger value="reports">التقارير</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">
                ملخص سريع لصحة مساحة العمل والأعضاء النشطين وأحدث التغييرات في
                مشاريعك.
              </TabsContent>
              <TabsContent value="analytics" className="pt-4 text-sm text-muted-foreground">
                اتجاهات الزيارات والتحويل والاحتفاظ مع مقارنات أسبوعية.
              </TabsContent>
              <TabsContent value="reports" className="pt-4 text-sm text-muted-foreground">
                صدّر التقارير المجدولة بصيغة CSV أو PDF وشاركها مع فريقك.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Accordion */}
        <Card>
          <CardHeader>
            <CardTitle>القوائم القابلة للطي</CardTitle>
            <CardDescription>كشف تدريجي للأسئلة الشائعة.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="faq-0">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Form controls */}
        <Card>
          <CardHeader>
            <CardTitle>عناصر الاختيار</CardTitle>
            <CardDescription>المفتاح ومربع الاختيار ومجموعة الأزرار.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cmp-switch" className="font-normal">
                تفعيل التحقق بخطوتين
              </Label>
              <Switch id="cmp-switch" defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <Checkbox id="cmp-chk-1" defaultChecked />
                <Label htmlFor="cmp-chk-1" className="font-normal">
                  أرسل لي ملخصاً أسبوعياً
                </Label>
              </div>
              <div className="flex items-center gap-2.5">
                <Checkbox id="cmp-chk-2" />
                <Label htmlFor="cmp-chk-2" className="font-normal">
                  الاشتراك في سجل التغييرات
                </Label>
              </div>
            </div>
            <Separator />
            <RadioGroup defaultValue="comfortable" className="gap-2.5">
              <div className="flex items-center gap-2.5">
                <RadioGroupItem id="cmp-rad-1" value="compact" />
                <Label htmlFor="cmp-rad-1" className="font-normal">
                  كثافة مضغوطة
                </Label>
              </div>
              <div className="flex items-center gap-2.5">
                <RadioGroupItem id="cmp-rad-2" value="comfortable" />
                <Label htmlFor="cmp-rad-2" className="font-normal">
                  كثافة مريحة
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Tooltip */}
        <Card>
          <CardHeader>
            <CardTitle>التلميحات</CardTitle>
            <CardDescription>تلميحات سياقية عند التمرير أو التركيز.</CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="flex flex-wrap gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">مرّر فوقي</Button>
                  </TooltipTrigger>
                  <TooltipContent>يُفتح في تبويب جديد</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="إضافة">
                      <IconPlus />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>إنشاء عنصر جديد</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="حذف">
                      <IconTrash />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>حذف نهائي</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Skeletons */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>هياكل التحميل</CardTitle>
            <CardDescription>عناصر نائبة تحاكي شكل المحتوى أثناء التحميل.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-xl border p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="w-24 shrink-0 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
