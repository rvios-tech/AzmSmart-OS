"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ApiError } from "@/lib/api/client";
import { listStores, type Store, type StoresResponse } from "@/lib/api/shop";

const ACTIVE_KEY = "azm_active_store";

interface StoreContextValue {
  status: "loading" | "ready" | "error";
  error: string | null;
  stores: Store[];
  slots: StoresResponse["slots"] | null;
  /** المتجر النشط — `null` حين لا متجر للحساب بعد. */
  store: Store | null;
  setActive: (id: string) => void;
  /** يعيد جلب المتاجر (بعد إنشاء أو تعديل أو تغيّر باقة). */
  reload: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function readActive(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

/**
 * سياق المتجر النشط — الحساب الواحد قد يملك حتى خمسة متاجر، وكل صفحات
 * التجارة تعمل على متجر واحد في كل لحظة. الاختيار يُحفظ محليًا للراحة فقط:
 * الخادم لا يثق به (كل نداء يحمل `storeId` ويتحقّق من ملكيته).
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    status: StoreContextValue["status"];
    error: string | null;
    stores: Store[];
    slots: StoresResponse["slots"] | null;
    activeId: string | null;
  }>({ status: "loading", error: null, stores: [], slots: null, activeId: null });

  const load = useCallback(async () => {
    try {
      const res = await listStores();
      setState((prev) => {
        const saved = prev.activeId ?? readActive();
        const activeId = res.stores.some((s) => s.id === saved)
          ? saved
          : (res.stores[0]?.id ?? null);
        return {
          status: "ready",
          error: null,
          stores: res.stores,
          slots: res.slots,
          activeId,
        };
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof ApiError ? err.message : "تعذّر تحميل متاجرك.",
      }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setActive = useCallback((id: string) => {
    try {
      window.localStorage.setItem(ACTIVE_KEY, id);
    } catch {
      // التخزين محظور — الاختيار يبقى في الذاكرة لهذه الجلسة فقط.
    }
    setState((prev) => ({ ...prev, activeId: id }));
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      status: state.status,
      error: state.error,
      stores: state.stores,
      slots: state.slots,
      store: state.stores.find((s) => s.id === state.activeId) ?? null,
      setActive,
      reload: load,
    }),
    [state, setActive, load],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore يجب أن يُستخدم داخل StoreProvider");
  return ctx;
}
