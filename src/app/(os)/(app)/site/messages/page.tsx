"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconLoader2, IconAlertTriangle, IconInbox } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  listContacts,
  updateContactStatus,
  CONTACT_STATUS,
  CONTACT_STATUS_LABELS,
  type CmsContact,
  type ContactStatus,
} from "@/lib/api/cms";

const statusStyles: Record<ContactStatus, string> = {
  [CONTACT_STATUS.UNREAD]: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  [CONTACT_STATUS.READ]: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  [CONTACT_STATUS.REPLIED]: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const tabs = ["الكل", ...Object.values(CONTACT_STATUS_LABELS)] as const;

export default function SiteMessagesPage() {
  const [rows, setRows] = useState<CmsContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("الكل");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listContacts()
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : "تعذّر تحميل الرسائل."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (tab === "الكل" ? rows : rows.filter((c) => CONTACT_STATUS_LABELS[c.status] === tab)),
    [rows, tab],
  );

  async function setStatus(id: string, status: ContactStatus) {
    try {
      const updated = await updateContactStatus(id, status);
      setRows((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر تحديث الرسالة.");
    }
  }

  function toggleExpand(contact: CmsContact) {
    setExpandedId((prev) => (prev === contact.id ? null : contact.id));
    if (contact.status === CONTACT_STATUS.UNREAD) {
      void setStatus(contact.id, CONTACT_STATUS.READ);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="رسائل التواصل" description="الرسائل الواردة من نموذج التواصل في الموقع الرئيسي." />

      <Card>
        <CardContent className="space-y-4 px-0">
          <div className="px-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>{tabs.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}</TabsList>
            </Tabs>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-6">المرسل</TableHead>
                <TableHead>الخدمة المطلوبة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead className="pe-6 w-32">إجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <IconLoader2 className="mx-auto mb-2 size-6 animate-spin" /> جارٍ التحميل…
                </TableCell></TableRow>
              )}
              {!loading && error && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-destructive">
                  <IconAlertTriangle className="mx-auto mb-2 size-6" /> {error}
                </TableCell></TableRow>
              )}
              {!loading && !error && filtered.map((c) => (
                <Fragment key={c.id}>
                  <TableRow className="cursor-pointer" onClick={() => toggleExpand(c)}>
                    <TableCell className="ps-6">
                      <div className="flex items-center gap-2 font-medium">
                        {c.status === CONTACT_STATUS.UNREAD && <span className="size-1.5 rounded-full bg-blue-500" />}
                        {c.name}
                      </div>
                      <p className="text-xs text-muted-foreground" dir="ltr">{c.email ?? c.phone}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.service ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusStyles[c.status]}>
                        {CONTACT_STATUS_LABELS[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">{formatDateShort(c.createdAt)}</TableCell>
                    <TableCell className="pe-6">
                      {c.status !== CONTACT_STATUS.REPLIED && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            void setStatus(c.id, CONTACT_STATUS.REPLIED);
                          }}
                        >
                          تم الرد
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedId === c.id && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="bg-muted/30 px-6 py-4 text-sm">
                        <p className="whitespace-pre-wrap">{c.message}</p>
                        {c.phone && <p className="mt-2 text-xs text-muted-foreground">الهاتف: {c.phone}</p>}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  <IconInbox className="mx-auto mb-2 size-6 opacity-50" /> لا توجد رسائل.
                </TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
