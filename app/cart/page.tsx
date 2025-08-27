"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "../lib/store";
import { formatPrice, calculateTax, calculateTotal } from "../lib/utils";
import Header from "../components/Header";
import toast from "react-hot-toast";

export default function Cart() {
  const { cart, cartTotal, removeFromCart, updateCartQuantity, clearCart } =
    useAppStore();
  const router = useRouter();

  const tax = calculateTax(cartTotal);
  const total = calculateTotal(cartTotal);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      toast.success("Item removed from cart");
      return;
    }

    updateCartQuantity(id, newQuantity);
    toast.success("Cart updated");
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    toast.success("Item removed from cart");
  };

  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    router.push("/checkout");
  };

  const handleClearCart = () => {
    clearCart();
    toast.success("Cart cleared");
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-cart-line text-gray-400 w-12 h-12"></i>
            </div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-8">
              Add some products to get started!
            </p>
            <Link
              href="/products"
              className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap inline-block"
            >
              Shop Products
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl overflow-hidden shadow-lg">
                {cart.map((item, index) => (
                  <div
                    key={item.id}
                    className={`p-4 md:p-6 ${index !== cart.length - 1 ? "border-b" : ""}`}
                  >
                    {/* Mobile Layout */}
                    <div className="block md:hidden">
                      <div className="flex items-start space-x-3 mb-3">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-fill object-center rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <p className="text-amber-600 font-semibold text-base">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                          title="Remove item"
                        >
                          <span className="text-lg font-bold">×</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-3 py-2 text-gray-600 hover:text-gray-900 cursor-pointer flex items-center justify-center"
                          >
                            <span className="text-lg font-bold">−</span>
                          </button>
                          <span className="px-4 py-2 bg-gray-50 font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-3 py-2 text-gray-600 hover:text-gray-900 cursor-pointer flex items-center justify-center"
                          >
                            <span className="text-lg font-bold">+</span>
                          </button>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>

                    {/* Desktop/Tablet Layout */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="w-24 h-24 object-fill object-center rounded-lg transition-transform duration-300 hover:scale-105 hover:-translate-y-1 flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {item.name}
                        </h3>
                        <p className="text-amber-600 font-semibold text-lg">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-3 py-2 text-gray-600 hover:text-gray-900 cursor-pointer flex items-center justify-center"
                          >
                            <span className="text-lg font-bold">−</span>
                          </button>
                          <span className="px-4 py-2 bg-gray-50 font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-3 py-2 text-gray-600 hover:text-gray-900 cursor-pointer flex items-center justify-center"
                          >
                            <span className="text-lg font-bold">+</span>
                          </button>
                        </div>

                        {/* Total Price */}
                        <div className="text-lg font-bold text-gray-900 min-w-[5rem] text-right">
                          {formatPrice(item.price * item.quantity)}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-2 cursor-pointer bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center"
                          title="Remove item"
                        >
                          <span className="text-lg font-bold">×</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Actions */}
              <div className="mt-6 flex justify-between items-center">
                <button
                  onClick={handleClearCart}
                  className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
                >
                  Clear Cart
                </button>
                <Link
                  href="/products"
                  className="text-orange-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-8 h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal (
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items)
                  </span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (18% GST)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-400 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors cursor-pointer whitespace-nowrap mb-4"
              >
                Proceed to Checkout
              </button>

              {/* Security Features */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Secure Checkout
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <i className="ri-shield-check-line text-green-600 w-5 h-5 mr-3 flex items-center justify-center"></i>
                    <span className="text-sm">SSL Encrypted Payment</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <i className="ri-truck-line text-blue-600 w-5 h-5 mr-3 flex items-center justify-center"></i>
                    <span className="text-sm">Free Shipping on All Orders</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
