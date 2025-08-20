'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../lib/store';
import { cn } from '../lib/utils';
import { useUser, useClerk, UserButton, SignInButton } from '@clerk/nextjs';

export default function Header() {
  const { cart, setSearchQuery } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      const adminRole = user.publicMetadata?.role === 'admin';
      setIsAdmin(adminRole);
    } else {
      setIsAdmin(false);
    }
  }, [isLoaded, user]);

  const handleLogout = () => {
    signOut({ redirectUrl: '/' });
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
                Soft on Clothes Hard on Stains 
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: User + Cart + Menu */}
          <div className="flex items-center space-x-4">
            {!isLoaded ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full"></div>
            ) : isSignedIn && user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden sm:block text-gray-700 font-medium">
                  Hello, {user.firstName || 'User'}!
                </span>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                      userButtonPopoverCard: "shadow-lg border",
                      userButtonPopoverActionButton: "hover:bg-orange-50",
                      userButtonPopoverActionButtonText: "text-gray-700",
                      userButtonPopoverFooter: "hidden"
                    }
                  }}
                  userProfileProps={{
                    additionalOAuthScopes: {
                      google: ['profile', 'email']
                    }
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Link 
                      label="My Orders" 
                      labelIcon={<i className="ri-shopping-bag-line"></i>}
                      href="/orders"
                    />
                    <UserButton.Link 
                      label="Profile" 
                      labelIcon={<i className="ri-user-line"></i>}
                      href="/profile"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
            )}

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