'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { HiCreditCard, HiUser } from 'react-icons/hi2';
import AddressAutocomplete from '@/components/AddressAutocomplete';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number | string;
  };
  subtotal: number;
}

interface CartData {
  items: CartItem[];
  total: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
  });

  const loadCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Not authenticated - redirect to login
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    // Authenticated user
    try {
      setIsAuthenticated(true);
      
      // Fetch cart and user profile in parallel
      interface UserProfile {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        province?: string;
        postalCode?: string;
      }
      
      const [cartResponse, userResponse] = await Promise.all([
        apiRequest<CartData>('/api/cart'),
        apiRequest<UserProfile>('/api/auth/me'),
      ]);
      
      if (cartResponse.success && cartResponse.data) {
        setCart(cartResponse.data);
        if (cartResponse.data.items.length === 0) {
          router.push('/cart');
          return;
        }
      } else {
        router.push('/cart');
        return;
      }
      
      // Pre-fill form with user profile data
      if (userResponse.success && userResponse.data) {
        const user = userResponse.data;
        setFormData((prev) => ({
          ...prev,
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || prev.name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone,
          addressLine1: user.addressLine1 || prev.addressLine1,
          addressLine2: user.addressLine2 || prev.addressLine2,
          city: user.city || prev.city,
          province: user.province || prev.province,
          postalCode: user.postalCode || prev.postalCode,
        }));
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      router.push('/cart');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Load cart on component mount
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Authenticated checkout - fetch from API
      const cartResponse = await apiRequest<CartData>('/api/cart');
      if (!cartResponse.success || !cartResponse.data) {
        alert('Error loading cart');
        setProcessing(false);
        return;
      }
      
      const items = cartResponse.data.items.map((item: any) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      interface OrderResponse {
        id: string;
        orderNumber: string;
      }
      
      const response = await apiRequest<OrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items,
          paymentMethod: 'ikhokha',
          shippingAddress: {
            name: formData.name,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2 || undefined,
            city: formData.city,
            province: formData.province || undefined,
            postalCode: formData.postalCode,
            phone: formData.phone,
            email: formData.email || undefined,
          },
        }),
      });

      if (response.success && response.data) {
        const orderId = response.data.id || response.data.orderNumber;

        // Redirect to iKhokha payment page
        try {
          console.log('Initiating iKhokha payment for order:', response.data.id);
          const paymentResponse = await apiRequest<{ redirectUrl: string; error?: string }>('/api/payments/initiate', {
            method: 'POST',
            body: JSON.stringify({ orderId: response.data.id }),
          });

          console.log('Payment response:', paymentResponse);

          const redirectUrl = (paymentResponse as any).redirectUrl || paymentResponse.data?.redirectUrl;
          
          if (paymentResponse.success && redirectUrl) {
            // Clear cart before redirecting
            await apiRequest('/api/cart', { method: 'DELETE' });
            window.dispatchEvent(new Event('cartUpdated'));
            // Redirect to iKhokha payment page
            window.location.href = redirectUrl;
            return;
          } else {
            const errorMsg = (paymentResponse as any).error || 'Failed to initiate payment';
            console.error('Payment initiation failed:', errorMsg);
            alert(`Payment error: ${errorMsg}\n\nPlease try again.`);
            setProcessing(false);
            return;
          }
        } catch (paymentError: any) {
          console.error('Payment initiation error:', paymentError);
          alert(`Payment initiation failed: ${paymentError.message || 'Unknown error'}\n\nPlease try again.`);
          setProcessing(false);
          return;
        }
      } else {
        const errorDetails = (response as any).details || '';
        const errorCode = (response as any).code || '';
        console.error('Order error:', { error: response.error, details: errorDetails, code: errorCode });
        alert(`${response.error || 'Failed to place order'}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}`);
        setProcessing(false);
      }
    } catch (error: any) {
      console.error('Order processing error:', error);
      alert(`Error processing order: ${error.message || 'Unknown error'}`);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-dark border-t-transparent
                        rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="card p-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary-dark/10 flex items-center justify-center">
              <HiUser className="w-8 h-8 text-primary-dark" />
            </div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] mb-4">
              Login Required
            </h1>
            <p className="text-[rgb(var(--muted-foreground))] mb-6">
              Please login or create an account to complete your purchase. This helps us process your order and keep you updated on delivery.
            </p>
            <div className="space-y-3">
              <Link
                href="/login?redirect=/checkout"
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <HiUser className="w-5 h-5" />
                Login to Continue
              </Link>
              <Link
                href="/cart"
                className="block text-primary-dark hover:underline text-sm"
              >
                ← Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--foreground))]">Checkout</h1>
          <Link href="/cart" className="text-primary-dark hover:underline text-sm font-medium">
            ← Back to Cart
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCheckout} className="card p-6 space-y-6">
              {/* Payment Method - iKhokha Only */}
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-4">Payment Method</h2>
                <div className="p-4 rounded-xl border-2 border-primary-dark bg-primary-dark/10">
                  <div className="flex items-center gap-3">
                    <HiCreditCard className="w-6 h-6 text-primary-dark" />
                    <span className="font-semibold text-[rgb(var(--foreground))]">Pay Online with iKhokha</span>
                  </div>
                  <p className="text-[rgb(var(--muted-foreground))] text-sm mt-2">
                    Secure payment via iKhokha - Accepts cards, EFT, and mobile payments.
                  </p>
                </div>
                <div className="mt-4 bg-primary-dark/10 border border-primary-dark/30 rounded-xl p-4">
                  <p className="text-[rgb(var(--foreground))] text-sm">
                    💳 You&apos;ll be redirected to iKhokha&apos;s secure payment page to complete your purchase.
                  </p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[rgb(var(--foreground))]">Delivery Information</h2>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  placeholder="Your email address"
                />
                <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">Order confirmation will be sent here</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Delivery Address *</label>
                <AddressAutocomplete
                  value={formData.addressLine1}
                  onChange={(address) => {
                    setFormData((prev) => ({
                      ...prev,
                      addressLine1: address.addressLine1,
                      city: address.city || prev.city,
                      province: address.province || prev.province,
                      postalCode: address.postalCode || prev.postalCode,
                    }));
                  }}
                  placeholder="Start typing your address..."
                />
                <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">
                  Type your address and select from suggestions. A map will show your location.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Apartment, suite, etc. (optional)"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-field"
                    placeholder="City will be auto-filled from address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Province will be auto-filled from address"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your phone number"
                    className="input-field"
                  />
                  <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">For delivery updates</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-4 text-lg font-semibold rounded-xl transition-all btn-primary"
              >
                {processing ? 'Processing...' : '💳 Proceed to Payment'}
              </button>

            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-4">Order Summary</h2>
              <div className="space-y-3 mb-4">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-[rgb(var(--foreground))]">
                    <span className="flex-1">{item.product.name} x{item.quantity}</span>
                    <span className="font-medium">R{(item.subtotal * 1.15).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-[rgb(var(--border))] pt-3 mt-3 space-y-2">
                  <div className="flex justify-between font-bold text-xl text-[rgb(var(--foreground))]">
                    <span>Total</span>
                    <span className="text-primary-dark">R{((cart?.total || 0) * 1.15).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] text-center">
                    All prices include 15% VAT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
