'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';
import { HiCurrencyDollar } from 'react-icons/hi2';
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await apiRequest<Order>(`/api/orders/${orderId}`);
      if (response.success && response.data) {
        // API returns { success: true, data: order }, so use response.data directly
        setOrder(response.data);
      } else {
        router.push('/orders');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    // Allow both guests and authenticated users to view orders
    fetchOrder();
  }, [fetchOrder]);

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
            <Logo href="/orders" width={180} height={60} />
            <Link href="/orders" className="text-gray-600 hover:text-primary-dark">
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

        {/* Back to Home Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90"
          >
            🏠 Back to Home
          </Link>
        </div>

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
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-semibold text-gray-900 hover:text-primary-dark"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        R{toNumber(item.total).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        R{toNumber(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
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
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary-dark">R{toNumber(order.total).toFixed(2)}</span>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <HiCurrencyDollar className="w-4 h-4 text-blue-800" />
                  <p className="text-blue-800 font-semibold text-sm">Online Payment</p>
                </div>
                <p className="text-blue-700 text-xs mt-1">
                  Pay when your order is delivered
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

