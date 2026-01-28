'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { 
  HiCheckCircle, 
  HiXCircle, 
  HiCheck, 
  HiTrash,
  HiMagnifyingGlass,
  HiArrowPath,
  HiEye,
  HiTruck,
  HiClock,
  HiChevronDown,
} from 'react-icons/hi2';

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
      return 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]';
    case 'ACCEPTED':
      return 'bg-[#569330]/10 text-[#569330]';
    case 'DECLINED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'PENDING_DELIVERY':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'OUT_FOR_DELIVERY':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'COMPLETED':
      return 'bg-[#569330]/10 text-[#569330] dark:bg-[#569330]/20 dark:text-[#7ab356]';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PENDING':
      return <HiClock className="w-4 h-4" />;
    case 'ACCEPTED':
      return <HiCheckCircle className="w-4 h-4" />;
    case 'DECLINED':
      return <HiXCircle className="w-4 h-4" />;
    case 'PENDING_DELIVERY':
    case 'OUT_FOR_DELIVERY':
      return <HiTruck className="w-4 h-4" />;
    case 'COMPLETED':
      return <HiCheck className="w-4 h-4" />;
    default:
      return null;
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'ACCEPTED':
      return 'Accepted';
    case 'DECLINED':
      return 'Declined';
    case 'PENDING_DELIVERY':
      return 'Ready';
    case 'OUT_FOR_DELIVERY':
      return 'Delivering';
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
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      try {
        const { getCurrentUser } = await import('@/lib/api');
        const userResponse = await getCurrentUser();
        
        if (!userResponse.success || !userResponse.data) {
          router.push('/login');
          return;
        }

        const userData = userResponse.data as any;
        localStorage.setItem('user', JSON.stringify(userData));
        
        if (userData.role !== 'ADMIN') {
          alert('You must be logged in as an admin to access this page.');
          router.push('/products');
          return;
        }

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
      const response = await apiRequest<{ data: Order[]; pagination?: any }>(url);
      
      if (response.success && response.data) {
        const ordersData = Array.isArray(response.data) ? response.data : [];
        setOrders(ordersData);
      } else {
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
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.role !== 'ADMIN') {
          alert('You must be logged in as an admin to update order status.');
          setUpdating(null);
          return;
        }
      }

      const response = await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (response.success) {
        fetchOrders(searchTerm || undefined, statusFilter || undefined);
      } else {
        const errorMsg = response.message || response.error || 'Failed to update order status';
        alert(`Failed to update order status: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status.');
    } finally {
      setUpdating(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to archive this order?')) {
      return;
    }

    setDeleting(orderId);
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.role !== 'ADMIN') {
          alert('You must be logged in as an admin to archive orders.');
          setDeleting(null);
          return;
        }
      }

      const response = await apiRequest(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        fetchOrders(searchTerm || undefined, statusFilter || undefined);
      } else {
        const errorMsg = response.message || response.error || 'Failed to archive order';
        alert(`Failed to archive order: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error archiving order:', error);
      alert(error.message || 'Error archiving order.');
    } finally {
      setDeleting(null);
    }
  };

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-dark border-t-transparent 
                        rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--foreground))]">
              Order Management
            </h1>
            <p className="text-[rgb(var(--muted-foreground))] mt-1">
              {orders.length} order{orders.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="btn-secondary"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Search and Filter */}
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 
                                            text-[rgb(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Search by order #, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-12"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
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

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-[rgb(var(--muted-foreground))] text-lg">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card overflow-hidden">
                {/* Order Header - Always Visible */}
                <div 
                  className="p-4 cursor-pointer hover:bg-[rgb(var(--muted))]/30 transition-colors"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-[rgb(var(--foreground))]">
                          #{order.orderNumber}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full 
                                        text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-[rgb(var(--muted-foreground))] truncate">
                        {order.user
                          ? (order.user.firstName && order.user.lastName
                              ? `${order.user.firstName} ${order.user.lastName}`
                              : order.user.email || 'N/A')
                          : order.shippingName || 'Guest'}
                        {' • '}{order.shippingCity}
                      </p>
                      
                      <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Price and Toggle */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-dark">
                          R{toNumber(order.total).toFixed(2)}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted-foreground))]">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <HiChevronDown 
                        className={`w-5 h-5 text-[rgb(var(--muted-foreground))] transition-transform
                                   ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedOrder === order.id && (
                  <div className="border-t border-[rgb(var(--border))] p-4 bg-[rgb(var(--muted))]/30">
                    {/* Items List */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-2">
                        Order Items:
                      </p>
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-sm text-[rgb(var(--foreground))]">
                            • {item.product.name} × {item.quantity}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    {order.shippingPhone && (
                      <p className="text-sm text-[rgb(var(--muted-foreground))] mb-4">
                        📞 {order.shippingPhone}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'ACCEPTED');
                            }}
                            disabled={updating === order.id}
                            className="flex-1 sm:flex-none btn-primary !bg-[#569330] hover:!bg-[#4a802a] 
                                     !py-2 text-sm"
                          >
                            {updating === order.id ? (
                              <HiArrowPath className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <HiCheckCircle className="w-4 h-4" />
                                Accept
                              </>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(order.id, 'DECLINED');
                            }}
                            disabled={updating === order.id}
                            className="flex-1 sm:flex-none btn-primary !bg-red-600 hover:!bg-red-700 
                                     !py-2 text-sm"
                          >
                            <HiXCircle className="w-4 h-4" />
                            Decline
                          </button>
                        </>
                      )}
                      
                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'PENDING_DELIVERY');
                          }}
                          disabled={updating === order.id}
                          className="flex-1 sm:flex-none btn-primary !bg-purple-600 hover:!bg-purple-700 
                                   !py-2 text-sm"
                        >
                          {updating === order.id ? (
                            <HiArrowPath className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <HiTruck className="w-4 h-4" />
                              Ready for Delivery
                            </>
                          )}
                        </button>
                      )}
                      
                      {order.status === 'PENDING_DELIVERY' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'OUT_FOR_DELIVERY');
                          }}
                          disabled={updating === order.id}
                          className="flex-1 sm:flex-none btn-primary !bg-indigo-600 hover:!bg-indigo-700 
                                   !py-2 text-sm"
                        >
                          {updating === order.id ? (
                            <HiArrowPath className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <HiTruck className="w-4 h-4" />
                              Out for Delivery
                            </>
                          )}
                        </button>
                      )}
                      
                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'COMPLETED');
                          }}
                          disabled={updating === order.id}
                          className="flex-1 sm:flex-none btn-primary !bg-[#569330] hover:!bg-[#4a802a] 
                                   !py-2 text-sm"
                        >
                          {updating === order.id ? (
                            <HiArrowPath className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <HiCheck className="w-4 h-4" />
                              Mark Completed
                            </>
                          )}
                        </button>
                      )}
                      
                      {(order.status === 'COMPLETED' || order.status === 'DECLINED' || order.status === 'CANCELLED') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOrder(order.id);
                          }}
                          disabled={deleting === order.id || updating === order.id}
                          className="flex-1 sm:flex-none btn-primary !bg-red-600 hover:!bg-red-700 
                                   !py-2 text-sm"
                        >
                          {deleting === order.id ? (
                            <HiArrowPath className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <HiTrash className="w-4 h-4" />
                              Archive
                            </>
                          )}
                        </button>
                      )}
                      
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="flex-1 sm:flex-none btn-secondary !py-2 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HiEye className="w-4 h-4" />
                        Details
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
