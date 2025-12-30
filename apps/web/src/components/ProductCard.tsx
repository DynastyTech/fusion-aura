'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { HiHeart, HiShoppingCart, HiCheck, HiEye } from 'react-icons/hi2';
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
  const [isHovered, setIsHovered] = useState(false);

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
        addToGuestCart({
          productId: product.id,
          quantity: 1,
          product: {
            id: product.id,
            name: product.name,
            price: price,
            images: product.images,
          },
        });
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className={`group relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="card-hover overflow-hidden rounded-xl bg-[rgb(var(--card))]">
          {/* Product Image */}
          <div className="relative aspect-square bg-[rgb(var(--muted))] overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FaLeaf className="w-12 h-12 text-[rgb(var(--muted-foreground))]/30" />
              </div>
            )}

            {/* Badges */}
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

            {/* Quick Action Buttons - Always visible on mobile, hover on desktop */}
            <div className={`absolute top-2 right-2 flex flex-col gap-2 z-10 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            }`}>
              {/* Wishlist Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleWishlist}
                disabled={togglingWishlist}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all ${
                  inWishlist
                    ? 'bg-red-500 text-white'
                    : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
                }`}
                title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <HiHeart className={`w-5 h-5 ${togglingWishlist ? 'animate-pulse' : ''} ${inWishlist ? 'fill-current' : ''}`} />
              </motion.button>

              {/* Quick View Button (optional) */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to product page
                  window.location.href = `/products/${product.slug}`;
                }}
                className="w-9 h-9 rounded-full bg-white/90 text-gray-700 hover:bg-primary-dark hover:text-white flex items-center justify-center shadow-lg backdrop-blur-sm transition-all"
                title="Quick View"
              >
                <HiEye className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Add to Cart Overlay */}
            <AnimatePresence>
              {(isHovered || addedToCart) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-0 left-0 right-0 p-3 z-10"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={!inStock || addingToCart}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                      addedToCart
                        ? 'bg-green-500 text-white'
                        : !inStock
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-primary-dark text-white hover:bg-primary-dark/90'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <HiCheck className="w-5 h-5" />
                        Added!
                      </>
                    ) : addingToCart ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : !inStock ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <HiShoppingCart className="w-5 h-5" />
                        Add to Cart
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {showCategory && product.category && (
              <p className="text-xs text-primary-dark font-medium mb-1 uppercase tracking-wide">
                {product.category.name}
              </p>
            )}
            <h3 className="font-semibold text-[rgb(var(--foreground))] line-clamp-2 mb-2 group-hover:text-primary-dark transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary-dark">
                R{price.toFixed(2)}
              </span>
              {isOnSale && (
                <span className="text-sm text-[rgb(var(--muted-foreground))] line-through">
                  R{compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Mobile Quick Actions Bar (visible below card on small screens) */}
      <div className="sm:hidden mt-2 flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || addingToCart}
          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 transition-all ${
            addedToCart
              ? 'bg-green-500 text-white'
              : !inStock
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-primary-dark text-white'
          }`}
        >
          {addedToCart ? <HiCheck className="w-4 h-4" /> : <HiShoppingCart className="w-4 h-4" />}
          {addedToCart ? 'Added!' : 'Add'}
        </button>
        <button
          onClick={handleToggleWishlist}
          disabled={togglingWishlist}
          className={`px-3 py-2 rounded-lg transition-all ${
            inWishlist
              ? 'bg-red-500 text-white'
              : 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))]'
          }`}
        >
          <HiHeart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
    </motion.div>
  );
}

