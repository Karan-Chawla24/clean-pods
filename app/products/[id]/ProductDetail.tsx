"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAppStore } from "../../lib/store";
import { formatPrice } from "../../lib/utils";
import {
  safeDisplayProductName,
  safeDisplayText,
  safeDisplayError,
} from "../../lib/security/ui-escaping";
import { safeLogError } from "../../lib/security/logging";
import Header from "../../components/Header";
import toast from "react-hot-toast";
import Image from "next/image";
import DeliveryBox3D from "../../components/DeliveryBox3D";

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

// Fetch product data from server-side API
async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const response = await fetch(`/api/products?id=${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch product");
    }
    const data = await response.json();
    return data.product;
  } catch (error) {
    safeLogError("Error fetching product", error);
    return null;
  }
}

export default function ProductDetail({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } =
    useAppStore();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);

      // For the generic product-details route, show the single-box product as default
      const defaultProductId = productId === "product-details" ? "single-box" : productId;
      const productData = await fetchProduct(defaultProductId);
      if (productData) {
        setProduct(productData);
      } else {
        setError("Product not found");
      }
      setLoading(false);
    }

    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">
            {error || "Product not found"}
          </p>
          <Link
            href="/products"
            className="text-orange-600 hover:text-orange-700 underline"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isInWishlist = wishlist.find((item) => item.id === product.id);

  const handleAddToCart = async () => {
    try {
      // Fetch latest price from API to ensure consistency
      const response = await fetch(`/api/products?id=${product.id}`);
      const data = await response.json();

      if (data.product) {
        addToCart({
          id: data.product.id,
          name: data.product.name,
          price: data.product.price,
          quantity: quantity,
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

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      toast.success("Added to wishlist!");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-gray-600 mb-8">
          <Link href="/" className="hover:text-orange-600 cursor-pointer">
            Home
          </Link>
          <i className="ri-arrow-right-s-line w-4 h-4"></i>
          <Link
            href="/products"
            className="hover:text-orange-600 cursor-pointer"
          >
            Products
          </Link>
          <i className="ri-arrow-right-s-line w-4 h-4"></i>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Product Image - 3D Delivery Box */}
          <div className="rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="relative">
              {/* 3D Delivery Box */}
              <DeliveryBox3D
                images={{
                  front: "/front.png",
                  back: "/back.png",
                  left: "/left.png",
                  right: "/right.png",
                  top: "/top.png",
                  bottom: "/bottom.png",
                }}
                width={400}
                height={250}
                depth={300}
                autoRotate={true}
                rotationSpeed={1.5}
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 break-words">
              {safeDisplayProductName(product.name)}
            </h1>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-6">
              {formatPrice(product.price)}
            </div>

            <p className="text-gray-600 text-base sm:text-lg mb-8 break-words">
              {safeDisplayText(product.description)}
            </p>

            {/* Features */}
            <div className="mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                Key Features
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start text-gray-700 text-sm sm:text-base"
                  >
                    <span className="text-green-600 mr-3 mt-1 flex-shrink-0">
                      ✓
                    </span>
                    <span className="break-words">
                      {safeDisplayText(feature, 100)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-8">
              <span className="text-gray-700 font-medium text-sm sm:text-base">
                Quantity:
              </span>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 cursor-pointer text-lg"
                >
                  −
                </button>
                <span className="px-3 sm:px-4 py-2 bg-gray-50 font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 cursor-pointer text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white py-3 sm:py-4 px-4 sm:px-8 rounded-lg text-base sm:text-lg font-semibold hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer text-center break-words"
              >
                Add to Cart - {formatPrice(product.price * quantity)}
              </button>
            </div>

            {/* Security Features */}
            <div className="flex items-center justify-center space-x-6 pt-6 border-t">
              <div className="flex items-center text-gray-600">
                <i className="ri-shield-check-line text-green-600 w-5 h-5 mr-2 flex items-center justify-center"></i>
                <span className="text-sm">Secure Payment</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl mt-8 sm:mt-12">
          <div className="border-b overflow-x-auto">
            <div className="flex min-w-full">
              {["ingredients", "usage"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 lg:px-8 py-3 sm:py-4 font-medium capitalize cursor-pointer whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                    activeTab === tab
                      ? "border-b-2 border-orange-600 text-orange-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {activeTab === "ingredients" && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                  Ingredients
                </h3>
                
                {/* Ingredients Table */}
                <div className="overflow-x-auto mb-8">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-orange-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Components
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            CAS No.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Concentration (Weight%)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Dodecylbenzene Sulfonic Acid</td>
                          <td className="px-4 py-3 text-sm text-gray-600">27176-87-0</td>
                          <td className="px-4 py-3 text-sm text-gray-600">15-20</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">C12-14 Fatty Alcohol Ethoxylate (9EO)</td>
                          <td className="px-4 py-3 text-sm text-gray-600">9002-92-0</td>
                          <td className="px-4 py-3 text-sm text-gray-600">15-20</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Triethanolamine</td>
                          <td className="px-4 py-3 text-sm text-gray-600">102-71-6</td>
                          <td className="px-4 py-3 text-sm text-gray-600">10-15</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Propylene Glycol</td>
                          <td className="px-4 py-3 text-sm text-gray-600">57-55-6</td>
                          <td className="px-4 py-3 text-sm text-gray-600">10-15</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Sodium Laureth Sulfate</td>
                          <td className="px-4 py-3 text-sm text-gray-600">1335-72-4</td>
                          <td className="px-4 py-3 text-sm text-gray-600">5-10</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Glycerin</td>
                          <td className="px-4 py-3 text-sm text-gray-600">56-81-5</td>
                          <td className="px-4 py-3 text-sm text-gray-600">5-10</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">C10-Guerbet Alcohol Alkoxylate (8EO)</td>
                          <td className="px-4 py-3 text-sm text-gray-600">61827-42-7</td>
                          <td className="px-4 py-3 text-sm text-gray-600">5-10</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Water</td>
                          <td className="px-4 py-3 text-sm text-gray-600">7732-18-5</td>
                          <td className="px-4 py-3 text-sm text-gray-600">4-8</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Coconut Acid</td>
                          <td className="px-4 py-3 text-sm text-gray-600">61688-47-4</td>
                          <td className="px-4 py-3 text-sm text-gray-600">3-5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Parfum</td>
                          <td className="px-4 py-3 text-sm text-gray-600">8023-88-9</td>
                          <td className="px-4 py-3 text-sm text-gray-600">0.5-1</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Sodium Citrate</td>
                          <td className="px-4 py-3 text-sm text-gray-600">68-04-2</td>
                          <td className="px-4 py-3 text-sm text-gray-600">0.2-0.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Protease</td>
                          <td className="px-4 py-3 text-sm text-gray-600">9054-89-1</td>
                          <td className="px-4 py-3 text-sm text-gray-600">0.1-0.6</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Dichlorobenzyl Alcohol</td>
                          <td className="px-4 py-3 text-sm text-gray-600">88-04-0</td>
                          <td className="px-4 py-3 text-sm text-gray-600">0.1-0.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Methylisothiazolinone / Methylchlor Oisothiazolinone</td>
                          <td className="px-4 py-3 text-sm text-gray-600">26172-55-4</td>
                          <td className="px-4 py-3 text-sm text-gray-600">0.05-0.5</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Colour</td>
                          <td className="px-4 py-3 text-sm text-gray-600">-</td>
                          <td className="px-4 py-3 text-sm text-gray-600">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
              </div>
            )}

            {activeTab === "usage" && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                  How to Use
                </h3>
                
                {/* Compatibility Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      🌊 Dissolves in Hot & Cold Water
                    </h4>
                    <div className="flex items-center justify-center mb-3">
                      <div className="text-4xl">🌡️❄️</div>
                    </div>
                    <p className="text-gray-700 text-sm text-center">
                       Works for all water temperatures
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      🔄 Automatic & Manual Washing Machines
                    </h4>
                    <div className="flex items-center justify-center space-x-4 mb-3">
                      <div className="text-2xl">🧺</div>
                      <div className="text-2xl">⚙️</div>
                    </div>
                    <p className="text-gray-700 text-sm text-center">
                      Compatible with all washing machine types
                    </p>
                  </div>
                </div>

                {/* Usage Instructions */}
                <div className="bg-orange-50 p-6 rounded-lg mb-8">
                  <h4 className="font-semibold text-gray-900 mb-6 text-center">
                    📋 How to Use
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">💧</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Pour Water in Washing Machines
                      </h5>
                      <p className="text-gray-600 text-sm">
                        Fill your washing machine with water first
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🧼</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Insert 1 Pod for Regular Wash
                      </h5>
                      <p className="text-gray-600 text-sm">
                        (6-8 kg Clothes) - Add one pod to the water
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👕</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Add Clothes
                      </h5>
                      <p className="text-gray-600 text-sm">
                        Place your laundry into the machine
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✨</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Get the Magic
                      </h5>
                      <p className="text-gray-600 text-sm">
                        Start your wash cycle and enjoy fresh, clean clothes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safety Instructions */}
                <div className="bg-red-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-6 text-center">
                    ⚠️ Precautions & Safety Instructions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✂️</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Do Not Cut or Handle With Wet Hands
                      </h5>
                      <p className="text-gray-600 text-sm">
                        Always handle pods with dry hands
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🔆</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Store in Dry or Cold Place, Away From Sunlight
                      </h5>
                      <p className="text-gray-600 text-sm">
                        Keep in a cool, dry storage area
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👶</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Keep out of Reach of Children & Pets
                      </h5>
                      <p className="text-gray-600 text-sm">
                        Store safely away from children and animals
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">👁️</span>
                      </div>
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Avoid Contact With Eyes
                      </h5>
                      <p className="text-gray-600 text-sm">
                        If contact occurs, rinse immediately with water
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
