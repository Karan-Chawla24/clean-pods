'use client';

import { useAppStore } from '../lib/store';
import { formatPrice } from '../lib/utils';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const products = [
  {
    id: 'essential',
    name: 'Essential Clean',
    price: 299,
    description: 'Pure detergent power for everyday cleaning. Removes dirt and stains effectively while being gentle on fabrics.',
    features: ['Powerful stain removal', 'Gentle on all fabric types', 'Fresh scent', '30 pods per pack'],
    image: '/Single.jpg',
    isPopular: false,
  },
  {
    id: 'soft-fresh',
    name: 'Soft & Fresh',
    price: 449,
    description: 'Complete care with detergent and fabric softener. Cleans thoroughly while making clothes soft and fragrant.',
    features: ['Deep cleaning formula', 'Built-in fabric softener', 'Long-lasting freshness', '25 pods per pack'],
    image: '/Threein1.jpg',
    isPopular: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate Care',
    price: 599,
    description: 'The complete solution with detergent, fabric softener, and stain remover for the toughest cleaning challenges.',
    features: ['Triple-action formula', 'Advanced stain removal', 'Fabric protection', '20 pods per pack'],
    image: '/fivein1.jpg',
    isPopular: false,
  },
];

export default function Products() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useAppStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success('Added to cart!');
  };

  const handleAddToWishlist = (product: any) => {
    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    toast.success('Added to wishlist!');
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId);
    toast.success('Removed from wishlist');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our three specially formulated detergent pods, each designed to meet your specific laundry needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const isInWishlist = wishlist.find(item => item.id === product.id);
            
            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-shadow">
                {product.isPopular && (
                  <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="relative">
                  <Image 
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={256}
                    className="w-full h-64 object-cover object-center"
                  />
                  <button
                    onClick={() => isInWishlist ? handleRemoveFromWishlist(product.id) : handleAddToWishlist(product)}
                    className={`absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center transition-colors ${
                      isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <i className={`w-5 h-5 ${isInWishlist ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                  </button>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-4">{product.description}</p>
                  
                  <div className="mb-4">
                    <ul className="space-y-1">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <i className="ri-check-line text-green-500 w-4 h-4 mr-2"></i>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="text-2xl font-bold text-blue-600 mb-4">{formatPrice(product.price)}</div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Add to Cart
                    </button>
                    <a
                      href={`/products/${product.id}`}
                      className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 