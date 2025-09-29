"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { formatPrice, formatDate } from "../../../lib/utils";
import {
  safeDisplayName,
  safeDisplayEmail,
  safeDisplayPhone,
  safeDisplayAddress,
  safeDisplayProductName,
  safeDisplayOrderId,
  safeDisplayError,
} from "../../../lib/security/ui-escaping";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  merchantOrderId: string;
  orderNo?: string;
  invoiceNo?: string;
  phonePeOrderId: string;
  paymentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  total: number;
  orderDate: string;
  items: OrderItem[];
  // Enhanced payment details
  paymentMode?: string;
  paymentTransactionId?: string;
  utr?: string;
  feeAmount?: number;
  payableAmount?: number;
  bankName?: string;
  accountType?: string;
  cardLast4?: string;
  paymentState?: string;
  paymentTimestamp?: string;
}

export default function AdminOrderDetails() {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check admin authorization using Clerk
  useEffect(() => {
    if (isLoaded && user) {
      // Check if user has admin role
      const isAdmin = user?.publicMetadata?.role === "admin";

      if (!isAdmin) {
        // Redirect non-admin users to home page
        router.push("/");
        return;
      }
    }
  }, [isLoaded, user, router]);

  // Fetch order details
  useEffect(() => {
    if (!isLoaded || !user || !orderId) return;

    // Only fetch if user is admin
    const isAdmin = user?.publicMetadata?.role === "admin";
    if (!isAdmin) return;

    const fetchOrder = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`/api/admin/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const orderData = await response.json();
          setOrder(orderData);
        } else {
          setError("Order not found");
        }
      } catch {
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, isLoaded, user]);

  if (!isLoaded || !user || user?.publicMetadata?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Back to Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin"
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Back to Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Order Not Found
            </h3>
            <p className="text-gray-600 mb-6">{safeDisplayError(error)}</p>
            <Link
              href="/admin"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Admin Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order Details
              </h1>
            </div>
            <div className="text-sm text-gray-500">
                Order: {safeDisplayOrderId(order.orderNo || order.merchantOrderId || order.paymentId)} | Invoice: {order.invoiceNo || 'N/A'}
              </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Order #{safeDisplayOrderId(order.orderNo || order.merchantOrderId || order.paymentId)}
                </h2>
              <p className="text-gray-600">
                Placed on {formatDate(order.orderDate)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(order.total)}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
          </div>

          {/* Customer & Payment Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                👤 Customer Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Name:</span>
                  <span className="text-gray-900">
                    {safeDisplayName(order.customerName)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <span className="text-gray-900">
                    {safeDisplayEmail(order.customerEmail)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Phone:</span>
                  <span className="text-gray-900">
                    {safeDisplayPhone(order.customerPhone)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                💳 Payment Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.paymentState === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    order.paymentState === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.paymentState === 'FAILED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.paymentState === 'COMPLETED' ? 'Paid' :
                     order.paymentState === 'PENDING' ? 'Pending' :
                     order.paymentState === 'FAILED' ? 'Failed' :
                     'Unknown'}
                  </span>
                </div>
                {order.paymentMode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Payment Mode:</span>
                    <span className="text-gray-900 font-medium">
                      {order.paymentMode.replace('_', ' ')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Transaction ID:</span>
                  <span className="text-gray-900 font-mono text-sm">
                    {safeDisplayOrderId(order.paymentId)}
                  </span>
                </div>
                {order.paymentTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Payment Txn ID:</span>
                    <span className="text-gray-900 font-mono text-sm">
                      {safeDisplayOrderId(order.paymentTransactionId)}
                    </span>
                  </div>
                )}
                {order.utr && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">UTR:</span>
                    <span className="text-gray-900 font-mono text-sm">
                      {safeDisplayOrderId(order.utr)}
                    </span>
                  </div>
                )}
                {order.bankName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Bank:</span>
                    <span className="text-gray-900">
                      {order.bankName}
                    </span>
                  </div>
                )}
                {order.accountType && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Account Type:</span>
                    <span className="text-gray-900">
                      {order.accountType.replace('_', ' ')}
                    </span>
                  </div>
                )}
                {order.cardLast4 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Card:</span>
                    <span className="text-gray-900 font-mono">
                      **** **** **** {order.cardLast4}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Total:</span>
                  <span className="text-gray-900 font-semibold">
                    {formatPrice(order.total)}
                  </span>
                </div>
                {order.payableAmount && order.payableAmount !== order.total && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Amount Paid:</span>
                    <span className="text-gray-900 font-semibold">
                      {formatPrice(order.payableAmount)}
                    </span>
                  </div>
                )}
                {order.feeAmount && order.feeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Transaction Fee:</span>
                    <span className="text-gray-900">
                      {formatPrice(order.feeAmount)}
                    </span>
                  </div>
                )}
                {order.paymentTimestamp && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Payment Time:</span>
                    <span className="text-gray-900 text-sm">
                      {formatDate(order.paymentTimestamp)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-gray-900 mb-4 text-lg">
              📍 Shipping Address
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900">
                {safeDisplayAddress(order.address)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📦 Order Items
          </h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={item.id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {safeDisplayProductName(item.name)}
                  </h3>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatPrice(item.price)} each
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Total */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">
                Total:
              </span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
