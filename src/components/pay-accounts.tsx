"use client";

import { useEffect, useState } from "react";
import { IconBuildingBank, IconCheck, IconCopy, IconQrcode, IconWallet } from "@tabler/icons-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CURRENCY_LABELS, publicPayAccounts, type PayAccount } from "@/lib/api/platform-ops";
import { cn } from "@/lib/utils";

function AccountCard({ a }: { a: PayAccount }) {
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(false);
  const color = a.color ?? "#C1272D";
  const Icon = a.kind === "wallet" ? IconWallet : IconBuildingBank;

  async function copy() {
    try {
      await navigator.clipboard.writeText(a.number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* الحافظة محظورة — الرقم قابل للتحديد يدويًا */
    }
  }

  return (
    <div className="relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-4" style={{ ["--pc" as string]: color }}>
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{a.providerName ?? a.provider}</div>
          {a.title !== a.providerName && <div className="truncate text-xs text-muted-foreground">{a.title}</div>}
        </div>
        {a.currency && (
          <span className="rounded-full border px-2 py-0.5 text-[11px] font-bold" style={{ color, borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}>
            {a.currency}
          </span>
        )}
      </div>
      {a.number && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            {a.kind === "wallet" ? "رقم المحفظة" : "رقم الحساب"}
            {a.currency && ` · ${CURRENCY_LABELS[a.currency] ?? a.currency}`}
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 p-2 ps-3">
            <span dir="ltr" className="select-all truncate font-mono text-lg font-bold tracking-wider">{a.number}</span>
            <button
              type="button"
              onClick={() => void copy()}
              className={cn("inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition", copied && "bg-emerald-600")}
              style={copied ? undefined : { background: color }}
            >
              {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
              {copied ? "نُسخ" : "نسخ"}
            </button>
          </div>
        </div>
      )}
      {a.holder && <div className="text-sm"><span className="text-muted-foreground">باسم</span> {a.holder}</div>}
      {a.qr && (
        <button type="button" onClick={() => setZoom(true)} className="flex items-center gap-3 rounded-xl border bg-white p-2 text-start text-xs text-neutral-600">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.qr} alt={`رمز الدفع — ${a.providerName ?? a.provider}`} className="size-20 rounded-md object-contain" />
          <span className="inline-flex items-center gap-1"><IconQrcode className="size-4" /> اضغط لتكبير الرمز ومسحه</span>
        </button>
      )}
      {a.note && <p className="text-xs leading-relaxed text-muted-foreground">{a.note}</p>}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{a.providerName ?? a.provider}</DialogTitle></DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.qr} alt="" className="w-full rounded-lg bg-white object-contain p-2" />
          <p className="text-center text-sm text-muted-foreground">امسح الرمز من تطبيق المحفظة</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** حسابات الدفع المعلنة (الكريمي، جيب، جوالي…) — بطاقات بنسخ الرقم ورمز QR. */
export function PayAccounts({ accounts, className }: { accounts?: PayAccount[]; className?: string }) {
  const [fetched, setFetched] = useState<PayAccount[] | null>(null);
  const given = accounts !== undefined;
  useEffect(() => {
    if (given) return;
    let off = false;
    void (async () => {
      const a = await publicPayAccounts().catch(() => []);
      if (!off) setFetched(a);
    })();
    return () => {
      off = true;
    };
  }, [given]);
  const list = given ? accounts : fetched;
  if (!list?.length) return null;
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {list.map((a) => <AccountCard key={a.id} a={a} />)}
    </div>
  );
}
