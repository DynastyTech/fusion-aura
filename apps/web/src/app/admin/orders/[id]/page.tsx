'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';
import { HiCheckCircle, HiXCircle, HiCheck, HiTrash, HiPencil } from 'react-icons/hi2';
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
        // API returns { success: true, data: order }, so use response.data directly
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
        fetchOrder(); // Refresh
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
    // Initialize edit items with current order items
    setEditItems(
      order!.items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }))
    );

    // Fetch all products
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
    // Validate all items have productId and quantity > 0
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
        fetchOrder(); // Refresh
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo href="/admin/orders" width={180} height={60} />
            <Link href="/admin/orders" className="text-gray-600 hover:text-primary-dark">
              ← Back to Orders
            </Link>
          </div>
        </div>
      </header>

      {/* Order Detail */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-gray-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}
          >
            {getStatusLabel(order.status)}
          </span>
        </div>

        {/* Status Actions */}
        {order.status === 'PENDING' && (
          <div className="mb-6 bg-white rounded-lg shadow p-4 flex space-x-4">
            <button
              onClick={() => updateOrderStatus('ACCEPTED')}
              disabled={updating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? 'Processing...' : (
                <>
                  <HiCheckCircle className="inline w-5 h-5 mr-1" />
                  Accept Order
                </>
              )}
            </button>
            <button
              onClick={() => updateOrderStatus('DECLINED')}
              disabled={updating}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {updating ? 'Processing...' : (
                <>
                  <HiXCircle className="inline w-5 h-5 mr-1" />
                  Decline Order
                </>
              )}
            </button>
          </div>
        )}

        {order.status === 'ACCEPTED' && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <button
              onClick={() => updateOrderStatus('PENDING_DELIVERY')}
              disabled={updating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? 'Processing...' : 'Mark as Pending Delivery'}
            </button>
          </div>
        )}

        {order.status === 'PENDING_DELIVERY' && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <button
              onClick={() => updateOrderStatus('OUT_FOR_DELIVERY')}
              disabled={updating}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {updating ? 'Processing...' : 'Mark as Out for Delivery'}
            </button>
          </div>
        )}

        {order.status === 'OUT_FOR_DELIVERY' && (
          <div className="mb-6 bg-white rounded-lg shadow p-4 flex space-x-4">
            <button
              onClick={() => updateOrderStatus('COMPLETED')}
              disabled={updating}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {updating ? 'Processing...' : (
                <>
                  <HiCheck className="inline w-5 h-5 mr-1" />
                  Mark as Completed
                </>
              )}
            </button>
          </div>
        )}

        {/* Edit and Delete Actions */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 flex space-x-4">
          {canEdit && (
            <button
              onClick={startEditing}
              disabled={editing || updating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <HiPencil className="w-5 h-5" />
              Edit Order Items
            </button>
          )}
          {canDelete && (
            <button
              onClick={deleteOrder}
              disabled={deleting || updating}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              <HiTrash className="w-5 h-5" />
              {deleting ? 'Archiving...' : 'Archive Order'}
            </button>
          )}
        </div>

        {/* Edit Order Modal */}
        {editing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Edit Order Items</h2>
              <div className="space-y-4">
                {editItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <select
                      value={item.productId}
                      onChange={(e) => updateEditItem(index, 'productId', e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - R{toNumber(product.price).toFixed(2)} (Stock: {product.inventory?.quantity || 0})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateEditItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => removeEditItem(index)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addEditItem}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  + Add Item
                </button>
              </div>
              <div className="mt-6 flex space-x-4">
                <button
                  onClick={saveOrderEdit}
                  disabled={updating}
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditItems([]);
                  }}
                  disabled={updating}
                  className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 pb-4 border-b last:border-0">
                    {item.product.images && item.product.images.length > 0 ? (
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        R{toNumber(item.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">R{toNumber(item.price).toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Customer Information</h2>
              <div className="text-gray-700">
                <p>
                  <strong>Name:</strong>{' '}
                  {order.user?.firstName && order.user?.lastName
                    ? `${order.user.firstName} ${order.user.lastName}`
                    : order.shippingName || 'Guest'}
                </p>
                <p>
                  <strong>Email:</strong> {order.user?.email || 'N/A'}
                </p>
                {(order.user?.phone || order.shippingPhone) && (
                  <p>
                    <strong>Phone:</strong> {order.user?.phone || order.shippingPhone}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Delivery Address</h2>
              <div className="text-gray-700">
                <p className="font-semibold">{order.shippingName}</p>
                <p>{order.shippingAddressLine1}</p>
                {order.shippingAddressLine2 && <p>{order.shippingAddressLine2}</p>}
                <p>
                  {order.shippingCity}
                  {order.shippingProvince && `, ${order.shippingProvince}`}
                </p>
                <p>{order.shippingPostalCode}</p>
                {order.shippingPhone && <p className="mt-2">Phone: {order.shippingPhone}</p>}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R{toNumber(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%)</span>
                  <span>R{toNumber(order.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>R{toNumber(order.shipping).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary-dark">R{toNumber(order.total).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold text-sm">💰 Cash on Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

