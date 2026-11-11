"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  IconBriefcase, IconExternalLink, IconFolder, IconFolders, IconLayoutDashboard, IconLoader2, IconMail, IconNotes, IconSettings,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { openSiteSupport } from "@/lib/api/platform-ops";
import { startSupport } from "@/lib/auth/support";

const SECTIONS = [
  { label: "نظرة عامة على الموقع", href: "/site", icon: IconLayoutDashboard, desc: "زيارات المحتوى وآخر الرسائل" },
  { label: "المدونة والمقالات", href: "/blog", icon: IconNotes, desc: "اكتب مقالًا، عدّل، انشر أو أرجئ" },
  { label: "الخدمات", href: "/site/services", icon: IconBriefcase, desc: "خدمات RVIOS المعروضة في الموقع" },
  { label: "معرض الأعمال", href: "/site/portfolio", icon: IconFolders, desc: "المشاريع وصورها ونتائجها" },
  { label: "مكتبة الوسائط", href: "/site/media", icon: IconFolder, desc: "صور الموقع والمقالات" },
  { label: "رسائل التواصل", href: "/site/messages", icon: IconMail, desc: "ما يرسله الزوار من نموذج التواصل" },
  { label: "إعدادات الموقع", href: "/site/settings", icon: IconSettings, desc: "النصوص العامة وروابط التواصل" },
];

/**
 * إدارة الموقع الرئيسي (rvios.com) ومدونته من حساب فريق المنصة: تفتح لوحة شركة
 * الموقع بجلسة دعم، فتعمل كل أدوات المحتوى نفسها، وشريط أعلى الصفحة يعيدك إلى هنا.
 */
export default function PlatformSitePage() {
  const [busy, setBusy] = useState<string | null>(null);

  async function go(href: string) {
    setBusy(href);
    try {
      const s = await openSiteSupport();
      startSupport(s, href, "/platform/site");
    } catch (err) {
      setBusy(null);
      toast.error(err instanceof ApiError ? err.message : "تعذّر فتح إدارة الموقع.");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="الموقع الرئيسي والمدونة" description="محتوى rvios.com كله من هنا: المقالات والخدمات ومعرض الأعمال والوسائط ورسائل الزوار.">
        <Button variant="outline" asChild>
          <a href="https://www.rvios.com" target="_blank" rel="noopener"><IconExternalLink className="size-4" /> فتح الموقع</a>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>أقسام الموقع</CardTitle>
          <CardDescription>تُفتح لوحة الموقع بجلسة إدارة مدتها ساعتان تُسجَّل باسمك. المقالات المنشورة هنا تظهر في مدونة الموقع تلقائيًا.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => (
            <button
              key={s.href}
              type="button"
              disabled={!!busy}
              onClick={() => void go(s.href)}
              className="flex items-start gap-3 rounded-xl border p-4 text-start transition hover:border-primary disabled:opacity-60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                {busy === s.href ? <IconLoader2 className="size-5 animate-spin" /> : <s.icon className="size-5" />}
              </span>
              <span className="space-y-0.5"><b className="block">{s.label}</b><span className="text-sm text-muted-foreground">{s.desc}</span></span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
