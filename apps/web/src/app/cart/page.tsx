'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';
import { getGuestCart, updateGuestCartItem, removeFromGuestCart, getGuestCartTotal, clearGuestCart } from '@/lib/guestCart';
import { 
  HiShoppingCart, 
  HiPlus, 
  HiMinus, 
  HiTrash, 
  HiArrowRight,
  HiShoppingBag,
  HiInformationCircle,
} from 'react-icons/hi2';
import BackButton from '@/components/BackButton';

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
      setUpdating(null);
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
      setUpdating(null);
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
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-dark border-t-transparent 
                        rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Loading cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Back Button */}
        <BackButton fallbackHref="/products" className="mb-4" />
        
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--foreground))] flex items-center gap-3">
            <HiShoppingCart className="w-8 h-8 text-primary-dark" />
            Shopping Cart
          </h1>
          {cart && cart.items.length > 0 && (
            <p className="text-[rgb(var(--muted-foreground))] mt-1">
              {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} in your cart
            </p>
          )}
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="card p-12 text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[rgb(var(--muted))] 
                          flex items-center justify-center">
              <HiShoppingBag className="w-10 h-10 text-[rgb(var(--muted-foreground))]" />
            </div>
            <h2 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-2">
              Your cart is empty
            </h2>
            <p className="text-[rgb(var(--muted-foreground))] mb-6">
              Looks like you haven&apos;t added anything yet
            </p>
            <Link href="/products" className="btn-primary">
              <HiShoppingBag className="w-5 h-5" />
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {isGuest && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 
                              border border-amber-200 dark:border-amber-800">
                  <HiInformationCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Please <Link href="/login?redirect=/cart" className="underline font-semibold">login</Link> or <Link href="/register?redirect=/cart" className="underline font-semibold">create an account</Link> to proceed to checkout.
                  </p>
                </div>
              )}

              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  {/* Image */}
                  <div className="relative w-full sm:w-24 h-32 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[rgb(var(--muted))]">
                    {item.product.images && item.product.images.length > 0 ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiShoppingBag className="w-8 h-8 text-[rgb(var(--muted-foreground))]" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-semibold text-[rgb(var(--foreground))] hover:text-primary-dark 
                               transition-colors line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-primary-dark font-bold mt-1">
                      R{toNumber(item.product.price).toFixed(2)} each
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center bg-[rgb(var(--muted))] rounded-xl">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={updating === item.id || item.quantity <= 1}
                        className="p-2 hover:bg-[rgb(var(--border))] rounded-l-xl transition-colors 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiMinus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-semibold text-[rgb(var(--foreground))]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={updating === item.id}
                        className="p-2 hover:bg-[rgb(var(--border))] rounded-r-xl transition-colors 
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <HiPlus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <p className="text-lg font-bold text-[rgb(var(--foreground))]">
                        R{item.subtotal.toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updating === item.id}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 
                                 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <HiTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-4">
                  Order Summary
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-[rgb(var(--foreground))]">Total</span>
                    <span className="text-lg font-bold text-primary-dark">
                      R{cart.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 mb-4">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    🚚 <strong>Delivery:</strong> R80 nationwide courier or free pick up in Sandton/Midrand
                  </p>
                </div>

                <Link 
                  href={isGuest ? "/login?redirect=/checkout" : "/checkout"} 
                  className="btn-primary w-full justify-center"
                >
                  {isGuest ? 'Login to Checkout' : 'Proceed to Checkout'}
                  <HiArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/products"
                  className="block w-full text-center py-3 text-[rgb(var(--muted-foreground))] 
                           hover:text-primary-dark transition-colors mt-3"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
