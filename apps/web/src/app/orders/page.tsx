'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

interface OrderItem {
  id: string;
  quantity: number;
  price: number | string;
  total: number | string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  subtotal: number | string;
  tax: number | string;
  createdAt: string;
  items: OrderItem[];
  shippingName: string;
  shippingCity: string;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACCEPTED':
      return 'bg-blue-100 text-blue-800';
    case 'DECLINED':
      return 'bg-red-100 text-red-800';
    case 'PENDING_DELIVERY':
      return 'bg-purple-100 text-purple-800';
    case 'OUT_FOR_DELIVERY':
      return 'bg-indigo-100 text-indigo-800';
    case 'COMPLETED':
      return 'bg-[#569330]/10 text-[#569330]';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Pending Approval';
    case 'ACCEPTED':
      return 'Accepted';
    case 'DECLINED':
      return 'Declined';
    case 'PENDING_DELIVERY':
      return 'Pending Delivery';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await apiRequest<{ data: Order[] }>('/api/orders');
      
      if (response.success && response.data) {
        const ordersData = response.data.data || response.data;
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else if (response.error?.includes('Unauthorized') || response.error?.includes('401')) {
        // Token expired or invalid, redirect to login
        router.push('/login');
        return;
      } else {
        console.error('Failed to fetch orders:', response.error);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    
    fetchOrders();
  }, [fetchOrders, router, authLoading, isAuthenticated, user]);

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo href="/" width={180} height={60} />
            <nav className="flex space-x-6">
              <Link href="/products" className="text-gray-700 hover:text-primary-dark">
                Products
              </Link>
              <Link href="/orders" className="text-gray-700 hover:text-primary-dark font-medium">
                My Orders
              </Link>
              <Link href="/track-order" className="text-gray-700 hover:text-primary-dark">
                Track Order
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Orders Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg mb-4">You haven&apos;t placed any orders yet</p>
            <Link
              href="/products"
              className="inline-block bg-primary-dark text-white px-6 py-3 rounded-lg hover:bg-primary-dark/90"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{order.orderNumber}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • Delivery to{' '}
                      {order.shippingCity}
                    </p>
                    {/* Status Progress Indicator */}
                    <div className="mt-3 flex items-center space-x-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        ['PENDING', 'ACCEPTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status)
                          ? 'bg-[#569330]' : 'bg-gray-300'
                      }`} />
                      <span className="text-gray-500">Order Placed</span>
                      {['ACCEPTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status) && (
                        <>
                          <span className="text-gray-300">→</span>
                          <div className="w-2 h-2 rounded-full bg-[#569330]" />
                          <span className="text-gray-500">Accepted</span>
                        </>
                      )}
                      {['OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status) && (
                        <>
                          <span className="text-gray-300">→</span>
                          <div className="w-2 h-2 rounded-full bg-[#569330]" />
                          <span className="text-gray-500">Out for Delivery</span>
                        </>
                      )}
                      {order.status === 'COMPLETED' && (
                        <>
                          <span className="text-gray-300">→</span>
                          <div className="w-2 h-2 rounded-full bg-[#569330]" />
                          <span className="text-gray-500">Delivered</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-dark">
                      R{toNumber(order.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Cash on Delivery</p>
                    <Link
                      href={`/orders/${order.id}`}
                      className="mt-2 inline-block text-sm text-primary-dark hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

