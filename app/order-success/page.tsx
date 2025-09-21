"use client";

import Link from "next/link";
import { safeDisplayOrderId } from "../lib/security/ui-escaping";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "../lib/store";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useAppStore();
  const [orderNumber, setOrderNumber] = useState("");
  const [displayOrderNumber, setDisplayOrderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notificationSent, setNotificationSent] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [orderFetchError, setOrderFetchError] = useState<string | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [maxRetries] = useState(8);

  // Retry logic with exponential backoff for fetching order details
  const fetchOrderWithRetry = async (orderId: string, maxRetries = 8) => {
    setIsLoadingOrder(true);
    setOrderFetchError(null);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setCurrentAttempt(attempt);
        
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (response.ok) {
          const orderData = await response.json();
          setOrderDetails(orderData);
          
          // Set transaction ID from order details if not already set from URL
          if (orderData.payment_id && !transactionId) {
            setTransactionId(orderData.payment_id);
          }
          
          setIsLoadingOrder(false);
          return orderData;
        } else if (response.status === 404 && attempt < maxRetries) {
          // Order not found yet, wait and retry with longer delays for PhonePe callback timing
          const delay = attempt <= 3 
            ? 2000 * attempt  // 2s, 4s, 6s for first 3 attempts
            : Math.min(3000 * (attempt - 2), 15000); // 3s, 6s, 9s, 12s, 15s for later attempts
          
          const errorData = await response.json().catch(() => ({}));
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to fetch order: ${response.status}`);
        }
      } catch (error) {
        if (attempt === maxRetries) {
          setOrderFetchError(`Order not found after ${maxRetries} attempts. This may indicate:\n1. The payment is still being processed by PhonePe\n2. There was an issue saving the order\n\nPlease wait a moment and refresh the page, or contact support if the issue persists.`);
          setIsLoadingOrder(false);
          return null;
        }
        
        // Longer delays for network errors too
        const delay = attempt <= 3 
          ? 2000 * attempt 
          : Math.min(3000 * (attempt - 2), 15000);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    setIsLoadingOrder(false);
    return null;
  };

  // Clear cart when user reaches order success page
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    // Get order ID from URL params - prioritize order_id (which should be merchantOrderId)
    const urlOrderId = searchParams.get("order_id");
    const merchantOrderId = searchParams.get("merchantOrderId");
    const urlTransactionId = searchParams.get("transactionId");
    
    // Store transaction ID if available
    if (urlTransactionId) {
      setTransactionId(urlTransactionId);
    }
    
    // Priority: order_id > merchantOrderId > generate random
    // Note: order_id should contain the merchantOrderId (customer-facing order number)
    if (urlOrderId) {
      setOrderNumber(urlOrderId);
      setDisplayOrderNumber(urlOrderId); // Always show merchantOrderId as order number
      
      // Fetch order details with retry logic
      fetchOrderWithRetry(urlOrderId);
    } else if (merchantOrderId) {
      setOrderNumber(merchantOrderId);
      setDisplayOrderNumber(merchantOrderId); // Always show merchantOrderId as order number
      
      // Verify payment status for merchantOrderId
      verifyPaymentStatus(merchantOrderId);
      
      // Fetch order details with retry logic
      fetchOrderWithRetry(merchantOrderId);
    } else {
      // Generate a random order number for demo
      const randomOrder =
        "CP" + Math.random().toString(36).substr(2, 9).toUpperCase();
      setOrderNumber(randomOrder);
      setDisplayOrderNumber(randomOrder);
    }
  }, [searchParams]);

  // Verify payment status for orders coming from PhonePe redirect
  const verifyPaymentStatus = async (merchantOrderId: string) => {
    try {
      const response = await fetch(`/api/phonepe/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantOrderId })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Only redirect on API errors, not payment status
        window.location.href = `/checkout?error=verification_failed&orderId=${merchantOrderId}`;
        return;
      }
      
      // Check the correct field: result.state (not result.status)
      if (result.state !== 'COMPLETED' && !result.success) {
        // Only redirect if payment actually failed, not if it's still pending
        if (result.state === 'FAILED' || result.isFailed) {
          window.location.href = `/checkout?error=payment_failed&orderId=${merchantOrderId}&message=Payment was not successful`;
          return;
        }
        
        // For pending payments, don't redirect - let the retry logic handle it
        if (result.state === 'PENDING' || result.isPending) {
          return;
        }
      }
      
      // Payment successful, update display with actual order details
      // Note: Don't update displayOrderNumber with result.orderId as that's the phonePeOrderId
      // Keep displaying the merchantOrderId as the order number
      
      // Capture transaction ID if available
      if (result.transactionId) {
        setTransactionId(result.transactionId);
      }
    } catch (error) {
      // Only redirect on actual errors, not on successful pending payments
      window.location.href = `/checkout?error=verification_failed&orderId=${merchantOrderId}`;
    }
  };

  // Send Slack notification when order details are available
  useEffect(() => {
    const sendSlackNotification = async () => {
      if (!orderNumber || notificationSent) return;

      try {
        const transactionId = searchParams.get("transactionId");
        const phonePeOrderId = searchParams.get("phonePeOrderId");
        
        // Get order details from the database
        const orderResponse = await fetch(`/api/orders/${orderNumber}`);
        if (!orderResponse.ok) {
          return;
        }
        
        const orderDetails = await orderResponse.json();
        
        // Prepare data for Slack notification
        const notificationData = {
          orderData: {
            id: orderDetails.id,
            items: orderDetails.items.map((item: any) => ({
              name: item.product_name,
              quantity: item.quantity,
              price: item.unit_price
            })),
            total: orderDetails.total_amount,
            paymentId: transactionId || orderDetails.payment_id
          },
          customerData: {
            name: orderDetails.customer_name,
            email: orderDetails.customer_email,
            phone: orderDetails.customer_phone,
            address: orderDetails.shipping_address
          }
        };
        
        // Send notification to Slack
        const slackResponse = await fetch('/api/slack-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData)
        });
        
        if (slackResponse.ok) {
          setNotificationSent(true);
        }
      } catch (error) {
        // Silently handle Slack notification errors
      }
    };

    sendSlackNotification();
  }, [orderNumber, searchParams, notificationSent]);

  return (
    <div className="min-h-screen bg-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              href="/"
              className="font-['Pacifico'] text-2xl text-orange-600 cursor-pointer"
            >
              BubbleBeads
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <i className="ri-check-line text-green-600 w-12 h-12 flex items-center justify-center"></i>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Order Successful!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase. Your order has been confirmed and is
            being processed.
          </p>

          {/* Order Details */}
          <div className="bg-white rounded-2xl p-8 mb-8 text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Order Details
            </h2>
            
            {/* Loading State */}
            {isLoadingOrder && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing payment confirmation...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                {currentAttempt > 1 && (
                  <div className="mt-3 text-sm text-gray-500">
                    Attempt {currentAttempt} of {maxRetries}
                  </div>
                )}
              </div>
            )}
            
            {/* Error State */}
            {orderFetchError && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-error-warning-line text-red-600 w-8 h-8"></i>
                </div>
                <p className="text-red-600 mb-4">{orderFetchError}</p>
                <Link
                  href="/orders"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  View all orders
                </Link>
              </div>
            )}
            
            {/* Order Details Content */}
            {!isLoadingOrder && !orderFetchError && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Order Information
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    <p>
                      <strong>Order Number:</strong>{" "}
                      {safeDisplayOrderId(displayOrderNumber)}
                    </p>
                    {(transactionId || orderDetails?.payment_id) && (
                      <p>
                        <strong>Transaction ID:</strong>{" "}
                        {safeDisplayOrderId(transactionId || orderDetails?.payment_id)}
                      </p>
                    )}
                    <p>
                      <strong>Order Date:</strong>{" "}
                      {orderDetails?.created_at 
                        ? new Date(orderDetails.created_at).toLocaleDateString()
                        : new Date().toLocaleDateString()
                      }
                    </p>
                    <p>
                      <strong>Payment Status:</strong>{" "}
                      <span className="text-green-600">
                        {orderDetails?.payment_status === 'paid' ? 'Confirmed' : 'Confirmed'}
                      </span>
                    </p>
                    {orderDetails?.total_amount && (
                      <p>
                        <strong>Total Amount:</strong>{" "}
                        ₹{orderDetails.total_amount.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Delivery Information
                  </h3>
                  <div className="space-y-2 text-gray-600">
                    {orderDetails?.customer_name && (
                      <p>
                        <strong>Customer:</strong> {orderDetails.customer_name}
                      </p>
                    )}
                    {orderDetails?.shipping_address && (
                      <p>
                        <strong>Address:</strong> {orderDetails.shipping_address}
                      </p>
                    )}
                    <p>
                      <strong>Estimated Delivery:</strong> 3-5 business days
                    </p>
                    <p>
                      <strong>Shipping Method:</strong> Free Standard Shipping
                    </p>
                    <p>
                      <strong>Tracking:</strong> Will be sent via email
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Order Items */}
            {orderDetails?.items && orderDetails.items.length > 0 && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-3">
                  {orderDetails.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{item.total_price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">₹{item.unit_price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="bg-orange-50 rounded-2xl p-8 mb-8 text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              What happens next?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-orange-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Order Processing
                </h3>
                <p className="text-gray-600 text-sm">
                  We&apos;re preparing your order for shipment
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-orange-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Shipping Confirmation
                </h3>
                <p className="text-gray-600 text-sm">
                  You&apos;ll receive tracking information via email
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold text-orange-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivery</h3>
                <p className="text-gray-600 text-sm">
                  Your BubbleBeads will arrive at your doorstep
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-8 py-3 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer whitespace-nowrap inline-block"
            >
              Continue Shopping
            </Link>
            {/* <button
              onClick={() => window.print()}
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Print Order Details
            </button> */}
          </div>

          {/* Customer Support */}
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, don&apos;t hesitate to
              contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:customercare.bb@outlook.com"
                className="text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                <i className="ri-mail-line w-4 h-4 inline-block mr-2"></i>
                customercare.bb@outlook.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback({ attempt = 1, maxRetries = 8 }: { attempt?: number; maxRetries?: number }) {
  const getLoadingMessage = () => {
    if (attempt <= 2) {
      return "Loading your order details...";
    } else if (attempt <= 4) {
      return "Processing payment confirmation...";
    } else {
      return "Finalizing your order (this may take a moment)...";
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              href="/"
              className="font-['Pacifico'] text-2xl text-orange-600 cursor-pointer"
            >
              BubbleBeads
            </Link>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">{getLoadingMessage()}</p>
          {attempt > 3 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md mx-auto">
              <p className="text-sm text-blue-700">
                Your payment was successful and we&apos;re processing your order. 
                This usually takes just a few moments.
              </p>
            </div>
          )}
          {attempt > 1 && (
            <div className="mt-3 text-sm text-gray-500">
              Attempt {attempt} of {maxRetries}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccess() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}
