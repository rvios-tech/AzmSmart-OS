"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { IconArrowUpRight, IconCreditCard, IconLoader2, IconShieldLock, IconUser } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { ImageUploadButton } from "@/components/image-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError } from "@/lib/api/client";
import {
  changePassword, getProfile, updateProfile, type Profile,
} from "@/lib/api/workspace";
import { COMPANY_PLAN_LABELS } from "@/lib/workspace/roles";
import { initials } from "@/lib/work/view";
import { useWorkspace } from "@/lib/workspace/workspace-context";

const TIMEZONES = ["Asia/Aden", "Asia/Riyadh", "Asia/Dubai", "Asia/Baghdad", "Africa/Cairo", "Asia/Amman", "Asia/Kuwait", "Asia/Muscat", "Asia/Qatar", "Asia/Bahrain"];

function ProfileTab() {
  const [p, setP] = useState<Profile | null>(null);
  const [f, setF] = useState({ displayName: "", phone: "", avatarUrl: "", timezone: "Asia/Riyadh" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const me = await getProfile();
        setP(me);
        setF({ displayName: me.displayName, phone: me.phone ?? "", avatarUrl: me.avatarUrl ?? "", timezone: me.timezone });
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل بياناتك.");
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const me = await updateProfile({
        displayName: f.displayName.trim(),
        phone: f.phone.trim(),
        avatarUrl: f.avatarUrl.trim(),
        timezone: f.timezone,
      });
      setP(me);
      try {
        // يُحدَّث الاسم المخزّن محليًا ليظهر في القائمة والرأس بعد إعادة التحميل
        const raw = window.localStorage.getItem("azm_user");
        if (raw) window.localStorage.setItem("azm_user", JSON.stringify({ ...JSON.parse(raw), displayName: me.displayName, avatarUrl: me.avatarUrl }));
      } catch {}
      toast.success("حُفظ ملفك الشخصي", { description: "يظهر الاسم الجديد في القائمة بعد إعادة تحميل الصفحة." });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  if (!p) return <div className="py-16 text-center"><IconLoader2 className="mx-auto size-5 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>الملف الشخصي</CardTitle>
        <CardDescription>بياناتك كما تظهر لزملائك في الفريق.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={f.avatarUrl || undefined} alt={f.displayName} />
            <AvatarFallback>{initials(f.displayName || "؟")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="avatar">رابط الصورة</Label>
            <div className="flex gap-2">
              <Input id="avatar" dir="ltr" className="flex-1" placeholder="https://…" value={f.avatarUrl} onChange={(e) => setF({ ...f, avatarUrl: e.target.value })} />
              <ImageUploadButton label="رفع" onUploaded={(url) => setF((p) => ({ ...p, avatarUrl: url }))} />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <Input id="name" maxLength={80} value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" dir="ltr" value={p.email} disabled />
            <p className="text-xs text-muted-foreground">هوية الدخول — لا تُعدَّل من هنا.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">الجوال</Label>
            <Input id="phone" dir="ltr" inputMode="tel" maxLength={30} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>المنطقة الزمنية</Label>
            <Select value={f.timezone} onValueChange={(v) => setF({ ...f, timezone: v })}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[...new Set([f.timezone, ...TIMEZONES])].map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t">
        <Button onClick={() => void save()} disabled={saving || f.displayName.trim().length < 2}>
          {saving && <IconLoader2 className="size-4 animate-spin" />} حفظ التغييرات
        </Button>
      </CardFooter>
    </Card>
  );
}

function SecurityTab() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== again) return toast.error("تأكيد كلمة المرور غير مطابق");
    setSaving(true);
    try {
      await changePassword(cur, next);
      setCur("");
      setNext("");
      setAgain("");
      toast.success("تم تحديث كلمة المرور", { description: "استخدم الجديدة عند تسجيل الدخول القادم." });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit}>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
          <CardDescription>ثماني خانات على الأقل — لا تستعملها في مواقع أخرى.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:max-w-md">
          <div className="space-y-2">
            <Label htmlFor="current">كلمة المرور الحالية</Label>
            <Input id="current" type="password" autoComplete="current-password" required value={cur} onChange={(e) => setCur(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new">كلمة المرور الجديدة</Label>
            <Input id="new" type="password" autoComplete="new-password" minLength={8} required value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">تأكيد كلمة المرور الجديدة</Label>
            <Input id="confirm" type="password" autoComplete="new-password" minLength={8} required value={again} onChange={(e) => setAgain(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-6">
          <Button type="submit" disabled={saving}>
            {saving && <IconLoader2 className="size-4 animate-spin" />} تحديث كلمة المرور
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function PlanTab() {
  const { ctx, isPlatform, isSite } = useWorkspace();
  const company = ctx?.company;
  return (
    <Card>
      <CardHeader>
        <CardTitle>الاشتراك</CardTitle>
        <CardDescription>باقة شركتك وفواتير اشتراكاتها.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-lg font-semibold">{company?.name}</p>
          <Badge variant="secondary">{COMPANY_PLAN_LABELS[company?.planType ?? 0]}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isSite && !isPlatform && (
            <Button asChild variant="outline"><Link href="/store/plan">اشتراك المتجر وفواتيره <IconArrowUpRight className="size-4" /></Link></Button>
          )}
          {isPlatform && (
            <Button asChild variant="outline"><Link href="/platform/invoices">فواتير المنصة <IconArrowUpRight className="size-4" /></Link></Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="إدارة حسابك وأمانك واشتراكك." />
      <Tabs defaultValue="general" className="gap-6">
        <div className="overflow-x-auto">
          <TabsList>
            <TabsTrigger value="general"><IconUser className="size-4" /> الملف الشخصي</TabsTrigger>
            <TabsTrigger value="security"><IconShieldLock className="size-4" /> الأمان</TabsTrigger>
            <TabsTrigger value="plan"><IconCreditCard className="size-4" /> الاشتراك</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="general"><ProfileTab /></TabsContent>
        <TabsContent value="security"><SecurityTab /></TabsContent>
        <TabsContent value="plan"><PlanTab /></TabsContent>
      </Tabs>
    </div>
  );
}
