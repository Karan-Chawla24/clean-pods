"use client";

import Header from "../components/Header";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function About() {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About BubbleBeads
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hard on Stains, Soft on Clothes — That's the BubbleBeads way.
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl p-8 mb-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Story
              </h2>
              <p className="text-gray-600 mb-4">
                At BubbleBeads, we're redefining the way you do laundry — one powerful pod at a time. Tired of messy powders, bulky bottles, and wasteful routines, we created a smarter solution: ultra-concentrated laundry pods that are tough on stains, gentle on fabrics, and kind to the planet.
              </p>
              <p className="text-gray-600 mb-4">
                We're not just here to clean your clothes — we're here to clean up the laundry industry. Our pods are pre-measured, plastic-free, and packed with plant-based cleaning power, making laundry day faster, easier, and more sustainable than ever.
              </p>
              <p className="text-gray-600">
                Whether you're a busy parent, a college student, or someone who just loves the smell of fresh laundry — welcome to the future of clean.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-drop-line text-white w-12 h-12"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Our Mission
                </h3>
                <p className="text-gray-700">
                  Hard on Stains, Soft on Clothes — That's the BubbleBeads way.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-leaf-line text-green-600 w-8 h-8"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Sustainability
            </h3>
            <p className="text-gray-600">
              We&apos;re committed to reducing environmental impact through
              biodegradable ingredients, eco-friendly packaging, and sustainable
              manufacturing processes.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-flask-line text-orange-600 w-8 h-8"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Innovation</h3>
            <p className="text-gray-600">
              Our research team continuously develops new formulations that
              deliver superior cleaning performance while being gentle on
              fabrics and skin.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-heart-line text-purple-600 w-8 h-8"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Customer First
            </h3>
            <p className="text-gray-600">
              We prioritize customer satisfaction through exceptional product
              quality, responsive support, and continuous improvement based on
              feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
