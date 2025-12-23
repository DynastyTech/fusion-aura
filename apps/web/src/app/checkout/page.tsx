'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import { getGuestCart, getGuestCartTotal, clearGuestCart } from '@/lib/guestCart';
import { HiCurrencyDollar } from 'react-icons/hi2';
import Logo from '@/components/Logo';

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

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    // Prefill name with "anonymous" for guest checkout
    if (isGuest) {
      setFormData(prev => ({ ...prev, name: 'anonymous' }));
    }
  }, [isGuest]);

  const loadCart = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Authenticated user
      try {
        const response = await apiRequest<CartData>('/api/cart');
        if (response.success && response.data) {
          setCart(response.data);
          setIsGuest(false);
          if (response.data.items.length === 0) {
            router.push('/cart');
          }
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
  };

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

      const response = await apiRequest('/api/orders', {
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
        // Clear cart
        if (isGuest) {
          clearGuestCart();
        } else {
          await apiRequest('/api/cart', { method: 'DELETE' });
        }
        window.dispatchEvent(new Event('cartUpdated'));
        // Redirect to order confirmation page (works for both guests and logged-in users)
        const orderId = response.data.id || response.data.orderNumber;
        router.push(`/order-confirmation/${orderId}`);
      } else {
        alert(response.error || 'Failed to place order');
        setProcessing(false);
      }
    } catch (error) {
      alert('Error processing order');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
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
            <Logo href="/" width={180} height={60} />
            <Link href="/cart" className="text-gray-600 hover:text-primary-dark">
              ← Back to Cart
            </Link>
          </div>
        </div>
      </header>

      {/* Checkout Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout - Cash on Delivery</h1>

        {isGuest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 font-semibold">🛒 Guest Checkout</p>
            <p className="text-blue-700 text-sm mt-1">
              You can complete your purchase without creating an account. Just provide your delivery details below.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCheckout} className="bg-white rounded-lg shadow p-6 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <HiCurrencyDollar className="w-5 h-5 text-green-800" />
                  <p className="text-green-800 font-semibold">Cash on Delivery</p>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  You will pay when your order is delivered. No online payment required.
                </p>
              </div>

              <h2 className="text-xl font-bold mb-4">Delivery Information</h2>

              {isGuest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark bg-gray-50"
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-500">Guest orders are anonymous</p>
                </div>
              )}

              {!isGuest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Address *</label>
                <div className="mt-2 flex space-x-2">
                  <input
                    type="text"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    placeholder="Street address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {gettingLocation ? '📍 Getting Location...' : '📍 Use Current Location'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address Line 2</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Apartment, suite, etc. (optional)"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Province</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="e.g., Gauteng, Western Cape"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your contact number (for delivery updates)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-dark focus:border-primary-dark"
                  />
                  <p className="mt-1 text-xs text-gray-500">We'll send order updates via SMS/WhatsApp</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-primary-dark text-white py-3 rounded-lg hover:bg-primary-dark/90 font-semibold disabled:opacity-50"
              >
                {processing ? 'Placing Order...' : 'Place Order (Cash on Delivery)'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.product.name} x{item.quantity}</span>
                    <span>R{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span>R{cart?.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>VAT (15%)</span>
                    <span>R{((cart?.total || 0) * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Total</span>
                    <span>R{((cart?.total || 0) * 1.15).toFixed(2)}</span>
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
