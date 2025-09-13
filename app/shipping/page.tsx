"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import FadeInOnScroll from "../components/FadeInOnScroll";

export default function Shipping() {
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
            Shipping Information
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about BubbleBeads delivery and shipping.
          </p>
        </FadeInOnScroll>

        {/* Shipping Overview */}
        <FadeInOnScroll
          delay={0.1}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mr-4">
              <i className="ri-truck-line text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Delivery Timeline
            </h2>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-2">
              Standard Delivery
            </h3>
            <p className="text-orange-700 text-lg font-medium mb-2">
              3-4 Business Days
            </p>
            <p className="text-gray-600">
              Your BubbleBeads order will be delivered within 3-4 business days
              from the date of order confirmation. Delivery times may vary based
              on your location and local courier schedules.
            </p>
          </div>
        </FadeInOnScroll>

        {/* Tracking Information */}
        <FadeInOnScroll
          delay={0.2}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mr-4">
              <i className="ri-map-pin-line text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Order Tracking</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                <i className="ri-check-line text-orange-600 text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Order Confirmation
                </h3>
                <p className="text-gray-600">
                  {
                    "You'll receive an email confirmation immediately after placing your order."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                <i className="ri-package-line text-orange-600 text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Order Processing
                </h3>
                <p className="text-gray-600">
                  {
                    "Your order will be processed and prepared for shipment within 1-2 business days."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                <i className="ri-truck-line text-orange-600 text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Courier Pickup
                </h3>
                <p className="text-gray-600">
                  {
                    "Once your order is picked up by our courier partner, you'll receive shipping details and tracking information via email and SMS."
                  }
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mt-1">
                <i className="ri-home-line text-orange-600 text-sm"></i>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Delivery</h3>
                <p className="text-gray-600">
                  {
                    "Your BubbleBeads will be delivered to your doorstep within the estimated timeframe."
                  }
                </p>
              </div>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Shipping Policies */}
        <FadeInOnScroll
          delay={0.3}
          className="bg-white rounded-2xl p-8 shadow-sm border border-orange-100 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mr-4">
              <i className="ri-shield-check-line text-white text-xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Shipping Policies
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Shipping
              </h3>
              <p className="text-gray-600 mb-4">
                We offer simple shipping rates: ₹99 for 1 box, ₹49 for 2 boxes, and free standard shipping on 3 or more BubbleBeads boxes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Secure Packaging
              </h3>
              <p className="text-gray-600 mb-4">
                All orders are carefully packaged to ensure your products arrive
                in perfect condition.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Address Accuracy
              </h3>
              <p className="text-gray-600 mb-4">
                {
                  "Please ensure your delivery address is accurate. We are not responsible for delays due to incorrect addresses."
                }
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Delivery Attempts
              </h3>
              <p className="text-gray-600 mb-4">
                {
                  "Our courier partners will make up to 3 delivery attempts. Please ensure someone is available to receive the package."
                }
              </p>
            </div>
          </div>
        </FadeInOnScroll>

        {/* Extra Shipping Info */}
        <FadeInOnScroll
          delay={0.35}
          className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Additional Information
          </h2>
          <ul className="list-disc list-inside text-gray-700 space-y-3">
            <li>
              <span className="font-semibold text-orange-700">
                International Shipping:
              </span>
              {
                " Currently, we only ship within India. Stay tuned for global shipping updates."
              }
            </li>
            <li>
              <span className="font-semibold text-orange-700">
                Cash on Delivery:
              </span>
              {
                " At the moment, COD is not available. All orders must be prepaid online."
              }
            </li>
            <li>
              <span className="font-semibold text-orange-700">
                Returns & Refunds:
              </span>
              {" Please refer to our "}
              <a
                href="/returns"
                className="underline text-orange-600 hover:text-orange-700"
              >
                Returns & Refund Policy
              </a>
              {" for more details."}
            </li>
          </ul>
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
