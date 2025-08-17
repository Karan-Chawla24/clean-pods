'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../lib/store';
import { cn } from '../lib/utils';
// Simple fetch wrapper for admin endpoints
const adminFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
};
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const { cart, wishlist, setSearchQuery } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check admin status on mount using HTTP-only cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Verify with server using HTTP-only cookie
      adminFetch('/api/admin-verify', {
        method: 'GET',
      })
      .then(res => res.json())
      .then(data => {
        setIsAdmin(data.success && data.isAdmin);
      })
      .catch(error => {
        console.error('Error verifying admin status:', error);
        setIsAdmin(false);
      });
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      setSearchQuery(localSearchQuery);
      router.push(`/search?q=${encodeURIComponent(localSearchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    // Call logout endpoint to clear the HTTP-only cookie
    await adminFetch('/api/admin-logout', {
      method: 'POST',
    });
    setIsAdmin(false);
    router.push('/');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center cursor-pointer">
            <Image
              src="/beadslogo.jpg"
              alt="BubbleBeads Logo"
              width={80}
              height={28}
              className="object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
              Products
            </Link>
            <Link href="/blog" className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
              Blog
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
              Contact
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin" className="text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
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
            {/* User Authentication */}
            {status === 'loading' ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
            ) : session ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {session.user.firstName?.[0] || session.user.name?.[0] || session.user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block font-medium">
                    {session.user.firstName || session.user.name?.split(' ')[0] || 'User'}
                  </span>
                  <i className="ri-arrow-down-s-line w-4 h-4"></i>
                </button>
                
                {/* User Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="font-medium text-gray-900 truncate">{session.user.name || `${session.user.firstName} ${session.user.lastName}`}</p>
                    <p className="text-sm text-gray-500 truncate" title={session.user.email || undefined}>{session.user.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <i className="ri-user-line w-4 h-4 inline-block mr-2"></i>
                    Profile
                  </Link>
                  <Link href="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-50">
                    <i className="ri-shopping-bag-line w-4 h-4 inline-block mr-2"></i>
                    My Orders
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    <i className="ri-logout-box-line w-4 h-4 inline-block mr-2"></i>
                    Sign Out
                  </button>
                </div>
              </div>
            ) : null}

            {/* Wishlist */}
            <Link href="/wishlist" className="relative text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
              <i className="ri-heart-line w-5 h-5"></i>
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative bg-gradient-to-r from-orange-400 to-amber-400 text-white px-4 py-2 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer whitespace-nowrap">
              <i className="ri-shopping-cart-line w-5 h-5 inline-block mr-2"></i>
              Cart ({cartItemCount})
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-orange-600 transition-colors cursor-pointer"
            >
              <i className={cn("ri-menu-line w-6 h-6", isMenuOpen && "ri-close-line")}></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-4">
              <Link href="/products" className="block text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
                Products
              </Link>
              <Link href="/blog" className="block text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
                Blog
              </Link>
              <Link href="/about" className="block text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
                About
              </Link>
              <Link href="/contact" className="block text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
                Contact
              </Link>
              <Link href="/orders" className="block text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
                Orders
              </Link>
              {isAdmin && (
                <>
                  <Link href="/admin" className="block text-gray-700 hover:text-orange-600 transition-colors cursor-pointer">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
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