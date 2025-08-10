'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice, formatDate, getOrderStatusColor } from '../lib/utils';
import Header from '../components/Header';
import { fetchWithCsrf } from '../lib/csrf';

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

function downloadOrdersExcel() {
  fetchWithCsrf('/api/admin-download-orders')
    .then(res => res.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('all');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin authorization using HTTP-only cookie
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Verify with server using HTTP-only cookie
      fetchWithCsrf('/api/admin-verify', {
        method: 'GET',
        credentials: 'include' // Important for cookies
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.isAdmin) {
          setIsAuthorized(true);
          // Fetch orders from database
          fetchOrders();
        } else {
          router.push('/admin-login');
        }
      })
      .catch(() => {
        router.push('/admin-login');
      });
    }
  }, [router]);

  const fetchOrders = async () => {
    try {
      const response = await fetchWithCsrf('/api/orders');
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Call logout endpoint to clear the HTTP-only cookie
    await fetchWithCsrf('/api/admin-logout', {
      method: 'POST',
      credentials: 'include'
    });
    router.push('/');
  };

  // Don't render if not authorized
  if (!isAuthorized) {
    return null;
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    // For now, all orders are considered 'processing' since we don't have status field
    return filter === 'processing';
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const processingOrders = orders.length; // All orders are processing for now

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-gray-500">Loading orders...</div>
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
          <div className="flex justify-between items-center py-4">
            <h1 className="font-['Pacifico'] text-2xl text-blue-600">BubbleBeads Admin</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">Admin Dashboard</div>
              <button
                onClick={() => {
                  fetchWithCsrf('/api/admin-download-orders')
                    .then(res => res.blob())
                    .then(blob => {
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'orders.xlsx';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(url);
                    });
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Download Orders
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-gray-900">{totalOrders}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-blue-600">{processingOrders}</div>
            <div className="text-sm text-gray-500">Processing Orders</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-2xl font-bold text-gray-600">0</div>
            <div className="text-sm text-gray-500">Delivered Orders</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setFilter('processing')}
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              filter === 'processing' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Processing
          </button>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Orders ({filteredOrders.length})
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">No orders found</div>
              <div className="text-sm text-gray-400">
                {filter === 'all' ? 'No orders have been placed yet.' : `No ${filter} orders found.`}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.razorpayOrderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-gray-400">{order.customerEmail}</div>
                          <div className="text-xs text-gray-400">{order.customerPhone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="max-w-xs">
                          {order.items.map((item, index) => (
                            <div key={index} className="truncate">
                              {item.name} (x{item.quantity})
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-xs font-mono">{order.paymentId}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}