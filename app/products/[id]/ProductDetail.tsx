
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAppStore } from '../../lib/store';
import { formatPrice } from '../../lib/utils';
import { 
  safeDisplayProductName, 
  safeDisplayText,
  safeDisplayError
} from '../../lib/security/ui-escaping';
import Header from '../../components/Header';
import toast from 'react-hot-toast';
import Image from 'next/image';

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
      throw new Error('Failed to fetch product');
    }
    const data = await response.json();
    return data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default function ProductDetail({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useAppStore();

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setError(null);
      
      const productData = await fetchProduct(productId);
      if (productData) {
        setProduct(productData);
      } else {
        setError('Product not found');
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
          <p className="text-red-600 text-lg mb-4">{error || 'Product not found'}</p>
          <Link href="/products" className="text-orange-600 hover:text-orange-700 underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isInWishlist = wishlist.find(item => item.id === product.id);

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
          image: data.product.image
        });
        toast.success('Added to cart!');
      } else {
        toast.error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      });
      toast.success('Added to wishlist!');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-gray-600 mb-8">
          <Link href="/" className="hover:text-orange-600 cursor-pointer">Home</Link>
          <i className="ri-arrow-right-s-line w-4 h-4"></i>
          <Link href="/products" className="hover:text-orange-600 cursor-pointer">Products</Link>
          <i className="ri-arrow-right-s-line w-4 h-4"></i>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
            <Image 
              src={product.image}
              alt={product.name}
              width={600}
              height={500}
              className="w-full max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] object-cover rounded-lg mb-4 transition-transform duration-300 hover:scale-105 hover:-translate-y-1"
            />
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 break-words">{safeDisplayProductName(product.name)}</h1>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-6">{formatPrice(product.price)}</div>
            
            <p className="text-gray-600 text-base sm:text-lg mb-8 break-words">{safeDisplayText(product.description)}</p>

            {/* Features */}
            <div className="mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-gray-700 text-sm sm:text-base">
                    <span className="text-green-600 mr-3 mt-1 flex-shrink-0">✓</span>
                    <span className="break-words">{safeDisplayText(feature, 100)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-8">
              <span className="text-gray-700 font-medium text-sm sm:text-base">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 cursor-pointer text-lg"
                >
                  −
                </button>
                <span className="px-3 sm:px-4 py-2 bg-gray-50 font-medium min-w-[3rem] text-center">{quantity}</span>
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
              <div className="flex items-center text-gray-600">
                <i className="ri-truck-line text-orange-600 w-5 h-5 mr-2 flex items-center justify-center"></i>
                <span className="text-sm">Free Shipping</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl mt-8 sm:mt-12">
          <div className="border-b overflow-x-auto">
            <div className="flex min-w-full">
              {['description', 'ingredients', 'usage'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 sm:px-6 lg:px-8 py-3 sm:py-4 font-medium capitalize cursor-pointer whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
                    activeTab === tab 
                      ? 'border-b-2 border-orange-600 text-orange-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 md:p-8">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Product Description</h3>
                <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-6 break-words">{safeDisplayText(product.description)}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900 mb-3">Perfect For:</h4>
                    <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                      <li>• Daily laundry loads</li>
                      <li>• All fabric types</li>
                      <li>• Front and top-load washers</li>
                      <li>• Cold and warm water washing</li>
                    </ul>
                  </div>
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900 mb-3">Benefits:</h4>
                    <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                      <li>• Convenient pre-measured pods</li>
                      <li>• No measuring or mess</li>
                      <li>• Concentrated formula</li>
                      <li>• Eco-friendly packaging</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'ingredients' && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Ingredients</h3>
                <p className="text-gray-700 text-base sm:text-lg mb-6 break-words">{safeDisplayText(product.ingredients)}</p>
                <div className="bg-orange-50 p-4 sm:p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Safety Information:</h4>
                  <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>• Keep out of reach of children</li>
                    <li>• Do not bite or chew pods</li>
                    <li>• Store in cool, dry place</li>
                    <li>• Dermatologically tested</li>
                  </ul>
                </div>
              </div>
            )}
            
            {activeTab === 'usage' && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">How to Use</h3>
                <p className="text-gray-700 text-base sm:text-lg mb-6 break-words">{safeDisplayText(product.usage)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-orange-600">1</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Place Pod</h4>
                    <p className="text-gray-600 text-sm break-words">Place pod in the drum before adding clothes</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-orange-600">2</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Add Clothes</h4>
                    <p className="text-gray-600 text-sm break-words">Add your laundry on top of the pod</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-orange-600">3</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Start Wash</h4>
                    <p className="text-gray-600 text-sm break-words">Run your regular wash cycle</p>
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
