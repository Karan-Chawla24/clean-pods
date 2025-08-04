
'use client';

import Link from 'next/link';
import { useAppStore } from './lib/store';
import { formatPrice } from './lib/utils';
import Header from './components/Header';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function Home() {
  const { addToCart, addToWishlist, wishlist } = useAppStore();

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
      image: 'https://readdy.ai/api/search-image?query=Single%20blue%20detergent%20pod%20on%20clean%20white%20background%2C%20modern%20product%20photography%2C%20premium%20household%20cleaning%20product%2C%20glossy%20finish%2C%20professional%20lighting%2C%20minimalist%20composition%2C%20fresh%20and%20clean%20aesthetic&width=300&height=300&seq=product-basic&orientation=squarish',
      isPopular: false,
    },
    {
      id: 'soft-fresh',
      name: 'Soft & Fresh',
      price: 449,
      description: 'Complete care with detergent and fabric softener. Cleans thoroughly while making clothes soft and fragrant.',
      features: ['Deep cleaning formula', 'Built-in fabric softener', 'Long-lasting freshness', '25 pods per pack'],
      image: 'https://readdy.ai/api/search-image?query=Dual-colored%20detergent%20pod%20with%20blue%20and%20green%20swirls%20on%20clean%20white%20background%2C%20premium%20household%20cleaning%20product%2C%20professional%20product%20photography%2C%20modern%20design%2C%20glossy%20finish%2C%20fresh%20and%20soft%20aesthetic&width=300&height=300&seq=product-softener&orientation=squarish',
      isPopular: true,
    },
    {
      id: 'ultimate',
      name: 'Ultimate Care',
      price: 599,
      description: 'The complete solution with detergent, fabric softener, and stain remover for the toughest cleaning challenges.',
      features: ['Triple-action formula', 'Advanced stain removal', 'Fabric protection', '20 pods per pack'],
      image: 'https://readdy.ai/api/search-image?query=Triple-layered%20detergent%20pod%20with%20blue%2C%20green%2C%20and%20white%20sections%20on%20clean%20white%20background%2C%20premium%20all-in-one%20cleaning%20product%2C%20professional%20product%20photography%2C%20modern%20design%2C%20glossy%20finish%2C%20complete%20care%20aesthetic&width=300&height=300&seq=product-complete&orientation=squarish',
      isPopular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center" style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=Modern%20laundry%20room%20with%20clean%20white%20washing%20machines%2C%20bright%20natural%20lighting%2C%20minimalist%20design%2C%20soap%20bubbles%20floating%20in%20the%20air%2C%20fresh%20and%20clean%20atmosphere%2C%20premium%20household%20products%20on%20wooden%20shelves%2C%20soft%20blue%20and%20white%20color%20scheme%2C%20professional%20photography&width=1920&height=1080&seq=hero-laundry&orientation=landscape')`,
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

      {/* Products Section */}
      <section id="products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Our Product Range</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our three specially formulated detergent pods, each designed to meet your specific laundry needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product) => (
              <div key={product.id} className="bg-gray-50 rounded-2xl p-8 text-center hover:shadow-lg transition-shadow cursor-pointer relative">
                {product.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                  <Image 
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h4>
                <p className="text-gray-600 mb-6">
                  {product.description}
                </p>
                <div className="text-3xl font-bold text-blue-600 mb-6">{formatPrice(product.price)}</div>
                
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleAddToWishlist(product)}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      wishlist.find(item => item.id === product.id)
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <i className={`w-5 h-5 ${wishlist.find(item => item.id === product.id) ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                  </button>
                </div>
                
                <Link href={`/products/${product.id}`} className="w-full text-center bg-gray-100 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap block">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Why Choose CleanPods?</h3>
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
            Join thousands of satisfied customers who have made the switch to CleanPods for a cleaner, fresher laundry experience.
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
              <h1 className="font-['Pacifico'] text-xl text-blue-400 mb-4">CleanPods</h1>
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
                <li>support@cleanpods.com</li>
                <li>1-800-CLEANPODS</li>
                <li>Mon-Fri 9AM-6PM</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 CleanPods. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
