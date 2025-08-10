'use client';

import Header from '../components/Header';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About BubbleBeads</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionizing laundry care with innovative, eco-friendly detergent pods designed for modern households.
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl p-8 mb-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                BubbleBeads was born from a simple observation: traditional laundry detergents were messy, wasteful, and harmful to the environment. We set out to create a better solution.
              </p>
              <p className="text-gray-600 mb-4">
                Our journey began in 2020 when our founders, a team of chemical engineers and environmental scientists, came together with a shared vision: to revolutionize laundry care with products that are both effective and eco-friendly.
              </p>
              <p className="text-gray-600">
                Today, BubbleBeads is proud to serve thousands of households across India, providing premium laundry solutions that make cleaning easier, more efficient, and better for our planet.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="ri-drop-line text-white w-12 h-12"></i>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-700">
                  To provide innovative, sustainable laundry solutions that simplify household cleaning while protecting our environment for future generations.
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
            <h3 className="text-xl font-bold text-gray-900 mb-4">Sustainability</h3>
            <p className="text-gray-600">
              We&apos;re committed to reducing environmental impact through biodegradable ingredients, eco-friendly packaging, and sustainable manufacturing processes.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-flask-line text-blue-600 w-8 h-8"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Innovation</h3>
            <p className="text-gray-600">
              Our research team continuously develops new formulations that deliver superior cleaning performance while being gentle on fabrics and skin.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-heart-line text-purple-600 w-8 h-8"></i>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Customer First</h3>
            <p className="text-gray-600">
              We prioritize customer satisfaction through exceptional product quality, responsive support, and continuous improvement based on feedback.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900 mb-1">Dr. Priya Sharma</h3>
              <p className="text-gray-600 text-sm">CEO & Co-Founder</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900 mb-1">Rajesh Kumar</h3>
              <p className="text-gray-600 text-sm">CTO & Co-Founder</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900 mb-1">Anita Patel</h3>
              <p className="text-gray-600 text-sm">Head of R&D</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-gray-900 mb-1">Vikram Singh</h3>
              <p className="text-gray-600 text-sm">Head of Operations</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">50K+</div>
            <p className="text-gray-600">Happy Customers</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">3</div>
            <p className="text-gray-600">Product Variants</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
            <p className="text-gray-600">Biodegradable</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
            <p className="text-gray-600">Customer Support</p>
          </div>
        </div>
      </div>
    </div>
  );
}