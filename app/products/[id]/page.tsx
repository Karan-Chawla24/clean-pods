import ProductDetail from "./ProductDetail";

export async function generateStaticParams() {
  return [{ id: "product-details" }];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}
