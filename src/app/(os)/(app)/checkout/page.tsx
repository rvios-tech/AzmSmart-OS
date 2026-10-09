"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconMail,
  IconMapPin,
  IconTruck,
  IconBolt,
  IconRocket,
  IconCreditCard,
  IconLock,
  IconBrandVisa,
  IconBrandMastercard,
  IconBrandPaypal,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { productList, type Product } from "@/data";
import { formatCurrency } from "@/lib/format";

type CartLine = Product & { qty: number };

// ضريبة القيمة المضافة في السعودية 15%، كما في طبقة البيانات.
const TAX_RATE = 0.15;

const currency = (n: number) =>
  formatCurrency(n, { decimals: 2 });

const summaryLines: CartLine[] = productList
  .slice(0, 3)
  .map((p, i) => ({ ...p, qty: [1, 2, 1][i] ?? 1 }));

const deliveryOptions = [
  {
    id: "standard",
    label: "عادي",
    description: "من 4 إلى 6 أيام عمل",
    price: 0,
    icon: IconTruck,
  },
  {
    id: "express",
    label: "سريع",
    description: "من يومين إلى 3 أيام عمل",
    price: 12,
    icon: IconBolt,
  },
  {
    id: "overnight",
    label: "فوري",
    description: "يوم العمل التالي",
    price: 28,
    icon: IconRocket,
  },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const [delivery, setDelivery] = useState<string>("standard");

  const subtotal = useMemo(
    () => summaryLines.reduce((sum, l) => sum + l.price * l.qty, 0),
    []
  );
  const shipping =
    deliveryOptions.find((o) => o.id === delivery)?.price ?? 0;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("تم تنفيذ الطلب", {
      description: `شكراً لك! تم تأكيد طلبك بإجمالي ${currency(total)}.`,
    });
    router.push("/orders");
  }

  return (
    <form onSubmit={placeOrder} className="space-y-6">
      <PageHeader title="إتمام الشراء" description="أكمل عملية الشراء بأمان.">
        <Button type="button" variant="outline" asChild>
          <Link href="/cart">
            <IconArrowLeft className="size-4" /> العودة إلى السلة
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* MAIN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconMail className="size-4" /> معلومات التواصل
              </CardTitle>
              <CardDescription>
                We&apos;ll send your receipt and updates here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ahmed@azmsmart.sa"
                  defaultValue="ahmed.alamri@azmsmart.sa"
                  dir="ltr"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconMapPin className="size-4" /> عنوان الشحن
              </CardTitle>
              <CardDescription>إلى أين نوصّل طلبك؟</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullname">الاسم الكامل</Label>
                  <Input
                    id="fullname"
                    placeholder="أحمد العمري"
                    defaultValue="أحمد العمري"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">عنوان الشارع</Label>
                  <Input
                    id="address"
                    placeholder="شارع الملك فهد، مكتب 400"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">المدينة</Label>
                  <Input id="city" placeholder="الرياض" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">المنطقة</Label>
                  <Input id="state" placeholder="منطقة الرياض" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">الرمز البريدي</Label>
                  <Input id="zip" placeholder="94114" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">الدولة</Label>
                  <Select defaultValue="SA">
                    <SelectTrigger id="country" className="w-full">
                      <SelectValue placeholder="اختر الدولة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SA">السعودية</SelectItem>
                      <SelectItem value="AE">الإمارات</SelectItem>
                      <SelectItem value="KW">الكويت</SelectItem>
                      <SelectItem value="QA">قطر</SelectItem>
                      <SelectItem value="BH">البحرين</SelectItem>
                      <SelectItem value="OM">عُمان</SelectItem>
                      <SelectItem value="EG">مصر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconTruck className="size-4" /> طريقة التوصيل
              </CardTitle>
              <CardDescription>اختر سرعة التوصيل التي تناسبك.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={delivery} onValueChange={setDelivery}>
                {deliveryOptions.map((o) => (
                  <Label
                    key={o.id}
                    htmlFor={`delivery-${o.id}`}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                      delivery === o.id
                        ? "border-primary ring-1 ring-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <RadioGroupItem value={o.id} id={`delivery-${o.id}`} />
                    <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <o.icon className="size-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{o.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.description}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {o.price === 0 ? "مجاني" : currency(o.price)}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <IconCreditCard className="size-4" /> الدفع
              </CardTitle>
              <CardDescription>
                جميع العمليات آمنة ومشفّرة.
              </CardDescription>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <IconBrandVisa className="size-7" />
                <IconBrandMastercard className="size-7" />
                <IconBrandPaypal className="size-7" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="card">رقم البطاقة</Label>
                  <div className="relative">
                    <IconCreditCard className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="card"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      className="ps-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="card-name">الاسم على البطاقة</Label>
                  <Input
                    id="card-name"
                    placeholder="أحمد العمري"
                    defaultValue="أحمد العمري"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                  <Input id="expiry" placeholder="MM / YY" dir="ltr" className="text-start" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvc">رمز التحقق (CVC)</Label>
                  <div className="relative">
                    <IconLock className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="cvc"
                      inputMode="numeric"
                      placeholder="123"
                      className="ps-9"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
              <CardDescription>
                {summaryLines.length} item
                {summaryLines.length === 1 ? "" : "s"} in your order
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-4">
                {summaryLines.map((line) => (
                  <li key={line.id} className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={line.image}
                        alt={line.name}
                        width={48}
                        height={48}
                        className="size-12 rounded-lg border bg-muted object-cover"
                      />
                      <span className="absolute -end-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground tabular-nums">
                        {line.qty}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{line.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {line.category}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {currency(line.price * line.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <Separator />

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">المجموع الفرعي</dt>
                  <dd className="font-medium tabular-nums">
                    {currency(subtotal)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">الشحن</dt>
                  <dd className="font-medium tabular-nums">
                    {shipping === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        مجاني
                      </span>
                    ) : (
                      currency(shipping)
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">الضريبة التقديرية (15%)</dt>
                  <dd className="font-medium tabular-nums">{currency(tax)}</dd>
                </div>
              </dl>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">الإجمالي</span>
                <span className="text-lg font-semibold tabular-nums">
                  {currency(total)}
                </span>
              </div>

              <Button type="submit" size="lg" className="w-full">
                <IconLock className="size-4" /> تأكيد الطلب
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                بتأكيد طلبك فإنك توافق على شروطنا وسياسة الخصوصية.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
