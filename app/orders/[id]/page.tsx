"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import { formatPrice } from "../../lib/utils";
import {
  safeDisplayName,
  safeDisplayEmail,
  safeDisplayPhone,
  safeDisplayAddress,
  safeDisplayProductName,
  safeDisplayOrderId,
  safeDisplayError,
} from "../../lib/security/ui-escaping";

interface OrderItem {
  id: number;
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  merchant_order_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_id: string;
  created_at: string;
  items: OrderItem[];
}

export default function OrderDetails() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}`);
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

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
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
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-error-warning-line text-red-600 w-12 h-12"></i>
            </div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-4">
              Order Not Found
            </h2>
            <p className="text-gray-500 mb-8">
              {error || "The order you are looking for does not exist."}
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-gray-600 mb-8">
          <Link href="/" className="hover:text-blue-600">
            Home
          </Link>
          <i className="ri-arrow-right-s-line w-4 h-4"></i>
          <span className="text-gray-900 font-medium">
            Order #{safeDisplayOrderId(order.merchant_order_id)}
          </span>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{safeDisplayOrderId(order.merchant_order_id)}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  order.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : order.status === "processing"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Customer Information
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>
                  <strong>Name:</strong> {safeDisplayName(order.customer_name)}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {safeDisplayEmail(order.customer_email)}
                </p>
                <p>
                  <strong>Phone:</strong>{" "}
                  {safeDisplayPhone(order.customer_phone)}
                </p>
                <p>
                  <strong>Address:</strong>{" "}
                  {safeDisplayAddress(order.shipping_address)}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Payment Information
              </h3>
              <div className="space-y-2 text-gray-600">
                <p>
                  <strong>Status:</strong>
                  <span
                    className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                      order.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.payment_status ? order.payment_status.charAt(0).toUpperCase() +
                      order.payment_status.slice(1) : 'Unknown'}
                  </span>
                </p>
                <p>
                  <strong>Transaction ID:</strong>{" "}
                  {safeDisplayOrderId(order.payment_id)}
                </p>
                <p>
                  <strong>Total Amount:</strong>{" "}
                  {formatPrice(order.total_amount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {safeDisplayProductName(item.product_name)}
                  </h4>
                  <p className="text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(item.total_price)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatPrice(item.unit_price)} each
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/orders"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Back to Orders
          </Link>
          <Link
            href="/products"
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
