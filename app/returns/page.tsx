"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import FadeInOnScroll from "../components/FadeInOnScroll";

export default function Returns() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (!isLoaded) {
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
            Returns & Refunds
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
              ordered. Please note that exchanges are not available - only
              refunds for eligible cases.
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
                    customercare.bb@outlook.com
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
                  Review & Refund Process
                </h3>
                <p className="text-gray-600">
                  {
                    "Our team will review your return request and get back to you within 48 hours with next steps. Upon successful approval, we will initiate a refund that will be processed to your bank account within 5-7 business days."
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

        
      </div>

      {/* Contact Support Section */}
      <FadeInOnScroll>
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still Need Help?
              </h2>
              <p className="text-xl text-gray-600">
                Our support team is here to assist you
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-mail-line text-2xl text-orange-600"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">
                  Get detailed help via email
                </p>
                <a
                  href="mailto:customercare.bb@outlook.com"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  customercare.bb@outlook.com
                </a>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-phone-line text-2xl text-orange-600"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-4">
                  Speak with our team directly
                </p>
                <a
                  href="tel:+911234567890"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  +91 6239881097
                </a>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                Business Hours: Monday - Friday, 9:00 AM - 6:00 PM IST
              </p>
              <div className="flex justify-center space-x-6">
                <Link
                  href="/shipping"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Shipping Info
                </Link>
                <Link
                  href="/contact"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Contact Us
                </Link>

              </div>
            </div>
          </div>
        </div>
      </FadeInOnScroll>
    </div>
  );
}
