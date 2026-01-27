'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';
import { 
  HiCheckCircle, 
  HiXCircle, 
  HiCheck, 
  HiTrash, 
  HiPencil,
  HiArrowLeft,
  HiTruck,
  HiPhone,
  HiEnvelope,
  HiMapPin,
  HiPlus,
  HiXMark,
  HiArrowPath,
  HiCurrencyDollar,
  HiClock,
  HiShoppingBag,
} from 'react-icons/hi2';
import { FaLeaf } from 'react-icons/fa';

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
  shipping: number | string;
  createdAt: string;
  items: OrderItem[];
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  shippingName: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string | null;
  shippingCity: string;
  shippingProvince: string | null;
  shippingPostalCode: string;
  shippingPhone: string | null;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'ACCEPTED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
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
      return 'Pending Approval';
    case 'ACCEPTED':
      return 'Accepted';
    case 'DECLINED':
      return 'Declined';
    case 'PENDING_DELIVERY':
      return 'Ready for Delivery';
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

interface Product {
  id: string;
  name: string;
  price: number | string;
  inventory: { quantity: number } | null;
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editItems, setEditItems] = useState<Array<{ productId: string; quantity: number }>>([]);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await apiRequest<Order>(`/api/orders/${orderId}`);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/admin/orders');
    } finally {
      setLoading(false);
    }
  }, [router, orderId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(userStr);
    if (userData.role !== 'ADMIN') {
      router.push('/products');
      return;
    }

    fetchOrder();
  }, [fetchOrder, router]);

  const updateOrderStatus = async (status: string) => {
    setUpdating(true);
    try {
      const response = await apiRequest(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (response.success) {
        fetchOrder();
      } else {
        alert(response.error || 'Failed to update order status');
      }
    } catch (error) {
      alert('Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const deleteOrder = async () => {
    if (!confirm('Are you sure you want to archive this order? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await apiRequest(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        alert('Order archived successfully');
        router.push('/admin/orders');
      } else {
        alert(response.error || 'Failed to archive order');
      }
    } catch (error) {
      alert('Error archiving order');
    } finally {
      setDeleting(false);
    }
  };

  const startEditing = async () => {
    setEditing(true);
    setEditItems(
      order!.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }))
    );

    try {
      const response = await apiRequest<{ data: Product[] }>('/api/products');
      if (response.success && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const addEditItem = () => {
    setEditItems([...editItems, { productId: '', quantity: 1 }]);
  };

  const removeEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const updateEditItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const newItems = [...editItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditItems(newItems);
  };

  const saveOrderEdit = async () => {
    if (editItems.some((item) => !item.productId || item.quantity <= 0)) {
      alert('Please fill in all items with valid product and quantity');
      return;
    }

    setUpdating(true);
    try {
      const response = await apiRequest(`/api/orders/${orderId}/items`, {
        method: 'PATCH',
        body: JSON.stringify({ items: editItems }),
      });

      if (response.success) {
        setEditing(false);
        fetchOrder();
        alert('Order updated successfully');
      } else {
        alert(response.error || 'Failed to update order');
      }
    } catch (error: any) {
      alert(error.message || 'Error updating order');
    } finally {
      setUpdating(false);
    }
  };

  const canEdit = order && !['COMPLETED', 'DECLINED', 'CANCELLED'].includes(order.status);
  const canDelete = order && ['COMPLETED', 'DECLINED', 'CANCELLED'].includes(order.status);

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-dark border-t-transparent 
                        rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-[rgb(var(--muted-foreground))] 
                     hover:text-primary-dark transition-colors touch-target w-fit"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--foreground))]">
                Order #{order.orderNumber}
              </h1>
              <p className="text-[rgb(var(--muted-foreground))] mt-1 text-sm sm:text-base">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold 
                           w-fit ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Status Actions */}
        <div className="mb-6 space-y-4">
          {order.status === 'PENDING' && (
            <div className="card p-4">
              <p className="text-sm font-medium text-[rgb(var(--muted-foreground))] mb-3">
                Approve or decline this order
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => updateOrderStatus('ACCEPTED')}
                  disabled={updating}
                  className="btn-primary !bg-[#569330] hover:!bg-[#4a802a] flex-1 sm:flex-none justify-center touch-target"
                >
                  {updating ? (
                    <HiArrowPath className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <HiCheckCircle className="w-5 h-5" />
                      Accept Order
                    </>
                  )}
                </button>
                <button
                  onClick={() => updateOrderStatus('DECLINED')}
                  disabled={updating}
                  className="btn-primary !bg-red-600 hover:!bg-red-700 flex-1 sm:flex-none justify-center touch-target"
                >
                  <HiXCircle className="w-5 h-5" />
                  Decline Order
                </button>
              </div>
            </div>
          )}

          {order.status === 'ACCEPTED' && (
            <div className="card p-4">
              <button
                onClick={() => updateOrderStatus('PENDING_DELIVERY')}
                disabled={updating}
                className="btn-primary !bg-purple-600 hover:!bg-purple-700 w-full sm:w-auto justify-center touch-target"
              >
                {updating ? (
                  <HiArrowPath className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <HiTruck className="w-5 h-5" />
                    Mark Ready for Delivery
                  </>
                )}
              </button>
            </div>
          )}

          {order.status === 'PENDING_DELIVERY' && (
            <div className="card p-4">
              <button
                onClick={() => updateOrderStatus('OUT_FOR_DELIVERY')}
                disabled={updating}
                className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 w-full sm:w-auto justify-center touch-target"
              >
                {updating ? (
                  <HiArrowPath className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <HiTruck className="w-5 h-5" />
                    Mark Out for Delivery
                  </>
                )}
              </button>
            </div>
          )}

          {order.status === 'OUT_FOR_DELIVERY' && (
            <div className="card p-4">
              <button
                onClick={() => updateOrderStatus('COMPLETED')}
                disabled={updating}
                className="btn-primary !bg-[#569330] hover:!bg-[#4a802a] w-full sm:w-auto justify-center touch-target"
              >
                {updating ? (
                  <HiArrowPath className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <HiCheck className="w-5 h-5" />
                    Mark as Completed
                  </>
                )}
              </button>
            </div>
          )}

          {/* Edit and Delete Actions */}
          {(canEdit || canDelete) && (
            <div className="card p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {canEdit && (
                  <button
                    onClick={startEditing}
                    disabled={editing || updating}
                    className="btn-secondary flex-1 sm:flex-none justify-center touch-target"
                  >
                    <HiPencil className="w-5 h-5" />
                    Edit Order Items
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={deleteOrder}
                    disabled={deleting || updating}
                    className="btn-primary !bg-red-600 hover:!bg-red-700 flex-1 sm:flex-none justify-center touch-target"
                  >
                    {deleting ? (
                      <HiArrowPath className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <HiTrash className="w-5 h-5" />
                        Archive Order
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Order Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[rgb(var(--card))] rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[rgb(var(--border))]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--foreground))]">
                  Edit Order Items
                </h2>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditItems([]);
                  }}
                  className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors touch-target"
                >
                  <HiXMark className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                {editItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 border border-[rgb(var(--border))] rounded-xl bg-[rgb(var(--muted))]/30">
                    <select
                      value={item.productId}
                      onChange={(e) => updateEditItem(index, 'productId', e.target.value)}
                      className="input-field flex-1"
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - R{toNumber(product.price).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateEditItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="input-field w-24"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => removeEditItem(index)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors touch-target"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addEditItem}
                  className="w-full btn-ghost border-2 border-dashed border-[rgb(var(--border))] py-4"
                >
                  <HiPlus className="w-5 h-5" />
                  Add Item
                </button>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={saveOrderEdit}
                  disabled={updating}
                  className="btn-primary flex-1 justify-center touch-target"
                >
                  {updating ? (
                    <HiArrowPath className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <HiCheck className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditItems([]);
                  }}
                  disabled={updating}
                  className="btn-secondary flex-1 justify-center touch-target"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[rgb(var(--foreground))] mb-4 flex items-center gap-2">
                <HiShoppingBag className="w-5 h-5 text-primary-dark" />
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 sm:gap-4 pb-4 border-b border-[rgb(var(--border))] last:border-0 last:pb-0">
                    {item.product.images && item.product.images.length > 0 ? (
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[rgb(var(--muted))]">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[rgb(var(--muted))] rounded-xl flex-shrink-0 flex items-center justify-center">
                        <FaLeaf className="w-6 h-6 text-[rgb(var(--muted-foreground))]/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[rgb(var(--foreground))] truncate text-sm sm:text-base">
                        {item.product.name}
                      </p>
                      <p className="text-sm text-[rgb(var(--muted-foreground))]">
                        Qty: {item.quantity} × R{toNumber(item.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-primary-dark text-sm sm:text-base">
                        R{toNumber(item.total).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[rgb(var(--foreground))] mb-4">
                Customer Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-dark/10">
                    <FaLeaf className="w-4 h-4 text-primary-dark" />
                  </div>
                  <p className="text-[rgb(var(--foreground))]">
                    {order.user?.firstName && order.user?.lastName
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : order.shippingName || 'Guest'}
                  </p>
                </div>
                {order.user?.email && (
                  <a 
                    href={`mailto:${order.user.email}`}
                    className="flex items-center gap-3 text-[rgb(var(--muted-foreground))] hover:text-primary-dark transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-[rgb(var(--muted))]">
                      <HiEnvelope className="w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base truncate">{order.user.email}</span>
                  </a>
                )}
                {(order.user?.phone || order.shippingPhone) && (
                  <a 
                    href={`tel:${order.user?.phone || order.shippingPhone}`}
                    className="flex items-center gap-3 text-[rgb(var(--muted-foreground))] hover:text-primary-dark transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-[rgb(var(--muted))]">
                      <HiPhone className="w-4 h-4" />
                    </div>
                    <span>{order.user?.phone || order.shippingPhone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-[rgb(var(--foreground))] mb-4 flex items-center gap-2">
                <HiMapPin className="w-5 h-5 text-primary-dark" />
                Delivery Address
              </h2>
              <div className="text-[rgb(var(--muted-foreground))] space-y-1">
                <p className="font-semibold text-[rgb(var(--foreground))]">{order.shippingName}</p>
                <p>{order.shippingAddressLine1}</p>
                {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                <p>
                  {order.shippingCity}
                  {order.shippingProvince && `, ${order.shippingProvince}`}
                </p>
                <p>{order.shippingPostalCode}</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-4 sm:p-6 sticky top-20">
              <h2 className="text-lg sm:text-xl font-bold text-[rgb(var(--foreground))] mb-4 flex items-center gap-2">
                <HiCurrencyDollar className="w-5 h-5 text-primary-dark" />
                Order Summary
              </h2>
              <div className="space-y-3 text-sm sm:text-base">
                <div className="flex justify-between text-[rgb(var(--muted-foreground))]">
                  <span>Subtotal</span>
                  <span>R{toNumber(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[rgb(var(--muted-foreground))]">
                  <span>VAT (15%)</span>
                  <span>R{toNumber(order.tax).toFixed(2)}</span>
                </div>
                <div className="border-t border-[rgb(var(--border))] pt-3 flex justify-between font-bold text-lg">
                  <span className="text-[rgb(var(--foreground))]">Total</span>
                  <span className="text-primary-dark">R{toNumber(order.total).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-blue-700 dark:text-blue-400 font-semibold text-sm flex items-center gap-2">
                  <HiCurrencyDollar className="w-5 h-5" />
                  Online Payment
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
