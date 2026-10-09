"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowRight,
  IconLoader2,
  IconAlertTriangle,
  IconDeviceFloppy,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateShort } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import {
  getOrganization,
  updateOrganizationPlan,
  PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type PlatformOrganizationDetail,
} from "@/lib/api/platform";

const roleLabels = [
  "مالك", "مدير عام", "مدير", "تنفيذي", "موارد بشرية",
  "مالية", "مدير قسم", "قائد فريق", "موظف", "ضيف",
];

export default function PlatformOrganizationDetailPage() {
  const params = useParams<{ id: string }>();
  const [org, setOrg] = useState<PlatformOrganizationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [planType, setPlanType] = useState("0");
  const [subscriptionStatus, setSubscriptionStatus] = useState("0");
  const [trialEndsAt, setTrialEndsAt] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getOrganization(params.id);
        if (!cancelled) {
          setOrg(data);
          setPlanType(String(data.planType));
          setSubscriptionStatus(String(data.subscriptionStatus));
          setTrialEndsAt(data.trialEndsAt ? data.trialEndsAt.slice(0, 10) : "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? "لم يتم العثور على هذه الشركة."
              : "تعذّر تحميل بيانات الشركة.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  async function handleSave() {
    if (!org) return;
    setSaving(true);
    try {
      const updated = await updateOrganizationPlan(org.id, {
        planType: Number(planType),
        subscriptionStatus: Number(subscriptionStatus),
        trialEndsAt: trialEndsAt || undefined,
      });
      setOrg((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success("تم حفظ التغييرات");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ التغييرات.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="space-y-6">
        <Link href="/platform/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <IconArrowRight className="size-4" /> العودة إلى الشركات
        </Link>
        <Card>
          <CardContent className="py-16 text-center">
            <IconAlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
            <p className="text-lg font-medium">{error ?? "لم يتم العثور على الشركة"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/platform/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى الشركات
      </Link>

      <PageHeader title={org.name} description={`${org.companyCode} · ${org.workspaceSlug}`}>
        <Badge variant="secondary">{SUBSCRIPTION_STATUS_LABELS[org.subscriptionStatus]}</Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>الأعضاء</CardTitle>
            <CardDescription>كل مستخدم منضمّ لهذه الشركة ودوره فيها.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">المستخدم</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="ps-6">
                      <div className="font-medium">{m.user.displayName}</div>
                      <div className="text-xs text-muted-foreground">{m.user.email}</div>
                    </TableCell>
                    <TableCell>{roleLabels[m.role] ?? m.role}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={m.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-slate-500/10 text-slate-600"}>
                        {m.isActive ? "نشط" : "معطّل"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {m.joinedAt ? formatDateShort(m.joinedAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {org.memberships.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      لا يوجد أعضاء.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الاشتراك</CardTitle>
            <CardDescription>تعديل خطة الشركة وحالة اشتراكها.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan">الخطة</Label>
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger id="plan" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLAN_LABELS.map((label, i) => (
                    <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">حالة الاشتراك</Label>
              <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                <SelectTrigger id="status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_STATUS_LABELS.map((label, i) => (
                    <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trial">نهاية الفترة التجريبية</Label>
              <Input id="trial" type="date" value={trialEndsAt} onChange={(e) => setTrialEndsAt(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? <IconLoader2 className="size-4 animate-spin" /> : <IconDeviceFloppy className="size-4" />}
              حفظ التغييرات
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
