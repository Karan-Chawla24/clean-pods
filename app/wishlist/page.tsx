"use client";

import { useAppStore, WishlistItem } from "../lib/store";
import { formatPrice } from "../lib/utils";
import Header from "../components/Header";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { safeLogError } from "../lib/security/logging";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useAppStore();

  const handleAddToCart = async (item: WishlistItem) => {
    try {
      // Fetch latest price from API to ensure consistency
      const response = await fetch(`/api/products?id=${item.id}`);
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

  const handleRemoveFromWishlist = (id: string) => {
    removeFromWishlist(id);
    toast.success("Removed from wishlist");
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-600">Save your favorite products for later</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-heart-line text-gray-400 w-12 h-12"></i>
            </div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Start adding products to your wishlist
            </p>
            <Link
              href="/products"
              className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-3 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer whitespace-nowrap inline-block"
            >
              Shop Products
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border overflow-hidden"
              >
                <div className="relative">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={300}
                    height={192}
                    className="w-full h-48 object-cover object-top"
                  />
                  <button
                    onClick={() => handleRemoveFromWishlist(item.id)}
                    className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                  >
                    <i className="ri-heart-fill w-4 h-4"></i>
                  </button>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  <div className="text-2xl font-bold text-orange-600 mb-4">
                    {formatPrice(item.price)}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white py-2 px-4 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer whitespace-nowrap"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
