import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium Laundry Detergent Pods | BubbleBeads Products | Soft on Clothes Hard on Stains",
  description: "Shop BubbleBeads premium laundry detergent pods. Revolutionary cleaning solutions with eco-friendly ingredients. Single box, combo packs available. Free shipping on orders above ₹499.",
  keywords: [
    "Soft on Clothes Hard on Stains",
    "laundry detergent pods",
    "premium cleaning products",
    "eco-friendly detergent",
    "stain removal",
    "fabric softener",
    "washing machine pods",
    "concentrated detergent",
    "BubbleBeads products"
  ],
  openGraph: {
    title: "Premium Laundry Detergent Pods | BubbleBeads Products | Soft on Clothes Hard on Stains",
    description: "Revolutionary cleaning solutions with eco-friendly ingredients. Shop single box and combo packs.",
    type: "website",
    url: "/products",
    images: [
      {
        url: "/beadslogo.jpg",
        width: 800,
        height: 600,
        alt: "BubbleBeads Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Laundry Detergent Pods | BubbleBeads | Soft on Clothes Hard on Stains",
    description: "Revolutionary cleaning solutions with eco-friendly ingredients.",
    images: ["/beadslogo.jpg"],
  },
  alternates: {
    canonical: "/products",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}