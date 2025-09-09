"use client";

import { useAppStore } from "../lib/store";
import { formatPrice } from "../lib/utils";
import {
  safeDisplayProductName,
  safeDisplayText,
} from "../lib/security/ui-escaping";
import Header from "../components/Header";
import toast from "react-hot-toast";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  image: string;
  ingredients: string;
  usage: string;
}

// Fetch products from server-side API
async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default function Products() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { addToCart } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);

      const productData = await fetchProducts();
      if (productData.length > 0) {
        setProducts(productData);
      } else {
        setError("No products available");
      }
      setLoading(false);
    }

    if (isLoaded) {
      loadProducts();
    }
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "No products available"}
          </p>
        </div>
      </div>
    );
  }

  // Use the first product for display (maintaining current single-product layout)
  const product = products[0];

  const handleAddToCart = async (product: any) => {
    try {
      // Fetch latest price from API to ensure consistency
      const response = await fetch(`/api/products?id=${product.id}`);
      const data = await response.json();

      if (data.product) {
        addToCart({
          id: data.product.id,
          name: data.product.name,
          price: data.product.price,
          quantity: 1,
          image: data.product.image,
        });
        toast.success("Added to cart!");
      } else {
        toast.error("Failed to add item to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="w-full px-4 sm:px-8 lg:px-12 py-12">
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            5-in-1 Laundry Pod
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the ultimate clean with our advanced 5-in-1 laundry pod.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1920px] mx-auto justify-center">
          {/* Product Section */}
          <div className="bg-white bg-opacity-95 rounded-3xl shadow-xl p-6 lg:p-8 md:w-[48%] w-full flex flex-col items-start justify-start border border-orange-200">
            <div className="w-full flex flex-col items-center">
              <div className="w-36 h-36 sm:w-40 sm:h-40 mb-4 relative flex items-center justify-center bg-gradient-to-br from-orange-100 to-sky-100 rounded-full shadow-lg border-4 border-orange-300">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain rounded-full transition-transform duration-300"
                />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-orange-600 mb-2 text-center drop-shadow break-words">
                {safeDisplayProductName(product.name)}
              </h2>
              <p className="text-gray-700 mb-3 text-center text-sm sm:text-base break-words">
                {safeDisplayText(product.description)}
              </p>
            </div>

            <ul className="w-full mt-4 text-gray-600 text-left space-y-2">
              {product.features.map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-3 text-sm sm:text-base break-words"
                >
                  <span className="text-sky-500">✔</span>{" "}
                  {safeDisplayText(feature, 100)}
                </li>
              ))}
            </ul>

            <div className="w-full mt-auto pt-4">
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4">
                <span className="text-2xl sm:text-3xl font-bold text-orange-500">
                  ₹{product.price}
                </span>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => router.push(`/products/${product.id}`)}
                    className="bg-gradient-to-r from-orange-400 via-orange-500 to-sky-400 text-white px-6 py-3 rounded-full hover:from-orange-500 hover:via-orange-600 hover:to-sky-500 transition-all duration-300 shadow-lg shadow-orange-200 w-full sm:w-auto"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-gradient-to-r from-sky-400 via-sky-500 to-orange-400 text-white px-6 py-3 rounded-full hover:from-sky-500 hover:via-sky-600 hover:to-orange-500 transition-all duration-300 shadow-lg shadow-sky-200 w-full sm:w-auto"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white bg-opacity-95 rounded-3xl shadow-xl p-6 lg:p-8 md:w-[48%] w-full flex flex-col justify-start border border-sky-200 max-h-[520px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-sky-200 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb:hover]:bg-sky-300">
            <h3 className="text-2xl sm:text-3xl font-bold text-sky-500 mb-6 text-center drop-shadow">
              Frequently Asked Questions
            </h3>
            <div className="space-y-5">
              {faqs.map((faq, idx) => (
                <FAQItem key={idx} faq={faq} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: { question: string; answer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg p-4 bg-gray-50 hover:border-orange-300 transition-all duration-200">
      <button
        className="flex items-center justify-between w-full text-left focus:outline-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-sky-600 hover:text-orange-600 transition-colors">
          {faq.question}
        </span>
        <span className="ml-2 text-sky-500">
          <svg
            className={`w-5 h-5 transform transition-transform duration-200 ${
              open ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </button>
      {open && <div className="mt-3 text-gray-700">{faq.answer}</div>}
    </div>
  );
}

const faqs = [
  {
    question: "What makes this laundry pod 5-in-1?",
    answer:
      "Our pod combines detergent, stain remover, fabric softener, brightener, and odor eliminator in one convenient capsule for a complete laundry solution.",
  },
  {
    question: "Is it safe for all types of fabrics?",
    answer:
      "Yes, our 5-in-1 pod is formulated to be gentle yet effective on cotton, synthetics, delicates, and more. The special enzyme blend ensures fabric protection while maintaining cleaning power.",
  },
  {
    question: "How do I use the pod?",
    answer:
      "Simply place one pod directly into the drum of your washing machine before adding clothes. No need to cut or unwrap. For heavily soiled loads, you may use two pods.",
  },
  {
    question: "Does it work in cold water?",
    answer:
      "Absolutely! Our pods dissolve quickly and clean effectively in both cold and hot water cycles. The advanced formula activates even at temperatures as low as 15°C (60°F).",
  },
  {
    question: "Is the pod packaging eco-friendly?",
    answer:
      "Yes, our pods and packaging are designed to minimize environmental impact. The outer container is made from 100% recycled materials and is fully recyclable. The water-soluble pod film is biodegradable.",
  },
  {
  question: "How many pods should I use per load?",
  answer:
    "For a regular load, one pod is enough. For larger or heavily soiled loads, use two pods. The pre-measured formula ensures the right amount of detergent every time.",
},
{
  question: "Can I use these pods in front-load and top-load washing machines?",
  answer:
    "Yes, our pods are compatible with both front-load and top-load washing machines. Just remember to place the pod directly in the drum, not in the detergent drawer.",
},
{
  question: "Are the pods safe for sensitive skin?",
  answer:
    "Absolutely. Our 5-in-1 pods are dermatologically tested and free from harsh chemicals, making them safe for babies and individuals with sensitive skin.",
},
{
  question: "Do the pods leave any residue on clothes?",
  answer:
    "No, the pods are designed to dissolve completely in water without leaving any sticky residue or streaks, even in cold washes.",
},
{
  question: "Can I use pods for hand-washing clothes?",
  answer:
    "Yes, you can dissolve a pod in a bucket of water for hand-washing delicate garments. Just make sure the pod is fully dissolved before soaking clothes.",
},
{
  question: "Do these pods help with odor removal?",
  answer:
    "Yes! Our advanced formula includes odor eliminators that neutralize tough smells like sweat, smoke, and food, leaving clothes fresh and clean.",
},
{
  question: "How should I store laundry pods safely?",
  answer:
    "Keep the pods in their original container, tightly sealed, and stored in a cool, dry place. Always keep out of reach of children and pets, as pods are highly concentrated.",
},
{
  question: "What makes pods better than liquid detergent?",
  answer:
    "Pods offer precise dosing, zero mess, and powerful cleaning in a small package. Unlike liquid detergent, there’s no risk of overpouring or wastage.",
},
{
  question: "Are your pods septic and plumbing safe?",
  answer:
    "Yes, our pods are fully water-soluble and biodegradable, making them safe for both septic systems and standard plumbing.",
},
{
  question: "Do the pods help maintain fabric softness?",
  answer:
    "Yes, one of the 5-in-1 benefits is built-in fabric softener, which keeps clothes feeling soft, smooth, and comfortable after every wash.",
},
];
