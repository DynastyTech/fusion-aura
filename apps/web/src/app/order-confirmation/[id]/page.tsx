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
    case 'AWAITING_PAYMENT':
      return 'bg-orange-100 text-orange-800';
    case 'PENDING':
      return 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]';
    case 'ACCEPTED':
      return 'bg-[#569330]/10 text-[#569330]';
    case 'DECLINED':
      return 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]';
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
    case 'AWAITING_PAYMENT':
      return 'Awaiting Payment';
    case 'PENDING':
      return 'Payment Confirmed';
    case 'ACCEPTED':
      return 'Order Accepted';
    case 'DECLINED':
      return 'Order Declined';
    case 'PENDING_DELIVERY':
      return 'Preparing for Delivery';
    case 'OUT_FOR_DELIVERY':
      return 'Out for Delivery';
    case 'COMPLETED':
      return 'Delivered';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

// Delivery status order for timeline
const deliverySteps = [
  { status: 'PENDING', label: 'Payment Confirmed', icon: '1' },
  { status: 'ACCEPTED', label: 'Order Accepted', icon: '2' },
  { status: 'PENDING_DELIVERY', label: 'Preparing', icon: '3' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '4' },
  { status: 'COMPLETED', label: 'Delivered', icon: '5' },
];

function getStatusIndex(status: string): number {
  const index = deliverySteps.findIndex((step) => step.status === status);
  return index >= 0 ? index : -1;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      // Public endpoint - works for both guests and authenticated users
      const response = await apiRequest<Order>(`/api/orders/${orderId}`);
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        console.error('Failed to fetch order:', response.error);
        alert('Order not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      alert('Error loading order details');
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const toNumber = (value: number | string): number => {
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading order details...</div>
        </div>
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
            <Logo href="/" width={180} height={60} />
          </div>
        </div>
      </header>

      {/* Order Confirmation */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#569330]/10 rounded-full mb-4">
            <svg className="w-12 h-12 text-[#569330]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-xl text-gray-600 mb-1">Thank you for your order</p>
          <p className="text-gray-500">Order #{order.orderNumber}</p>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Order Status</p>
              <span
                className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Placed on</p>
              <p className="text-gray-900 font-medium mt-1">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* Delivery Timeline */}
          {order.status !== 'DECLINED' && order.status !== 'CANCELLED' && order.status !== 'AWAITING_PAYMENT' && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Delivery Progress</h3>
              <div className="flex items-center justify-between overflow-x-auto pb-2">
                {deliverySteps.map((step, index) => {
                  const currentIndex = getStatusIndex(order.status);
                  const isCompleted = currentIndex >= index;
                  const isCurrent = currentIndex === index;
                  
                  return (
                    <div key={step.status} className="flex flex-col items-center min-w-[80px]">
                      <div className="flex items-center w-full">
                        {index > 0 && (
                          <div 
                            className={`flex-1 h-1 ${isCompleted ? 'bg-[#569330]' : 'bg-gray-200'}`}
                          />
                        )}
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                            ${isCompleted ? 'bg-[#569330] text-white' : 'bg-gray-200 text-gray-400'}
                            ${isCurrent ? 'ring-4 ring-[#569330]/30' : ''}`}
                        >
                          {step.icon}
                        </div>
                        {index < deliverySteps.length - 1 && (
                          <div 
                            className={`flex-1 h-1 ${currentIndex > index ? 'bg-[#569330]' : 'bg-gray-200'}`}
                          />
                        )}
                      </div>
                      <span className={`text-xs mt-2 text-center ${isCurrent ? 'font-semibold text-[#569330]' : 'text-gray-500'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                      sizes="80px"
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

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2">
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
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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

        {/* Payment Info */}
        <div className="bg-[#569330]/5 border border-[#569330]/20 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-4">
            <HiCurrencyDollar className="w-8 h-8 text-[#569330] flex-shrink-0" />
            <div>
              <p className="text-[#569330] font-semibold">Payment Confirmed</p>
              <p className="text-[#569330] text-sm mt-1">
                Your payment of R{toNumber(order.total).toFixed(2)} has been successfully processed.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-[rgb(var(--muted))]/30 border border-[rgb(var(--border))] rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-[rgb(var(--foreground))] mb-2">What&apos;s Next?</h3>
          <ul className="text-[rgb(var(--muted-foreground))] space-y-1 text-sm">
            <li>• Your order is being reviewed by our team</li>
            <li>• You&apos;ll receive email updates when your order status changes</li>
            <li>• Our delivery team will contact you before delivery</li>
            <li>• Track your order status on this page anytime</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-primary-dark text-white rounded-lg hover:bg-primary-dark/90 font-semibold text-center"
          >
            Back to Home
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    </div>
  );
}

