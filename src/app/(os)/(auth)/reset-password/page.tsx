"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight, IconEye, IconEyeOff, IconLoader2, IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { resetPassword } from "@/lib/api/auth";
import { clearPendingEmail, readPendingEmail } from "@/lib/auth/pending";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email] = React.useState(() => (typeof window === "undefined" ? null : readPendingEmail()));
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!email) router.replace("/forgot-password");
  }, [email, router]);

  const match = confirm.length > 0 && confirm === password;
  const ok = /^\d{6}$/.test(code) && password.length >= 8 && match;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !ok) return;
    setError(null);
    setSubmitting(true);
    try {
      await resetPassword({ email, code, newPassword: password });
      clearPendingEmail();
      toast.success("تغيّرت كلمة المرور — سجّل الدخول بها");
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر تغيير كلمة المرور.");
      setSubmitting(false);
    }
  }

  if (!email) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border bg-card">
          <IconLock className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">تعيين كلمة مرور جديدة</h1>
        <p className="text-sm text-muted-foreground">
          إن كان <span className="font-medium text-foreground" dir="ltr">{email}</span> مسجَّلاً لدينا فقد أرسلنا إليه رمزاً من 6 أرقام.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="code">الرمز</Label>
          <Input id="code" dir="ltr" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="text-center tracking-[.4em]"
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور الجديدة</Label>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} className="pe-10"
              placeholder="ثماني خانات على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>
              {show ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
          <Input id="confirm" type={show ? "text" : "password"} autoComplete="new-password"
            placeholder="أعد إدخال كلمة المرور" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {confirm.length > 0 && !match && <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين</p>}
        </div>
        <Button type="submit" className="w-full" disabled={!ok || submitting}>
          {submitting && <IconLoader2 className="size-4 animate-spin" />}
          تغيير كلمة المرور
        </Button>
      </form>

      <Link href="/forgot-password" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> طلب رمز جديد
      </Link>
    </div>
  );
}
