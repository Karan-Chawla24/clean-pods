
'use client';

import Link from 'next/link';
import { useAppStore } from './lib/store';
import Header from './components/Header';
import Image from 'next/image';
import HomeImg  from '../images/Home.jpg';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Testimonial1 from '../images/Home.jpg';
import Testimonial2 from '../images/three.jpg';
import Testimonial3 from '../images/fivein1.jpg';
import FloatingBubbles from './components/FloatingBubbles';
import ShimmerButton from './components/ShimmerButton';
import FadeInOnScroll from './components/FadeInOnScroll';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToCart, addToWishlist, wishlist } = useAppStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center" style={{
        backgroundImage: `url(${HomeImg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <FloatingBubbles />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-bold bg-gradient-to-r from-sky-200 to-amber-200 bg-clip-text text-transparent mb-6">
              Revolutionary Laundry Made Simple
            </h2>
            <p className="text-xl bg-gradient-to-r from-amber-200 to-sky-200 bg-clip-text text-transparent mb-8">
              Experience the power of premium detergent pods designed for every laundry need. Clean, fresh, and effortless.
            </p>
            <ShimmerButton as="link" href="/products">
              Shop Now
            </ShimmerButton>
          </div>
        </div>
      </section>

{/* Testimonials Section */}
<section id="testimonials" className="py-20 bg-gradient-to-b from-amber-50 via-white to-orange-50 relative overflow-hidden">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Heading */}
    <FadeInOnScroll className="text-center mb-16">
      <h3 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h3>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Real stories from happy BubbleBeads users.
      </p>
    </FadeInOnScroll>

    {/* Testimonials Grid */}
    <div className="grid md:grid-cols-3 gap-8">
      {/* Testimonial 1 */}
      <FadeInOnScroll delay={0.1} className="bg-white rounded-2xl p-8 text-center shadow-lg border border-orange-100 flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-transform duration-300">
        <Image src={Testimonial1} alt="Priya S." width={80} height={80} className="rounded-full mb-4" />
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <i key={i} className="ri-star-fill text-yellow-400 text-xl mr-1"></i>
          ))}
        </div>
        <p className="text-lg text-gray-700 mb-4">&ldquo;BubbleBeads pods are a game changer! My clothes have never felt so fresh and clean.&rdquo;</p>
        <div className="font-bold text-orange-500">Priya S.</div>
        <p className="text-sm text-gray-500">Verified Buyer</p>
      </FadeInOnScroll>

      {/* Testimonial 2 */}
      <FadeInOnScroll delay={0.2} className="bg-white rounded-2xl p-8 text-center shadow-lg border border-orange-100 flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-transform duration-300">
        <Image src={Testimonial2} alt="Rahul M." width={80} height={80} className="rounded-full mb-4" />
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <i key={i} className="ri-star-fill text-yellow-400 text-xl mr-1"></i>
          ))}
        </div>
        <p className="text-lg text-gray-700 mb-4">&ldquo;Super easy to use and no mess. The scent lasts for days!&rdquo;</p>
        <div className="font-bold text-orange-500">Rahul M.</div>
        <p className="text-sm text-gray-500">Verified Buyer</p>
      </FadeInOnScroll>

      {/* Testimonial 3 */}
      <FadeInOnScroll delay={0.3} className="bg-white rounded-2xl p-8 text-center shadow-lg border border-orange-100 flex flex-col items-center hover:shadow-xl hover:-translate-y-2 transition-transform duration-300">
        <Image src={Testimonial3} alt="Anjali K." width={80} height={80} className="rounded-full mb-4" />
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <i key={i} className="ri-star-fill text-yellow-400 text-xl mr-1"></i>
          ))}
        </div>
        <p className="text-lg text-gray-700 mb-4">&ldquo;I love how eco-friendly these pods are. Highly recommend!&rdquo;</p>
        <div className="font-bold text-orange-500">Anjali K.</div>
        <p className="text-sm text-gray-500">Verified Buyer</p>
      </FadeInOnScroll>
    </div>

    {/* CTA Below Testimonials */}
    <div className="mt-12 text-center">
      <Link 
        href="/products" 
        className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-orange-400 text-white font-semibold shadow-lg hover:opacity-90 transition"
      >
        Join Thousands of Happy Customers
      </Link>
    </div>
  </div>
</section>


      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-sky-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Why Choose BubbleBeads?</h3>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-3 gap-8">
            <FadeInOnScroll delay={0.1} className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-drop-line text-orange-500 w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Concentrated Formula</h4>
              <p className="text-gray-600">
                Powerful cleaning in a compact pod. Less waste, more results.
              </p>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.2} className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-leaf-line text-green-600 w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Eco-Friendly</h4>
              <p className="text-gray-600">
                Biodegradable ingredients that are safe for you and the environment.
              </p>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.3} className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-check-line text-purple-600 w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Safe & Gentle</h4>
              <p className="text-gray-600">
                Dermatologically tested and safe for all fabric types.
              </p>
            </FadeInOnScroll>
          </div>
        </div>
      </section>


      {/* Footer */}
<footer className="bg-gradient-to-r from-sky-50 via-white to-orange-50 text-gray-700 py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid md:grid-cols-4 gap-8">
      
      <div>
        <h1 className="font-['Pacifico'] text-xl text-orange-500 mb-4">BubbleBeads</h1>
        <p className="text-gray-600">
          Premium detergent pods for the modern household. Clean, simple, effective.
        </p>
      </div>
      
      <div>
        <h5 className="font-semibold text-sky-700 mb-4">Products</h5>
        <ul className="space-y-2 text-gray-600">
          <li>
            <Link href="/products/essential" className="hover:text-orange-500 transition-colors">
              Essential Clean
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h5 className="font-semibold text-sky-700 mb-4">Support</h5>
        <ul className="space-y-2 text-gray-600">
          <li><Link href="/help" className="hover:text-orange-500 transition-colors">Help Center</Link></li>
          <li><Link href="/shipping" className="hover:text-orange-500 transition-colors">Shipping Info</Link></li>
          <li><Link href="/returns" className="hover:text-orange-500 transition-colors">Returns</Link></li>
        </ul>
      </div>

      <div>
        <h5 className="font-semibold text-sky-700 mb-4">Contact</h5>
        <ul className="space-y-2 text-gray-600">
          <li>support@bubblebeads.com</li>
          <li>1-800-BUBBLEBEADS</li>
          <li>Mon-Fri 9AM-6PM</li>
        </ul>
      </div>
    </div>
    
    <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-500">
      <p>&copy; 2024 BubbleBeads. All rights reserved.</p>
    </div>
  </div>
</footer>

    </div>
  );
}
