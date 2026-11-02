"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { afterAuthPath } from "@/lib/shop/store-draft";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const SCRIPT = "https://accounts.google.com/gsi/client";

interface GoogleIdentity {
  accounts: {
    id: {
      initialize(config: { client_id: string; callback: (r: { credential: string }) => void }): void;
      renderButton(el: HTMLElement, options: Record<string, unknown>): void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

function loadScript(): Promise<void> {
  if (window.google) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(s);
  });
}

/**
 * الدخول والتسجيل بحساب Google. لا يظهر قبل ضبط `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. الرمز يذهب
 * إلى الخادم ليتحقق منه؛ والحساب الجديد يتجه إلى إنشاء متجره.
 */
export function GoogleButton() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const box = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadScript();
      } catch {
        if (!cancelled) setError("تعذّر تحميل خدمة Google — استخدم البريد وكلمة المرور.");
        return;
      }
      if (cancelled || !box.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          setError(null);
          try {
            const isNew = await loginWithGoogle(credential);
            router.push(isNew ? "/store/new" : afterAuthPath());
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "تعذّر الدخول بحساب Google.");
          }
        },
      });
      window.google.accounts.id.renderButton(box.current, {
        theme: "outline", size: "large", text: "continue_with", locale: "ar", width: Math.min(box.current.offsetWidth || 360, 400),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, router]);

  if (!CLIENT_ID) return null;
  return (
    <div className="space-y-3">
      {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
      <div ref={box} className="flex min-h-10 w-full justify-center" />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
