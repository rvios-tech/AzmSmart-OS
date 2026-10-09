"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  IconAt,
  IconMessageCircle,
  IconUserPlus,
  IconShieldCheck,
  IconCreditCard,
  IconRocket,
  IconChecks,
  IconSettings,
  IconDots,
  IconCircleCheck,
  IconTrash,
  IconBellRinging,
  IconBellOff,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import {
  deleteNotificationApi,
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  type NotificationDto as Notification,
} from "@/lib/api/work";
import { formatRelativeTime } from "@/lib/format";

const kindConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; tint: string }
> = {
  mention: {
    icon: IconAt,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  comment: {
    icon: IconMessageCircle,
    tint: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  assign: {
    icon: IconUserPlus,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  system: {
    icon: IconShieldCheck,
    tint: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },
  billing: {
    icon: IconCreditCard,
    tint: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  milestone: {
    icon: IconRocket,
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
}

type TabValue = "all" | "unread" | "mentions" | "system";

function StatTile({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", tint)}>
          <Icon className="size-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);
  const [tab, setTab] = useState<TabValue>("all");

  const load = useCallback(async () => {
    try {
      setItems((await listNotificationsApi()).notifications);
    } catch (err) {
      setItems([]);
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل الإشعارات.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const list = useMemo(() => items ?? [], [items]);

  const counts = useMemo(() => {
    return {
      all: list.length,
      unread: list.filter((n) => !n.readAt).length,
      mentions: list.filter((n) => n.kind === "mention" || n.kind === "comment").length,
      system: list.filter((n) => n.kind === "system" || n.kind === "billing").length,
    };
  }, [list]);

  const visible = useMemo(() => {
    return list.filter((n) => {
      if (tab === "unread") return !n.readAt;
      if (tab === "mentions") return n.kind === "mention" || n.kind === "comment";
      if (tab === "system") return n.kind === "system" || n.kind === "billing";
      return true;
    });
  }, [list, tab]);

  const markAll = async () => {
    if (counts.unread === 0) return;
    try {
      await markAllNotificationsReadApi();
      await load();
      toast.success("تم تحديد كل الإشعارات كمقروءة");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    }
  };

  const setRead = async (id: string) => {
    try {
      await markNotificationReadApi(id);
      setItems((prev) => prev?.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)) ?? prev);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteNotificationApi(id);
      setItems((prev) => prev?.filter((n) => n.id !== id) ?? prev);
      toast.success("تمت إزالة الإشعار");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّرت الإزالة.");
    }
  };

  const tabs: { value: TabValue; label: string; count: number }[] = [
    { value: "all", label: "الكل", count: counts.all },
    { value: "unread", label: "غير مقروءة", count: counts.unread },
    { value: "mentions", label: "التعليقات", count: counts.mentions },
    { value: "system", label: "النظام", count: counts.system },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="الإشعارات"
        description="الإشارات والتعليقات ونشاط النظام في مساحة عملك."
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => void markAll()}
          disabled={counts.unread === 0}
        >
          <IconChecks className="size-4" /> تحديد الكل كمقروء
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="إعدادات الإشعارات"
          asChild
        >
          <Link href="/settings">
            <IconSettings className="size-4" />
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          icon={IconBellRinging}
          label="غير مقروء"
          value={counts.unread}
          tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatTile
          icon={IconAt}
          label="التعليقات"
          value={counts.mentions}
          tint="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatTile
          icon={IconShieldCheck}
          label="النظام"
          value={counts.system}
          tint="bg-slate-500/10 text-slate-600 dark:text-slate-400"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="overflow-x-auto">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
              <TabsList>
                {tabs.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                    <span className="ms-1 rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">
                      {t.count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>

        <CardContent className="px-2">
          {!items ? (
            <p className="py-16 text-center text-sm text-muted-foreground">جارٍ التحميل…</p>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <IconBellOff className="size-7 opacity-50" />
              <p className="text-sm">لا شيء جديد — أنت على اطلاع بكل شيء.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {visible.map((n) => {
                const cfg = kindConfig[n.kind] ?? kindConfig.system;
                const read = !!n.readAt;
                const Icon = cfg.icon;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50",
                      !read && "bg-muted/40"
                    )}
                  >
                    {!read && (
                      <span className="absolute start-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                    )}

                    <div className="relative shrink-0">
                      {n.actor ? (
                        <>
                          <Avatar className="size-9">
                            <AvatarImage src={n.actor.avatar ?? undefined} alt={n.actor.name} />
                            <AvatarFallback>{initials(n.actor.name)}</AvatarFallback>
                          </Avatar>
                          <span
                            className={cn(
                              "absolute -end-1 -bottom-1 grid size-5 place-items-center rounded-full ring-2 ring-card",
                              cfg.tint
                            )}
                          >
                            <Icon className="size-3" />
                          </span>
                        </>
                      ) : (
                        <span
                          className={cn(
                            "grid size-9 place-items-center rounded-full",
                            cfg.tint
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            read ? "font-medium" : "font-semibold"
                          )}
                        >
                          {n.title}
                        </p>
                        {!read && (
                          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {n.body}
                      </p>
                      <p className="flex items-center gap-3 text-xs text-muted-foreground">
                        {formatRelativeTime(n.createdAt)}
                        {n.link && (
                          <Link href={n.link} onClick={() => void setRead(n.id)} className="text-primary hover:underline">
                            فتح
                          </Link>
                        )}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
                        >
                          <IconDots className="size-4" />
                          <span className="sr-only">إجراءات الإشعار</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!read && (
                          <>
                            <DropdownMenuItem onSelect={() => void setRead(n.id)}>
                              <IconCircleCheck className="size-4" /> تحديد كمقروء
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => void remove(n.id)}
                        >
                          <IconTrash className="size-4" /> إزالة
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
