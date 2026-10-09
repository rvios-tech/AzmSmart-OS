"use client";

import { useState } from "react";
import Link from "next/link";
import {
  IconLock,
  IconEye,
  IconEyeOff,
  IconArrowLeft,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { currentUser } from "@/data";

export default function LockPage() {
  const [show, setShow] = useState(false);

  const initials = currentUser.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const firstName = currentUser.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <Avatar className="size-20">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-1 -end-1 flex size-7 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground">
            <IconLock className="size-3.5" />
          </span>
        </div>
        <div className="space-y-1.5">
          <p className="font-medium">{currentUser.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            جلستك مقفلة
          </h1>
          <p className="text-sm text-muted-foreground">
            أهلاً بعودتك يا {firstName}. أدخل كلمة المرور لإلغاء القفل ومتابعة
            عملك من حيث توقفت.
          </p>
        </div>
      </div>

      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lock-password">كلمة المرور</Label>
          <div className="relative">
            <Input
              id="lock-password"
              type={show ? "text" : "password"}
              defaultValue="password"
              className="pe-10"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {show ? (
                <IconEyeOff className="size-4" />
              ) : (
                <IconEye className="size-4" />
              )}
            </button>
          </div>
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard">
            إلغاء القفل <IconArrowLeft className="size-4" />
          </Link>
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        لست أنت؟{" "}
        <Link
          href="/login"
          className="font-medium text-foreground hover:underline"
        >
          تسجيل الدخول بحساب آخر
        </Link>
      </p>
    </div>
  );
}
