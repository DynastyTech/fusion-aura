'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { HiCheckCircle, HiXCircle, HiCheck, HiTrash } from 'react-icons/hi2';
import Logo from '@/components/Logo';

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  createdAt: string;
  items: OrderItem[];
  user: {
    email: string | null;
    firstName: string | null;
    lastName: string | null;
  } | null;
  shippingName: string;
  shippingCity: string;
  shippingPhone: string | null;
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
      return 'bg-green-100 text-green-800';
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

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      // Refresh user data from API to ensure role is current
      try {
        const { getCurrentUser } = await import('@/lib/api');
        const userResponse = await getCurrentUser();
        
        if (!userResponse.success || !userResponse.data) {
          console.error('Failed to get current user:', userResponse.error);
          router.push('/login');
          return;
        }

        const userData = userResponse.data as any;
        console.log('🔐 Admin Orders Page - User role from API:', userData.role);
        
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (userData.role !== 'ADMIN') {
          console.log('❌ Access denied - User is not ADMIN, redirecting to products');
          alert('You must be logged in as an admin to access this page.');
          router.push('/products');
          return;
        }

        console.log('✅ Admin access granted, fetching orders...');
        fetchOrders();
      } catch (error) {
        console.error('Error checking admin access:', error);
        router.push('/login');
      }
    };

    checkAdminAccess();
  }, [router]);

  const fetchOrders = async (search?: string, status?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      
      const url = `/api/orders/admin/all${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 Admin fetching orders from:', url);
      const response = await apiRequest<{ data: Order[]; pagination?: any }>(url);
      console.log('🔍 Admin orders API response:', response);
      
      if (response.success && response.data) {
        // API returns { success: true, data: Order[] } - data is the array directly
        const ordersData = Array.isArray(response.data) ? response.data : [];
        console.log('✅ Admin orders fetched:', ordersData.length, 'orders');
        if (ordersData.length > 0) {
          console.log('   Order numbers:', ordersData.map((o: Order) => o.orderNumber).join(', '));
        }
        setOrders(ordersData);
      } else {
        console.log('❌ Admin orders fetch failed:', response.error);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchOrders(searchTerm || undefined, statusFilter || undefined);
    }, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      // Check if user is admin before making request
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.role !== 'ADMIN') {
          alert('You must be logged in as an admin to update order status. Please log out and log in as admin.');
          setUpdating(null);
          return;
        }
      }

      const response = await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (response.success) {
        fetchOrders(); // Refresh list
      } else {
        const errorMsg = response.message || response.error || 'Failed to update order status';
        console.error('Order status update failed:', errorMsg);
        alert(`Failed to update order status: ${errorMsg}\n\nPlease ensure you are logged in as an admin.`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status. Please check the console for details.');
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to archive this order? This action cannot be undone.')) {
      return;
    }

    setDeleting(orderId);
    try {
      // Check if user is admin before making request
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.role !== 'ADMIN') {
          alert('You must be logged in as an admin to archive orders. Please log out and log in as admin.');
          setDeleting(null);
          return;
        }
      }

      const response = await apiRequest(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        alert('Order archived successfully');
        fetchOrders(); // Refresh list
      } else {
        const errorMsg = response.message || response.error || 'Failed to archive order';
        console.error('Order archive failed:', errorMsg);
        alert(`Failed to archive order: ${errorMsg}\n\nPlease ensure you are logged in as an admin.`);
      }
    } catch (error: any) {
      console.error('Error archiving order:', error);
      alert(error.message || 'Error archiving order. Please check the console for details.');
    } finally {
      setDeleting(null);
    }
  };

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo href="/admin/dashboard" width={180} height={60} />
            <div className="flex space-x-4">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-primary-dark">
                Dashboard
              </Link>
              <Link href="/admin/orders" className="text-gray-600 hover:text-primary-dark font-medium">
                Orders
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Orders Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6">Order Management</h1>
          
          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Orders
                </label>
                <input
                  type="text"
                  placeholder="Search by order number, customer name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="DECLINED">Declined</option>
                  <option value="PENDING_DELIVERY">Pending Delivery</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
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
                      Customer: {order.user
                        ? (order.user.firstName && order.user.lastName
                            ? `${order.user.firstName} ${order.user.lastName}`
                            : order.user.email || 'N/A')
                        : order.shippingName || 'Guest'}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''} • Delivery to{' '}
                      {order.shippingCity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-dark">
                      R{toNumber(order.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">Cash on Delivery</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                        disabled={updating === order.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {updating === order.id ? 'Processing...' : (
                          <>
                            <HiCheckCircle className="w-5 h-5" />
                            Accept Order
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'DECLINED')}
                        disabled={updating === order.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {updating === order.id ? 'Processing...' : (
                          <>
                            <HiXCircle className="w-5 h-5" />
                            Decline Order
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PENDING_DELIVERY')}
                      disabled={updating === order.id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updating === order.id ? 'Processing...' : 'Mark as Pending Delivery'}
                    </button>
                  )}
                  {order.status === 'PENDING_DELIVERY' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                      disabled={updating === order.id}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {updating === order.id ? 'Processing...' : 'Mark as Out for Delivery'}
                    </button>
                  )}
                  {order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                      disabled={updating === order.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {updating === order.id ? 'Processing...' : (
                        <>
                          <HiCheck className="w-5 h-5" />
                          Mark as Completed
                        </>
                      )}
                    </button>
                  )}
                  {(order.status === 'COMPLETED' || order.status === 'DECLINED' || order.status === 'CANCELLED') && (
                    <button
                      onClick={() => deleteOrder(order.id)}
                      disabled={deleting === order.id || updating === order.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {deleting === order.id ? 'Archiving...' : (
                        <>
                          <HiTrash className="w-5 h-5" />
                          Archive Order
                        </>
                      )}
                    </button>
                  )}
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 inline-flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

