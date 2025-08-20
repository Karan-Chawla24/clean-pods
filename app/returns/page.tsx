"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "../components/Header";
import FadeInOnScroll from "../components/FadeInOnScroll";

export default function Returns() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/auth/signin");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <FadeInOnScroll className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Returns & Exchanges
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We want you to be completely satisfied with your BubbleBeads
            purchase. Learn about our return policy below.
          </p>
        </FadeInOnScroll>

        {/* Return Policy Overview */}
        <FadeInOnScroll
          delay={0.1}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mr-4">
              <i className="ri-arrow-left-right-line text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Return Policy</h2>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">
              When Returns Are Applicable
            </h3>
            <p className="text-gray-700 mb-4">
              Returns are only applicable if the product is damaged or if items
              are missing from your order. We stand behind the quality of our
              BubbleBeads and want to ensure you receive exactly what you
              ordered.
            </p>
            <div className="flex items-center text-orange-700">
              <i className="ri-time-line text-base mr-2"></i>
              <span className="font-medium">
                Return requests must be made within 24-48 hours after delivery
              </span>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Return Process */}
        <FadeInOnScroll
          delay={0.2}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mr-4">
              <i className="ri-file-list-3-line text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              How to Request a Return
            </h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                <span className="text-orange-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Take Clear Photos
                </h3>
                <p className="text-gray-600">
                  Capture clear images of the damaged product or missing items.
                  Include photos of the packaging if relevant. Multiple angles
                  help our team better understand the issue.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                <span className="text-orange-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Send Email with Details
                </h3>
                <p className="text-gray-600 mb-3">
                  Email us at{" "}
                  <span className="font-medium text-orange-600">
                    returns@bubblebeads.com
                  </span>{" "}
                  with:
                </p>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• Your order number</li>
                  <li>• Photos of the damaged/missing items</li>
                  <li>• Brief description of the issue</li>
                  <li>• Your contact information</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                <span className="text-orange-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Wait for Review
                </h3>
                <p className="text-gray-600">
                  {
                    "Our team will review your return request and get back to you within 48 hours with next steps. We'll provide instructions for return shipping if your request is approved."
                  }
                </p>
              </div>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Important Guidelines */}
        <FadeInOnScroll
          delay={0.3}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mr-4">
              <i className="ri-information-line text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Important Guidelines
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                <i className="ri-close-circle-line text-base mr-2"></i>
                Not Eligible for Return
              </h3>
              <ul className="text-red-700 space-y-1 text-sm">
                <li>• Change of mind</li>
                <li>• Product works as intended</li>
                <li>• Requests after 48 hours</li>
                <li>• Used or opened products (unless damaged)</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center">
                <i className="ri-check-circle-line text-base mr-2"></i>
                Eligible for Return
              </h3>
              <ul className="text-green-700 space-y-1 text-sm">
                <li>• Damaged products</li>
                <li>• Missing items from order</li>
                <li>• Defective products</li>
                <li>• Wrong items shipped</li>
              </ul>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Timeline */}
        <FadeInOnScroll
          delay={0.4}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mr-4">
              <i className="ri-calendar-line text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Return Timeline
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-orange-200"></div>
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm relative z-10">
                  0
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delivery Date</h3>
                  <p className="text-gray-600 text-sm">
                    Your BubbleBeads order is delivered
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm relative z-10">
                  24-48h
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Return Window</h3>
                  <p className="text-gray-600 text-sm">
                    Submit return request with photos via email
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm relative z-10">
                  48h
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Review Response
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Our team reviews and responds to your request
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </div>
  );
}
