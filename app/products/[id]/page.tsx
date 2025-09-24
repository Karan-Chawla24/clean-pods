import ProductDetail from "./ProductDetail";
import { getProductById, getAllProducts } from "../../lib/products";
import { Metadata } from "next";

export async function generateStaticParams() {
  const products = getAllProducts();
  return products.map((product) => ({
    id: product.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const defaultProductId = id === "product-details" ? "single-box" : id;
  const product = getProductById(defaultProductId);

  if (!product) {
    return {
      title: "Product Not Found | BubbleBeads",
      description: "The requested product could not be found.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bubblebeads.in';

  return {
    title: `${product.name} | BubbleBeads - Premium Laundry Detergent Pods`,
    description: `${product.description} Features: ${product.features.join(', ')}. Starting at ₹${product.price}. Free shipping available.`,
    keywords: [
      product.name,
      "laundry detergent pods",
      "premium cleaning",
      "eco-friendly detergent",
      "stain removal",
      "fabric softener",
      ...product.features.map(f => f.toLowerCase())
    ],
    openGraph: {
      title: `${product.name} | BubbleBeads`,
      description: product.description,
      images: [
        {
          url: product.image,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: "website",
      url: `/products/${product.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | BubbleBeads`,
      description: product.description,
      images: [product.image],
    },
    alternates: {
      canonical: `/products/${product.id}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetail productId={id} />;
}
