'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HiHeart, HiShoppingCart, HiCheck } from 'react-icons/hi2';
import { FaLeaf } from 'react-icons/fa';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { addToGuestCart } from '@/lib/guestCart';
import { apiRequest } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  compareAtPrice?: number | string | null;
  images: string[];
  category?: {
    name: string;
    slug?: string;
  };
  inventory?: {
    quantity: number;
  } | null;
  isFeatured?: boolean;
}

interface ProductCardProps {
  product: Product;
  index?: number;
  showCategory?: boolean;
  className?: string;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
}

export default function ProductCard({ product, index = 0, showCategory = true, className = '' }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { refreshCart } = useCart();
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  const price = toNumber(product.price);
  const compareAtPrice = toNumber(product.compareAtPrice);
  const inStock = product.inventory ? product.inventory.quantity > 0 : true;
  const isOnSale = compareAtPrice > 0 && compareAtPrice > price;
  const discountPercentage = isOnSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!inStock || addingToCart) return;
    
    setAddingToCart(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        await apiRequest('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        });
        await refreshCart();
      } else {
        addToGuestCart(
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: price,
            images: product.images,
          },
          1
        );
      }
      
      window.dispatchEvent(new Event('cartUpdated'));
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (togglingWishlist) return;
    
    setTogglingWishlist(true);
    try {
      await toggleWishlist(product.id);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setTogglingWishlist(false);
    }
  };

  return (
    <div
      className={`group relative ${className}`}
      style={{ 
        opacity: 1,
        animation: `fadeInUp 0.3s ease-out ${Math.min(index * 0.05, 0.2)}s both`
      }}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="overflow-hidden rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] 
                        transition-shadow duration-200 hover:shadow-lg">
          {/* Product Image - Clean, no overlay icons */}
          <div className="relative aspect-square bg-[rgb(var(--muted))] overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaLeaf className="w-12 h-12 text-[rgb(var(--muted-foreground))]/30" />
              </div>
            )}

            {/* Badges - Only status badges, no action buttons */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
              {product.isFeatured && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-primary-dark text-white rounded-full">
                  Featured
                </span>
              )}
              {isOnSale && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                  -{discountPercentage}%
                </span>
              )}
              {!inStock && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-gray-500 text-white rounded-full">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {showCategory && product.category && (
              <p className="text-xs text-primary-dark font-medium mb-1 uppercase tracking-wide">
                {product.category.name}
              </p>
            )}
            <h3 className="font-semibold text-[rgb(var(--foreground))] line-clamp-2 mb-2 
                           group-hover:text-primary-dark transition-colors duration-200">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-primary-dark">
                R{price.toFixed(2)}
              </span>
              {isOnSale && (
                <span className="text-sm text-[rgb(var(--muted-foreground))] line-through">
                  R{compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Action Buttons - Always visible below product info */}
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                disabled={!inStock || addingToCart}
                className={`flex-1 py-2.5 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 
                            transition-all duration-200 touch-manipulation ${
                  addedToCart
                    ? 'bg-green-500 text-white'
                    : !inStock
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-primary-dark text-white active:scale-[0.98]'
                }`}
              >
                {addedToCart ? (
                  <>
                    <HiCheck className="w-4 h-4" />
                    Added!
                  </>
                ) : addingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <HiShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </>
                )}
              </button>
              <button
                onClick={handleToggleWishlist}
                disabled={togglingWishlist}
                className={`px-3 py-2.5 rounded-lg transition-all duration-200 touch-manipulation active:scale-[0.98] ${
                  inWishlist
                    ? 'bg-red-500 text-white'
                    : 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] hover:bg-red-100 hover:text-red-500'
                }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <HiHeart className={`w-5 h-5 ${togglingWishlist ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
