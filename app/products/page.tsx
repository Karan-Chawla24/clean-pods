'use client';

import { useAppStore } from '../lib/store';
import { formatPrice } from '../lib/utils';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import SinglePod from '../../images/Single.jpg';

const products = [
  {
    id: 'essential',
    name: 'Essential Clean',
    price: 299,
    description:
      'Pure detergent power for everyday cleaning. Removes dirt and stains effectively while being gentle on fabrics.',
    features: [
      'Powerful stain removal',
      'Gentle on all fabric types',
      'Fresh scent',
      '30 pods per pack',
    ],
    image: SinglePod,
    isPopular: false,
  },
];
const product = products[0];

export default function Products() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToCart } = useAppStore();

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

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="w-full px-4 sm:px-8 lg:px-12 py-12">
        <div className="text-center mb-12 max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            5-in-1 Laundry Pod
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the ultimate clean with our advanced 5-in-1 laundry pod.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1920px] mx-auto justify-center">
          {/* Product Section */}
          <div className="bg-white bg-opacity-95 rounded-3xl shadow-xl p-6 lg:p-8 md:w-[48%] w-full flex flex-col items-start justify-start border border-orange-200 md:h-[520px]">
            <div className="w-full flex flex-col items-center">
              <div className="w-40 h-40 mb-4 relative flex items-center justify-center bg-gradient-to-br from-orange-100 to-sky-100 rounded-full shadow-lg border-4 border-orange-300">
                <Image
                  src={product.image}
                  alt={product.name}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-full"
                />
              </div>
              <h2 className="text-3xl font-extrabold text-orange-600 mb-2 text-center drop-shadow">
                {product.name}
              </h2>
              <p className="text-gray-700 mb-3 text-center text-base">
                {product.description}
              </p>
            </div>

            <ul className="w-full mt-4 text-gray-600 text-left space-y-2">
              {product.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-base">
                  <span className="text-sky-500">✔</span> {feature}
                </li>
              ))}
            </ul>

            <div className="w-full mt-auto pt-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-3xl font-bold text-orange-500">
                  ₹{product.price}
                </span>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-gradient-to-r from-sky-400 via-sky-500 to-orange-400 text-white px-8 py-3 rounded-full hover:from-sky-500 hover:via-sky-600 hover:to-orange-500 transition-all duration-300 shadow-lg shadow-sky-200"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white bg-opacity-95 rounded-3xl shadow-xl p-6 lg:p-8 md:w-[48%] w-full flex flex-col justify-start border border-sky-200 md:h-[520px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-sky-200 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb:hover]:bg-sky-300">
            <h3 className="text-3xl font-bold text-sky-500 mb-8 text-center drop-shadow">
              Frequently Asked Questions
            </h3>
            <div className="space-y-5">
              {faqs.map((faq, idx) => (
                <FAQItem key={idx} faq={faq} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: { question: string; answer: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg p-4 bg-gray-50 hover:border-orange-300 transition-all duration-200">
      <button
        className="flex items-center justify-between w-full text-left focus:outline-none"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="font-semibold text-sky-600 hover:text-orange-600 transition-colors">
          {faq.question}
        </span>
        <span className="ml-2 text-sky-500">
          <svg
            className={`w-5 h-5 transform transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </button>
      {open && <div className="mt-3 text-gray-700">{faq.answer}</div>}
    </div>
  );
}

const faqs = [
  {
    question: 'What makes this laundry pod 5-in-1?',
    answer:
      'Our pod combines detergent, stain remover, fabric softener, brightener, and odor eliminator in one convenient capsule for a complete laundry solution.',
  },
  {
    question: 'Is it safe for all types of fabrics?',
    answer:
      'Yes, our 5-in-1 pod is formulated to be gentle yet effective on cotton, synthetics, delicates, and more. The special enzyme blend ensures fabric protection while maintaining cleaning power.',
  },
  {
    question: 'How do I use the pod?',
    answer:
      'Simply place one pod directly into the drum of your washing machine before adding clothes. No need to cut or unwrap. For heavily soiled loads, you may use two pods.',
  },
  {
    question: 'Does it work in cold water?',
    answer:
      'Absolutely! Our pods dissolve quickly and clean effectively in both cold and hot water cycles. The advanced formula activates even at temperatures as low as 15°C (60°F).',
  },
  {
    question: 'Is the pod packaging eco-friendly?',
    answer:
      'Yes, our pods and packaging are designed to minimize environmental impact. The outer container is made from 100% recycled materials and is fully recyclable. The water-soluble pod film is biodegradable.',
  },
];
