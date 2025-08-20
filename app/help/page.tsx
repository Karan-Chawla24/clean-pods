'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import FadeInOnScroll from '../components/FadeInOnScroll';
import Header from '../components/Header';

export default function HelpCenter() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  const categories = [
    { id: 'general', name: 'General', icon: 'ri-question-line' },
    { id: 'orders', name: 'Orders', icon: 'ri-shopping-bag-line' },
    { id: 'payment', name: 'Payment', icon: 'ri-bank-card-line' },
    { id: 'shipping', name: 'Shipping', icon: 'ri-truck-line' },
    { id: 'returns', name: 'Returns', icon: 'ri-arrow-go-back-line' }
  ];

  const faqs = {
    general: [
      {
        question: "What are bubble beads?",
        answer: "Bubble beads are innovative sensory toys that provide a satisfying popping experience. They&apos;re made from high-quality, non-toxic materials and are perfect for stress relief and entertainment."
      },
      {
        question: "Are your products safe for children?",
        answer: "Yes, all our bubble bead products are made from non-toxic, BPA-free materials and meet international safety standards. However, we recommend adult supervision for children under 3 years old."
      },
      {
        question: "How do I clean my bubble beads?",
        answer: "Simply wash with warm soapy water and let air dry. Avoid using harsh chemicals or putting them in the dishwasher."
      },
      {
        question: "Do you offer wholesale pricing?",
        answer: "Yes, we offer wholesale pricing for bulk orders. Please contact our sales team at wholesale@bubblebeads.com for more information."
      }
    ],
    orders: [
      {
        question: "How can I track my order?",
        answer: "You can track your order by logging into your account and visiting the &apos;My Orders&apos; section. You&apos;ll receive tracking information via email once your order ships."
      },
      {
        question: "Can I modify or cancel my order?",
        answer: "Orders can be modified or cancelled within 2 hours of placement. After this time, orders enter our fulfillment process and cannot be changed."
      },
      {
        question: "What if I receive a damaged item?",
        answer: "If you receive a damaged item, please contact us within 48 hours with photos of the damage. We&apos;ll arrange for a replacement or full refund immediately."
      },
      {
        question: "How long does order processing take?",
        answer: "Orders are typically processed within 1-2 business days. You&apos;ll receive a confirmation email once your order ships."
      }
    ],
    payment: [
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, UPI, net banking, and digital wallets through our secure Razorpay payment gateway."
      },
      {
        question: "Is my payment information secure?",
        answer: "Yes, we use industry-standard SSL encryption and PCI-compliant payment processing to ensure your payment information is completely secure."
      },
      {
        question: "Why was my payment declined?",
        answer: "Payment declines can occur due to insufficient funds, incorrect card details, or bank security measures. Please check with your bank or try a different payment method."
      },
      {
        question: "Can I get a refund?",
        answer: "Yes, we offer full refunds for damaged or defective items. Refunds are processed within 5-7 business days to your original payment method."
      }
    ],
    shipping: [
      {
        question: "How long does shipping take?",
        answer: "Standard shipping takes 5-7 business days."
      },
      {
        question: "Do you ship internationally?",
        answer: "Currently, we only ship within India. International shipping will be available soon."
      },
      {
        question: "What are your shipping charges?",
        answer: "Shipping is on us — every order, every time."
      },
      {
        question: "Can I change my shipping address?",
        answer: "Shipping addresses cannot be changed after an order has been placed. For any issues, please contact our support team."
      }
    ],
    returns: [
      {
        question: "What is your return policy?",
        answer: "We accept returns for damaged or missing items within 24-48 hours of delivery. Items must be in original condition with packaging."
      },
      {
        question: "How do I initiate a return?",
        answer: "Email us at returns@bubblebeads.com with your order number and photos of the issue. Our team will review and respond within 48 hours."
      },
      {
        question: "Who pays for return shipping?",
        answer: "We cover return shipping costs for damaged or defective items. For other returns, customers are responsible for return shipping."
      },
      {
        question: "How long do refunds take?",
        answer: "Once we receive and process your return, refunds are issued within 5-7 business days to your original payment method."
      }
    ]
  };

  const filteredFaqs = faqs[activeCategory as keyof typeof faqs].filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Navigation */}
      <Header />

      {/* Hero Section */}
      <FadeInOnScroll>
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-xl mb-8 opacity-90">Find answers to your questions and get the support you need</p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 text-gray-900 rounded-full border-0 shadow-lg focus:ring-4 focus:ring-orange-300 focus:outline-none text-lg"
              />
              <i className="ri-search-line absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl"></i>
            </div>
          </div>
        </div>
      </FadeInOnScroll>

      {/* Quick Links */}
      <FadeInOnScroll delay={0.2}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`p-6 rounded-xl text-center transition-all duration-300 ${
                  activeCategory === category.id
                    ? 'bg-orange-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 shadow-md'
                }`}
              >
                <i className={`${category.icon} text-2xl mb-2 block`}></i>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </FadeInOnScroll>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <FadeInOnScroll delay={0.3}>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {categories.find(cat => cat.id === activeCategory)?.name} Questions
          </h2>
        </FadeInOnScroll>

        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <FadeInOnScroll key={index} delay={0.1 * index}>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <details className="group">
                  <summary className="flex justify-between items-center p-6 cursor-pointer hover:bg-orange-50 transition-colors">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                    <i className="ri-add-line text-xl text-orange-600 group-open:rotate-45 transition-transform duration-300"></i>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                </details>
              </div>
            </FadeInOnScroll>
          ))}
        </div>

        {filteredFaqs.length === 0 && (
          <FadeInOnScroll>
            <div className="text-center py-12">
              <i className="ri-search-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
              <p className="text-gray-500">Try adjusting your search terms or browse different categories.</p>
            </div>
          </FadeInOnScroll>
        )}
      </div>

      {/* Contact Support Section */}
      <FadeInOnScroll>
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
              <p className="text-xl text-gray-600">Our support team is here to assist you</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-mail-line text-2xl text-orange-600"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Support</h3>
                <p className="text-gray-600 mb-4">Get detailed help via email</p>
                <a href="mailto:support@bubblebeads.com" className="text-orange-600 hover:text-orange-700 font-medium">
                  support@bubblebeads.com
                </a>
              </div>

              <div className="text-center">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-phone-line text-2xl text-orange-600"></i>
                </div>
                <h3 className="text-lg font-semibold mb-2">Phone Support</h3>
                <p className="text-gray-600 mb-4">Speak with our team directly</p>
                <a href="tel:+911234567890" className="text-orange-600 hover:text-orange-700 font-medium">
                  +91 12345 67890
                </a>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">Business Hours: Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              <div className="flex justify-center space-x-6">
                <Link href="/shipping" className="text-orange-600 hover:text-orange-700 font-medium">
                  Shipping Info
                </Link>
                <Link href="/returns" className="text-orange-600 hover:text-orange-700 font-medium">
                  Return Policy
                </Link>
                <Link href="/contact" className="text-orange-600 hover:text-orange-700 font-medium">
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
