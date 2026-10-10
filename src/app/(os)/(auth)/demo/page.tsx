"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconBuildingStore, IconChartBar, IconEye, IconFileInvoice, IconLayoutKanban, IconLoader2, IconUsers, IconCalendarEvent,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/client";

const MODULES = [
  { icon: IconChartBar, title: "لوحة التحكم والتقارير", text: "المبيعات والزيارات والتحويل على ٤٥ يومًا" },
  { icon: IconBuildingStore, title: "المتجر الإلكتروني", text: "منتجات وطلبات ومخزون وتقييمات حقيقية" },
  { icon: IconFileInvoice, title: "العملاء والفواتير", text: "فواتير بكل حالاتها ومتابعة التحصيل" },
  { icon: IconLayoutKanban, title: "المشاريع والمهام", text: "لوحات مهام ومراحل وفريق يعمل" },
  { icon: IconCalendarEvent, title: "الاجتماعات والمتابعات", text: "جدول الفريق وما يُنجز بعده" },
  { icon: IconUsers, title: "الفريق والصلاحيات", text: "سبعة أعضاء بأدوار مختلفة" },
];

/**
 * دخول العرض التجريبي — لوحة تحكم كاملة لشركة تجارية ببياناتها، للمشاهدة فقط.
 * الخادم يرفض أي كتابة في شركة العرض، فالزائر يتجوّل بحرية دون أن يغيّر شيئًا.
 */
export default function DemoPage() {
  const router = useRouter();
  const { enterDemo } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enter() {
    setBusy(true);
    setError(null);
    try {
      await enterDemo();
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر فتح العرض الآن. حاول بعد قليل.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
          <IconEye className="size-3.5" /> عرض تجريبي — بلا تسجيل
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">جرّب عزم سمارت كاملًا</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          ادخل لوحة تحكم «مؤسسة الواحة للتجارة» — شركة ببيانات واقعية في كل وحدة — وتجوّل فيها كما يفعل فريقها كل يوم.
        </p>
      </div>

      <ul className="grid gap-3">
        {MODULES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3 rounded-lg border bg-card/50 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <span className="space-y-0.5">
              <b className="block text-sm font-medium">{title}</b>
              <span className="block text-xs text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-3">
        <Button className="w-full" size="lg" onClick={() => void enter()} disabled={busy}>
          {busy && <IconLoader2 className="size-4 animate-spin" />} ادخل لوحة التحكم
        </Button>
        <p className="text-center text-xs text-muted-foreground">العرض للمشاهدة فقط — لا يُحفظ فيه أي تعديل.</p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        جاهز لبياناتك أنت؟{" "}
        <Link href="/register" className="font-medium text-foreground hover:underline">أنشئ حسابك مجانًا</Link>
      </p>
    </div>
  );
}
