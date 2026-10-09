"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconBuildingSkyscraper,
  IconLoader2,
  IconAlertTriangle,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateShort, formatNumber } from "@/lib/format";
import { ApiError } from "@/lib/api/client";
import {
  listOrganizations,
  PLAN_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type PlatformOrganization,
} from "@/lib/api/platform";

const statusStyles = [
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", // نشط
  "bg-slate-500/10 text-slate-600 dark:text-slate-400", // منتهٍ
  "bg-amber-500/10 text-amber-600 dark:text-amber-400", // معلَّق
  "bg-rose-500/10 text-rose-600 dark:text-rose-400", // ملغى
];

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default function PlatformOrganizationsPage() {
  const [rows, setRows] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await listOrganizations();
        if (!cancelled) setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "تعذّر تحميل الشركات.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((o) => o.subscriptionStatus === 0).length;
    const totalMembers = rows.reduce((sum, o) => sum + o.memberCount, 0);
    return { total, active, totalMembers };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.companyCode.toLowerCase().includes(q) ||
        o.workspaceSlug.toLowerCase().includes(q),
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="الشركات" description="كل الشركات المشتركة في عزم سمارت." />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryTile label="إجمالي الشركات" value={formatNumber(stats.total)} />
        <SummaryTile label="اشتراكات نشطة" value={formatNumber(stats.active)} />
        <SummaryTile label="إجمالي المستخدمين" value={formatNumber(stats.totalMembers)} />
      </div>

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="flex items-center justify-between px-6">
            <div className="relative w-full max-w-xs">
              <IconSearch className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو الكود…"
                className="ps-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatNumber(filtered.length)} شركة
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الشركة</TableHead>
                  <TableHead>الخطة</TableHead>
                  <TableHead>حالة الاشتراك</TableHead>
                  <TableHead>المستخدمون</TableHead>
                  <TableHead>نهاية التجربة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" /> جارٍ التحميل…
                    </TableCell>
                  </TableRow>
                )}

                {!loading && error && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-destructive">
                      <IconAlertTriangle className="mx-auto mb-2 size-6" /> {error}
                    </TableCell>
                  </TableRow>
                )}

                {!loading && !error &&
                  filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="ps-6">
                        <Link
                          href={`/platform/companies/${o.id}`}
                          className="font-medium hover:underline"
                        >
                          {o.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{o.companyCode}</p>
                      </TableCell>
                      <TableCell>{PLAN_LABELS[o.planType] ?? o.planType}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusStyles[o.subscriptionStatus] ?? statusStyles[0]}
                        >
                          {SUBSCRIPTION_STATUS_LABELS[o.subscriptionStatus] ?? o.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatNumber(o.memberCount)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {o.trialEndsAt ? formatDateShort(o.trialEndsAt) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {formatDateShort(o.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}

                {!loading && !error && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      <IconBuildingSkyscraper className="mx-auto mb-2 size-6 opacity-50" />
                      لا توجد شركات تطابق البحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
