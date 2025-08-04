
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '../../lib/store';
import { formatPrice } from '../../lib/utils';
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

const products: Record<string, Product> = {
  essential: {
    id: 'essential',
    name: 'Essential Clean',
    price: 299,
    description: 'Pure detergent power for everyday cleaning. Removes dirt and stains effectively while being gentle on fabrics.',
    features: [
      'Powerful stain removal',
      'Gentle on all fabric types',
      'Fresh scent',
      '30 pods per pack'
    ],
    image: 'https://readdy.ai/api/search-image?query=Single%20blue%20detergent%20pod%20on%20clean%20white%20background%2C%20modern%20product%20photography%2C%20premium%20household%20cleaning%20product%2C%20glossy%20finish%2C%20professional%20lighting%2C%20minimalist%20composition%2C%20fresh%20and%20clean%20aesthetic&width=600&height=600&seq=product-basic-detail&orientation=squarish',
    ingredients: 'Surfactants, Enzymes, Brightening agents, Fragrance',
    usage: 'Use 1 pod for regular loads, 2 pods for heavily soiled items. Place in drum before adding clothes.'
  },
  'soft-fresh': {
    id: 'soft-fresh',
    name: 'Soft & Fresh',
    price: 449,
    description: 'Complete care with detergent and fabric softener. Cleans thoroughly while making clothes soft and fragrant.',
    features: [
      'Deep cleaning formula',
      'Built-in fabric softener',
      'Long-lasting freshness',
      '25 pods per pack'
    ],
    image: 'https://readdy.ai/api/search-image?query=Dual-colored%20detergent%20pod%20with%20blue%20and%20green%20swirls%20on%20clean%20white%20background%2C%20premium%20household%20cleaning%20product%2C%20professional%20product%20photography%2C%20modern%20design%2C%20glossy%20finish%2C%20fresh%20and%20soft%20aesthetic&width=600&height=600&seq=product-softener-detail&orientation=squarish',
    ingredients: 'Surfactants, Enzymes, Fabric softener, Brightening agents, Fragrance',
    usage: 'Use 1 pod for regular loads. The dual-chamber design releases softener at the right time during the wash cycle.'
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate Care',
    price: 599,
    description: 'The complete solution with detergent, fabric softener, and stain remover for the toughest cleaning challenges.',
    features: [
      'Triple-action formula',
      'Advanced stain removal',
      'Fabric protection',
      '20 pods per pack'
    ],
    image: 'https://readdy.ai/api/search-image?query=Triple-layered%20detergent%20pod%20with%20blue%2C%20green%2C%20and%20white%20sections%20on%20clean%20white%20background%2C%20premium%20all-in-one%20cleaning%20product%2C%20professional%20product%20photography%2C%20modern%20design%2C%20glossy%20finish%2C%20complete%20care%20aesthetic&width=600&height=600&seq=product-complete-detail&orientation=squarish',
    ingredients: 'Surfactants, Enzymes, Stain removers, Fabric softener, Brightening agents, Fragrance',
    usage: 'Use 1 pod for most loads. Perfect for tough stains, delicate fabrics, and everything in between.'
  }
};

export default function ProductDetail({ productId }: { productId: string }) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useAppStore();
  const product = products[productId];

  if (!product) {
    return <div>Product not found</div>;
  }

  const isInWishlist = wishlist.find(item => item.id === product.id);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      image: product.image
    });
    toast.success('Added to cart!');
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600 cursor-pointer">Home</Link>
          <i className="ri-arrow-right-s-line w-4 h-4"></i>
          <Link href="/#products" className="hover:text-blue-600 cursor-pointer">Products</Link>
          <i className="ri-arrow-right-s-line w-4 h-4"></i>
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-2xl p-8">
            <Image 
              src={product.image}
              alt={product.name}
              className="w-full h-96 object-cover object-top rounded-lg mb-4"
            />
            <div className="grid grid-cols-3 gap-4">
              <Image 
                src={product.image}
                alt={product.name}
                className="w-full h-24 object-cover object-top rounded-lg border-2 border-blue-200 cursor-pointer"
              />
              <Image 
                src={product.image}
                alt={product.name}
                className="w-full h-24 object-cover object-top rounded-lg border cursor-pointer hover:border-blue-200"
              />
              <Image 
                src={product.image}
                alt={product.name}
                className="w-full h-24 object-cover object-top rounded-lg border cursor-pointer hover:border-blue-200"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <div className="text-3xl font-bold text-blue-600 mb-6">{formatPrice(product.price)}</div>
            
            <p className="text-gray-600 text-lg mb-8">{product.description}</p>

            {/* Features */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-gray-700">
                    <i className="ri-check-line text-green-600 w-5 h-5 mr-3 flex items-center justify-center"></i>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-gray-700 font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <i className="ri-subtract-line w-4 h-4 flex items-center justify-center"></i>
                </button>
                <span className="px-4 py-2 bg-gray-50 font-medium">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  <i className="ri-add-line w-4 h-4 flex items-center justify-center"></i>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-4">
              <button 
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 text-white py-4 px-8 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Add to Cart - {formatPrice(product.price * quantity)}
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  isInWishlist
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <i className={`w-6 h-6 ${isInWishlist ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
              </button>
            </div>

            {/* Security Features */}
            <div className="flex items-center justify-center space-x-6 pt-6 border-t">
              <div className="flex items-center text-gray-600">
                <i className="ri-shield-check-line text-green-600 w-5 h-5 mr-2 flex items-center justify-center"></i>
                <span className="text-sm">Secure Payment</span>
              </div>
              <div className="flex items-center text-gray-600">
                <i className="ri-truck-line text-blue-600 w-5 h-5 mr-2 flex items-center justify-center"></i>
                <span className="text-sm">Free Shipping</span>
              </div>
              <div className="flex items-center text-gray-600">
                <i className="ri-refresh-line text-purple-600 w-5 h-5 mr-2 flex items-center justify-center"></i>
                <span className="text-sm">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl mt-12">
          <div className="border-b">
            <div className="flex">
              {['description', 'ingredients', 'usage'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-8 py-4 font-medium capitalize cursor-pointer whitespace-nowrap ${
                    activeTab === tab 
                      ? 'border-b-2 border-blue-600 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-8">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h3>
                <p className="text-gray-700 text-lg leading-relaxed mb-6">{product.description}</p>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Perfect For:</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>• Daily laundry loads</li>
                      <li>• All fabric types</li>
                      <li>• Front and top-load washers</li>
                      <li>• Cold and warm water washing</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Benefits:</h4>
                    <ul className="space-y-2 text-gray-700">
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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ingredients</h3>
                <p className="text-gray-700 text-lg mb-6">{product.ingredients}</p>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Safety Information:</h4>
                  <ul className="space-y-2 text-gray-700">
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
                <h3 className="text-2xl font-bold text-gray-900 mb-4">How to Use</h3>
                <p className="text-gray-700 text-lg mb-6">{product.usage}</p>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">1</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Place Pod</h4>
                    <p className="text-gray-600 text-sm">Place pod in the drum before adding clothes</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">2</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Add Clothes</h4>
                    <p className="text-gray-600 text-sm">Add your laundry on top of the pod</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-blue-600">3</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Start Wash</h4>
                    <p className="text-gray-600 text-sm">Run your regular wash cycle</p>
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
