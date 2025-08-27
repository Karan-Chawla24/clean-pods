'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '../lib/store';
import { formatPrice } from '../lib/utils';
import { 
  safeDisplayProductName, 
  safeDisplayText
} from '../lib/security/ui-escaping';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

// Fetch products from server-side API
async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const data = await response.json();
    return data.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

function SearchContent() {
  const searchParams = useSearchParams();
  const { searchQuery, addToCart, addToWishlist, removeFromWishlist, wishlist } = useAppStore();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');

  // Load products from API
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);
      
      const productData = await fetchProducts();
      if (productData.length > 0) {
        setAllProducts(productData);
      } else {
        setError('No products available');
      }
      setLoading(false);
    }

    loadProducts();
  }, []);

  // Filter products based on search query
  useEffect(() => {
    if (allProducts.length === 0) return;
    
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
  }, [searchParams, searchQuery, allProducts]);

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
        toast.success('Added to cart!');
      } else {
        toast.error('Failed to add item to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Header />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Header />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <Link href="/" className="text-orange-600 hover:text-orange-700 underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Search Results</h1>
          <p className="text-gray-600">
            {currentQuery ? `Results for "${safeDisplayText(currentQuery, 50)}"` : 'All products'}
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
                ? `No products match "${safeDisplayText(currentQuery, 50)}". Try a different search term.`
                : 'No products available.'
              }
            </p>
            <Link href="/products" className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-3 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer whitespace-nowrap inline-block">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const isInWishlist = wishlist.find(item => item.id === product.id);
              
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  <div className="relative">
                    <Image 
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={192}
                      className="w-full h-48 object-cover object-center transition-transform duration-300 hover:scale-105 hover:-translate-y-1"
                    />
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                    >
                      <i className={`w-4 h-4 ${isInWishlist ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{safeDisplayProductName(product.name)}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{safeDisplayText(product.description, 100)}</p>
                    <div className="text-2xl font-bold text-orange-600 mb-4">{formatPrice(product.price)}</div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white py-2 px-4 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer whitespace-nowrap"
                      >
                        Add to Cart
                      </button>
                      <Link
                        href={`/products/${product.id}`}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        View Details
                      </Link>
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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}