'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '../lib/store';
import { cn } from '../lib/utils';

export default function Header() {
  const { cart, wishlist, setSearchQuery } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check admin status on mount and when pathname changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessionToken = sessionStorage.getItem('adminSessionToken');
      if (sessionToken) {
        // Verify with server
        fetch('/api/admin-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionToken })
        })
        .then(res => res.json())
        .then(data => {
          setIsAdmin(data.success && data.isAdmin);
          if (!data.success || !data.isAdmin) {
            sessionStorage.removeItem('adminSessionToken');
            sessionStorage.removeItem('adminExpiresAt');
          }
        });
      } else {
        setIsAdmin(false);
      }
    }
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      setSearchQuery(localSearchQuery);
      // If already on search page, just update the query
      if (pathname === '/search') {
        router.push(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`);
      }
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminSessionToken');
    sessionStorage.removeItem('adminExpiresAt');
    setIsAdmin(false);
    if (pathname === '/admin') {
      router.push('/');
    }
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="font-['Pacifico'] text-2xl text-blue-600 cursor-pointer">
            BubbleBeads
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              Products
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              Contact
            </Link>
            <Link href="/orders" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              Orders
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                  Admin
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            )}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className="ri-search-line w-4 h-4"></i>
              </button>
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <Link href="/wishlist" className="relative text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
              <i className="ri-heart-line w-5 h-5"></i>
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-shopping-cart-line w-5 h-5 inline-block mr-2"></i>
              Cart ({cartItemCount})
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <i className={cn("ri-menu-line w-6 h-6", isMenuOpen && "ri-close-line")}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-4">
              <Link href="/products" className="block text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                Products
              </Link>
              <Link href="/about" className="block text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                About
              </Link>
              <Link href="/contact" className="block text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                Contact
              </Link>
              <Link href="/orders" className="block text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                Orders
              </Link>
              {isAdmin && (
                <>
                  <Link href="/admin" className="block text-gray-700 hover:text-blue-600 transition-colors cursor-pointer">
                    Admin
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              )}
              <form onSubmit={handleSearch} className="pt-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-search-line w-4 h-4"></i>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 