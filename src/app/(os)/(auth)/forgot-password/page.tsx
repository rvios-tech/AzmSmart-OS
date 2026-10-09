import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "نسيت كلمة المرور" };

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          نسيت كلمة المرور؟
        </h1>
        <p className="text-sm text-muted-foreground">
          لا تقلق، سنرسل لك تعليمات إعادة التعيين.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            type="email"
            dir="ltr"
            className="text-start"
            placeholder="ahmed@azmsmart.sa"
          />
        </div>
        <Button asChild className="w-full">
          <Link href="/login">إرسال رابط إعادة التعيين</Link>
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <IconArrowRight className="size-4" /> العودة لتسجيل الدخول
      </Link>
    </div>
  );
}
