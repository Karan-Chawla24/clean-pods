'use client';

import { SignUp } from '@clerk/nextjs';
import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';

function SignUpContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-orange-25 to-amber-50">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-amber-200/40 rounded-full blur-lg"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-orange-100/50 rounded-full blur-2xl"></div>
      </div>

      {/* Main Container with Two Columns */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Side - Logo and Branding */}
            <div className="text-center lg:text-left">
              <Link href="/" className="inline-block group transition-transform hover:scale-105">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-orange-100/50">
                  <Image
                    src="/beadslogo.jpg"
                    alt="BubbleBeads Logo"
                    width={280}
                    height={80}
                    className="object-contain mx-auto lg:mx-0"
                    priority
                  />
                  <h1 className="mt-6 text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    BubbleBeads
                  </h1>
                  <p className="text-lg text-gray-600 mt-3 font-medium">
                    Premium Laundry Solutions
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Soft on Clothes Hard on Stains
                  </p>
                </div>
              </Link>
            </div>
            
            {/* Right Side - Sign Up Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <SignUp 
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium text-sm normal-case shadow-lg hover:shadow-xl transition-all duration-200 border-0',
                  socialButtonsBlockButton: 'border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200 text-gray-700 font-medium',
                  socialButtonsBlockButtonText: 'font-medium text-gray-700',
                  card: 'shadow-none border-0 bg-transparent',
                  rootBox: 'w-full',
                  headerTitle: 'text-3xl font-bold text-gray-900 mb-2',
                  headerSubtitle: 'text-gray-600 text-base',
                  formFieldInput: 'border-2 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-500 transition-all duration-200',
                  formFieldLabel: 'text-gray-700 font-medium text-sm',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-500 font-medium',
                  footerActionLink: 'text-orange-600 hover:text-orange-700 font-medium transition-colors duration-200',
                  identityPreviewText: 'text-gray-600',
                  formButtonReset: 'text-orange-600 hover:text-orange-700 font-medium'
                },
                layout: {
                  socialButtonsPlacement: 'top'
                }
              }}
              routing="path"
              path="/auth/signup"
              signInUrl="/auth/signin"
            />
            </div>
            
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-orange-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div><p className="mt-2 text-gray-600">Loading...</p></div></div>}>
      <SignUpContent />
    </Suspense>
  );
}
