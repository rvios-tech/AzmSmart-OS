"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCopy,
  IconCurrencyDollar,
  IconDiscount2,
  IconDotsVertical,
  IconLoader2,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconReceipt,
  IconTicket,
  IconTrash,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { DeleteDialog } from "@/components/delete-dialog";
import { RequireStore } from "@/components/require-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiError } from "@/lib/api/client";
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
  type Coupon,
  type CouponInput,
  type CouponKind,
  type CouponsResponse,
  type Store,
} from "@/lib/api/shop";
import { formatDateShort, formatMoney, formatNumber } from "@/lib/format";

type Status = "نشطة" | "مجدولة" | "منتهية" | "نفدت" | "موقوفة";

const statusStyles: Record<Status, string> = {
  "نشطة": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "مجدولة": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "منتهية": "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  "نفدت": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "موقوفة": "bg-slate-500/10 text-slate-500",
};

const KIND_LABEL: Record<CouponKind, string> = {
  percent: "نسبة من الطلب",
  amount: "مبلغ ثابت",
  ship: "توصيل مجاني",
};

function statusOf(c: Coupon): Status {
  if (!c.active) return "موقوفة";
  const now = Date.now();
  if (c.endsAt && new Date(c.endsAt).getTime() < now) return "منتهية";
  if (c.usageLimit > 0 && c.used >= c.usageLimit) return "نفدت";
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return "مجدولة";
  return "نشطة";
}

