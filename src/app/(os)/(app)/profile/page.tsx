"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconBuilding, IconCalendar, IconLoader2, IconMail, IconPhone, IconSettings } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { MetricCard } from "@/components/metric-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listActivityApi, listTasksApi, type ActivityDto, type TaskDto } from "@/lib/api/work";
import { getProfile, type Profile } from "@/lib/api/workspace";
import { formatDateShort, formatNumber, formatRelativeTime } from "@/lib/format";
import { initials } from "@/lib/work/view";
import { useWorkspace } from "@/lib/workspace/workspace-context";

/** ملفي الشخصي: من أنا في هذه الشركة وماذا أنجزت — من بياناتي الحقيقية. */
export default function ProfilePage() {
  const { ctx, roleLabel } = useWorkspace();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<TaskDto[] | null>(null);
  const [activity, setActivity] = useState<ActivityDto[]>([]);

  useEffect(() => {
    void (async () => {
      const [p, t, a] = await Promise.allSettled([getProfile(), listTasksApi({ assignee: "me" }), listActivityApi({ page: 1 })]);
      if (p.status === "fulfilled") setProfile(p.value);
      setTasks(t.status === "fulfilled" ? t.value : []);
      if (a.status === "fulfilled" && p.status === "fulfilled") {
        setActivity(a.value.activity.filter((e) => e.actor?.id === p.value.id).slice(0, 8));
      }
    })();
  }, []);

  if (!profile || !tasks) {
    return <div className="flex h-64 items-center justify-center"><IconLoader2 className="size-5 animate-spin" /></div>;
  }

  const open = tasks.filter((t) => t.status !== 4);
  const done = tasks.filter((t) => t.status === 4);

  return (
    <div className="space-y-6">
      <PageHeader title="الملف الشخصي" description="من أنا في هذه الشركة وماذا أعمل عليه.">
        <Button variant="outline" asChild>
          <Link href="/settings"><IconSettings className="size-4" /> تعديل بياناتي</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName} />
            <AvatarFallback className="text-xl">{initials(profile.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{profile.displayName}</h2>
              <Badge variant="secondary">{roleLabel}</Badge>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><IconBuilding className="size-4" />{ctx?.company?.name}</span>
              <span className="flex items-center gap-1.5" dir="ltr"><IconMail className="size-4" />{profile.email}</span>
              {profile.phone && <span className="flex items-center gap-1.5" dir="ltr"><IconPhone className="size-4" />{profile.phone}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="مهامي المفتوحة" value={formatNumber(open.length)} tone={open.length ? "warn" : undefined} />
        <MetricCard label="مهامي المنجزة" value={formatNumber(done.length)} tone="good" />
        <MetricCard label="نقاط الجهد المنجزة" value={formatNumber(done.reduce((a, t) => a + t.points, 0))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>مهامي القادمة</CardTitle>
            <CardDescription>المفتوحة مرتبةً بتاريخ الاستحقاق.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {open.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا مهام مفتوحة.</p>}
            {[...open]
              .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
              .slice(0, 6)
              .map((t) => (
                <Link key={t.id} href={`/projects/${t.projectId}`} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{t.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t.title}</span>
                  {t.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><IconCalendar className="size-3" />{formatDateShort(t.dueDate)}</span>
                  )}
                </Link>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نشاطي الأخير</CardTitle>
            <CardDescription>آخر ما فعلتُه في مساحة العمل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">لا نشاط بعد.</p>}
            {activity.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 text-sm">
                <span>{e.description}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(e.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
