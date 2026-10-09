"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import {
  CONTACT_STATUS, POST_STATUS, PROJECT_STATUS, listContacts, listMedia, listPosts, listProjects, listServices,
  type CmsContact, type CmsPost, type CmsProject,
} from "@/lib/api/cms";
import { formatDateShort, formatNumber } from "@/lib/format";

interface SiteData {
  posts: CmsPost[];
  projects: CmsProject[];
  services: number;
  media: number;
  contacts: CmsContact[];
}

/** نظرة عامة على الموقع الرئيسي — أرقام حقيقية من محتواه ورسائل زواره. */
export default function SiteOverviewPage() {
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [posts, projects, services, media, contacts] = await Promise.all([
          listPosts(), listProjects(), listServices(), listMedia(), listContacts(),
        ]);
        setData({ posts, projects, services: services.length, media: media.length, contacts });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "تعذّر تحميل بيانات الموقع.");
      }
    })();
  }, []);

  if (error) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <IconAlertTriangle className="mx-auto mb-2 size-6 text-destructive" />
          {error}
        </CardContent>
      </Card>
    );
  }
  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <IconLoader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const published = data.posts.filter((p) => p.status === POST_STATUS.PUBLISHED).length;
  const drafts = data.posts.length - published;
  const liveProjects = data.projects.filter((p) => p.status === PROJECT_STATUS.PUBLISHED).length;
  const unread = data.contacts.filter((c) => c.status === CONTACT_STATUS.UNREAD);

  return (
    <div className="space-y-6">
      <PageHeader title="الموقع الرئيسي" description="محتوى الموقع التسويقي ورسائل زواره." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="مقالات منشورة" value={formatNumber(published)} hint={drafts ? `${formatNumber(drafts)} مسودة` : "لا مسودات"} />
        <MetricCard label="أعمال منشورة" value={formatNumber(liveProjects)} hint={`من ${formatNumber(data.projects.length)}`} />
        <MetricCard label="الخدمات" value={formatNumber(data.services)} hint={`${formatNumber(data.media)} ملف وسائط`} />
        <MetricCard label="رسائل غير مقروءة" value={formatNumber(unread.length)} tone={unread.length ? "warn" : undefined} hint={`من ${formatNumber(data.contacts.length)} رسالة`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>أحدث الرسائل</CardTitle>
            <CardDescription>ما يرسله زوّار الموقع من نموذج التواصل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.contacts.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-start justify-between gap-3 rounded-md border p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-muted-foreground">{c.message}</p>
                </div>
                <div className="shrink-0 text-end">
                  {c.status === CONTACT_STATUS.UNREAD && <Badge>جديدة</Badge>}
                  <p className="text-xs text-muted-foreground">{formatDateShort(c.createdAt)}</p>
                </div>
              </div>
            ))}
            {data.contacts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا رسائل بعد.</p>}
            <Button asChild variant="outline" size="sm" className="w-full"><Link href="/site/messages">كل الرسائل</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أحدث المقالات</CardTitle>
            <CardDescription>آخر ما كُتب في المدونة.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.posts.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/blog/${p.id}`} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm hover:bg-muted">
                <span className="truncate font-medium">{p.title}</span>
                <Badge variant="secondary">{p.status === POST_STATUS.PUBLISHED ? "منشور" : "مسودة"}</Badge>
              </Link>
            ))}
            {data.posts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا مقالات بعد.</p>}
            <Button asChild variant="outline" size="sm" className="w-full"><Link href="/blog/new">مقال جديد</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
