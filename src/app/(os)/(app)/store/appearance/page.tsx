"use client";

import { useMemo } from "react";

import { RequireStore } from "@/components/require-store";
import { AppearanceEditor, type AppearanceApi } from "@/components/shop/appearance-editor";
import { listProducts, saveAppearance, saveStoreExtras, updateStore, type Store } from "@/lib/api/shop";
import { useStore } from "@/lib/shop/store-context";

/** «شكل المتجر» لصاحب المتجر — لكل القوالب، ويُقفل أسبوعًا بعد كل حفظ */
function MerchantEditor({ store }: { store: Store }) {
  const { reload } = useStore();
  const api = useMemo<AppearanceApi>(() => ({
    products: () => listProducts(store.id),
    save: (input) => saveAppearance(store.id, input),
    saveExtras: (x) => saveStoreExtras(store.id, x),
    setTemplate: (id) => updateStore(store.id, { template: id }),
    afterSave: reload,
  }), [store.id, reload]);
  return <AppearanceEditor store={store} api={api} />;
}

export default function StoreAppearancePage() {
  return <RequireStore>{(store) => <MerchantEditor key={store.id} store={store} />}</RequireStore>;
}
