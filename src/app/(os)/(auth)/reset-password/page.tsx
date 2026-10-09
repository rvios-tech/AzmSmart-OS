"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconEye,
  IconEyeOff,
  IconCheck,
  IconLock,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const rules = [
  { label: "8 أحرف على الأقل", test: (v: string) => v.length >= 8 },
  { label: "حرف كبير واحد", test: (v: string) => /[A-Z]/.test(v) },
  { label: "رقم واحد", test: (v: string) => /[0-9]/.test(v) },
  { label: "رمز واحد", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);

  const passed = rules.filter((r) => r.test(password)).length;
  const strength = (passed / rules.length) * 100;
  const match = confirm.length > 0 && confirm === password;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl border bg-card">
          <IconLock className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">تعيين كلمة مرور جديدة</h1>
        <p className="text-sm text-muted-foreground">
          يجب أن تختلف كلمة المرور الجديدة عن كلمات المرور السابقة.
        </p>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">كلمة المرور الجديدة</Label>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="أدخل كلمة مرور جديدة"
              className="pe-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {show ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
            </button>
          </div>

          {/* مؤشر قوة كلمة المرور */}
          <div className="flex gap-1.5 pt-1">
            {rules.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < passed
                    ? passed <= 2
                      ? "bg-amber-500"
                      : passed === 3
                        ? "bg-sky-500"
                        : "bg-emerald-500"
                    : "bg-muted"
                )}
              />
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-1.5 pt-1">
            {rules.map((r) => {
              const ok = r.test(password);
              return (
                <li
                  key={r.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs",
                    ok ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-3.5 items-center justify-center rounded-full",
                      ok ? "bg-emerald-500 text-white" : "bg-muted"
                    )}
                  >
                    {ok && <IconCheck className="size-2.5" />}
                  </span>
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">تأكيد كلمة المرور</Label>
          <Input
            id="confirm"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="أعد إدخال كلمة المرور"
          />
          {confirm.length > 0 && !match && (
            <p className="text-xs text-destructive">كلمتا المرور غير متطابقتين.</p>
          )}
        </div>

        <Button
          asChild
          className="w-full"
          disabled={strength < 100 || !match}
        >
          <Link href="/login">إعادة تعيين كلمة المرور</Link>
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
