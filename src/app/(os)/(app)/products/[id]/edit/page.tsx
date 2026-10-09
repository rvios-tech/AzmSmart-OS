"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { IconAlertTriangle, IconArrowRight, IconLoader2, IconTrash } from "@tabler/icons-react";

import { PageHeader } from "@/components/page-header";
import { RequireStore } from "@/components/require-store";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import {
  deleteProduct, getProduct, updateProduct, type Product, type ProductInput, type Store,
} from "@/lib/api/shop";
import { ProductForm } from "../../product-form";

function EditProduct({ store }: { store: Store }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await getProduct(store.id, params.id);
        if (!cancelled) setProduct(p);
      } catch {
        if (!cancelled) setError("لم يتم العثور على هذا المنتج.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [store.id, params.id]);

  async function handleSubmit(input: ProductInput) {
    setSaving(true);
    try {
      setProduct(await updateProduct(store.id, params.id, input));
      toast.success("حُفظت التغييرات");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حفظ التغييرات.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteProduct(store.id, params.id);
      router.push("/products");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذّر حذف المنتج.");
    }
  }

  if (error) {
    return (
      <Card><CardContent className="py-16 text-center">
        <IconAlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
        <p className="text-lg font-medium">{error}</p>
      </CardContent></Card>
    );
  }
  if (!product) {
    return <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground"><IconLoader2 className="size-4 animate-spin" /> جارٍ التحميل…</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <IconArrowRight className="size-4" /> العودة إلى المنتجات
      </Link>
      <PageHeader title={product.name} description="تعديل المنتج.">
        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
          <IconTrash className="size-4" /> حذف
        </Button>
      </PageHeader>
      <ProductForm key={product.id + product.name} store={store} initial={product}
        submitLabel="حفظ التغييرات" saving={saving} onSubmit={handleSubmit} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} name={product.name} onConfirm={() => void handleDelete()} />
    </div>
  );
}

export default function EditProductPage() {
  return <RequireStore>{(store) => <EditProduct store={store} />}</RequireStore>;
}
