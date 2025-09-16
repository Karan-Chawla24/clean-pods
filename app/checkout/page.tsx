"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAppStore } from "../lib/store";
import {
  formatPrice,
  generateOrderId,
  validateEmail,
  validatePhone,
} from "../lib/utils";
import Header from "../components/Header";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}



export default function Checkout() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    cart,
    cartTotal,
    clearCart,
    addOrder,
    addToCart,
    updateCartItemPrice,
  } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);


  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/auth/signin?redirect_url=/checkout');
    }
  }, [isLoaded, user, router]);



  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutForm>();

  // Pre-fill form with user data if signed in
  useEffect(() => {
    if (user) {
      if (user.firstName) setValue("firstName", user.firstName);
      if (user.lastName) setValue("lastName", user.lastName);
      if (user.emailAddresses?.[0]?.emailAddress)
        setValue("email", user.emailAddresses[0].emailAddress);
    }
  }, [user, setValue]);

  const subtotal = cartTotal;
  
  // Calculate shipping based on total quantity of boxes
  const totalBoxes = cart.reduce((total, item) => {
    // Determine boxes per item based on product ID
    let boxesPerItem = 1; // default
    if (item.id === 'combo-2box') boxesPerItem = 2;
    if (item.id === 'combo-3box') boxesPerItem = 3;
    return total + (boxesPerItem * item.quantity);
  }, 0);
  
  const shipping = totalBoxes >= 3 ? 0 : totalBoxes >= 2 ? 49 : 99;
  const total = subtotal + shipping;

  // Validate and update cart item prices on component mount
  useEffect(() => {
    const validateCartPrices = async () => {
      if (cart.length === 0) return;

      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        const products = data.products;

        // Check each cart item against current API prices
        cart.forEach((cartItem) => {
          const currentProduct = products.find(
            (p: any) => p.id === cartItem.id,
          );
          if (currentProduct && currentProduct.price !== cartItem.price) {
            updateCartItemPrice(cartItem.id, currentProduct.price);
          }
        });
      } catch (error) {
        console.error("Failed to validate cart prices:", error);
      }
    };

    validateCartPrices();
  }, [cart.length]); // Only run when cart length changes to avoid infinite loops

  const processPayment = handleSubmit(async (data: CheckoutForm) => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      // Create PhonePe order with cart validation
      const requestBody = {
        amount: total,
        currency: "INR",
        merchantOrderId: generateOrderId(),
        cart: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        customerInfo: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          address: `${data.address}, ${data.city}, ${data.state} - ${data.pincode}`,
        },
      };

      // Request sent to /api/phonepe/create-order (OAuth)
      const orderResponse = await fetch("/api/phonepe/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        throw new Error(`API Error: ${orderResponse.status} - ${errorText}`);
      }

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Redirect to PhonePe payment page
      if (orderData.paymentUrl) {
        window.location.href = orderData.paymentUrl;
      } else {
        throw new Error("Payment URL not received from server");
      }


    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process payment. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  });

  // Show loading while checking authentication
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      {/* Full-page loader overlay when redirecting to success page */}
      {isRedirecting && (
        <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600">
              Redirecting to your order confirmation...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Checkout Form */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

            <form onSubmit={processPayment} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    {...register("firstName", {
                      required: "First name is required",
                      minLength: {
                        value: 2,
                        message: "First name must be at least 2 characters",
                      },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    {...register("lastName", {
                      required: "Last name is required",
                      minLength: {
                        value: 2,
                        message: "Last name must be at least 2 characters",
                      },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    validate: (value) =>
                      validateEmail(value) || "Please enter a valid email",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Phone *
                </label>
                <input
                  type="tel"
                  {...register("phone", {
                    required: "Phone number is required",
                    validate: (value) =>
                      validatePhone(value) ||
                      "Please enter a valid phone number",
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Address *
                </label>
                <textarea
                  {...register("address", {
                    required: "Address is required",
                    minLength: {
                      value: 10,
                      message: "Address must be at least 10 characters",
                    },
                  })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    {...register("city", {
                      required: "City is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    {...register("state", {
                      required: "State is required",
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.state.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    {...register("pincode", {
                      required: "Pincode is required",
                      pattern: {
                        value: /^[1-9][0-9]{5}$/,
                        message: "Please enter a valid pincode",
                      },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter pincode"
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.pincode.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay ${formatPrice(total)}`
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-gray-600 text-sm">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm text-gray-500 italic">Inclusive of all taxes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
