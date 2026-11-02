"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { IconAlertTriangle, IconLoader2 } from "@tabler/icons-react";

import { AppearanceEditor, type AppearanceApi } from "@/components/shop/appearance-editor";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { getTeamStoreEditor, saveTeamAppearance } from "@/lib/api/platform";
import type { Store } from "@/lib/api/shop";
import { uploadStoreImageAsTeam } from "@/lib/api/uploads";

/** فريق المنصة يعدّل شكل أي متجر — بالمحرر نفسه، وبلا قفل الأسبوع */
export default function TeamAppearancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const r = await getTeamStoreEditor(id);
    setStore(r.store);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await getTeamStoreEditor(id);
        if (!cancelled) setStore(r.store);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "تعذّر فتح المتجر.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const api = useMemo<AppearanceApi>(() => ({
    products: () => getTeamStoreEditor(id),
    save: (input) => saveTeamAppearance(id, input),
    afterSave: refresh,
    uploader: (file) => uploadStoreImageAsTeam(id, file),
  }), [id, refresh]);

  if (error) {
    return <Card><CardContent className="py-16 text-center"><IconAlertTriangle className="mx-auto mb-2 size-6 text-destructive" />{error}</CardContent></Card>;
  }
  if (!store) return <div className="flex h-64 items-center justify-center"><IconLoader2 className="size-5 animate-spin" /></div>;
  return <AppearanceEditor key={store.id + store.appearanceLockedUntil} store={store} api={api} team />;
}
