"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { IconCircleCheck, IconClock, IconLoader2, IconLock, IconRosetteDiscountCheck, IconTrash, IconUpload } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { PrivateImage } from "@/components/shop/private-image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApiError } from "@/lib/api/client";
import {
  getKyc, kycDocPath, removeKycDoc, saveKyc, submitKyc, uploadKycDoc, type Kyc, type KycDocKind, type Store,
} from "@/lib/api/shop";
import { formatDateShort } from "@/lib/format";
import { useWorkspace } from "@/lib/workspace/workspace-context";

const SLOTS: { kind: KycDocKind; label: string; hint: string; need: "always" | "business" | "optional" }[] = [
  { kind: "id_front", label: "وجه الهوية", hint: "بطاقة شخصية أو جواز أو إقامة — صاحب المتجر", need: "always" },
  { kind: "id_back", label: "ظهر الهوية", hint: "للبطاقة ذات الوجهين", need: "optional" },
  { kind: "selfie", label: "صورتك مع الهوية", hint: "تسرّع المراجعة", need: "optional" },
  { kind: "cr", label: "السجل التجاري", hint: "للمنشآت المسجّلة", need: "business" },
];

const err = (e: unknown, f: string) => toast.error(e instanceof ApiError ? e.message : f);

function VerificationView({ store }: { store: Store }) {
  const [k, setK] = useState<Kyc | null>(null);
  const [kind, setKind] = useState<"person" | "business">("person");
  const [legalName, setLegalName] = useState("");
  const [crNumber, setCr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const files = useRef<Partial<Record<KycDocKind, HTMLInputElement | null>>>({});

  function apply(r: Kyc) {
    setK(r);
    setKind(r.kind);
    setLegalName(r.legalName);
    setCr(r.crNumber);
  }
  useEffect(() => { void getKyc(store.id).then(apply, (e) => { err(e, "تعذّر التحميل."); }); }, [store.id]);

  if (!k) return <div className="flex h-60 items-center justify-center"><IconLoader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  const locked = k.status === 1 || k.verified;
  const doc = (kind: KycDocKind) => k.docs.find((d) => d.kind === kind);
  const dirty = kind !== k.kind || legalName.trim() !== k.legalName || crNumber.trim() !== k.crNumber;

  // رفع وثيقة أو حذفها لا يمسّ ما يُكتب في الحقول ولم يُحفظ بعد
  async function run(key: string, f: () => Promise<Kyc>, ok?: string, fields = true) {
    setBusy(key);
    try { const r = await f(); if (fields) apply(r); else setK(r); if (ok) toast.success(ok); } catch (e) { err(e, "تعذّر الحفظ."); } finally { setBusy(null); }
  }
  const save = () => saveKyc(store.id, { kind, legalName: legalName.trim(), ...(crNumber.trim() ? { crNumber: crNumber.trim() } : {}) });

  return (
    <div className="space-y-6">
      <PageHeader title="توثيق المتجر" description="وثّق هويتك مرة واحدة فيظهر لمتجرك شارة «متجر موثَّق» تطمئن العملاء قبل الطلب." />

      {k.verified ? (
        <Alert className="border-emerald-500/40 bg-emerald-500/5">
          <IconRosetteDiscountCheck className="size-4 text-emerald-600" />
          <AlertTitle>متجرك موثَّق</AlertTitle>
          <AlertDescription>تظهر الشارة في صفحات متجرك.{k.reviewedAt ? ` وُثّق في ${formatDateShort(k.reviewedAt)}.` : ""}</AlertDescription>
        </Alert>
      ) : k.status === 1 ? (
        <Alert>
          <IconClock className="size-4" />
          <AlertTitle>طلبك قيد المراجعة</AlertTitle>
          <AlertDescription>يراجعه فريق RVIOS عادة خلال يوم عمل، ويصلك إشعار بالقرار.</AlertDescription>
        </Alert>
      ) : k.status === 3 ? (
        <Alert variant="destructive">
          <AlertTitle>يحتاج طلبك تصحيحًا</AlertTitle>
          <AlertDescription>{k.reviewNote} — صحّح ما يلزم ثم أعد الإرسال.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>صاحب المتجر</CardTitle><CardDescription>كما هو مكتوب في الوثيقة تمامًا.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={kind} onValueChange={(v) => setKind(v as "person" | "business")} disabled={locked} className="flex gap-6">
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="person" /> فرد</label>
                <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="business" /> منشأة بسجل تجاري</label>
              </RadioGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="ln">{kind === "business" ? "اسم المنشأة الرسمي" : "الاسم الكامل"}</Label><Input id="ln" value={legalName} disabled={locked} maxLength={120} onChange={(e) => setLegalName(e.target.value)} /></div>
                {kind === "business" && <div className="space-y-2"><Label htmlFor="cr">رقم السجل التجاري</Label><Input id="cr" dir="ltr" value={crNumber} disabled={locked} maxLength={40} onChange={(e) => setCr(e.target.value)} /></div>}
              </div>
              {!locked && <Button variant="outline" disabled={!dirty || legalName.trim().length < 3 || busy !== null} onClick={() => void run("info", save, "حُفظت البيانات")}>{busy === "info" && <IconLoader2 className="size-4 animate-spin" />} حفظ البيانات</Button>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>الوثائق</CardTitle><CardDescription>صورة واضحة كاملة الأطراف، JPG أو PNG حتى ١٠ م.ب.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {SLOTS.filter((x) => x.need !== "business" || kind === "business").map((x) => {
                const d = doc(x.kind);
                return (
                  <div key={x.kind} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium">{x.label}{x.need !== "optional" && <span className="text-destructive"> *</span>}</p>
                      <span className="text-xs text-muted-foreground">{x.need === "optional" ? "اختياري" : "مطلوب"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{x.hint}</p>
                    {d ? <PrivateImage path={kycDocPath(store.id, d.id)} alt={x.label} className="aspect-[3/2] w-full" onClick={setZoom} />
                      : <div className="flex aspect-[3/2] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">لم تُرفع بعد</div>}
                    {!locked && (
                      <div className="flex gap-2">
                        <input ref={(el) => { files.current[x.kind] = el; }} type="file" accept="image/jpeg,image/png,image/webp" hidden
                          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void run(x.kind, () => uploadKycDoc(store.id, x.kind, f), "رُفعت الوثيقة", false); }} />
                        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => files.current[x.kind]?.click()}>
                          {busy === x.kind ? <IconLoader2 className="size-4 animate-spin" /> : <IconUpload className="size-4" />} {d ? "استبدال" : "رفع"}
                        </Button>
                        {d && <Button size="sm" variant="ghost" className="text-destructive" disabled={busy !== null} onClick={() => void run(x.kind, () => removeKycDoc(store.id, d.id), undefined, false)}><IconTrash className="size-4" /></Button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><IconLock className="size-4" /> خصوصية وثائقك</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>لا رابط عامًا للوثائق: لا يراها إلا مالك المتجر ومديروه وفريق مراجعة RVIOS.</p>
              <p>نحذف من الصورة بياناتها الوصفية (ومنها موقع التصوير) عند الرفع.</p>
              <p>تُحذف الصور نهائيًا بعد {k.keepDays ?? 30} يومًا من قرار المراجعة، ويبقى القرار وحده.</p>
            </CardContent>
          </Card>
          {!locked && (
            <Button className="w-full" size="lg" disabled={busy !== null}
              onClick={() => void run("submit", async () => { if (dirty) await save(); return submitKyc(store.id); }, "أُرسل الطلب للمراجعة")}>
              {busy === "submit" ? <IconLoader2 className="size-4 animate-spin" /> : <IconCircleCheck className="size-4" />} إرسال للمراجعة
            </Button>
          )}
        </div>
      </div>

      {zoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setZoom(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-md" />
        </div>
      )}
    </div>
  );
}

function Gate({ store }: { store: Store }) {
  const { ctx } = useWorkspace();
  if ((ctx?.role ?? 9) > 2) {
    return <Alert><IconLock className="size-4" /><AlertTitle>للمالك والمدير فقط</AlertTitle><AlertDescription>وثائق الهوية لا يطّلع عليها إلا مالك المتجر ومديروه.</AlertDescription></Alert>;
  }
  return <VerificationView store={store} />;
}

export default function VerificationPage() {
  return <RequireStore allowSuspended>{(store) => <Gate store={store} />}</RequireStore>;
}
