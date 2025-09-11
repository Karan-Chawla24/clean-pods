"use client";

import { useState } from "react";
import Header from "../components/Header";
import FadeInOnScroll from "../components/FadeInOnScroll";

function FAQItem({ faq }: { faq: { question: string; answer: string } }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900">{faq.question}</span>
        <span
          className={`text-orange-600 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

const faqs = [
  {
    question: "What makes this laundry pod 5-in-1?",
    answer:
      "Our pod combines detergent, stain remover, fabric softener, brightener, and odor eliminator in one convenient capsule for a complete laundry solution.",
  },
  {
    question: "Is it safe for all types of fabrics?",
    answer:
      "Yes, our 5-in-1 pod is formulated to be gentle yet effective on cotton, synthetics, delicates, and more. The special enzyme blend ensures fabric protection while maintaining cleaning power.",
  },
  {
    question: "How do I use the pod?",
    answer:
      "Simply place one pod directly into the drum of your washing machine before adding clothes. No need to cut or unwrap. For heavily soiled loads, you may use two pods.",
  },
  {
    question: "Does it work in cold water?",
    answer:
      "Absolutely! Our pods dissolve quickly and clean effectively in both cold and hot water cycles. The advanced formula activates even at temperatures as low as 15°C (60°F).",
  },
  {
    question: "Is the pod packaging eco-friendly?",
    answer:
      "Yes, our pods and packaging are designed to minimize environmental impact. The outer container is made from 100% recycled materials and is fully recyclable. The water-soluble pod film is biodegradable.",
  },
  {
    question: "How many pods should I use per load?",
    answer:
      "For a regular load, one pod is enough. For larger or heavily soiled loads, use two pods. The pre-measured formula ensures the right amount of detergent every time.",
  },
  {
    question: "Can I use these pods in front-load and top-load washing machines?",
    answer:
      "Yes, our pods are compatible with both front-load and top-load washing machines. Just remember to place the pod directly in the drum, not in the detergent drawer.",
  },
  {
    question: "Are the pods safe for sensitive skin?",
    answer:
      "Absolutely. Our 5-in-1 pods are dermatologically tested and free from harsh chemicals, making them safe for babies and individuals with sensitive skin.",
  },
  {
    question: "Do the pods leave any residue on clothes?",
    answer:
      "No, the pods are designed to dissolve completely in water without leaving any sticky residue or streaks, even in cold washes.",
  },
  {
    question: "Can I use pods for hand-washing clothes?",
    answer:
      "Yes, you can dissolve a pod in a bucket of water for hand-washing delicate garments. Just make sure the pod is fully dissolved before soaking clothes.",
  },
  {
    question: "Do these pods help with odor removal?",
    answer:
      "Yes! Our advanced formula includes odor eliminators that neutralize tough smells like sweat, smoke, and food, leaving clothes fresh and clean.",
  },
  {
    question: "How should I store laundry pods safely?",
    answer:
      "Keep the pods in their original container, tightly sealed, and stored in a cool, dry place. Always keep out of reach of children and pets, as pods are highly concentrated.",
  },
  {
    question: "What makes pods better than liquid detergent?",
    answer:
      "Pods offer precise dosing, zero mess, and powerful cleaning in a small package. Unlike liquid detergent, there's no risk of overpouring or wastage.",
  },
  {
    question: "Are your pods septic and plumbing safe?",
    answer:
      "Yes, our pods are fully water-soluble and biodegradable, making them safe for both septic systems and standard plumbing.",
  },
  {
    question: "Do the pods help maintain fabric softness?",
    answer:
      "Yes, one of the 5-in-1 benefits is built-in fabric softener, which keeps clothes feeling soft, smooth, and comfortable after every wash.",
  },
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeInOnScroll>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our 5-in-1 laundry pods
            </p>
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} />
            ))}
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll>
          <div className="mt-12 text-center bg-white rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-6">
              Can&apos;t find the answer you&apos;re looking for? Our customer support team is here to help.
            </p>
            <a
              href="/contact"
              className="inline-block bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-500 hover:to-amber-500 transition-all duration-300"
            >
              Contact Support
            </a>
          </div>
        </FadeInOnScroll>
      </div>
    </div>
  );
}