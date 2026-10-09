import {
  IconMail,
  IconAt,
  IconCreditCard,
  IconSearch,
  IconInfoCircle,
  IconAlertCircle,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { SaveFooter, FilterActions } from "./form-actions";

export const metadata = { title: "تخطيطات النماذج" };

export default function FormsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="تخطيطات النماذج"
        description="مرجع لأنماط النماذج — أفقية، وبعمودين، وعوامل تصفية مضمّنة، وحالات الحقول."
      />

      {/* (a) Horizontal — Account settings */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات الحساب</CardTitle>
          <CardDescription>
            Update your public profile. Labels sit beside each field on wide
            screens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldRow
            htmlFor="acc-name"
            label="الاسم المعروض"
            description="هكذا يظهر اسمك في مساحة العمل."
          >
            <Input id="acc-name" defaultValue="أحمد العمري" />
          </FieldRow>
          <Separator />
          <FieldRow
            htmlFor="acc-email"
            label="البريد الإلكتروني"
            description="يُستخدم لتسجيل الدخول وإشعارات الحساب."
          >
            <InputGroup>
              <InputGroupAddon>
                <IconMail />
              </InputGroupAddon>
              <InputGroupInput
                id="acc-email"
                type="email"
                defaultValue="ahmed.alamri@azmsmart.sa"
              />
            </InputGroup>
          </FieldRow>
          <Separator />
          <FieldRow
            htmlFor="acc-username"
            label="اسم المستخدم"
            description="معرّفك الفريد على azmsmart.sa."
          >
            <InputGroup>
              <InputGroupAddon>
                <IconAt />
              </InputGroupAddon>
              <InputGroupInput id="acc-username" defaultValue="alexmorgan" />
            </InputGroup>
          </FieldRow>
          <Separator />
          <FieldRow
            htmlFor="acc-website"
            label="الموقع الإلكتروني"
            description="أضف رابطاً لأعمالك أو شركتك."
          >
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>https://</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput id="acc-website" defaultValue="ahmedalamri.sa" />
            </InputGroup>
          </FieldRow>
          <Separator />
          <FieldRow
            htmlFor="acc-bio"
            label="نبذة تعريفية"
            description="وصف قصير يظهر في ملفك الشخصي."
          >
            <Textarea
              id="acc-bio"
              rows={3}
              defaultValue="رئيس المنتج في عزم سمارت. أبني برمجيات هادئة ومركّزة لفرق تنجز وتُطلق."
            />
          </FieldRow>
        </CardContent>
        <SaveFooter />
      </Card>

      {/* (b) Two-column — Billing details */}
      <Card>
        <CardHeader>
          <CardTitle>بيانات الفوترة</CardTitle>
          <CardDescription>
            البطاقة والعنوان المستخدمان في فاتورتك الشهرية.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم حامل البطاقة" htmlFor="bill-name" className="sm:col-span-2">
              <Input id="bill-name" defaultValue="أحمد سعيد العمري" />
            </Field>
            <Field label="رقم البطاقة" htmlFor="bill-card" className="sm:col-span-2">
              <InputGroup>
                <InputGroupAddon>
                  <IconCreditCard />
                </InputGroupAddon>
                <InputGroupInput id="bill-card" defaultValue="4242 4242 4242 4242" />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>Visa</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field label="تاريخ الانتهاء" htmlFor="bill-exp">
              <Input id="bill-exp" defaultValue="09 / 27" />
            </Field>
            <Field label="رمز التحقق (CVC)" htmlFor="bill-cvc">
              <Input id="bill-cvc" defaultValue="123" />
            </Field>
            <Field label="الدولة" htmlFor="bill-country">
              <Select defaultValue="us">
                <SelectTrigger id="bill-country" className="w-full">
                  <SelectValue placeholder="اختر الدولة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">الولايات المتحدة</SelectItem>
                  <SelectItem value="ca">كندا</SelectItem>
                  <SelectItem value="uk">المملكة المتحدة</SelectItem>
                  <SelectItem value="de">ألمانيا</SelectItem>
                  <SelectItem value="au">أستراليا</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="الرمز البريدي" htmlFor="bill-zip">
              <Input id="bill-zip" defaultValue="94114" />
            </Field>
            <Field label="عنوان الفوترة" htmlFor="bill-addr" className="sm:col-span-2">
              <Input id="bill-addr" defaultValue="شارع الملك فهد، مكتب 400" />
            </Field>
            <Field label="المدينة" htmlFor="bill-city">
              <Input id="bill-city" defaultValue="الرياض" />
            </Field>
            <Field label="المنطقة" htmlFor="bill-state">
              <Input id="bill-state" defaultValue="منطقة الرياض" />
            </Field>
          </div>
        </CardContent>
        <SaveFooter saveLabel="حفظ بيانات الفوترة" />
      </Card>

      {/* (c) Inline filter bar */}
      <Card>
        <CardHeader>
          <CardTitle>تصفية العملاء</CardTitle>
          <CardDescription>
            اجمع عناصر التحكم في شريط واحد للعروض المزدحمة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex-1 space-y-1.5 sm:min-w-[220px]">
              <Label htmlFor="flt-search">بحث</Label>
              <InputGroup>
                <InputGroupAddon>
                  <IconSearch />
                </InputGroupAddon>
                <InputGroupInput
                  id="flt-search"
                  placeholder="ابحث بالاسم أو البريد…"
                />
              </InputGroup>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flt-status">الحالة</Label>
              <Select defaultValue="all">
                <SelectTrigger id="flt-status" className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="pending">معلّق</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flt-plan">الباقة</Label>
              <Select defaultValue="all">
                <SelectTrigger id="flt-plan" className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الباقات</SelectItem>
                  <SelectItem value="free">مجاني</SelectItem>
                  <SelectItem value="pro">احترافي</SelectItem>
                  <SelectItem value="enterprise">مؤسسي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="flt-date">انضم بعد</Label>
              <Input
                id="flt-date"
                type="date"
                defaultValue="2024-01-01"
                className="sm:w-[170px]"
              />
            </div>
            <FilterActions />
          </div>
        </CardContent>
      </Card>

      {/* (d) Input variants */}
      <Card>
        <CardHeader>
          <CardTitle>حالات الحقول</CardTitle>
          <CardDescription>
            أيقونات ونصوص مساعدة وحالات التعطيل والتحقق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="مع أيقونة في البداية" htmlFor="var-icon">
              <InputGroup>
                <InputGroupAddon>
                  <IconSearch />
                </InputGroupAddon>
                <InputGroupInput id="var-icon" placeholder="ابحث في المشاريع…" />
              </InputGroup>
            </Field>
            <Field label="معطّل" htmlFor="var-disabled">
              <Input id="var-disabled" defaultValue="قيمة مقفلة" disabled />
            </Field>
            <Field
              label="مع نص مساعد"
              htmlFor="var-help"
              hint="استخدم 24 حرفاً أو أقل، بلا مسافات."
            >
              <Input id="var-help" defaultValue="azmsmart-production" />
            </Field>
            <Field
              label="حالة الخطأ"
              htmlFor="var-error"
              error="أدخل بريداً إلكترونياً صحيحاً."
            >
              <InputGroup className="border-destructive ring-3 ring-destructive/20">
                <InputGroupAddon>
                  <IconAlertCircle className="text-destructive" />
                </InputGroupAddon>
                <InputGroupInput
                  id="var-error"
                  aria-invalid
                  defaultValue="ahmed@azmsmart"
                />
              </InputGroup>
            </Field>
          </div>
        </CardContent>
        <SaveFooter />
      </Card>

      {/* (e) Controls */}
      <Card>
        <CardHeader>
          <CardTitle>عناصر التحكم</CardTitle>
          <CardDescription>
            قوائم وخيارات ومفاتيح ونصوص متعددة الأسطر في مكان واحد.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Select */}
            <Field label="الدور" htmlFor="ctl-role">
              <Select defaultValue="admin">
                <SelectTrigger id="ctl-role" className="w-full">
                  <SelectValue placeholder="اختر الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="editor">محرّر</SelectItem>
                  <SelectItem value="viewer">مُشاهد</SelectItem>
                  <SelectItem value="billing">مدير الفوترة</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {/* Date */}
            <Field
              label="تاريخ البدء"
              htmlFor="ctl-date"
              hint="متى يحصل هذا العضو على الصلاحية."
            >
              <Input id="ctl-date" type="date" defaultValue="2026-08-01" />
            </Field>

            {/* Checkbox group */}
            <div className="space-y-2.5">
              <p className="text-sm font-medium">تفضيلات البريد</p>
              <div className="space-y-2.5">
                <CheckRow
                  id="chk-product"
                  label="تحديثات المنتج"
                  hint="أخبار عن المزايا والتحسينات."
                  defaultChecked
                />
                <CheckRow
                  id="chk-security"
                  label="تنبيهات الأمان"
                  hint="عمليات الدخول والنشاط غير المعتاد."
                  defaultChecked
                />
                <CheckRow
                  id="chk-marketing"
                  label="التسويق والعروض"
                  hint="نصائح وعروض بين حين وآخر."
                />
              </div>
            </div>

            {/* Radio group */}
            <div className="space-y-2.5">
              <p className="text-sm font-medium">باقة مساحة العمل</p>
              <RadioGroup defaultValue="pro" className="gap-2.5">
                <RadioRow
                  id="rad-free"
                  value="free"
                  label="مجاني"
                  hint="حتى 3 مقاعد ومشروع واحد."
                />
                <RadioRow
                  id="rad-pro"
                  value="pro"
                  label="احترافي"
                  hint="مشاريع وتحليلات بلا حدود."
                />
                <RadioRow
                  id="rad-ent"
                  value="enterprise"
                  label="مؤسسي"
                  hint="دخول موحّد وسجلات تدقيق ودعم ذو أولوية."
                />
              </RadioGroup>
            </div>
          </div>

          <Separator />

          {/* Switch rows */}
          <div className="space-y-4">
            <p className="text-sm font-medium">الإشعارات</p>
            <SwitchRow
              id="sw-mentions"
              label="الإشارات"
              hint="نبّهني عندما يشير إليّ أحدهم بعلامة @."
              defaultChecked
            />
            <SwitchRow
              id="sw-comments"
              label="التعليقات"
              hint="نبّهني عند الرد على مواضيعي."
              defaultChecked
            />
            <SwitchRow
              id="sw-digest"
              label="الملخص الأسبوعي"
              hint="ملخص نشاط يصلك كل إثنين."
            />
          </div>

          <Separator />

          {/* Textarea */}
          <Field
            label="الملاحظات"
            htmlFor="ctl-notes"
            hint="داخلي فقط — يراه فريقك."
          >
            <Textarea
              id="ctl-notes"
              rows={4}
              placeholder="أضف تفاصيل عن هذا الحساب…"
            />
          </Field>
        </CardContent>
        <SaveFooter saveLabel="حفظ التفضيلات" />
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Presentational helpers                                             */
/* ------------------------------------------------------------------ */

function FieldRow({
  label,
  htmlFor,
  description,
  children,
}: {
  label: string;
  htmlFor: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-[220px_1fr] sm:items-start sm:gap-6">
      <div className="space-y-1">
        <Label htmlFor={htmlFor}>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="max-w-md">{children}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  className,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconInfoCircle className="size-3.5" /> {hint}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <IconAlertCircle className="size-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

function CheckRow({
  id,
  label,
  hint,
  defaultChecked,
}: {
  id: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Checkbox id={id} defaultChecked={defaultChecked} className="mt-0.5" />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function RadioRow({
  id,
  value,
  label,
  hint,
}: {
  id: string;
  value: string;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border p-3">
      <RadioGroupItem id={id} value={value} className="mt-0.5" />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  hint,
  defaultChecked,
}: {
  id: string;
  label: string;
  hint: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} />
    </div>
  );
}
