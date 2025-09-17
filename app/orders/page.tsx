"use client";

import { useEffect, useState, Suspense } from "react";
import { formatPrice, formatDate } from "../lib/utils";
import Header from "../components/Header";
import Link from "next/link";
import Image from "next/image";
import { useAppStore } from "../lib/store";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  merchantOrderId: string;
  phonePeOrderId: string;
  paymentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  total: number;
  orderDate: string;
  items: OrderItem[];
}

// Component to handle search parameters with Suspense boundary
function SearchParamsHandler({ setHighlightOrderId }: { setHighlightOrderId: (id: string | null) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const merchantOrderId = searchParams.get('merchantOrderId');
    if (merchantOrderId) {
      setHighlightOrderId(merchantOrderId);
      toast.success('Payment completed! Your order has been processed.');
      // Clear the URL parameter after showing the message
      const url = new URL(window.location.href);
      url.searchParams.delete('merchantOrderId');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, setHighlightOrderId]);

  return null;
}

// Product image mapping based on product names and IDs
const productImageMap: { [key: string]: string } = {
  // Current combo box IDs
  "single-box": "/pod_image.jpg",
  "combo-2box": "/pod_image.jpg",
  "combo-3box": "/pod_image.jpg",
  // Current product names
  "5-in-1 Laundry Pod": "/pod_image.jpg",
  "5-in-1 Laundry Pod - 2 Box Combo": "/pod_image.jpg",
  "5-in-1 Laundry Pod - 3 Box Combo": "/pod_image.jpg",
  // Legacy IDs (for backward compatibility with old orders)
  essential: "/pod_image.jpg",
  "soft-fresh": "/Threein1.jpg",
  ultimate: "/fivein1.jpg",
  // Legacy names (for backward compatibility with old orders)
  "Essential Clean": "/pod_image.jpg",
  "Soft & Fresh": "/Threein1.jpg",
  "Ultimate Care": "/fivein1.jpg",
  "Essential Clean Pod": "/pod_image.jpg",
};

export default function Orders() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);
  const { orders: storeOrders, clearCart } = useAppStore();

  useEffect(() => {
    console.log('Client auth status:', { isLoaded, userId: user?.id });
    
    if (!isLoaded || !user) {
      if (isLoaded && !user) {
        router.push(
          "/auth/signin?callbackUrl=" + encodeURIComponent("/orders"),
        );
      }
      return;
    }

    if (isLoaded && user) {
      const fetchOrders = async () => {
        try {
          console.log('Fetching orders for user:', user.id);
          // For same-origin requests, Clerk automatically handles authentication via cookies
          // No need to manually send Bearer token for same-origin API routes
          const response = await fetch("/api/user/orders");
          console.log('Orders API response status:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Orders API error:', errorText);
            throw new Error("Failed to fetch orders");
          }
          const data = await response.json();
          console.log('Orders data received:', data);
          setOrders(Array.isArray(data) ? data : data.orders || []);
        } catch (err) {
          console.error("Error fetching orders:", err);
          setError("Failed to load your orders");
          toast.error("Could not fetch your orders. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchOrders();
    }
  }, [isLoaded, user, router]);

  // Generate secure JWT token for invoice access
  const generateInvoiceToken = async (orderId: string): Promise<string> => {
    try {
      // Use cookie-based authentication for same-origin requests
      const response = await fetch("/api/generate-invoice-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate access token");
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error("Error generating invoice token:", error);
      toast.error("Failed to generate invoice access token");
      throw error;
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // Show loading state
      toast.loading("Generating secure invoice link...", {
        id: "invoice-loading",
      });

      const token = await generateInvoiceToken(orderId);

      // Create secure URL with JWT token only
      const url = `/api/download-invoice/${orderId}?token=${token}`;

      // Open in new window with proper sizing
      const invoiceWindow = window.open(
        url,
        "_blank",
        "width=900,height=700,scrollbars=yes,resizable=yes",
      );

      toast.dismiss("invoice-loading");

      if (!invoiceWindow) {
        toast.error(
          'Please allow popups to view your invoice. You can also right-click and select "Open link in new tab".',
        );
      } else {
        toast.success("Invoice opened in new window");
      }
    } catch (error) {
      toast.dismiss("invoice-loading");
      console.error("Error generating invoice token:", error);
      toast.error("Unable to generate secure invoice link. Please try again.");
    }
  };

  const handleEmailInvoice = async (orderId: string) => {
    try {
      // Show loading state
      toast.loading("Sending invoice email...", {
        id: "email-invoice-loading",
      });

      const token = await getToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const response = await fetch("/api/email-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      toast.dismiss("email-invoice-loading");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invoice email");
      }

      const data = await response.json();
      toast.success("Invoice email sent successfully! Check your inbox.");
    } catch (error) {
      toast.dismiss("email-invoice-loading");
      console.error("Error sending invoice email:", error);
      toast.error("Failed to send invoice email. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      <Suspense fallback={null}>
        <SearchParamsHandler setHighlightOrderId={setHighlightOrderId} />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">My Orders</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track your orders and view order history
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-red-500 w-12 h-12"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Orders
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-6 py-3 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-shopping-bag-line text-gray-400 w-12 h-12"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Orders Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven&apos;t placed any orders yet.
            </p>
            <Link
              href="/products"
              className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-6 py-3 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const isHighlighted = highlightOrderId === order.merchantOrderId || highlightOrderId === order.id;
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl p-6 shadow-sm border transition-all duration-300 ${
                    isHighlighted 
                      ? 'border-green-400 bg-green-50 shadow-lg ring-2 ring-green-200' 
                      : 'border-gray-200'
                  }`}
                >
                  {isHighlighted && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <div className="flex items-center">
                        <i className="ri-check-circle-line text-green-600 mr-2"></i>
                        <span className="text-green-800 font-medium">Payment Completed Successfully!</span>
                      </div>
                    </div>
                  )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Order #{order.id}
                  </h3>
                  <p className="text-gray-600">
                    Placed on {formatDate(order.orderDate)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Transaction ID: {order.paymentId}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {order.items.map((item, index) => {
                    const productImage =
                      productImageMap[item.id] || productImageMap[item.name];

                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {productImage ? (
                            <Image
                              src={productImage}
                              alt={item.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <i className="ri-product-hunt-line text-gray-400 w-8 h-8"></i>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.name}
                          </h4>
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
                    );
                  })}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        Total: {formatPrice(order.total)}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 cursor-pointer flex items-center space-x-2"
                      >
                        <i className="ri-eye-line w-4 h-4"></i>
                        <span>Order Details</span>
                      </Link>
                      <button
                        onClick={() => handleEmailInvoice(order.id)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 cursor-pointer flex items-center space-x-2"
                      >
                        <i className="ri-mail-line w-4 h-4"></i>
                        <span>Email Invoice</span>
                      </button>
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-400 to-amber-400 text-white rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer flex items-center space-x-2"
                      >
                        <i className="ri-download-line w-4 h-4"></i>
                        <span>Download Invoice</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