/** «YYYY-MM-DD» لحقل التاريخ ← ISO: البداية أول اليوم، والنهاية آخره */
const toIso = (d: string, end: boolean) => (d ? new Date(`${d}T${end ? "23:59:59" : "00:00:00"}`).toISOString() : null);
const toDay = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function Tile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <span className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </span>
        </div>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function CouponForm({
  editing,
  currency,
  saving,
  onSubmit,
}: {
  editing: Coupon | null;
  currency: string;
  saving: boolean;
  onSubmit: (input: CouponInput) => void;
}) {
  const [kind, setKind] = useState<CouponKind>(editing?.kind ?? "percent");
  const [active, setActive] = useState(editing?.active ?? true);
  const locked = !!editing && editing.used > 0;

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const n = (k: string) => Math.max(0, Math.trunc(Number(fd.get(k)) || 0));
    onSubmit({
      ...(locked ? {} : { code: String(fd.get("code") ?? "").trim().toUpperCase() }),
      kind,
      value: kind === "ship" ? 0 : n("value"),
      maxDiscount: kind === "percent" ? n("maxDiscount") : 0,
      minSubtotal: n("minSubtotal"),
      usageLimit: n("usageLimit"),
      perCustomer: n("perCustomer"),
      startsAt: toIso(String(fd.get("start") ?? ""), false),
      endsAt: toIso(String(fd.get("end") ?? ""), true),
      note: String(fd.get("note") ?? "").trim(),
      active,
    });
  }

  return (
    <form onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>{editing ? "تعديل القسيمة" : "قسيمة خصم جديدة"}</DialogTitle>
        <DialogDescription>
          يكتب العميل الرمز في السلة، ويحسب الخادم الخصم عند الطلب — لا يمكن التلاعب به من المتصفح.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="code">الرمز</Label>
          <Input
            id="code"
            name="code"
            placeholder="EID15"
            dir="ltr"
            defaultValue={editing?.code}
            className="font-mono uppercase text-start"
            pattern="[A-Za-z0-9_\-]{3,24}"
            title="من ٣ إلى ٢٤ حرفًا لاتينيًا أو رقمًا بلا مسافات"
            disabled={locked}
            required={!locked}
          />
          {locked && <p className="text-xs text-muted-foreground">استُخدم الرمز في طلبات، فلا يُغيَّر — أنشئ قسيمة جديدة لرمز آخر.</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="kind">نوع الخصم</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as CouponKind)}>
              <SelectTrigger id="kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">نسبة من الطلب</SelectItem>
                <SelectItem value="amount">مبلغ ثابت</SelectItem>
                <SelectItem value="ship">توصيل مجاني</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {kind !== "ship" && (
            <div className="space-y-2">
              <Label htmlFor="value">{kind === "percent" ? "النسبة ٪" : `المبلغ (${currency})`}</Label>
              <Input
                id="value"
                name="value"
                type="number"
                min={1}
                max={kind === "percent" ? 100 : undefined}
                defaultValue={editing?.kind === kind ? editing.value : undefined}
                placeholder={kind === "percent" ? "10" : "5000"}
                required
              />
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minSubtotal">حد أدنى للطلب ({currency})</Label>
            <Input id="minSubtotal" name="minSubtotal" type="number" min={0} defaultValue={editing?.minSubtotal || ""} placeholder="بلا حد" />
          </div>
          {kind === "percent" && (
            <div className="space-y-2">
              <Label htmlFor="maxDiscount">أقصى خصم ({currency})</Label>
              <Input id="maxDiscount" name="maxDiscount" type="number" min={0} defaultValue={editing?.maxDiscount || ""} placeholder="بلا سقف" />
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="usageLimit">عدد مرات الاستخدام</Label>
            <Input id="usageLimit" name="usageLimit" type="number" min={0} defaultValue={editing?.usageLimit || ""} placeholder="بلا حد" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perCustomer">لكل عميل (رقم جوال)</Label>
            <Input id="perCustomer" name="perCustomer" type="number" min={0} defaultValue={editing?.perCustomer || ""} placeholder="بلا حد" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start">يبدأ</Label>
            <Input id="start" name="start" type="date" defaultValue={toDay(editing?.startsAt ?? null)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">ينتهي</Label>
            <Input id="end" name="end" type="date" defaultValue={toDay(editing?.endsAt ?? null)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">ملاحظة داخلية</Label>
          <Input id="note" name="note" maxLength={200} defaultValue={editing?.note} placeholder="مثال: حملة العيد على انستغرام" />
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <span className="space-y-0.5">
            <span className="block text-sm font-medium">مفعّلة</span>
            <span className="block text-xs text-muted-foreground">الموقوفة تبقى محفوظة ولا يقبلها المتجر.</span>
          </span>
          <Switch checked={active} onCheckedChange={setActive} />
        </label>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">إلغاء</Button>
        </DialogClose>
        <Button type="submit" disabled={saving}>
          {saving && <IconLoader2 className="size-4 animate-spin" />}
          {editing ? "حفظ التغييرات" : "إنشاء القسيمة"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DiscountsView({ store }: { store: Store }) {
  const [data, setData] = useState<CouponsResponse | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await listCoupons(store.id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحميل القسائم.");
      setData((d) => d ?? { coupons: [], limit: null, plan: "", planName: "", currency: store.currency });
    }
  }, [store.id, store.currency]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => data?.coupons ?? [], [data]);
  const cur = data?.currency || store.currency;
  const deleting = rows.find((c) => c.id === deleteId) ?? null;

  const stats = useMemo(() => {
    const active = rows.filter((c) => statusOf(c) === "نشطة").length;
    return {
      active,
      orders: rows.reduce((s, c) => s + c.orders, 0),
      discounted: rows.reduce((s, c) => s + c.discounted, 0),
      revenue: rows.reduce((s, c) => s + c.revenue, 0),
    };
  }, [rows]);
  const activeCount = rows.filter((c) => c.active).length;

  async function save(input: CouponInput) {
    setSaving(true);
    try {
      if (editing) {
        await updateCoupon(store.id, editing.id, input);
        toast.success("حُفظت القسيمة");
      } else {
        const c = await createCoupon(store.id, input);
        toast.success("أُنشئت القسيمة", { description: `يكتب عملاؤك «${c.code}» في السلة.` });
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحفظ.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: Coupon) {
    try {
      await updateCoupon(store.id, c.id, { active: !c.active });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر التحديث.");
    }
  }

  async function remove() {
    if (!deleteId) return;
    try {
      await deleteCoupon(store.id, deleteId);
      toast.success("حُذفت القسيمة", { description: "الطلبات السابقة تحتفظ بخصمها كما هو." });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الحذف.");
    }
  }

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code).catch(() => {});
    toast.success("نُسخ الرمز", { description: `«${code}» في الحافظة — شاركه مع عملائك.` });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="قسائم الخصم" description="رموز خصم يكتبها عملاؤك في سلة المتجر — نسبة، أو مبلغ، أو توصيل مجاني.">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <IconPlus className="size-4" /> قسيمة جديدة
        </Button>
      </PageHeader>

      {data?.limit != null && (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          باقة {data.planName}: حتى {formatNumber(data.limit)} قسائم مفعّلة معًا ({formatNumber(activeCount)} الآن). الموقوفة لا تُحسب، والباقات المدفوعة بلا حد.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="نشطة الآن" value={formatNumber(stats.active)} hint="يقبلها المتجر في هذه اللحظة" icon={IconDiscount2} />
        <Tile label="طلبات بقسيمة" value={formatNumber(stats.orders)} hint="غير الملغاة" icon={IconReceipt} />
        <Tile label="إجمالي ما خُصم" value={formatMoney(stats.discounted, cur)} hint="ما تنازلت عنه لعملائك" icon={IconTicket} />
        <Tile label="مبيعات بالقسائم" value={formatMoney(stats.revenue, cur)} hint="إجمالي تلك الطلبات بعد الخصم" icon={IconCurrencyDollar} />
      </div>

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="flex items-center justify-between px-6">
            <p className="text-sm font-medium">كل القسائم</p>
            <p className="text-sm text-muted-foreground">{formatNumber(rows.length)}</p>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الرمز</TableHead>
                  <TableHead>الخصم</TableHead>
                  <TableHead className="w-44">الاستخدام</TableHead>
                  <TableHead>الأثر</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المدة</TableHead>
                  <TableHead className="w-10 pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <IconLoader2 className="mx-auto size-5 animate-spin" />
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((c) => {
                  const st = statusOf(c);
                  const pct = c.usageLimit > 0 ? Math.min(100, Math.round((c.used / c.usageLimit) * 100)) : 0;
                  return (
                    <TableRow key={c.id} className={c.active ? undefined : "opacity-60"}>
                      <TableCell className="ps-6">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                            <IconTicket className="size-4" />
                          </span>
                          <div>
                            <span className="font-mono text-sm font-semibold" dir="ltr">{c.code}</span>
                            {c.note && <p className="max-w-48 truncate text-xs text-muted-foreground">{c.note}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{c.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {KIND_LABEL[c.kind]}
                          {c.minSubtotal > 0 && ` · من ${formatMoney(c.minSubtotal, cur)}`}
                          {c.perCustomer > 0 && ` · ${formatNumber(c.perCustomer)} لكل عميل`}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs tabular-nums">
                            <span className="font-medium">{formatNumber(c.used)}</span>
                            <span className="text-muted-foreground">/ {c.usageLimit > 0 ? formatNumber(c.usageLimit) : "∞"}</span>
                          </div>
                          {c.usageLimit > 0 && <Progress value={pct} className="h-1.5" />}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        <p className="text-sm">{formatNumber(c.orders)} طلب</p>
                        <p className="text-xs text-muted-foreground">خُصم {formatMoney(c.discounted, cur)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusStyles[st]}>{st}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        <span className="whitespace-nowrap text-xs">
                          {c.startsAt || c.endsAt
                            ? `${c.startsAt ? formatDateShort(c.startsAt) : "الآن"} – ${c.endsAt ? formatDateShort(c.endsAt) : "مفتوحة"}`
                            : "دائمة"}
                        </span>
                      </TableCell>
                      <TableCell className="pe-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <IconDotsVertical className="size-4" />
                              <span className="sr-only">الإجراءات</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditing(c);
                                setFormOpen(true);
                              }}
                            >
                              <IconPencil className="size-4" /> تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => copyCode(c.code)}>
                              <IconCopy className="size-4" /> نسخ الرمز
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => void toggle(c)}>
                              {c.active ? <IconPlayerPause className="size-4" /> : <IconPlayerPlay className="size-4" />}
                              {c.active ? "إيقاف" : "تفعيل"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteId(c.id)}>
                              <IconTrash className="size-4" /> حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <IconTicket className="mx-auto mb-2 size-6 opacity-50" />
                      لا قسائم بعد. أنشئ أول رمز — مثل «WELCOME10» لأول طلب.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <CouponForm key={editing?.id ?? "new"} editing={editing} currency={cur} saving={saving} onSubmit={save} />
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        name={deleting?.code ?? "القسيمة"}
        onConfirm={() => void remove()}
      />
    </div>
  );
}

export default function DiscountsPage() {
  return <RequireStore>{(store) => <DiscountsView store={store} />}</RequireStore>;
}
