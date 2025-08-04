'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '../lib/store';
import { formatPrice } from '../lib/utils';
import Header from '../components/Header';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

const allProducts: Product[] = [
  {
    id: 'essential',
    name: 'Essential Clean',
    price: 299,
    description: 'Pure detergent power for everyday cleaning. Removes dirt and stains effectively while being gentle on fabrics.',
    image: 'https://readdy.ai/api/search-image?query=Single%20blue%20detergent%20pod%20on%20clean%20white%20background%2C%20modern%20product%20photography%2C%20premium%20household%20cleaning%20product%2C%20glossy%20finish%2C%20professional%20lighting%2C%20minimalist%20composition%2C%20fresh%20and%20clean%20aesthetic&width=300&height=300&seq=product-basic&orientation=squarish',
  },
  {
    id: 'soft-fresh',
    name: 'Soft & Fresh',
    price: 449,
    description: 'Complete care with detergent and fabric softener. Cleans thoroughly while making clothes soft and fragrant.',
    image: 'https://readdy.ai/api/search-image?query=Dual-colored%20detergent%20pod%20with%20blue%20and%20green%20swirls%20on%20clean%20white%20background%2C%20premium%20household%20cleaning%20product%2C%20professional%20product%20photography%2C%20modern%20design%2C%20glossy%20finish%2C%20fresh%20and%20soft%20aesthetic&width=300&height=300&seq=product-softener&orientation=squarish',
  },
  {
    id: 'ultimate',
    name: 'Ultimate Care',
    price: 599,
    description: 'The complete solution with detergent, fabric softener, and stain remover for the toughest cleaning challenges.',
    image: 'https://readdy.ai/api/search-image?query=Triple-layered%20detergent%20pod%20with%20blue%2C%20green%2C%20and%20white%20sections%20on%20clean%20white%20background%2C%20premium%20all-in-one%20cleaning%20product%2C%20professional%20product%20photography%2C%20modern%20design%2C%20glossy%20finish%2C%20complete%20care%20aesthetic&width=300&height=300&seq=product-complete&orientation=squarish',
  },
];

export default function Search() {
  const searchParams = useSearchParams();
  const { searchQuery, addToCart, addToWishlist, removeFromWishlist, wishlist } = useAppStore();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');

  useEffect(() => {
    // Get query from URL params or store
    const urlQuery = searchParams.get('q') || '';
    const query = urlQuery || searchQuery;
    setCurrentQuery(query);

    if (query.trim() === '') {
      setFilteredProducts(allProducts);
    } else {
      const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchParams, searchQuery]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (product: Product) => {
    const isInWishlist = wishlist.find(item => item.id === product.id);
    
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      });
      toast.success('Added to wishlist!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-600">
            {currentQuery ? `Results for "${currentQuery}"` : 'All products'}
          </p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-search-line text-gray-400 w-12 h-12"></i>
            </div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">No products found</h2>
            <p className="text-gray-500 mb-8">
              {currentQuery 
                ? `No products match "${currentQuery}". Try a different search term.`
                : 'No products available.'
              }
            </p>
            <a href="/#products" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap inline-block">
              Browse All Products
            </a>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const isInWishlist = wishlist.find(item => item.id === product.id);
              
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="relative">
                    <img 
                      src={product.image}
                      alt={product.name}
                      className="w-full h-48 object-cover object-top"
                    />
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                    >
                      <i className={`w-4 h-4 ${isInWishlist ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                    <div className="text-2xl font-bold text-blue-600 mb-4">{formatPrice(product.price)}</div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Add to Cart
                      </button>
                      <a
                        href={`/products/${product.id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}