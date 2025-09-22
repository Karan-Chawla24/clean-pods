"use client";

import { useAppStore } from "../lib/store";
import { formatPrice } from "../lib/utils";
import {
  safeDisplayProductName,
  safeDisplayText,
} from "../lib/security/ui-escaping";
import { safeLogError } from "../lib/security/logging";
import Header from "../components/Header";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FadeInOnScroll from "../components/FadeInOnScroll";

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  image: string;
  ingredients: string;
  usage: string;
  quantity: number;
  shipping: number;
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
    safeLogError("Error fetching products", error);
    return [];
  }
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isPopular?: boolean;
}

function ProductCard({ product, onAddToCart, isPopular = false }: ProductCardProps) {
  const originalPrice = product.originalPrice || product.price;
  const discountPercentage = Math.round(((originalPrice - product.price) / originalPrice) * 100);
  const totalPrice = product.price + product.shipping;

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden ${isPopular ? 'ring-4 ring-orange-400 scale-105' : ''}`}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20">
          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            🔥 MOST POPULAR
          </span>
        </div>
      )}
      
      {/* Discount Badge */}
      {discountPercentage > 0 && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
            {discountPercentage}% OFF
          </span>
        </div>
      )}
      
      {/* Free Shipping Badge */}
      {product.shipping === 0 && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
            FREE SHIPPING
          </span>
        </div>
      )}

      <div className="relative p-6">
        {/* Product Image */}
        <div className="w-32 h-32 mx-auto mb-6 relative flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100 rounded-full shadow-lg">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain rounded-full transition-transform duration-300 hover:scale-110"
          />
        </div>

        {/* Product Info */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{safeDisplayProductName(product.name)}</h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-3">{safeDisplayText(product.description)}</p>
          
          {/* Quantity Info */}
          <div className="mb-4">
            <span className="inline-block bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold">
              {product.quantity}
            </span>
          </div>
        </div>

        {/* Price Section */}
        <div className="text-center mb-6">
          {discountPercentage > 0 && (
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-gray-500 line-through text-lg">{formatPrice(originalPrice)}</span>
              <span className="text-red-500 font-semibold text-sm bg-red-100 px-2 py-1 rounded">-{discountPercentage}%</span>
            </div>
          )}
          <div className="text-3xl font-bold text-gray-900 mb-2">{formatPrice(product.price)}</div>
          
          {/* Shipping Info */}
          <div className="text-sm text-gray-600 mb-2">
            {product.shipping > 0 ? (
              <span>+ {formatPrice(product.shipping)} shipping</span>
            ) : (
              <span className="text-green-600 font-semibold">Free shipping included</span>
            )}
          </div>
          
          {/* Total Price */}
          <div className="text-lg font-semibold text-orange-600 bg-orange-50 px-4 py-2 rounded-lg">
            Total: {formatPrice(totalPrice)}
          </div>
        </div>

        {/* Key Features */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3 text-center">Key Benefits:</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            {product.features.slice(0, 5).map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-500 mr-2 mt-0.5 flex-shrink-0">✓</span>
                <span>{safeDisplayText(feature, 80)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* View Details Button */}
          <Link
            href="/products/product-details"
            className="block w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-blue-200"
          >
            🔍 View Details
          </Link>
          
          {/* Add to Cart Button */}
          <button
            onClick={() => onAddToCart(product)}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
              isPopular 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-orange-200'
                : 'bg-gradient-to-r from-orange-400 to-amber-400 text-white hover:from-orange-500 hover:to-amber-500 shadow-orange-200'
            }`}
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
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

  const handleAddToCart = async (product: Product) => {
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
      safeLogError("Error adding to cart", error);
      toast.error("Failed to add item to cart");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "No products available"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <FadeInOnScroll>
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Premium 5-in-1 Laundry Pods
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Choose the perfect pack size for your laundry needs. All our pods deliver the same premium 5-in-1 cleaning power with amazing discounts!
            </p>
            <div className="inline-block bg-gradient-to-r from-orange-400 to-amber-400 text-white px-6 py-3 rounded-full font-semibold">
              🚚 Free shipping on 3 or more boxes • 💰 Save up to 40%
            </div>
          </div>
        </FadeInOnScroll>

        {/* Products Grid */}
        <FadeInOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                isPopular={index === 1} // Make the 2-box combo popular
              />
            ))}
          </div>
        </FadeInOnScroll>

        {/* Benefits Section */}
        <FadeInOnScroll>
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
              Why Choose Our 5-in-1 Laundry Pods?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { icon: "🧽", title: "Powerful Stain Removal", desc: "Advanced formula removes tough stains" },
                { icon: "👕", title: "Soften the Clothes", desc: "Gentle care for all fabric types" },
                { icon: "🌺", title: "Long Lasting Fragrance", desc: "Fresh scent that lasts all day" },
                { icon: "🛡️", title: "Colour Protection", desc: "Keeps colors bright and vibrant" },
                { icon: "💨", title: "Dust Removal", desc: "Eliminates dust and allergens" }
              ].map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-3">{benefit.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeInOnScroll>

        {/* FAQ Link Section */}
        <FadeInOnScroll>
          <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Have Questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Check out our comprehensive FAQ section for detailed information about our products.
            </p>
            <a
              href="/faq"
              className="inline-block bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-500 hover:to-amber-500 transition-all duration-300 shadow-lg"
            >
              View FAQ
            </a>
          </div>
        </FadeInOnScroll>
      </div>
    </div>
  );
}
