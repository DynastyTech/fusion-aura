'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { clearGuestCart } from '@/lib/guestCart';
import { HiCheckCircle, HiArrowRight } from 'react-icons/hi2';

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
}

export default function PaymentSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const orderId = params.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Clear cart on successful payment
        const token = localStorage.getItem('token');
        if (token) {
          await apiRequest('/api/cart', { method: 'DELETE' });
        } else {
          clearGuestCart();
        }
        window.dispatchEvent(new Event('cartUpdated'));

        // Verify payment
        const response = await apiRequest<OrderDetails>(`/api/payments/verify/${orderId}`);
        if (response.success && response.data) {
          setOrder(response.data);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-dark border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto bg-[#569330]/20 rounded-full flex items-center justify-center animate-pulse">
            <HiCheckCircle className="w-16 h-16 text-[#569330]" />
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto border-4 border-[#569330] rounded-full animate-ping opacity-20" />
        </div>

        <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-[rgb(var(--muted-foreground))] mb-6">
          Thank you for your purchase. Your order has been placed successfully.
        </p>

        {order && (
          <div className="bg-[rgb(var(--card))] rounded-xl p-6 mb-8 text-left">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[rgb(var(--muted-foreground))]">Order Number</span>
                <span className="font-semibold text-[rgb(var(--foreground))]">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[rgb(var(--muted-foreground))]">Status</span>
                <span className="font-semibold text-[#569330]">Paid</span>
              </div>
              <div className="flex justify-between border-t border-[rgb(var(--border))] pt-3">
                <span className="text-[rgb(var(--muted-foreground))]">Total Paid</span>
                <span className="font-bold text-xl text-primary-dark">
                  R{typeof order.total === 'number' ? order.total.toFixed(2) : order.total}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Link 
            href={`/orders/${orderId}`}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            View Order Details
            <HiArrowRight className="w-5 h-5" />
          </Link>
          
          <Link 
            href="/products"
            className="btn-secondary w-full"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="text-sm text-[rgb(var(--muted-foreground))] mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}

