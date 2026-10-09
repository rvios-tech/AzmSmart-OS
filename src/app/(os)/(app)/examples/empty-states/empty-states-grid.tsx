"use client";

import { toast } from "sonner";
import {
  IconSearch,
  IconFolderPlus,
  IconInbox,
  IconBellOff,
  IconServerOff,
  IconPlugConnected,
  IconPlus,
  IconRefresh,
  IconMessageCircle,
  IconSettings,
  IconLifebuoy,
  IconArrowLeft,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Action = { label: string; icon?: React.ComponentType<{ className?: string }> };

type EmptyStateDef = {
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
  title: string;
  description: string;
  primary: Action;
  secondary?: Action;
};

const states: EmptyStateDef[] = [
  {
    icon: IconSearch,
    tint: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    title: "لم يتم العثور على نتائج",
    description:
      "لم نجد أي نتيجة تطابق «التوقعات الربعية». جرّب كلمة أخرى أو امسح عوامل التصفية.",
    primary: { label: "مسح البحث", icon: IconRefresh },
    secondary: { label: "تصفّح الكل" },
  },
  {
    icon: IconFolderPlus,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    title: "لا توجد مشاريع بعد",
    description:
      "تجمع المشاريع مهامك وملفاتك ومعالمك في مكان واحد. أنشئ أول مشروع للبدء.",
    primary: { label: "مشروع جديد", icon: IconPlus },
    secondary: { label: "استيراد" },
  },
  {
    icon: IconInbox,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    title: "بريدك خالٍ",
    description:
      "أنجزت كل شيء — لا توجد رسائل تحتاج انتباهك الآن. عمل رائع.",
    primary: { label: "إنشاء رسالة", icon: IconMessageCircle },
    secondary: { label: "عرض الأرشيف" },
  },
  {
    icon: IconBellOff,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    title: "لا توجد إشعارات",
    description:
      "عندما يحتاج شيء إلى انتباهك — إشارة أو إسناد أو إطلاق — سيظهر هنا.",
    primary: { label: "إعدادات الإشعارات", icon: IconSettings },
  },
  {
    icon: IconServerOff,
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    title: "حدث خطأ ما",
    description:
      "تعذّر تحميل هذه البيانات، وغالباً ما يكون الأمر مؤقتاً — أعد المحاولة بعد قليل.",
    primary: { label: "إعادة المحاولة", icon: IconRefresh },
    secondary: { label: "تواصل مع الدعم", icon: IconLifebuoy },
  },
  {
    icon: IconPlugConnected,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    title: "لا توجد تكاملات مرتبطة",
    description:
      "اربط أدواتك المفضّلة لمزامنة البيانات تلقائياً وإبقاء كل شيء في مكان واحد.",
    primary: { label: "تصفّح التكاملات", icon: IconArrowLeft },
    secondary: { label: "اعرف المزيد" },
  },
];

export function EmptyStatesGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {states.map((s) => (
        <EmptyState key={s.title} {...s} />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  tint,
  title,
  description,
  primary,
  secondary,
}: EmptyStateDef) {
  const fire = (label: string) => () =>
    toast(label, { description: "إجراء توضيحي — مُهيّأ للمعاينة فقط." });

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div
          className={`flex size-14 shrink-0 items-center justify-center rounded-full ${tint}`}
        >
          <Icon className="size-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-medium tracking-tight">{title}</h3>
          <p className="mx-auto max-w-[30ch] text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button size="sm" onClick={fire(primary.label)}>
            {primary.icon && <primary.icon className="size-4" />}
            {primary.label}
          </Button>
          {secondary && (
            <Button size="sm" variant="outline" onClick={fire(secondary.label)}>
              {secondary.icon && <secondary.icon className="size-4" />}
              {secondary.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
