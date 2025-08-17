
'use client';

import Link from 'next/link';
import { useAppStore } from './lib/store';
import { formatPrice } from './lib/utils';
import Header from './components/Header';
import toast from 'react-hot-toast';
import Image from 'next/image';
import SinglePod from '../images/Single.jpg';
import threein1 from '../images/threein1.jpg';
import fivein1 from '../images/fivein1.jpg';
import HomeImg  from '../images/Home.jpg';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Testimonial1 from '../images/Home.jpg';
import Testimonial2 from '../images/three.jpg';
import Testimonial3 from '../images/fivein1.jpg';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleAddToCart = (product: any) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    toast.success('Added to cart!');
  };

  const handleAddToWishlist = (product: any) => {
    addToWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    toast.success('Added to wishlist!');
  };

  const products = [
    {
      id: 'essential',
      name: 'Essential Clean',
      price: 299,
      description: 'Pure detergent power for everyday cleaning. Removes dirt and stains effectively while being gentle on fabrics.',
      features: ['Powerful stain removal', 'Gentle on all fabric types', 'Fresh scent', '30 pods per pack'],
      image: SinglePod, 
      isPopular: false,
    },
    {
      id: 'soft-fresh',
      name: 'Soft & Fresh',
      price: 449,
      description: 'Complete care with detergent and fabric softener. Cleans thoroughly while making clothes soft and fragrant.',
      features: ['Deep cleaning formula', 'Built-in fabric softener', 'Long-lasting freshness', '30 pods per pack'],
      image: threein1,
      isPopular: true,
    },
    {
      id: 'ultimate',
      name: 'Ultimate Care',
      price: 599,
      description: 'The complete solution with detergent, fabric softener, and stain remover for the toughest cleaning challenges.',
      features: ['Triple-action formula', 'Advanced stain removal', 'Fabric protection', '20 pods per pack'],
      image: fivein1,
      isPopular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center" style={{
        backgroundImage: `url(${HomeImg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <h2 className="text-5xl font-bold text-white mb-6">
              Revolutionary Laundry Made Simple
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Experience the power of premium detergent pods designed for every laundry need. Clean, fresh, and effortless.
            </p>
            <Link href="/products" className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap inline-block">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section (replaces Products Section) */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real stories from happy BubbleBeads users.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 text-center shadow flex flex-col items-center">
              <Image src={Testimonial1} alt="Priya S." width={80} height={80} className="rounded-full mb-4" />
              <div className="mb-4">
                <i className="ri-star-fill text-yellow-400 text-3xl"></i>
              </div>
              <p className="text-lg text-gray-700 mb-4">&ldquo;BubbleBeads pods are a game changer! My clothes have never felt so fresh and clean.&rdquo;</p>
              <div className="font-bold text-blue-600">Priya S.</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center shadow flex flex-col items-center">
              <Image src={Testimonial2} alt="Rahul M." width={80} height={80} className="rounded-full mb-4" />
              <div className="mb-4">
                <i className="ri-star-fill text-yellow-400 text-3xl"></i>
              </div>
              <p className="text-lg text-gray-700 mb-4">&ldquo;Super easy to use and no mess. The scent lasts for days!&rdquo;</p>
              <div className="font-bold text-blue-600">Rahul M.</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center shadow flex flex-col items-center">
              <Image src={Testimonial3} alt="Anjali K." width={80} height={80} className="rounded-full mb-4" />
              <div className="mb-4">
                <i className="ri-star-fill text-yellow-400 text-3xl"></i>
              </div>
              <p className="text-lg text-gray-700 mb-4">&ldquo;I love how eco-friendly these pods are. Highly recommend!&rdquo;</p>
              <div className="font-bold text-blue-600">Anjali K.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Why Choose BubbleBeads?</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-drop-line text-blue-600 w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Concentrated Formula</h4>
              <p className="text-gray-600">
                Powerful cleaning in a compact pod. Less waste, more results.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-leaf-line text-green-600 w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Eco-Friendly</h4>
              <p className="text-gray-600">
                Biodegradable ingredients that are safe for you and the environment.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-shield-check-line text-purple-600 w-8 h-8 flex items-center justify-center"></i>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Safe & Gentle</h4>
              <p className="text-gray-600">
                Dermatologically tested and safe for all fabric types.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Laundry?</h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have made the switch to BubbleBeads for a cleaner, fresher laundry experience.
          </p>
          <Link href="#products" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap inline-block">
            Shop All Products
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h1 className="font-['Pacifico'] text-xl text-blue-400 mb-4">BubbleBeads</h1>
              <p className="text-gray-400">
                Premium detergent pods for the modern household. Clean, simple, effective.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Products</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products/essential" className="hover:text-white cursor-pointer">Essential Clean</Link></li>
                <li><Link href="/products/soft-fresh" className="hover:text-white cursor-pointer">Soft & Fresh</Link></li>
                <li><Link href="/products/ultimate" className="hover:text-white cursor-pointer">Ultimate Care</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white cursor-pointer">Help Center</Link></li>
                <li><Link href="/shipping" className="hover:text-white cursor-pointer">Shipping Info</Link></li>
                <li><Link href="/returns" className="hover:text-white cursor-pointer">Returns</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Contact</h5>
              <ul className="space-y-2 text-gray-400">
                <li>support@bubblebeads.com</li>
                <li>1-800-BUBBLEBEADS</li>
                <li>Mon-Fri 9AM-6PM</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 BubbleBeads. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
