'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import Logo from '@/components/Logo';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string;
  createdAt: string;
  shippingName: string;
  shippingCity: string;
  shippingPhone: string | null;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
  }>;
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

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Try to find order by order number (public endpoint)
      const response = await apiRequest<Order>(`/api/orders/${orderNumber}`);
      
      if (response.success && response.data) {
        const foundOrder = response.data;
        
        // Verify phone matches (if provided)
        if (phone && foundOrder.shippingPhone && foundOrder.shippingPhone !== phone) {
          setError('Phone number does not match this order');
          setLoading(false);
          return;
        }
        
        setOrder(foundOrder);
      } else {
        setError('Order not found. Please check your order number and try again.');
      }
    } catch (err) {
      setError('Error tracking order. Please try again.');
      console.error('Track order error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

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
              <Link href="/track-order" className="text-gray-700 hover:text-primary-dark font-medium">
                Track Order
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Track Order Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your order number to check the status</p>
        </div>

        {/* Track Form */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Number *
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g., FUS-1234567890-ABC"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
              />
              <p className="mt-1 text-xs text-gray-500">
                You can find your order number in your order confirmation email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number used for order"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-dark"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Enter phone number for additional verification
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-dark text-white py-3 rounded-lg hover:bg-primary-dark/90 font-semibold disabled:opacity-50"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
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
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Order Items</h3>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 border-b last:border-0">
                    <span>{item.product.name} x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary-dark">
                  R{toNumber(order.total).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">Cash on Delivery</p>
            </div>

            {/* Delivery Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Delivery Address</h3>
              <p className="text-gray-700">{order.shippingName}</p>
              <p className="text-gray-700">{order.shippingCity}</p>
            </div>

            {/* Status Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Order Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    ['PENDING', 'ACCEPTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className={['PENDING', 'ACCEPTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status) ? 'text-gray-900' : 'text-gray-400'}>
                    Order Placed
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    ['ACCEPTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className={['ACCEPTED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status) ? 'text-gray-900' : 'text-gray-400'}>
                    Order Accepted
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    ['OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status)
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className={['OUT_FOR_DELIVERY', 'COMPLETED'].includes(order.status) ? 'text-gray-900' : 'text-gray-400'}>
                    Out for Delivery
                  </span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    order.status === 'COMPLETED' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  <span className={order.status === 'COMPLETED' ? 'text-gray-900' : 'text-gray-400'}>
                    Delivered
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <Link
                href="/"
                className="inline-block bg-primary-dark text-white px-6 py-3 rounded-lg hover:bg-primary-dark/90"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

