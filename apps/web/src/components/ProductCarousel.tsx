'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FaLeaf } from 'react-icons/fa';
import { HiHeart, HiShoppingCart, HiCheck } from 'react-icons/hi2';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { addToGuestCart } from '@/lib/guestCart';
import { apiRequest } from '@/lib/api';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import './ProductCarousel.css';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  images: string[];
  category: {
    name: string;
  };
  shortDescription: string | null;
  compareAtPrice: number | string | null;
  inventory: {
    quantity: number;
  } | null;
}

interface ProductCarouselProps {
  products: Product[];
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : Number(value);
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  const { refreshCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState<string | null>(null);
  const [togglingWishlist, setTogglingWishlist] = useState<string | null>(null);

  if (products.length === 0) return null;

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    setAddingToCart(product.id);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (token) {
        // Authenticated user - use API
        await apiRequest('/api/cart/add', {
          method: 'POST',
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
          }),
        });
      } else {
        // Guest user - use localStorage
        addToGuestCart({
          productId: product.id,
          quantity: 1,
          product: {
            id: product.id,
            name: product.name,
            price: toNumber(product.price),
            images: product.images,
          },
        });
      }
      
      // Refresh cart count
      await refreshCart();
      
      // Dispatch cart updated event
      window.dispatchEvent(new Event('cartUpdated'));
      
      setAddedToCart(product.id);
      setTimeout(() => {
        setAddingToCart(null);
        setAddedToCart(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setAddingToCart(null);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setTogglingWishlist(productId);
    try {
      await toggleWishlist(productId);
    } catch (error) {
      console.error('Failed to toggle wishlist:', error);
    } finally {
      setTogglingWishlist(null);
    }
  };

  return (
    <section className="product-carousel-section">
      <div className="container mx-auto px-4">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Featured Products</h2>
          <p>Our most popular natural remedies trusted by customers nationwide</p>
        </motion.div>

        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView="auto"
          coverflowEffect={{
            rotate: 50,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          pagination={{ clickable: true }}
          navigation={true}
          className="product-swiper"
        >
          {products.map((product) => {
            const price = toNumber(product.price);
            const inStock = product.inventory && product.inventory.quantity > 0;

            return (
              <SwiperSlide key={product.id}>
                <motion.div
                  className="product-card-carousel"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="product-image">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 300px, 400px"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        <FaLeaf />
                      </div>
                    )}
                    
                    {/* Wishlist Button - Always visible */}
                    <button
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                      disabled={togglingWishlist === product.id}
                      className={`absolute top-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center 
                                shadow-lg backdrop-blur-sm transition-all duration-200 ${
                        isInWishlist(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
                      }`}
                    >
                      <HiHeart className={`w-5 h-5 ${togglingWishlist === product.id ? 'animate-pulse' : ''}`} />
                    </button>

                    <div className="product-overlay">
                      <button
                        className={`btn ${addedToCart === product.id ? 'btn-success' : 'btn-primary'}`}
                        onClick={(e) => handleAddToCart(e, product)}
                        disabled={addingToCart === product.id || !inStock}
                      >
                        {addedToCart === product.id ? (
                          <>
                            <HiCheck size={20} />
                            Added!
                          </>
                        ) : addingToCart === product.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : !inStock ? (
                          'Out of Stock'
                        ) : (
                          <>
                            <HiShoppingCart size={20} />
                            Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="product-info">
                    <Link href={`/products/${product.slug}`}>
                      <h3>{product.name}</h3>
                    </Link>
                    {product.shortDescription && (
                      <p className="product-description">{product.shortDescription}</p>
                    )}
                    <div className="product-footer">
                      <span className="product-price">R{price.toFixed(2)}</span>
                      <span className="product-category">{product.category.name}</span>
                    </div>
                  </div>
                </motion.div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    </section>
  );
}
