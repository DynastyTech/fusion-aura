'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { addToGuestCart, getGuestCart } from '@/lib/guestCart';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
  inventory: { quantity: number } | null;
}

export default function AddToCartButton({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    
    setLoading(true);
    try {
      if (token) {
        // Authenticated user - use API cart
        const response = await apiRequest('/api/cart', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        });

        if (response.success) {
          window.dispatchEvent(new Event('cartUpdated'));
          router.push('/cart');
        } else {
          alert(response.error || 'Failed to add to cart');
        }
      } else {
        // Guest user - use localStorage cart
        addToGuestCart(product, 1);
        window.dispatchEvent(new Event('cartUpdated'));
        router.push('/cart');
      }
    } catch (error) {
      alert('Error adding to cart');
    } finally {
      setLoading(false);
    }
  };

  const isOutOfStock = !product.inventory || product.inventory.quantity === 0;

  return (
    <div className="space-y-4">
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || loading}
        className="w-full bg-primary-dark text-white py-4 px-6 rounded-lg font-semibold hover:bg-primary-dark/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? 'Adding...'
          : isOutOfStock
          ? 'Out of Stock'
          : 'Add to Cart'}
      </button>
    </div>
  );
}

