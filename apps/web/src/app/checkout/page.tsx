'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { getGuestCart, getGuestCartTotal, clearGuestCart } from '@/lib/guestCart';
import { HiCurrencyDollar, HiCreditCard } from 'react-icons/hi2';

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
  const [isGuest, setIsGuest] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'payfast'>('cod');
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
    
    if (token) {
      // Authenticated user
      try {
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
          setIsGuest(false);
          if (cartResponse.data.items.length === 0) {
            router.push('/cart');
            return;
          }
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
      } finally {
        setLoading(false);
      }
    } else {
      // Guest user
      const guestItems = getGuestCart();
      const total = getGuestCartTotal();
      
      if (guestItems.length === 0) {
        router.push('/cart');
        return;
      }
      
      setCart({
        items: guestItems.map((item) => ({
          id: item.productId,
          quantity: item.quantity,
          product: item.product,
          subtotal: (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price) * item.quantity,
        })),
        total,
      });
      setIsGuest(true);
      setLoading(false);
    }
  }, [router]);

  // Load cart on component mount
  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    try {
      // Show loading state
      setGettingLocation(true);
      
      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode using our API
      const response = await apiRequest<{
        addressLine1: string;
        city: string;
        province: string;
        postalCode: string;
        country: string;
        formattedAddress: string;
      }>('/api/geocoding/reverse', {
        method: 'POST',
        body: JSON.stringify({
          lat: latitude,
          lng: longitude,
        }),
      });

      if (response.success && response.data) {
        const address = response.data;
        
        // Pre-fill address fields
        setFormData((prev) => ({
          ...prev,
          addressLine1: address.addressLine1 || prev.addressLine1,
          city: address.city || prev.city,
          province: address.province || prev.province,
          postalCode: address.postalCode || prev.postalCode,
        }));

        setUseCurrentLocation(true);
        alert(`Location found! Address pre-filled. Please review and confirm.`);
      } else {
        alert(response.error || 'Could not find address for your location. Please enter it manually.');
      }
    } catch (error: any) {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        alert('Location access denied. Please enable location permissions and try again.');
      } else if (error.code === 2) {
        alert('Location unavailable. Please enter your address manually.');
      } else if (error.code === 3) {
        alert('Location request timed out. Please try again or enter your address manually.');
      } else {
        alert('Unable to get your location. Please enter your address manually.');
      }
    } finally {
      setGettingLocation(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      let items: Array<{ productId: string; quantity: number }>;
      
      if (isGuest) {
        // Guest checkout - use guest cart
        const guestItems = getGuestCart();
        items = guestItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        }));
      } else {
        // Authenticated checkout - fetch from API
        const cartResponse = await apiRequest<CartData>('/api/cart');
        if (!cartResponse.success || !cartResponse.data) {
          alert('Error loading cart');
          setProcessing(false);
          return;
        }
        items = cartResponse.data.items.map((item: any) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }));
      }

      interface OrderResponse {
        id: string;
        orderNumber: string;
      }
      
      const response = await apiRequest<OrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items,
          shippingAddress: {
            name: isGuest ? 'anonymous' : formData.name,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2 || undefined,
            city: formData.city,
            province: formData.province || undefined,
            postalCode: formData.postalCode,
            phone: formData.phone, // Required for guest orders
            email: formData.email || undefined, // Optional
          },
        }),
      });

      if (response.success && response.data) {
        const orderId = response.data.id || response.data.orderNumber;

        // If PayFast selected, redirect to PayFast
        if (paymentMethod === 'payfast' && !isGuest) {
          try {
            const paymentResponse = await apiRequest<{ redirectUrl: string }>('/api/payments/initiate', {
              method: 'POST',
              body: JSON.stringify({ orderId: response.data.id }),
            });

            if (paymentResponse.success && paymentResponse.data?.redirectUrl) {
              // Don't clear cart yet - will be done after successful payment
              window.location.href = paymentResponse.data.redirectUrl;
              return;
            } else {
              alert('Failed to initiate payment. Please try again or use Cash on Delivery.');
              setProcessing(false);
              return;
            }
          } catch (paymentError) {
            console.error('Payment initiation error:', paymentError);
            alert('Payment initiation failed. Please try Cash on Delivery.');
            setProcessing(false);
            return;
          }
        }

        // Clear cart for COD orders
        if (isGuest) {
          clearGuestCart();
        } else {
          await apiRequest('/api/cart', { method: 'DELETE' });
        }
        window.dispatchEvent(new Event('cartUpdated'));
        // Redirect to order confirmation page (works for both guests and logged-in users)
        router.push(`/order-confirmation/${orderId}`);
      } else {
        // Show detailed error info for debugging
        const errorDetails = (response as any).details || '';
        const errorCode = (response as any).code || '';
        const errorMeta = (response as any).meta ? JSON.stringify((response as any).meta) : '';
        console.error('Order error:', { error: response.error, details: errorDetails, code: errorCode, meta: errorMeta });
        alert(`${response.error || 'Failed to place order'}${errorDetails ? `\n\nDetails: ${errorDetails}` : ''}${errorCode ? `\nCode: ${errorCode}` : ''}`);
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

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Checkout Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--foreground))]">Checkout</h1>
          <Link href="/cart" className="text-primary-dark hover:underline text-sm font-medium">
            ← Back to Cart
          </Link>
        </div>

        {isGuest && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <p className="text-blue-400 font-semibold">🛒 Guest Checkout</p>
            <p className="text-blue-300 text-sm mt-1">
              You can complete your purchase without creating an account. Just provide your delivery details below.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCheckout} className="card p-6 space-y-6">
              {/* Payment Method Selection */}
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-4">Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cash on Delivery Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === 'cod'
                        ? 'border-primary-dark bg-primary-dark/10'
                        : 'border-[rgb(var(--border))] hover:border-primary-dark/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'cod' ? 'border-primary-dark' : 'border-[rgb(var(--muted-foreground))]'
                      }`}>
                        {paymentMethod === 'cod' && (
                          <div className="w-3 h-3 rounded-full bg-primary-dark" />
                        )}
                      </div>
                      <HiCurrencyDollar className="w-6 h-6 text-primary-dark" />
                      <span className="font-semibold text-[rgb(var(--foreground))]">Cash on Delivery</span>
                    </div>
                    <p className="text-[rgb(var(--muted-foreground))] text-sm mt-2 ml-8">
                      Pay when your order arrives
                    </p>
                  </button>

                  {/* PayFast Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('payfast')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === 'payfast'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-[rgb(var(--border))] hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'payfast' ? 'border-blue-500' : 'border-[rgb(var(--muted-foreground))]'
                      }`}>
                        {paymentMethod === 'payfast' && (
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <HiCreditCard className="w-6 h-6 text-blue-500" />
                      <span className="font-semibold text-[rgb(var(--foreground))]">Pay Online</span>
                    </div>
                    <p className="text-[rgb(var(--muted-foreground))] text-sm mt-2 ml-8">
                      Secure payment via PayFast
                    </p>
                  </button>
                </div>
                
                {paymentMethod === 'payfast' && (
                  <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-400 text-sm">
                      💳 You&apos;ll be redirected to PayFast&apos;s secure payment page to complete your purchase.
                      Accepts cards, EFT, and mobile payments.
                    </p>
                  </div>
                )}
              </div>

              <h2 className="text-xl font-bold text-[rgb(var(--foreground))]">Delivery Information</h2>

              {isGuest && (
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field bg-[rgb(var(--muted))]/50"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-[rgb(var(--muted-foreground))]">Guest orders are anonymous</p>
                </div>
              )}

              {!isGuest && (
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Delivery Address *</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="Street address"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="btn-secondary whitespace-nowrap"
                  >
                    {gettingLocation ? '📍 Getting...' : '📍 Use Location'}
                  </button>
                </div>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--foreground))] mb-1">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="e.g., Gauteng"
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
                className={`w-full py-4 text-lg font-semibold rounded-xl transition-all ${
                  paymentMethod === 'payfast'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'btn-primary'
                }`}
              >
                {processing 
                  ? 'Processing...' 
                  : paymentMethod === 'payfast'
                    ? '💳 Proceed to Payment'
                    : '🚚 Place Order (Cash on Delivery)'
                }
              </button>

              {paymentMethod === 'payfast' && isGuest && (
                <p className="text-amber-400 text-sm text-center mt-2">
                  ⚠️ Please log in to use online payment. Guest checkout only supports Cash on Delivery.
                </p>
              )}
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
                    <span className="font-medium">R{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-[rgb(var(--border))] pt-3 mt-3 space-y-2">
                  <div className="flex justify-between text-[rgb(var(--muted-foreground))]">
                    <span>Subtotal</span>
                    <span>R{cart?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[rgb(var(--muted-foreground))]">
                    <span>VAT (15%)</span>
                    <span>R{((cart?.total || 0) * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl text-[rgb(var(--foreground))] border-t border-[rgb(var(--border))] pt-3 mt-3">
                    <span>Total</span>
                    <span className="text-primary-dark">R{((cart?.total || 0) * 1.15).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
