"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { forgotPassword } from "@/lib/api/auth";
import { setPendingEmail } from "@/lib/auth/pending";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const clean = email.trim();
      await forgotPassword(clean);
      setPendingEmail(clean);
      router.push("/reset-password");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "تعذّر إرسال الرمز. حاول مجدداً.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">نسيت كلمة المرور؟</h1>
        <p className="text-sm text-muted-foreground">اكتب بريد حسابك، وسنرسل إليه رمزاً لتعيين كلمة مرور جديدة.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input id="email" type="email" dir="ltr" className="text-start" required autoComplete="email"
            placeholder="ahmed@rvios.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <IconLoader2 className="size-4 animate-spin" />}
          إرسال الرمز
        </Button>
      </form>

      <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة لتسجيل الدخول
      </Link>
    </div>
  );
}
