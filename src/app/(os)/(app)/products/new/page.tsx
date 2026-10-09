"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconArrowRight } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { ApiError } from "@/lib/api/client";
import { createProduct, type ProductInput, type Store } from "@/lib/api/shop";
import { ProductForm } from "../product-form";

function NewProduct({ store }: { store: Store }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(input: ProductInput) {
    setSaving(true);
    try {
      await createProduct(store.id, input);
      toast.success("أُضيف المنتج");
      router.push("/products");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر إضافة المنتج.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى المنتجات
      </Link>
      <PageHeader title="منتج جديد" description="أضف منتجًا إلى كتالوج متجرك." />
      <ProductForm store={store} submitLabel="إضافة المنتج" saving={saving} onSubmit={handleSubmit} />
    </div>
  );
}

export default function NewProductPage() {
  return <RequireStore>{(store) => <NewProduct store={store} />}</RequireStore>;
}
