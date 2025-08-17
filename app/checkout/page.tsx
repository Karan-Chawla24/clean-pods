
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../lib/store';
import { formatPrice, calculateTax, calculateTotal, generateOrderId, validateEmail, validatePhone } from '../lib/utils';
import Header from '../components/Header';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession, getCsrfToken } from 'next-auth/react';

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

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { data: session } = useSession();
  const router = useRouter();
  const { cart, cartTotal, clearCart, addOrder } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Helper function to make CSRF-protected API calls
  const fetchWithCsrf = async (url: string, options: RequestInit = {}) => {
    const csrfToken = await getCsrfToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        'X-CSRF-Token': csrfToken || '',
      },
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutForm>();

  // Pre-fill form with user data if signed in
  useEffect(() => {
    if (session?.user) {
      if (session.user.firstName) setValue('firstName', session.user.firstName);
      if (session.user.lastName) setValue('lastName', session.user.lastName);
      if (session.user.email) setValue('email', session.user.email);
    }
  }, [session, setValue]);

  const subtotal = cartTotal;
  const tax = calculateTax(subtotal);
  const total = calculateTotal(subtotal);

  const processPayment = handleSubmit(async (data: CheckoutForm) => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      // Create Razorpay order
      const orderResponse = await fetchWithCsrf('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR',
          receipt: generateOrderId(),
        }),
      });

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        throw new Error(`API Error: ${orderResponse.status} - ${errorText}`);
      }

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay script not loaded');
      }

      // Initialize Razorpay
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      
      if (!razorpayKey) {
        throw new Error('Razorpay key not configured. Please check your environment variables.');
      }
      
      const options = {
        key: razorpayKey,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'BubbleBeads',
        description: 'Laundry Detergent Pods',
        order_id: orderData.order.id,
        handler: async function (response: any) {
          // Show loader immediately when payment is completed
          setIsRedirecting(true);
          
          try {
            // Verify payment
            const verifyResponse = await fetchWithCsrf('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Use Razorpay order ID instead of generating custom one
              const orderId = response.razorpay_order_id;
              
              // Save order to database (authenticated users get it saved to their account)
                try {
                  const orderApiUrl = session ? '/api/user/orders' : '/api/orders';
                  
                  const orderPayload: any = {
                    razorpayOrderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    total: total,
                    customerName: `${data.firstName} ${data.lastName}`,
                    customerEmail: data.email,
                    customerPhone: data.phone,
                    address: `${data.address}, ${data.city}, ${data.state} ${data.pincode}`,
                    items: cart.map(item => ({
                      name: item.name,
                      quantity: item.quantity,
                      price: item.price
                    }))
                  };
                  
                  // For non-authenticated users, use the legacy format expected by /api/orders
                  if (!session) {
                    orderPayload.customer = {
                      firstName: data.firstName,
                      lastName: data.lastName,
                      email: data.email,
                      phone: data.phone,
                      address: data.address,
                      city: data.city,
                      state: data.state,
                      pincode: data.pincode
                    };
                  } else if (session.user?.id) {
                    // For authenticated users, include the user ID
                    orderPayload.userId = session.user.id;
                  }
                  
                  console.log('Sending order payload:', orderPayload);
                  
                  const orderResponse = await fetchWithCsrf(orderApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                  });
                
                if (!orderResponse.ok) {
                  const errorText = await orderResponse.text();
                  console.error('Order creation failed:', errorText);
                } else {
                  const orderResult = await orderResponse.json();
                  console.log('Order created successfully:', orderResult);
                }
              } catch (dbError) {
                console.error('Order creation error:', dbError);
                // Continue with Slack notification even if DB fails
              }

              // Create order in our system (existing code)
              const order = {
                id: orderId,
                items: cart,
                total: total,
                status: 'processing' as const,
                orderDate: new Date().toISOString(),
                trackingNumber: `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                paymentId: response.razorpay_payment_id,
              };

              // Send Slack notification
              try {
                await fetchWithCsrf('/api/slack-notification', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    orderData: {
                      id: orderId,
                      items: cart.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price
                      })),
                      total: total,
                      paymentId: response.razorpay_payment_id,
                    },
                    customerData: {
                      name: `${data.firstName} ${data.lastName}`,
                      email: data.email,
                      phone: data.phone,
                      address: `${data.address}, ${data.city}, ${data.state} ${data.pincode}`,
                    },
                  }),
                });
              } catch (slackError) {
                // Don't fail the order if Slack notification fails
              }

              // Store order in user's localStorage for privacy (only for unauthenticated users)
              if (!session) {
                try {
                  const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
                  const orderForStorage = {
                    id: orderId,
                    razorpayOrderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    customerName: `${data.firstName} ${data.lastName}`,
                    customerEmail: data.email,
                    customerPhone: data.phone,
                    address: `${data.address}, ${data.city}, ${data.state} ${data.pincode}`,
                    items: cart.map(item => ({
                      id: item.id,
                      name: item.name,
                      quantity: item.quantity,
                      price: item.price
                    })),
                    total: total,
                    orderDate: new Date().toISOString(),
                  };
                  userOrders.push(orderForStorage);
                  localStorage.setItem('userOrders', JSON.stringify(userOrders));
                } catch (localError) {
                  console.error('Failed to store order locally:', localError);
                }
              }
              
              addOrder(order);
              clearCart();
              toast.success('Payment successful! Your order has been placed.');
              router.push(`/order-success?order_id=${orderId}`);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          contact: data.phone,
        },
        notes: {
          address: `${data.address}, ${data.city}, ${data.state} ${data.pincode}`,
        },
        theme: {
          color: '#2563eb',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  });

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some products to your cart before checkout.</p>
            <Link
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block"
            >
              Continue Shopping
            </Link>
          </div>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600">Redirecting to your order confirmation...</p>
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
                  <label className="block text-gray-700 font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: { value: 2, message: 'First name must be at least 2 characters' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: { value: 2, message: 'Last name must be at least 2 characters' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email *</label>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    validate: (value) => validateEmail(value) || 'Please enter a valid email',
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  {...register('phone', {
                    required: 'Phone number is required',
                    validate: (value) => validatePhone(value) || 'Please enter a valid phone number',
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Address *</label>
                <textarea
                  {...register('address', {
                    required: 'Address is required',
                    minLength: { value: 10, message: 'Address must be at least 10 characters' },
                  })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">City *</label>
                  <input
                    type="text"
                    {...register('city', {
                      required: 'City is required',
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">State *</label>
                  <input
                    type="text"
                    {...register('state', {
                      required: 'State is required',
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter state"
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Pincode *</label>
                  <input
                    type="text"
                    {...register('pincode', {
                      required: 'Pincode is required',
                      pattern: { value: /^[1-9][0-9]{5}$/, message: 'Please enter a valid pincode' },
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter pincode"
                  />
                  {errors.pincode && (
                    <p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
              
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
                      <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
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
                  <span className="text-gray-600">Tax (18% GST)</span>
                  <span className="font-medium">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
