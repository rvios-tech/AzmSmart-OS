import { redirect } from "next/navigation";

/** لا صفحة عرض منفصلة للمنتج — التعديل هو الشاشة الوحيدة. */
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/products/${id}/edit`);
}
