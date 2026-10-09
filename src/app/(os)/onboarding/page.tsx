"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  IconSparkles,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconUser,
  IconBuildingStore,
  IconUsers,
  IconConfetti,
  IconMail,
  IconPlus,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";

const steps = [
  { title: "الحساب", subtitle: "عرّفنا بنفسك", icon: IconUser },
  { title: "مساحة العمل", subtitle: "جهّز فريقك", icon: IconBuildingStore },
  { title: "الدعوات", subtitle: "ادعُ فريقك", icon: IconUsers },
  { title: "الإنهاء", subtitle: "كل شيء جاهز", icon: IconConfetti },
];

const teamSizes = ["أنا فقط", "2–10", "11–50", "51–200", "+200"];

type Invite = { id: number; email: string; role: string };

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const [fullName, setFullName] = useState("أحمد العمري");
  const [email, setEmail] = useState("ahmed.alamri@azmsmart.sa");
  const [password, setPassword] = useState("");

  const [workspace, setWorkspace] = useState("عزم سمارت");
  const [slug, setSlug] = useState("azmsmart");
  const [teamSize, setTeamSize] = useState("11–50");
  const [industry, setIndustry] = useState("saas");

  const [invites, setInvites] = useState<Invite[]>([
    { id: 1, email: "sara.alrashdi@azmsmart.sa", role: "admin" },
    { id: 2, email: "abdallah.alshammari@azmsmart.sa", role: "member" },
    { id: 3, email: "", role: "member" },
  ]);

  const isLast = step === steps.length - 1;
  const progress = (step / (steps.length - 1)) * 100;

  function next() {
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function updateInvite(id: number, patch: Partial<Invite>) {
    setInvites((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  }
  function addInvite() {
    setInvites((prev) => [
      ...prev,
      { id: (prev.at(-1)?.id ?? 0) + 1, email: "", role: "member" },
    ]);
  }
  function removeInvite(id: number) {
    setInvites((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconSparkles className="size-5" />
          </span>
          <span className="tracking-tight">عزم سمارت</span>
        </Link>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">تخطٍّ الآن</Link>
        </Button>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {/* Progress rail + stepper */}
          <div className="mb-8">
            <div className="mb-5 flex items-start">
              {steps.map((s, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <Fragment key={s.title}>
                    <div className="flex w-16 shrink-0 flex-col items-center gap-2">
                      <div
                        className={`flex size-9 items-center justify-center rounded-full border text-sm font-medium transition-colors ${
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : active
                              ? "border-primary bg-background text-foreground"
                              : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {done ? (
                          <IconCheck className="size-4" />
                        ) : (
                          <s.icon className="size-4" />
                        )}
                      </div>
                      <span
                        className={`hidden text-center text-xs sm:block ${
                          active || done
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="mt-4 h-px flex-1 bg-border">
                        <div
                          className="h-px bg-primary transition-all"
                          style={{ width: done ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
            {step === 0 && (
              <div className="space-y-6">
                <StepHeading
                  eyebrow="الخطوة 1 من 4"
                  title="مرحباً بك في عزم سمارت"
                  description="لنجهّز حسابك، لن يستغرق الأمر سوى دقيقة."
                />
                <div className="space-y-4">
                  <Field label="الاسم الكامل" htmlFor="name">
                    <Input
                      id="name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: نورة المطيري"
                    />
                  </Field>
                  <Field label="بريد العمل" htmlFor="email">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="noura@azmsmart.sa"
                    />
                  </Field>
                  <Field label="كلمة المرور" htmlFor="password" hint="8 أحرف على الأقل">
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أنشئ كلمة مرور قوية"
                    />
                  </Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <StepHeading
                  eyebrow="الخطوة 2 من 4"
                  title="أنشئ مساحة عملك"
                  description="هنا ستتعاون أنت وفريقك."
                />
                <div className="space-y-4">
                  <Field label="اسم مساحة العمل" htmlFor="workspace">
                    <Input
                      id="workspace"
                      value={workspace}
                      onChange={(e) => setWorkspace(e.target.value)}
                      placeholder="عزم سمارت"
                    />
                  </Field>
                  <Field label="رابط مساحة العمل" htmlFor="slug">
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupText>azmsmart.sa/</InputGroupText>
                      </InputGroupAddon>
                      <InputGroupInput
                        id="slug"
                        value={slug}
                        onChange={(e) =>
                          setSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, ""),
                          )
                        }
                        placeholder="your-team"
                      />
                    </InputGroup>
                  </Field>
                  <Field label="حجم الشركة">
                    <RadioGroup
                      value={teamSize}
                      onValueChange={setTeamSize}
                      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
                    >
                      {teamSizes.map((size) => (
                        <Label
                          key={size}
                          htmlFor={`size-${size}`}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm font-normal transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                        >
                          <RadioGroupItem id={`size-${size}`} value={size} />
                          {size}
                        </Label>
                      ))}
                    </RadioGroup>
                  </Field>
                  <Field label="القطاع" htmlFor="industry">
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger id="industry" className="w-full">
                        <SelectValue placeholder="اختر القطاع" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saas">البرمجيات والخدمات السحابية</SelectItem>
                        <SelectItem value="ecommerce">التجارة الإلكترونية</SelectItem>
                        <SelectItem value="fintech">التقنية المالية</SelectItem>
                        <SelectItem value="agency">وكالة</SelectItem>
                        <SelectItem value="education">التعليم</SelectItem>
                        <SelectItem value="other">قطاع آخر</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <StepHeading
                  eyebrow="الخطوة 3 من 4"
                  title="ادعُ فريقك"
                  description="العمل الجماعي أفضل. أضف زملاءك الآن أو لاحقاً."
                />
                <div className="space-y-3">
                  {invites.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <IconMail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={inv.email}
                          onChange={(e) =>
                            updateInvite(inv.id, { email: e.target.value })
                          }
                          placeholder="zameel@azmsmart.sa"
                          className="ps-9"
                        />
                      </div>
                      <Select
                        value={inv.role}
                        onValueChange={(v) => updateInvite(inv.id, { role: v })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مدير</SelectItem>
                          <SelectItem value="member">عضو</SelectItem>
                          <SelectItem value="viewer">مُشاهد</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground"
                        onClick={() => removeInvite(inv.id)}
                        aria-label="حذف الدعوة"
                      >
                        <IconX className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={addInvite}
                >
                  <IconPlus className="size-4" /> إضافة آخر
                </Button>
                <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-sm text-muted-foreground">
                  Teammates will receive an email invitation to join{" "}
                  <span className="font-medium text-foreground">{workspace}</span>
                  . You can manage roles anytime from settings.
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 py-4 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <IconConfetti className="size-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    You&apos;re all set!
                  </h2>
                  <p className="mx-auto max-w-sm text-muted-foreground">
                    Your workspace{" "}
                    <span className="font-medium text-foreground">
                      {workspace}
                    </span>{" "}
                    is ready to go. Jump in and start building.
                  </p>
                </div>

                <div className="mx-auto max-w-sm space-y-3 rounded-xl border bg-muted/30 p-4 text-start">
                  <SummaryRow label="الحساب" value={fullName} />
                  <Separator />
                  <SummaryRow label="مساحة العمل" value={`azmsmart.sa/${slug || "azmsmart"}`} />
                  <Separator />
                  <SummaryRow
                    label="المدعوّون"
                    value={`${invites.filter((i) => i.email.trim()).length} teammates`}
                  />
                </div>

                <Button size="lg" className="h-11 w-full gap-2 px-6 text-sm" asChild>
                  <Link href="/dashboard">
                    الانتقال إلى لوحة التحكم <IconArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Footer controls */}
            {!isLast && (
              <>
                <Separator className="my-6" />
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={back}
                    disabled={step === 0}
                    className="gap-1.5"
                  >
                    <IconArrowLeft className="size-4" /> رجوع
                  </Button>
                  <Button onClick={next} className="gap-1.5">
                    {step === steps.length - 2 ? "إنهاء الإعداد" : "متابعة"}
                    <IconArrowRight className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {!isLast && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Need help?{" "}
              <Link
                href="/dashboard"
                className="font-medium text-foreground hover:underline"
              >
                تواصل مع الدعم
              </Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function StepHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
