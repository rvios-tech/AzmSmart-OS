"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconLoader2, IconShieldLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { resendCode } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/auth-context";
import { readPendingEmail } from "@/lib/auth/pending";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const LENGTH = 6;
/** مهلة الخادم بين رسالتين */
const RESEND_SECONDS = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyEmailCode } = useAuth();
  const [email] = React.useState(() => (typeof window === "undefined" ? null : readPendingEmail()));
  const [digits, setDigits] = React.useState<string[]>(Array(LENGTH).fill(""));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [wait, setWait] = React.useState(RESEND_SECONDS);
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");
  const complete = code.length === LENGTH;

  // وصل هنا بلا دخول سابق: لا بريد نتحقق منه
  React.useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  React.useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  function setAt(i: number, value: string) {
    setDigits((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function handleChange(i: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setAt(i, "");
      return;
    }
    // دعم لصق الرمز كاملاً داخل أي خانة.
    if (value.length > 1) {
      const chars = value.slice(0, LENGTH - i).split("");
      setDigits((prev) => {
        const next = [...prev];
        chars.forEach((c, k) => (next[i + k] = c));
        return next;
      });
      const last = Math.min(i + chars.length, LENGTH - 1);
      inputs.current[last]?.focus();
      return;
    }
    setAt(i, value);
    if (i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    // خانات الرمز مرتبة من اليسار لليمين حتى في RTL، لذا يتحرك السهم الأيمن
    // إلى الخانة السابقة والأيسر إلى التالية.
    if (e.key === "ArrowRight" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    setError(null);
    setSubmitting(true);
    try {
      await verifyEmailCode(code);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر التحقق. حاول مجدداً.");
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!email || wait > 0) return;
    setError(null);
    setWait(RESEND_SECONDS);
    setDigits(Array(LENGTH).fill(""));
    inputs.current[0]?.focus();
    try {
      await resendCode(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إعادة الإرسال.");
    }
  }

  if (!email) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border bg-card">
          <IconShieldLock className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">تحقّق من بريدك</h1>
        <p className="text-sm text-muted-foreground">
          أرسلنا رمزاً من 6 أرقام إلى{" "}
          <span className="font-medium text-foreground" dir="ltr">{email}</span>
          . أدخله أدناه للمتابعة، وإن لم تجده فانظر في مجلد الرسائل غير المرغوبة.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {/* خانات الرمز تُقرأ من اليسار لليمين كالأرقام. */}
        <div className="flex justify-between gap-2" dir="ltr">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              aria-label={`الخانة ${formatNumber(i + 1)}`}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              autoFocus={i === 0}
              maxLength={LENGTH}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={cn(
                "size-12 rounded-lg border bg-background text-center text-lg! font-semibold tabular-nums shadow-sm outline-none transition-colors",
                "focus:border-ring focus:ring-2 focus:ring-ring/40",
                d && "border-foreground/30"
              )}
            />
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={!complete || submitting}>
          {submitting && <IconLoader2 className="size-4 animate-spin" />}
          تحقّق
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        لم يصلك الرمز؟{" "}
        {wait > 0 ? (
          <span className="tabular-nums">إعادة الإرسال بعد {formatNumber(wait)} ثانية</span>
        ) : (
          <button type="button" className="font-medium text-foreground hover:underline" onClick={() => void resend()}>
            إعادة الإرسال
          </button>
        )}
      </p>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <IconArrowRight className="size-4" /> العودة لتسجيل الدخول
      </Link>
    </div>
  );
}
