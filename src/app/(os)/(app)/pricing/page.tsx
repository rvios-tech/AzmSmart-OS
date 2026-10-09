"use client";

import { useState } from "react";
import { IconCheck, IconSparkles } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const tiers = [
  {
    name: "المبتدئة",
    description: "للأفراد في بداية الطريق.",
    monthly: 0,
    yearly: 0,
    highlight: false,
    cta: "ابدأ الآن",
    features: [
      "حتى 3 مشاريع",
      "1 team member",
      "تحليلات أساسية",
      "دعم المجتمع",
      "مساحة تخزين 1 جيجابايت",
    ],
  },
  {
    name: "الاحترافية",
    description: "للفرق النامية التي تحتاج المزيد.",
    monthly: 49,
    yearly: 39,
    highlight: true,
    cta: "ابدأ التجربة المجانية",
    features: [
      "مشاريع بلا حدود",
      "حتى 10 أعضاء في الفريق",
      "تحليلات متقدمة",
      "دعم بريدي ذو أولوية",
      "مساحة تخزين 100 جيجابايت",
      "تكاملات مخصصة",
      "الوصول إلى الواجهة البرمجية",
    ],
  },
  {
    name: "المؤسسية",
    description: "للمؤسسات الكبيرة.",
    monthly: 149,
    yearly: 129,
    highlight: false,
    cta: "تواصل مع المبيعات",
    features: [
      "كل مزايا الاحترافية",
      "أعضاء فريق بلا حدود",
      "دخول موحّد SSO و SAML",
      "مدير دعم مخصص",
      "مساحة تخزين غير محدودة",
      "سجلات تدقيق واتفاقية مستوى خدمة",
    ],
  },
];

const faqs = [
  {
    q: "هل يمكنني تغيير الباقة لاحقاً؟",
    a: "بالتأكيد. يمكنك الترقية أو التخفيض أو الإلغاء في أي وقت من إعدادات الفوترة، وتُحتسب الفروقات تلقائياً بالتناسب.",
  },
  {
    q: "هل توجد فترة تجريبية مجانية؟",
    a: "نعم — تأتي الباقة الاحترافية بتجربة مجانية لمدة 14 يوماً، دون الحاجة إلى بطاقة ائتمان للبدء.",
  },
  {
    q: "ما طرق الدفع المقبولة؟",
    a: "نقبل جميع بطاقات الائتمان الرئيسية ومدى والتحويلات البنكية للباقات المؤسسية السنوية.",
  },
  {
    q: "هل تقدّمون خصومات للجمعيات غير الربحية؟",
    a: "نقدّم خصماً بنسبة 30% للجمعيات غير الربحية المسجّلة والمؤسسات التعليمية. تواصل مع فريق المبيعات للاستفادة.",
  },
  {
    q: "ماذا يحدث عند بلوغ حدود باقتي؟",
    a: "سننبّهك قبل بلوغ الحد ونساعدك في اختيار الباقة المناسبة. ولا تُحذف بياناتك أبداً بسبب تجاوز الحدود.",
  },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-5xl space-y-10 py-4">
        <div className="space-y-4 text-center">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary"
          >
            <IconSparkles className="size-3.5" /> الأسعار
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            تسعير بسيط وواضح
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            ابدأ مجاناً وتوسّع مع نموّك. بلا رسوم خفية، وألغِ في أي وقت.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Label
              htmlFor="billing"
              className={cn(
                "text-sm",
                !yearly ? "font-medium" : "text-muted-foreground"
              )}
            >
              شهرياً
            </Label>
            <Switch
              id="billing"
              checked={yearly}
              onCheckedChange={setYearly}
            />
            <Label
              htmlFor="billing"
              className={cn(
                "text-sm",
                yearly ? "font-medium" : "text-muted-foreground"
              )}
            >
              سنوياً
            </Label>
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              وفّر 20%
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {tiers.map((tier) => {
            const price = yearly ? tier.yearly : tier.monthly;
            return (
              <Card
                key={tier.name}
                className={cn(
                  "relative flex flex-col",
                  tier.highlight &&
                    "overflow-visible shadow-lg ring-2 ring-primary lg:-mt-3"
                )}
              >
                {tier.highlight && (
                  <Badge className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 shadow-sm">
                    الأكثر رواجاً
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums">
                      ${price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /شهرياً
                    </span>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <IconCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={tier.highlight ? "default" : "outline"}
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mx-auto w-full max-w-2xl space-y-4">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            الأسئلة الشائعة
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
}
