'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { HiHeart, HiShoppingCart, HiTrash, HiArrowLeft, HiArrowRight } from 'react-icons/hi2';
import { FaLeaf } from 'react-icons/fa';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { addToGuestCart } from '@/lib/guestCart';
import { apiRequest } from '@/lib/api';

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
}

export default function WishlistPage() {
  const { items, count, isLoading, removeFromWishlist, moveToCart, clearWishlist } = useWishlist();
  const { refreshCart } = useCart();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [movingToCartId, setMovingToCartId] = useState<string | null>(null);

  const handleRemove = async (productId: string) => {
    setProcessingId(productId);
    await removeFromWishlist(productId);
    setProcessingId(null);
  };

  const handleMoveToCart = async (productId: string) => {
    setMovingToCartId(productId);
    
    const token = localStorage.getItem('token');
    
    if (token) {
      // Authenticated user - use API
      await moveToCart(productId);
      await refreshCart();
    } else {
      // Guest user - add to guest cart and remove from wishlist
      const item = items.find((i) => i.productId === productId);
      if (item) {
        addToGuestCart({
          productId: item.product.id,
          quantity: 1,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: toNumber(item.product.price),
            images: item.product.images,
          },
        });
        await removeFromWishlist(productId);
      }
    }
    
    window.dispatchEvent(new Event('cartUpdated'));
    setMovingToCartId(null);
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire wishlist?')) {
      await clearWishlist();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-dark border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[rgb(var(--muted-foreground))]">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Page Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-primary-dark/5" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            href="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-6
                     text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]
                     hover:bg-[rgb(var(--muted))] transition-all duration-200 font-medium"
          >
            <HiArrowLeft className="w-5 h-5" />
            Continue Shopping
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[rgb(var(--foreground))] flex items-center gap-3">
                <HiHeart className="w-10 h-10 text-red-500" />
                My Wishlist
              </h1>
              <p className="text-[rgb(var(--muted-foreground))] mt-2">
                {count === 0 ? 'No items saved yet' : `${count} item${count !== 1 ? 's' : ''} saved`}
              </p>
            </div>
            
            {count > 0 && (
              <button
                onClick={handleClearAll}
                className="btn-secondary text-red-500 hover:bg-red-500/10 border-red-500/30"
              >
                <HiTrash className="w-5 h-5" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Wishlist Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {count === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-12 text-center max-w-md mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <HiHeart className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[rgb(var(--foreground))] mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-[rgb(var(--muted-foreground))] mb-6">
              Start adding products you love by clicking the heart icon on any product.
            </p>
            <Link href="/products" className="btn-primary inline-flex items-center gap-2">
              Browse Products
              <HiArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {items.map((item, index) => {
                const price = toNumber(item.product.price);
                const compareAtPrice = toNumber(item.product.compareAtPrice);
                const isOnSale = compareAtPrice > 0 && compareAtPrice > price;
                const inStock = item.product.inventory ? item.product.inventory.quantity > 0 : true;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="card overflow-hidden group"
                  >
                    {/* Product Image */}
                    <Link href={`/products/${item.product.slug}`} className="block">
                      <div className="relative aspect-square bg-[rgb(var(--muted))] overflow-hidden">
                        {item.product.images && item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FaLeaf className="w-12 h-12 text-[rgb(var(--muted-foreground))]/30" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                          {isOnSale && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                              Sale
                            </span>
                          )}
                          {!inStock && (
                            <span className="px-2 py-0.5 text-xs font-semibold bg-gray-500 text-white rounded-full">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemove(item.productId);
                          }}
                          disabled={processingId === item.productId}
                          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 hover:bg-red-500 
                                   text-gray-700 hover:text-white flex items-center justify-center 
                                   shadow-lg transition-all"
                        >
                          {processingId === item.productId ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <HiTrash className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-4">
                      {item.product.category && (
                        <p className="text-xs text-primary-dark font-medium mb-1 uppercase tracking-wide">
                          {item.product.category.name}
                        </p>
                      )}
                      <Link href={`/products/${item.product.slug}`}>
                        <h3 className="font-semibold text-[rgb(var(--foreground))] line-clamp-2 mb-2 
                                     hover:text-primary-dark transition-colors">
                          {item.product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-bold text-primary-dark">
                          R{price.toFixed(2)}
                        </span>
                        {isOnSale && (
                          <span className="text-sm text-[rgb(var(--muted-foreground))] line-through">
                            R{compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleMoveToCart(item.productId)}
                        disabled={!inStock || movingToCartId === item.productId}
                        className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center 
                                  justify-center gap-2 transition-all ${
                          !inStock
                            ? 'bg-gray-400 text-white cursor-not-allowed'
                            : 'bg-primary-dark text-white hover:bg-primary-dark/90'
                        }`}
                      >
                        {movingToCartId === item.productId ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Moving...
                          </>
                        ) : !inStock ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <HiShoppingCart className="w-5 h-5" />
                            Move to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

