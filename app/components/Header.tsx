'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../lib/store';
import { cn } from '../lib/utils';
import { useSession, signOut } from 'next-auth/react';

const adminFetch = (url: string, options: RequestInit = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
};

export default function Header() {
  const { cart, setSearchQuery } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      adminFetch('/api/admin-verify', { method: 'GET' })
        .then(res => res.json())
        .then(data => setIsAdmin(data.success && data.isAdmin))
        .catch(() => setIsAdmin(false));
    }
  }, []);

  const handleLogout = async () => {
    await adminFetch('/api/admin-logout', { method: 'POST' });
    setIsAdmin(false);
    router.push('/');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="bg-gradient-to-r from-sky-50 via-white to-orange-50 shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* LEFT SIDE: Logo + Routes */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center cursor-pointer">
              <Image
                src="/beadslogo.png"
                alt="BubbleBeads Logo"
                width={80}
                height={28}
                className="object-contain bg-gradient-to-r from-sky-50 via-white-to-orange-50"
                priority
              />
            </Link>

            <nav className="hidden md:flex space-x-6">
              <Link href="/products" className="text-gray-700 hover:text-orange-600 transition-colors">Products</Link>
              <Link href="/blog" className="text-gray-700 hover:text-orange-600 transition-colors">Blog</Link>
              <Link href="/about" className="text-gray-700 hover:text-orange-600 transition-colors">About</Link>
              <Link href="/contact" className="text-gray-700 hover:text-orange-600 transition-colors">Contact</Link>
              {isAdmin && (
                <>
                  <Link href="/admin" className="text-gray-700 hover:text-orange-600 transition-colors">Admin</Link>
                  <button onClick={handleLogout} className="text-red-600 hover:text-red-700">Logout</button>
                </>
              )}
            </nav>
          </div>

          {/* MIDDLE: Tagline with ticker effect */}
          <div className="hidden md:flex flex-1 justify-center overflow-hidden">
            <div className="relative w-full max-w-md overflow-hidden h-6">
              <p className="absolute whitespace-nowrap text-xl font-semibold bg-gradient-to-r from-sky-500 via-amber-600 to-orange-500 bg-clip-text text-transparent animate-ticker">
                Hard on Stains Soft on Clothes
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: User + Cart + Menu */}
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
            ) : session ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-700 hover:text-orange-600">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {session.user.firstName?.[0] || session.user.name?.[0] || session.user.email?.[0]?.toUpperCase()}
                  </div>
                  <span className="hidden sm:block font-medium">
                    {session.user.firstName || session.user.name?.split(' ')[0] || 'User'}
                  </span>
                  <i className="ri-arrow-down-s-line w-4 h-4"></i>
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="font-medium text-gray-900 truncate">{session.user.name}</p>
                    <p className="text-sm text-gray-500 truncate">{session.user.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 hover:bg-gray-50">Profile</Link>
                  <Link href="/orders" className="block px-4 py-2 hover:bg-gray-50">My Orders</Link>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="block w-full text-left px-4 py-2 hover:bg-gray-50">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : null}

            {/* Cart */}
            <Link
              href="/cart"
              className="relative bg-gradient-to-r from-sky-100 via-sky-200 to-orange-100 
                         text-sky-700 px-4 py-2 rounded-lg 
                         hover:from-sky-200 hover:via-sky-300 hover:to-orange-200 
                         transition-all duration-300 whitespace-nowrap"
            >
              <i className="ri-shopping-cart-line w-5 h-5 inline-block mr-2"></i>
              Cart ({cartItemCount})
            </Link>

            {/* Mobile Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-orange-600"
            >
              <i className={cn("ri-menu-line w-6 h-6", isMenuOpen && "ri-close-line")}></i>
            </button>
          </div>
        </div>

{/* Mobile Menu */}
{isMenuOpen && (
  <div className="absolute right-4 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg flex flex-col space-y-2 p-3 md:hidden z-50">
    <Link href="/products" className="block text-gray-700 hover:text-orange-600">Products</Link>
    <Link href="/blog" className="block text-gray-700 hover:text-orange-600">Blog</Link>
    <Link href="/about" className="block text-gray-700 hover:text-orange-600">About</Link>
    <Link href="/contact" className="block text-gray-700 hover:text-orange-600">Contact</Link>
    <Link href="/orders" className="block text-gray-700 hover:text-orange-600">Orders</Link>
    {isAdmin && (
      <>
        <Link href="/admin" className="block text-gray-700 hover:text-orange-600">Admin</Link>
        <button onClick={handleLogout} className="block text-left text-red-600 hover:text-red-700">Logout</button>
      </>
    )}
  </div>
)}


      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-ticker {
          animation: ticker 10s linear infinite;
        }
      `}</style>
    </header>
  );
}