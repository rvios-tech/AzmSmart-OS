"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  IconAlertTriangle,
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconKey,
  IconLoader2,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { DeleteDialog } from "@/components/delete-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { createApiKey, listApiKeys, revokeApiKey, type ApiKeySummary } from "@/lib/api/developers";
import { formatDateShort, formatRelativeTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/workspace/roles";
import { WebhooksSection } from "./webhooks-section";
import { useWorkspace } from "@/lib/workspace/workspace-context";

/** «موظف» في ترقيم الأدوار (الأصغر = صلاحية أعلى). */
const EMPLOYEE_ROLE = 8;

async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard?.writeText(text);
    toast.success(`تم نسخ ${label}`);
  } catch {
    toast.error("تعذّر النسخ — انسخه يدويًا.");
  }
}

/**
 * مفاتيح API حقيقية: تعمل فعليًا عبر ترويسة `x-api-key` بديلًا عن رمز
 * الدخول، بصلاحية الدور الذي اختاره مُصدِرها — لا عرض بلا أثر.
 */
export default function DevelopersPage() {
  const { ctx } = useWorkspace();
  const myRole = ctx?.role ?? 9;

  const [keys, setKeys] = useState<ApiKeySummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  // الافتراضي «موظف» لا دور المُصدِر: مفتاح بصلاحية مالك لتكامل خارجي
  // يجب أن يكون اختيارًا واعيًا لا نتيجة ترك القائمة كما هي.
  const defaultRole = String(Math.max(myRole, EMPLOYEE_ROLE));
  const [role, setRole] = useState(defaultRole);
  const [creating, setCreating] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const [revokeId, setRevokeId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setKeys(await listApiKeys());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تحميل المفاتيح.");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  function openCreate() {
    setName("");
    setRole(defaultRole);
    setCreatedSecret(null);
    setCreateOpen(true);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("اسم المفتاح مطلوب");
    setCreating(true);
    try {
      const created = await createApiKey({ name: name.trim(), role: Number(role) });
      setCreatedSecret(created.secret);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إنشاء المفتاح.");
    } finally {
      setCreating(false);
    }
  }

  async function doRevoke() {
    if (!revokeId) return;
    try {
      await revokeApiKey(revokeId);
      await load();
      toast.success("أُبطل المفتاح");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر الإبطال.");
    } finally {
      setRevokeId(null);
    }
  }

  const revoking = keys?.find((k) => k.id === revokeId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title="المطورون" description="مفاتيح API وخطافات ويب حقيقية لتكامل أنظمتك الخارجية مع بيانات شركتك.">
        <Button size="sm" onClick={openCreate}>
          <IconPlus className="size-4" /> إنشاء مفتاح
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            أرفق المفتاح بترويسة <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">x-api-key</code> في
            طلباتك بدل رمز الدخول. يعمل المفتاح بصلاحية الدور الذي اخترته له تحديدًا — نفس قواعد الأدوار المفروضة على
            أعضاء الفريق حرفيًا، فمفتاح بدور «ضيف» يقرأ ولا يكتب.
          </p>
          <p>إن أُنزلت رتبتك لاحقًا أو أُزلتَ من الشركة، تضعف كل مفاتيحك أو تتوقف معك تلقائيًا — لا حاجة لإبطالها يدويًا.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconKey className="size-5" /> المفاتيح
          </CardTitle>
          <CardDescription>السرّ الكامل يظهر مرة واحدة فقط عند الإنشاء — احفظه فورًا.</CardDescription>
          <CardAction>
            <Button size="sm" variant="outline" onClick={openCreate}>
              <IconPlus className="size-4" /> إنشاء مفتاح
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="ps-6">الاسم</TableHead>
                  <TableHead>المفتاح</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>أُنشئ</TableHead>
                  <TableHead>آخر استخدام</TableHead>
                  <TableHead className="w-16 pe-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {!keys && !error && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center"><IconLoader2 className="mx-auto size-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                )}
                {error && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-destructive"><IconAlertTriangle className="mx-auto mb-2 size-6" />{error}</TableCell></TableRow>
                )}
                {keys?.map((k) => (
                  <TableRow key={k.id} className={k.revokedAt ? "opacity-60" : undefined}>
                    <TableCell className="ps-6 font-medium">{k.name}</TableCell>
                    <TableCell><code className="rounded bg-muted px-2 py-1 font-mono text-xs" dir="ltr">{k.prefix}</code></TableCell>
                    <TableCell><Badge variant="secondary">{ROLE_LABELS[k.role] ?? k.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatDateShort(k.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {k.revokedAt ? <span className="text-destructive">أُبطل {formatDateShort(k.revokedAt)}</span>
                        : k.lastUsedAt ? formatRelativeTime(k.lastUsedAt) : "لم يُستخدم بعد"}
                    </TableCell>
                    <TableCell className="pe-6 text-start">
                      {!k.revokedAt && (
                        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => setRevokeId(k.id)}>
                          <IconTrash className="size-4" /><span className="sr-only">إبطال</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {keys && keys.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground"><IconKey className="mx-auto mb-2 size-6 opacity-50" />لا مفاتيح بعد.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreatedSecret(null); }}>
        <DialogContent>
          {createdSecret ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconCircleCheck className="size-5 text-emerald-500" /> أُنشئ المفتاح
                </DialogTitle>
                <DialogDescription>انسخه الآن — لن يظهر السرّ الكامل مرة أخرى بعد إغلاق هذه النافذة.</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                <code className="flex-1 overflow-x-auto font-mono text-xs" dir="ltr">{createdSecret}</code>
                <Button size="sm" variant="outline" onClick={() => void copyToClipboard(createdSecret, "المفتاح")}>
                  <IconCopy className="size-4" /> نسخ
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => { setCreateOpen(false); setCreatedSecret(null); }}>
                  <IconCheck className="size-4" /> حفظتُه، إغلاق
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={submitCreate}>
              <DialogHeader>
                <DialogTitle>مفتاح جديد</DialogTitle>
                <DialogDescription>اختر اسمًا يذكّرك بمكان استعماله، ودورًا لا يتجاوز صلاحيتك.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">الاسم</Label>
                  <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="مثال: تكامل المتجر الخارجي" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label>الدور</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_LABELS.map((l, i) => i >= myRole && <SelectItem key={l} value={String(i)}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">يقرأ ويكتب بما يسمح به هذا الدور بالضبط — «ضيف» للقراءة فقط.</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={creating}>
                  {creating && <IconLoader2 className="size-4 animate-spin" />} إنشاء
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={revokeId !== null}
        onOpenChange={(o) => { if (!o) setRevokeId(null); }}
        name={revoking ? revoking.name : "المفتاح"}
        description={revoking ? `سيتوقّف «${revoking.name}» عن العمل فورًا. لا يمكن التراجع.` : undefined}
        onConfirm={() => void doRevoke()}
      />

      <WebhooksSection />
    </div>
  );
}
