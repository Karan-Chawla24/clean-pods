'use client';

import { useEffect, useState } from 'react';
import { formatPrice, formatDate } from '../lib/utils';
import Header from '../components/Header';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '../lib/store';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  razorpayOrderId: string;
  paymentId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  total: number;
  orderDate: string;
  items: OrderItem[];
}

// Product image mapping based on product names and IDs
const productImageMap: { [key: string]: string } = {
  // By ID
  'essential': '/pod_image.jpg',
  'soft-fresh': '/Threein1.jpg',
  'ultimate': '/fivein1.jpg',
  // By name (for backward compatibility with old orders)
  'Essential Clean': '/pod_image.jpg',
  'Soft & Fresh': '/Threein1.jpg',
  'Ultimate Care': '/fivein1.jpg',
  // Current product name (post August 20th)
  'Essential Clean Pod': '/pod_image.jpg',
};

export default function Orders() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { orders: storeOrders, clearCart } = useAppStore();

  useEffect(() => {
    if (!isLoaded || !user) {
      if (isLoaded && !user) {
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/orders'));
      }
      return;
    }

    if (isLoaded && user) {
      const fetchOrders = async () => {
        try {
          const token = await getToken();
          const response = await fetch('/api/user/orders', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            throw new Error('Failed to fetch orders');
          }
          const data = await response.json();
          setOrders(Array.isArray(data) ? data : data.orders || []);
        } catch (err) {
          console.error('Error fetching orders:', err);
          setError('Failed to load your orders');
          toast.error('Could not fetch your orders. Please try again.');
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
      const token = await getToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/generate-invoice-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate access token');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating invoice token:', error);
      toast.error('Failed to generate invoice access token');
      throw error;
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      // Show loading state
      toast.loading('Generating secure invoice link...', { id: 'invoice-loading' });
      
      const token = await generateInvoiceToken(orderId);
      
      // Create secure URL with JWT token only
      const url = `/api/download-invoice/${orderId}?token=${token}`;
      
      // Open in new window with proper sizing
      const invoiceWindow = window.open(url, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
      
      toast.dismiss('invoice-loading');
      
      if (!invoiceWindow) {
        toast.error('Please allow popups to view your invoice. You can also right-click and select "Open link in new tab".');
      } else {
        toast.success('Invoice opened in new window');
      }
    } catch (error) {
      toast.dismiss('invoice-loading');
      console.error('Error generating invoice token:', error);
      toast.error('Unable to generate secure invoice link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />
      
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h3>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-600 mb-6">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/products"
              className="bg-gradient-to-r from-orange-400 to-amber-400 text-white px-6 py-3 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 cursor-pointer inline-block"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Order #{order.id}</h3>
                  <p className="text-gray-600">Placed on {formatDate(order.orderDate)}</p>
                  <p className="text-sm text-gray-500 mt-1">Payment ID: {order.paymentId}</p>
                </div>

                <div className="space-y-4 mb-6">
                  {order.items.map((item, index) => {
                    const productImage = productImageMap[item.id] || productImageMap[item.name];
                    
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
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-gray-600 text-sm">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">Total: {formatPrice(order.total)}</p>
                    </div>
                    <div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}