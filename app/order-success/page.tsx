
'use client';

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Get order ID from URL params or generate one
    const urlOrderId = searchParams.get('order_id');
    if (urlOrderId) {
      setOrderNumber(urlOrderId);
    } else {
      // Generate a random order number for demo
      const randomOrder = 'CP' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setOrderNumber(randomOrder);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="font-['Pacifico'] text-2xl text-orange-600 cursor-pointer">
              BubbleBeads
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="ri-check-line text-green-600 w-12 h-12 flex items-center justify-center"></i>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Successful!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your order has been confirmed and is being processed.
          </p>

          {/* Order Details */}
          <div className="bg-white rounded-2xl p-8 mb-8 text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Details</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Order Number:</strong> {orderNumber}</p>
                  <p><strong>Order Date:</strong> {new Date().toLocaleDateString()}</p>
                  <p><strong>Payment Status:</strong> <span className="text-green-600">Confirmed</span></p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Delivery Information</h3>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
                  <p><strong>Shipping Method:</strong> Free Standard Shipping</p>
                  <p><strong>Tracking:</strong> Will be sent via email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-orange-50 rounded-2xl p-8 mb-8 text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What happens next?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-orange-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Processing</h3>
                <p className="text-gray-600 text-sm">We&apos;re preparing your order for shipment</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-orange-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Shipping Confirmation</h3>
                <p className="text-gray-600 text-sm">You&apos;ll receive tracking information via email</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-orange-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivery</h3>
                <p className="text-gray-600 text-sm">Your BubbleBeads will arrive at your doorstep</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-3 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer whitespace-nowrap inline-block">
              Continue Shopping
            </Link>
            <button 
              onClick={() => window.print()}
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Print Order Details
            </button>
          </div>

          {/* Customer Support */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, don&apos;t hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:support@bubblebeads.com" className="text-orange-600 hover:text-orange-700 cursor-pointer">
                <i className="ri-mail-line w-4 h-4 inline-block mr-2"></i>
                support@bubblebeads.com
              </a>
              <a href="tel:1-800-BUBBLEBEADS" className="text-orange-600 hover:text-orange-700 cursor-pointer">
                <i className="ri-phone-line w-4 h-4 inline-block mr-2"></i>
                1-800-BUBBLEBEADS
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="font-['Pacifico'] text-2xl text-orange-600 cursor-pointer">
              BubbleBeads
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
