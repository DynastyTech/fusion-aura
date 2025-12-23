'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';
import { getGuestCart, updateGuestCartItem, removeFromGuestCart, getGuestCartTotal, clearGuestCart } from '@/lib/guestCart';
import HeaderNav from '@/components/HeaderNav';
import Logo from '@/components/Logo';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    images: string[];
  };
  subtotal: number;
}

interface CartData {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const loadGuestCart = useCallback(() => {
    const guestItems = getGuestCart();
    const total = getGuestCartTotal();
    
    setCart({
      items: guestItems.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
        product: item.product,
        subtotal: (typeof item.product.price === 'string' ? parseFloat(item.product.price) : item.product.price) * item.quantity,
      })),
      total,
      itemCount: guestItems.length,
    });
    setIsGuest(true);
    setLoading(false);
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const response = await apiRequest<CartData>('/api/cart');
      if (response.success && response.data) {
        setCart(response.data);
        setIsGuest(false);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      // Fallback to guest cart if API fails
      loadGuestCart();
    } finally {
      setLoading(false);
    }
  }, [loadGuestCart]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCart();
    } else {
      // Guest cart
      loadGuestCart();
    }
  }, [fetchCart, loadGuestCart]);

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setUpdating(itemId);
    
    if (isGuest) {
      updateGuestCartItem(itemId, quantity);
      loadGuestCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } else {
      try {
        const response = await apiRequest(`/api/cart/${itemId}`, {
          method: 'PATCH',
          body: JSON.stringify({ quantity }),
        });
        if (response.success) {
          fetchCart();
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } catch (error) {
        alert('Error updating cart');
      } finally {
        setUpdating(null);
      }
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    
    if (isGuest) {
      removeFromGuestCart(itemId);
      loadGuestCart();
      window.dispatchEvent(new Event('cartUpdated'));
    } else {
      try {
        const response = await apiRequest(`/api/cart/${itemId}`, {
          method: 'DELETE',
        });
        if (response.success) {
          fetchCart();
          window.dispatchEvent(new Event('cartUpdated'));
        }
      } catch (error) {
        alert('Error removing item');
      } finally {
        setUpdating(null);
      }
    }
  };

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Logo href="/" width={180} height={60} />
            <HeaderNav />
          </div>
        </div>
      </header>

      {/* Cart Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {!cart || cart.items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
            <Link
              href="/products"
              className="inline-block bg-primary-dark text-white px-6 py-3 rounded-lg hover:bg-primary-dark/90"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {isGuest && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    💡 You&apos;re shopping as a guest. You can checkout without creating an account!
                  </p>
                </div>
              )}
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center space-x-4"
                >
                  {item.product.images && item.product.images.length > 0 ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-100 rounded flex-shrink-0" />
                  )}

                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="text-lg font-semibold text-gray-900 hover:text-primary-dark"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-primary-dark font-bold mt-1">
                      R{toNumber(item.product.price).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                      className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      R{item.subtotal.toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={updating === item.id}
                      className="text-sm text-red-600 hover:text-red-800 mt-1 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R{cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15%)</span>
                    <span>R{(cart.total * 0.15).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R{(cart.total * 1.15).toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full bg-primary-dark text-white text-center py-3 rounded-lg hover:bg-primary-dark/90 font-semibold"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/products"
                  className="block w-full text-center py-2 text-gray-600 hover:text-primary-dark mt-2"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
